package com.fas.service;

import com.fas.api.dto.event.AttendancePunchEvent;
import com.fas.api.dto.request.AdjustAttendanceRequest;
import com.fas.api.dto.request.KioskPunchRequest;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.PunchResult;
import com.fas.api.dto.response.ShiftEvaluationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.websocket.StompEventBroadcaster;
import com.fas.service.audit.AuditContextHolder;
import com.fas.service.audit.Auditable;
import com.fas.data.cache.CooldownManager;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

/**
 * Động cơ xử lý điểm danh cốt lõi (TASK-BE-013, BLD-BE-011, SOL-BE-002, SOL-BE-009).
 *
 * <p>Quy trình nghiệp vụ:
 * <ol>
 *   <li>Thẩm định tính hợp lệ của trạm Kiosk gửi yêu cầu.</li>
 *   <li>Thẩm định nhân sự và trạng thái tài khoản (phải ở trạng thái ACTIVE).</li>
 *   <li>Kiểm tra cơ chế Cooldown 120s phía máy chủ qua {@link CooldownManager} (chặn quẹt trùng lặp).</li>
 *   <li>Tự động xác định loại quẹt {@link PunchType#CHECK_IN} hoặc {@link PunchType#CHECK_OUT} dựa trên lịch sử trong ngày.</li>
 *   <li>Đối chiếu ca kíp đang hiệu lực qua {@link ShiftManagementService} để tính toán trạng thái
 *       {@link AttendanceStatus#ON_TIME}, {@link AttendanceStatus#LATE}, {@link AttendanceStatus#EARLY_LEAVE},
 *       hoặc {@link AttendanceStatus#ANOMALOUS} (khi chưa được phân ca).</li>
 *   <li>Lưu bản ghi điểm danh vào CSDL PostgreSQL (bảng {@code attendance_logs}).</li>
 *   <li>Cập nhật bộ đệm Cooldown Caffeine in-memory.</li>
 *   <li>Phát sóng sự kiện điểm danh thời gian thực tới topic WebSocket STOMP {@code /topic/live-attendance}.</li>
 * </ol>
 */
@Slf4j
@Service
public class AttendanceService {

    private final AttendanceLogRepository attendanceLogRepository;
    private final UserRepository userRepository;
    private final KioskRepository kioskRepository;
    private final ShiftManagementService shiftManagementService;
    private final CooldownManager cooldownManager;
    private final StompEventBroadcaster stompEventBroadcaster;

    public AttendanceService(
            AttendanceLogRepository attendanceLogRepository,
            UserRepository userRepository,
            KioskRepository kioskRepository,
            ShiftManagementService shiftManagementService,
            CooldownManager cooldownManager,
            StompEventBroadcaster stompEventBroadcaster
    ) {
        this.attendanceLogRepository = attendanceLogRepository;
        this.userRepository = userRepository;
        this.kioskRepository = kioskRepository;
        this.shiftManagementService = shiftManagementService;
        this.cooldownManager = cooldownManager;
        this.stompEventBroadcaster = stompEventBroadcaster;
    }

    /**
     * Tiếp nhận và ghi nhận một lượt điểm danh thời gian thực từ trạm Kiosk.
     *
     * @param request dữ liệu lượt quẹt gửi từ Kiosk
     * @return kết quả lượt điểm danh đã xử lý
     */
    @Transactional
    public PunchResult recordPunch(KioskPunchRequest request) {
        // 1. Thẩm định trạm Kiosk
        Kiosk kiosk = kioskRepository.findByIdAndIsActiveTrue(request.kioskId())
                .orElseThrow(() -> {
                    log.warn("Từ chối điểm danh: Trạm Kiosk '{}' không tồn tại hoặc đã bị vô hiệu hóa", request.kioskId());
                    return new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Trạm Kiosk không tồn tại hoặc đã bị vô hiệu hóa: " + request.kioskId());
                });

        // 2. Thẩm định nhân sự
        User employee = userRepository.findById(request.employeeId())
                .orElseThrow(() -> {
                    log.warn("Từ chối điểm danh: Không tìm thấy nhân sự ID={}", request.employeeId());
                    return new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                            "Không tìm thấy nhân sự ID=" + request.employeeId());
                });

        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            log.warn("Từ chối điểm danh: Nhân viên ID={} không ở trạng thái ACTIVE (trạng thái: {})",
                    employee.getId(), employee.getStatus());
            throw new ApiException(ApiErrorCode.ACCESS_DENIED,
                    "Tài khoản nhân viên không ở trạng thái hoạt động: " + employee.getStatus());
        }

        // 3. Phân tách thời gian
        OffsetDateTime punchTimeOffset = request.punchTimestamp();
        Instant punchInstant = punchTimeOffset.toInstant();
        LocalDate punchDate = punchTimeOffset.toLocalDate();
        LocalTime punchTime = punchTimeOffset.toLocalTime();
        ZoneId zoneId = punchTimeOffset.getOffset();

        // 4. Kiểm tra Cooldown 120s
        if (cooldownManager.isCooldownActive(employee.getId(), punchDate, punchInstant)) {
            log.warn("Từ chối điểm danh: Nhân viên ID={} vi phạm Cooldown 120s", employee.getId());
            throw new ApiException(ApiErrorCode.COOLDOWN_ACTIVE,
                    "Chống quẹt trùng lặp: Lượt điểm danh trong vòng 120 giây trước đó đã được ghi nhận");
        }

        // 5. Xác định PunchType (CHECK_IN hay CHECK_OUT)
        PunchType punchType = determinePunchType(employee.getId(), punchDate, zoneId);

        // 6. Đánh giá ca làm việc & tính toán trạng thái
        AttendanceStatus status;
        int lateMinutes = 0;

        if (punchType == PunchType.CHECK_IN) {
            ShiftEvaluationResult evaluation = shiftManagementService.evaluatePunch(employee.getId(), punchDate, punchTime);
            status = evaluation.status();
            lateMinutes = (int) evaluation.lateMinutes();
        } else {
            // CHECK_OUT
            Optional<Shift> shiftOpt = shiftManagementService.findActiveShiftForUser(employee.getId(), punchDate);
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

        // 7. Parse phương thức xác thực
        VerificationMethod verificationMethod;
        try {
            verificationMethod = VerificationMethod.valueOf(request.verificationMethod());
        } catch (IllegalArgumentException e) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Phương thức xác thực không hợp lệ: " + request.verificationMethod());
        }

        // 8. Lưu bản ghi vào CSDL
        AttendanceLog attendanceLog = AttendanceLog.builder()
                .user(employee)
                .punchTimestamp(punchInstant)
                .punchType(punchType)
                .verificationMethod(verificationMethod)
                .confidenceScore(request.confidenceScore())
                .kiosk(kiosk)
                .status(status)
                .lateMinutes(lateMinutes)
                .isOfflineSync(false)
                .build();

        AttendanceLog savedLog = attendanceLogRepository.save(attendanceLog);
        log.info("Ghi nhận điểm danh thành công: LogID={}, User={}, Type={}, Status={}, LateMinutes={}",
                savedLog.getId(), employee.getEmployeeCode(), punchType, status, lateMinutes);

        // 9. Cập nhật Cooldown Cache
        cooldownManager.recordPunch(employee.getId(), punchDate, punchInstant, punchType, kiosk.getId());

        // 10. Phát sóng STOMP WebSocket
        AttendanceLogItem logItem = new AttendanceLogItem(
                savedLog.getId(),
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getDepartment(),
                punchTimeOffset,
                punchType,
                verificationMethod,
                status,
                lateMinutes,
                kiosk.getId()
        );

        try {
            stompEventBroadcaster.broadcastAttendancePunch(logItem);
        } catch (Exception e) {
            log.error("Không thể phát sóng sự kiện điểm danh qua STOMP cho LogID={}: {}", savedLog.getId(), e.getMessage());
        }

        // 11. Trả về kết quả
        return new PunchResult(
                savedLog.getId(),
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                punchType,
                punchTimeOffset,
                status,
                lateMinutes,
                employee.getDepartment()
        );
    }

    /**
     * Xác định loại điểm danh vào/ra dựa trên lịch sử điểm danh trong ngày của nhân sự.
     *
     * @param userId    định danh nhân sự
     * @param punchDate ngày điểm danh
     * @param zoneId    múi giờ để tính mốc bắt đầu/kết thúc ngày
     * @return {@link PunchType#CHECK_IN} nếu là lượt đầu tiên hoặc lượt trước là CHECK_OUT;
     *         {@link PunchType#CHECK_OUT} nếu lượt trước là CHECK_IN.
     */
    public PunchType determinePunchType(Long userId, LocalDate punchDate, ZoneId zoneId) {
        Instant startOfDay = punchDate.atStartOfDay(zoneId).toInstant();
        Instant endOfDay = punchDate.plusDays(1).atStartOfDay(zoneId).toInstant().minusNanos(1);

        Page<AttendanceLog> logsToday = attendanceLogRepository.findByUserIdAndPunchTimestampBetween(
                userId, startOfDay, endOfDay,
                PageRequest.of(0, 100, Sort.by(Sort.Direction.ASC, "punchTimestamp"))
        );

        List<AttendanceLog> list = logsToday.getContent();
        if (list.isEmpty()) {
            return PunchType.CHECK_IN;
        }

        AttendanceLog latestLog = list.get(list.size() - 1);
        return latestLog.getPunchType() == PunchType.CHECK_IN ? PunchType.CHECK_OUT : PunchType.CHECK_IN;
    }

    /**
     * Điều chỉnh bản ghi điểm danh phục vụ HR/Admin sửa giờ công thủ công (FR-BE-008, SOL-BE-007, DD-BE-002).
     * <p>Được đánh chặn bởi {@link Auditable} để tự động sinh bản ghi kiểm toán bất biến trong {@code audit_logs}.</p>
     *
     * @param logId   định danh bản ghi điểm danh cần chỉnh sửa
     * @param request dữ liệu thông số điều chỉnh giờ công
     * @return bản ghi điểm danh sau khi đã điều chỉnh
     */
    @Auditable(action = "UPDATE_ATTENDANCE", entityType = "ATTENDANCE_LOG", entityId = "#logId")
    @Transactional
    public AttendanceLogItem adjustAttendanceLog(Long logId, AdjustAttendanceRequest request) {
        AttendanceLog attendanceLog = attendanceLogRepository.findById(logId)
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy bản ghi điểm danh ID={} để điều chỉnh", logId);
                    return new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND,
                            "Không tìm thấy bản ghi điểm danh ID=" + logId);
                });

        // 1. Chụp trạng thái trước khi sửa (before state) vào context holder
        AuditContextHolder.setBeforeState(mapToAuditState(attendanceLog));

        // 2. Cập nhật các trường dữ liệu theo yêu cầu
        if (request.punchTimestamp() != null) {
            attendanceLog.setPunchTimestamp(request.punchTimestamp().toInstant());
        }
        if (request.status() != null) {
            attendanceLog.setStatus(request.status());
        }
        if (request.lateMinutes() != null) {
            attendanceLog.setLateMinutes(Math.max(0, request.lateMinutes()));
        }

        AttendanceLog saved = attendanceLogRepository.save(attendanceLog);
        log.info("Đã điều chỉnh bản ghi điểm danh ID={} (Status={}, LateMinutes={}): {}",
                saved.getId(), saved.getStatus(), saved.getLateMinutes(), request.reason());

        // 3. Trả về kết quả sau khi chỉnh sửa
        User user = saved.getUser();
        OffsetDateTime punchOffset = saved.getPunchTimestamp().atZone(ZoneId.systemDefault()).toOffsetDateTime();
        return new AttendanceLogItem(
                saved.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getEmployeeCode() : null,
                user != null ? user.getFullName() : null,
                user != null ? user.getDepartment() : null,
                punchOffset,
                saved.getPunchType(),
                saved.getVerificationMethod(),
                saved.getStatus(),
                saved.getLateMinutes(),
                saved.getKiosk() != null ? saved.getKiosk().getId() : null
        );
    }

    private java.util.Map<String, Object> mapToAuditState(AttendanceLog log) {
        java.util.Map<String, Object> state = new java.util.LinkedHashMap<>();
        state.put("id", log.getId());
        state.put("userId", log.getUser() != null ? log.getUser().getId() : null);
        state.put("punchTimestamp", log.getPunchTimestamp() != null ? log.getPunchTimestamp().toString() : null);
        state.put("punchType", log.getPunchType() != null ? log.getPunchType().name() : null);
        state.put("status", log.getStatus() != null ? log.getStatus().name() : null);
        state.put("lateMinutes", log.getLateMinutes());
        return state;
    }
}

