package com.fas.service;

import com.fas.api.dto.request.KioskSyncBatchRequest;
import com.fas.api.dto.request.OfflinePunchRecord;
import com.fas.api.dto.response.BatchSyncResult;
import com.fas.api.dto.response.ShiftEvaluationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.VerificationMethod;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.fas.config.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Dịch vụ Đồng bộ Bù Ngoại tuyến cho Trạm Kiosk (SOL-BE-003, FR-BE-003, DD-SYS-002, BLD-BE-012, TASK-BE-014).
 *
 * <p>Quy trình nghiệp vụ:
 * <ol>
 *   <li>Thẩm định tính hợp lệ của trạm Kiosk và cập nhật mốc {@code lastPingAt}.</li>
 *   <li>Thẩm định kích thước gói lô (tối đa 50 bản ghi) và tính hợp lệ của các bản ghi.</li>
 *   <li>Bỏ qua các bản ghi thuộc nhân sự không tồn tại hoặc đã thôi việc (đưa vào {@code failedLocalIds}).</li>
 *   <li>Tính toán tuần tự {@link PunchType} (CHECK_IN/CHECK_OUT) và trạng thái ca làm việc,
 *       bảo toàn mốc thời gian thực tế của bản ghi ngoại tuyến.</li>
 *   <li>Kiểm tra và loại bỏ bản ghi trùng lặp qua bộ ba tự nhiên {@code (user_id, punch_timestamp, punch_type)}.</li>
 *   <li>Thực thi batch insert hiệu năng cao với chiến lược {@code ON CONFLICT DO NOTHING}.</li>
 *   <li>Trả về kết quả chi tiết {@link BatchSyncResult} gồm số lượng thành công và danh sách ID cục bộ.</li>
 * </ol>
 */
@Slf4j
@Service
public class OfflineBatchSyncService {

    private final AttendanceLogRepository attendanceLogRepository;
    private final KioskRepository kioskRepository;
    private final UserRepository userRepository;
    private final ShiftManagementService shiftManagementService;
    private final Clock clock;

    @Autowired
    public OfflineBatchSyncService(
            AttendanceLogRepository attendanceLogRepository,
            KioskRepository kioskRepository,
            UserRepository userRepository,
            ShiftManagementService shiftManagementService) {
        this(attendanceLogRepository, kioskRepository, userRepository, shiftManagementService, Clock.systemDefaultZone());
    }

    public OfflineBatchSyncService(
            AttendanceLogRepository attendanceLogRepository,
            KioskRepository kioskRepository,
            UserRepository userRepository,
            ShiftManagementService shiftManagementService,
            Clock clock) {
        this.attendanceLogRepository = attendanceLogRepository;
        this.kioskRepository = kioskRepository;
        this.userRepository = userRepository;
        this.shiftManagementService = shiftManagementService;
        this.clock = clock;
    }

    /**
     * Tiếp nhận và xử lý gói lô điểm danh ngoại tuyến từ trạm Kiosk.
     *
     * @param request dữ liệu gói lô đồng bộ ngoại tuyến
     * @return kết quả đồng bộ chi tiết
     */
    @CacheEvict(value = CacheConfig.ATTENDANCE_STATS_CACHE, allEntries = true)
    @Transactional
    public BatchSyncResult processOfflineBatch(KioskSyncBatchRequest request) {
        validateRequest(request);

        // 1. Thẩm định trạm Kiosk
        Kiosk kiosk = kioskRepository.findById(request.kioskId())
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy trạm Kiosk ID={}", request.kioskId());
                    return new ApiException(ApiErrorCode.KIOSK_NOT_FOUND,
                            "Không tìm thấy trạm Kiosk: " + request.kioskId());
                });

        if (Boolean.FALSE.equals(kiosk.getIsActive())) {
            log.warn("Từ chối đồng bộ: Trạm Kiosk ID={} đã bị vô hiệu hóa", kiosk.getId());
            throw new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                    "Trạm Kiosk đã bị vô hiệu hóa");
        }

        kiosk.setLastPingAt(clock.instant());
        kioskRepository.save(kiosk);

        // 2. Sắp xếp các bản ghi theo thời gian thực tế tăng dần để đánh giá ca và lượt quẹt chính xác
        List<OfflinePunchRecord> records = new ArrayList<>(request.records());
        records.sort(Comparator.comparing(OfflinePunchRecord::punchTimestamp));

        List<Long> syncedLocalIds = new ArrayList<>();
        List<Long> failedLocalIds = new ArrayList<>();
        List<AttendanceLog> logsToInsert = new ArrayList<>();
        List<Long> pendingCandidateLocalIds = new ArrayList<>();

        // Bộ theo dõi lượt quẹt gần nhất của nhân sự trong cùng một ngày (key: userId + "_" + punchDate)
        Map<String, PunchType> lastPunchTypeTracker = new HashMap<>();

        // 3. Xử lý từng bản ghi ngoại tuyến trong lô
        for (OfflinePunchRecord record : records) {
            Long employeeId = record.employeeId();
            Optional<User> userOpt = userRepository.findById(employeeId);

            if (userOpt.isEmpty() || userOpt.get().getStatus() != EmployeeStatus.ACTIVE) {
                log.warn("Bỏ qua bản ghi offline localQueueId={}: Nhân viên ID={} không tồn tại hoặc không ACTIVE",
                        record.localQueueId(), employeeId);
                failedLocalIds.add(record.localQueueId());
                continue;
            }

            User employee = userOpt.get();
            OffsetDateTime punchOffset = record.punchTimestamp();
            // Chuẩn hóa về múi giờ hợp đồng hệ thống (Asia/Ho_Chi_Minh) như đường online
            OffsetDateTime vietnamPunchOffset = punchOffset.atZoneSameInstant(com.fas.api.dto.ApiResponse.VIETNAM_ZONE).toOffsetDateTime();
            Instant punchInstant = vietnamPunchOffset.toInstant();
            LocalDate punchDate = vietnamPunchOffset.toLocalDate();
            LocalTime punchTime = vietnamPunchOffset.toLocalTime();
            ZoneId zoneId = com.fas.api.dto.ApiResponse.VIETNAM_ZONE;

            // Xác định PunchType tuần tự
            String trackerKey = employeeId + "_" + punchDate;
            PunchType punchType;
            if (lastPunchTypeTracker.containsKey(trackerKey)) {
                PunchType previousType = lastPunchTypeTracker.get(trackerKey);
                punchType = (previousType == PunchType.CHECK_IN) ? PunchType.CHECK_OUT : PunchType.CHECK_IN;
            } else {
                punchType = determineInitialPunchType(employeeId, punchDate, zoneId);
            }

            // Kiểm tra ràng buộc duy nhất chống trùng lặp (Idempotency)
            if (attendanceLogRepository.existsByUserIdAndPunchTimestampAndPunchType(employeeId, punchInstant, punchType)) {
                log.info("Bản ghi offline localQueueId={} đã tồn tại trong CSDL (User={}, Time={}, Type={})",
                        record.localQueueId(), employeeId, punchInstant, punchType);
                failedLocalIds.add(record.localQueueId());
                continue;
            }

            // Chỉ cập nhật bộ theo dõi lượt quẹt SAU khi bản ghi vượt qua kiểm tra trùng lặp
            // (tránh suy luận sai CHECK_IN/CHECK_OUT khi gói lô được gửi lại - idempotency)
            lastPunchTypeTracker.put(trackerKey, punchType);

            // Đánh giá ca kíp và tính toán trạng thái
            AttendanceStatus status;
            int lateMinutes = 0;

            if (punchType == PunchType.CHECK_IN) {
                ShiftEvaluationResult evaluation = shiftManagementService.evaluatePunch(employeeId, punchDate, punchTime);
                status = evaluation.status();
                lateMinutes = (int) evaluation.lateMinutes();
            } else {
                Optional<Shift> shiftOpt = shiftManagementService.findActiveShiftForUser(employeeId, punchDate);
                if (shiftOpt.isEmpty()) {
                    status = AttendanceStatus.ANOMALOUS;
                    lateMinutes = 0;
                } else {
                    Shift shift = shiftOpt.get();
                    if (punchTime.isBefore(shift.getEndTime())) {
                        status = AttendanceStatus.EARLY_LEAVE;
                        lateMinutes = 0;
                    } else {
                        status = AttendanceStatus.ON_TIME;
                        lateMinutes = 0;
                    }
                }
            }

            // Parse phương thức xác thực
            VerificationMethod verificationMethod = parseVerificationMethod(record.verificationMethod());

            AttendanceLog attendanceLog = AttendanceLog.builder()
                    .user(employee)
                    .punchTimestamp(punchInstant)
                    .punchType(punchType)
                    .verificationMethod(verificationMethod)
                    .confidenceScore(record.confidenceScore())
                    .kiosk(kiosk)
                    .status(status)
                    .lateMinutes(lateMinutes)
                    .isOfflineSync(true)
                    .createdAt(clock.instant())
                    .build();

            logsToInsert.add(attendanceLog);
            pendingCandidateLocalIds.add(record.localQueueId());
        }

        // 4. Thực thi batch insert nếu có bản ghi hợp lệ
        if (!logsToInsert.isEmpty()) {
            attendanceLogRepository.batchInsertOfflineLogs(logsToInsert);
            syncedLocalIds.addAll(pendingCandidateLocalIds);
            log.info("Đồng bộ bù thành công {} bản ghi ngoại tuyến từ trạm Kiosk ID={}",
                    syncedLocalIds.size(), kiosk.getId());
        }

        return new BatchSyncResult(syncedLocalIds.size(), syncedLocalIds, failedLocalIds);
    }

    private void validateRequest(KioskSyncBatchRequest request) {
        if (request == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Dữ liệu gói đồng bộ không được để trống");
        }
        if (!StringUtils.hasText(request.kioskId())) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "kioskId không được để trống");
        }
        if (request.records() == null || request.records().isEmpty()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Danh sách bản ghi records không được để trống");
        }
        if (request.records().size() > 50) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Gói đồng bộ chỉ được chứa tối đa 50 bản ghi");
        }
        if (request.batchSize() != null && request.batchSize() != request.records().size()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "batchSize (" + request.batchSize() + ") không khớp với số lượng bản ghi thực tế (" + request.records().size() + ")");
        }
    }

    private PunchType determineInitialPunchType(Long userId, LocalDate punchDate, ZoneId zoneId) {
        Instant startOfDay = punchDate.atStartOfDay(zoneId).toInstant();
        Instant endOfDay = punchDate.plusDays(1).atStartOfDay(zoneId).toInstant().minusNanos(1);

        Optional<AttendanceLog> latestLog = attendanceLogRepository
                .findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(userId, startOfDay, endOfDay);

        if (latestLog.isEmpty()) {
            return PunchType.CHECK_IN;
        }

        return latestLog.get().getPunchType() == PunchType.CHECK_IN ? PunchType.CHECK_OUT : PunchType.CHECK_IN;
    }

    private VerificationMethod parseVerificationMethod(String rawMethod) {
        if (!StringUtils.hasText(rawMethod)) {
            return VerificationMethod.VERIFICATION_FACE;
        }
        try {
            return VerificationMethod.valueOf(rawMethod);
        } catch (IllegalArgumentException e) {
            if ("FACE".equalsIgnoreCase(rawMethod)) {
                return VerificationMethod.VERIFICATION_FACE;
            } else if ("PIN".equalsIgnoreCase(rawMethod)) {
                return VerificationMethod.VERIFICATION_PIN;
            }
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Phương thức xác thực không hợp lệ: " + rawMethod);
        }
    }
}
