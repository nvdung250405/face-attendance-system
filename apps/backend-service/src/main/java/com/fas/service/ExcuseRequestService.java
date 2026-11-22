package com.fas.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fas.api.dto.request.ApproveExcuseRequest;
import com.fas.api.dto.request.RejectExcuseRequest;
import com.fas.api.dto.request.SubmitExcuseRequest;
import com.fas.api.dto.response.ExcuseRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.ExcuseRequest;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.ExcuseRequestStatus;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.ExcuseRequestRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Dịch vụ xử lý đơn giải trình công (TASK-BE-030, BLD-BE-025, SOL-BE-018).
 *
 * <p>Quy tắc nghiệp vụ:
 * <ul>
 *   <li>Nhân viên chỉ nộp đơn cho bản ghi điểm danh thuộc chính mình trong vòng 30 ngày gần nhất (FR-BE-014).</li>
 *   <li>Đơn giải trình mới luôn khởi tạo với trạng thái {@link ExcuseRequestStatus#PENDING}.</li>
 *   <li>Không cho phép nộp trùng đơn khi bản ghi điểm danh đã có đơn PENDING (DATA-BE-018).</li>
 *   <li>Khi phê duyệt (APPROVED), điều chỉnh bản ghi {@link AttendanceLog} tương ứng trong CÙNG GIAO DỊCH
 *       và ghi một bản ghi {@link AuditLog} chứa giá trị trước/sau (FR-BE-015, DD-BE-018, DD-SYS-021).</li>
 *   <li>Khi từ chối (REJECTED), bắt buộc phải có lý do từ chối {@code rejectionReason} (FR-BE-015).</li>
 *   <li>Đơn đã phê duyệt hoặc từ chối không được phép thay đổi trạng thái lần nữa; từ chối với HTTP 409 (DD-SYS-021).</li>
 * </ul>
 */
@Slf4j
@Service
public class ExcuseRequestService {

    public static final Duration MAX_SUBMISSION_WINDOW = Duration.ofDays(30);

    private final ExcuseRequestRepository excuseRequestRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Autowired
    public ExcuseRequestService(
            ExcuseRequestRepository excuseRequestRepository,
            AttendanceLogRepository attendanceLogRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            ObjectMapper objectMapper
    ) {
        this(excuseRequestRepository, attendanceLogRepository, userRepository, auditLogRepository, objectMapper, Clock.systemDefaultZone());
    }

    public ExcuseRequestService(
            ExcuseRequestRepository excuseRequestRepository,
            AttendanceLogRepository attendanceLogRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this.excuseRequestRepository = excuseRequestRepository;
        this.attendanceLogRepository = attendanceLogRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    /**
     * Nộp đơn giải trình công cho một lượt điểm danh (FR-BE-014, API-BE-026).
     *
     * @param userId  mã định danh nhân viên nộp đơn
     * @param request thông tin đơn giải trình
     * @return chi tiết đơn giải trình vừa tạo ở trạng thái PENDING
     */
    @Transactional
    public ExcuseRequestResponse submitExcuseRequest(Long userId, SubmitExcuseRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId));

        AttendanceLog attendanceLog = attendanceLogRepository.findById(request.attendanceLogId())
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi điểm danh ID=" + request.attendanceLogId()));

        // Kiểm tra quyền sở hữu bản ghi điểm danh: trả 404 khi bản ghi không thuộc người gửi (API-BE-026)
        if (!attendanceLog.getUser().getId().equals(userId)) {
            log.warn("Nhân viên ID={} cố gắng nộp đơn giải trình cho bản ghi ID={} của người khác (User ID={})",
                    userId, attendanceLog.getId(), attendanceLog.getUser().getId());
            throw new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi điểm danh thuộc nhân viên ID=" + userId);
        }

        // Kiểm tra giới hạn 30 ngày (FR-BE-014, DD-BE-018)
        Instant now = clock.instant();
        Instant windowStart = now.minus(MAX_SUBMISSION_WINDOW);
        if (attendanceLog.getPunchTimestamp().isBefore(windowStart)) {
            log.warn("Từ chối nộp đơn giải trình: bản ghi ID={} (mốc {}) đã vượt quá 30 ngày so với hiện tại ({})",
                    attendanceLog.getId(), attendanceLog.getPunchTimestamp(), now);
            throw new ApiException(ApiErrorCode.EXCUSE_WINDOW_EXPIRED,
                    "Bản ghi điểm danh đã vượt quá thời hạn 30 ngày cho phép nộp đơn giải trình");
        }

        // Kiểm tra đơn trùng lặp đang chờ xử lý (DATA-BE-018, FR-BE-014)
        if (excuseRequestRepository.existsByAttendanceLogIdAndStatus(attendanceLog.getId(), ExcuseRequestStatus.PENDING)) {
            log.warn("Từ chối nộp đơn giải trình: bản ghi ID={} đã có đơn giải trình đang chờ xử lý", attendanceLog.getId());
            throw new ApiException(ApiErrorCode.EXCUSE_ALREADY_PENDING,
                    "Lượt điểm danh ID=" + attendanceLog.getId() + " đã có đơn giải trình đang chờ xử lý");
        }

        ExcuseRequest excuseRequest = ExcuseRequest.builder()
                .user(user)
                .attendanceLog(attendanceLog)
                .reason(request.reason().trim())
                .requestedPunchTimestamp(request.requestedPunchTimestamp())
                .status(ExcuseRequestStatus.PENDING)
                .build();

        ExcuseRequest saved = excuseRequestRepository.save(excuseRequest);
        log.info("Nộp đơn giải trình thành công: ID={}, User={}, AttendanceLog={}", saved.getId(), user.getEmployeeCode(), attendanceLog.getId());
        return ExcuseRequestResponse.fromEntity(saved);
    }

    /**
     * Tra cứu danh sách đơn giải trình của chính nhân viên (FR-BE-014, API-BE-027).
     *
     * @param userId   định danh nhân viên
     * @param pageable thông số phân trang
     * @return trang kết quả các đơn giải trình
     */
    @Transactional(readOnly = true)
    public Page<ExcuseRequestResponse> getEmployeeExcuseRequests(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId);
        }
        return excuseRequestRepository.findByUserId(userId, pageable)
                .map(e -> ExcuseRequestResponse.fromEntity(e));
    }

    /**
     * Tra cứu danh sách đơn giải trình phục vụ HR/Admin xử lý (FR-BE-015, API-BE-028).
     *
     * @param status   trạng thái đơn cần lọc (nếu null thì lấy tất cả)
     * @param pageable thông số phân trang
     * @return trang kết quả các đơn giải trình
     */
    @Transactional(readOnly = true)
    public Page<ExcuseRequestResponse> getExcuseRequests(ExcuseRequestStatus status, Pageable pageable) {
        if (status != null) {
            return excuseRequestRepository.findByStatus(status, pageable)
                    .map(e -> ExcuseRequestResponse.fromEntity(e));
        }
        return excuseRequestRepository.findAll(pageable)
                .map(e -> ExcuseRequestResponse.fromEntity(e));
    }

    /**
     * Lấy chi tiết đơn giải trình theo ID.
     *
     * @param id định danh đơn giải trình
     * @return chi tiết đơn giải trình
     */
    @Transactional(readOnly = true)
    public ExcuseRequestResponse getExcuseRequestById(Long id) {
        ExcuseRequest excuseRequest = excuseRequestRepository.findById(id)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đơn giải trình ID=" + id));
        return ExcuseRequestResponse.fromEntity(excuseRequest);
    }

    /**
     * Phê duyệt đơn giải trình công (FR-BE-015, API-BE-029).
     *
     * <p>Thực hiện trong cùng giao dịch:
     * 1. Kiểm tra đơn chưa được xử lý (trả 409 nếu đã APPROVED/REJECTED).
     * 2. Chuyển trạng thái đơn sang APPROVED và ghi nhận thông tin người duyệt.
     * 3. Điều chỉnh bản ghi điểm danh {@link AttendanceLog} liên quan (cập nhật mốc giờ đề xuất, chuyển ON_TIME, lateMinutes = 0).
     * 4. Sinh đúng một bản ghi {@link AuditLog} ghi nhận giá trị trước/sau.
     *
     * @param requestId        định danh đơn giải trình
     * @param decidedByUserId  định danh nhân sự phê duyệt (HR/ADMIN)
     * @param request          thông tin duyệt kèm ghi chú (tùy chọn)
     * @return thông tin đơn giải trình đã phê duyệt
     */
    @Transactional
    public ExcuseRequestResponse approveExcuseRequest(Long requestId, Long decidedByUserId, ApproveExcuseRequest request) {
        User decidedBy = userRepository.findById(decidedByUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy người duyệt ID=" + decidedByUserId));

        ExcuseRequest excuseRequest = excuseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đơn giải trình ID=" + requestId));

        if (excuseRequest.getStatus() != ExcuseRequestStatus.PENDING) {
            log.warn("Từ chối duyệt đơn: đơn ID={} đã ở trạng thái {}", requestId, excuseRequest.getStatus());
            throw new ApiException(ApiErrorCode.EXCUSE_ALREADY_PROCESSED,
                    "Đơn giải trình ID=" + requestId + " đã được xử lý (trạng thái: " + excuseRequest.getStatus() + ")");
        }

        AttendanceLog attendanceLog = excuseRequest.getAttendanceLog();
        if (attendanceLog != null) {
            // Chụp trạng thái trước khi sửa (before state)
            String beforeStateJson = serializeAttendanceLogState(attendanceLog);

            // Điều chỉnh bản ghi điểm danh
            if (excuseRequest.getRequestedPunchTimestamp() != null) {
                attendanceLog.setPunchTimestamp(excuseRequest.getRequestedPunchTimestamp());
            }
            attendanceLog.setStatus(AttendanceStatus.ON_TIME);
            attendanceLog.setLateMinutes(0);
            attendanceLogRepository.save(attendanceLog);

            // Chụp trạng thái sau khi sửa (after state)
            String afterStateJson = serializeAttendanceLogState(attendanceLog);

            // Ghi nhật ký kiểm toán bất biến (Immutable Audit Log)
            AuditLog auditLog = AuditLog.builder()
                    .actor(decidedBy)
                    .actorEmail(decidedBy.getEmail())
                    .action("APPROVE_EXCUSE_REQUEST")
                    .entityType("ATTENDANCE_LOG")
                    .entityId(String.valueOf(attendanceLog.getId()))
                    .beforeState(beforeStateJson)
                    .afterState(afterStateJson)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Đã ghi vết kiểm toán cho việc duyệt đơn giải trình: logId={}, actor={}", attendanceLog.getId(), decidedBy.getEmail());
        }

        Instant decidedAt = clock.instant();
        excuseRequest.setStatus(ExcuseRequestStatus.APPROVED);
        excuseRequest.setDecidedBy(decidedBy);
        excuseRequest.setDecidedAt(decidedAt);

        ExcuseRequest saved = excuseRequestRepository.save(excuseRequest);
        log.info("Phê duyệt đơn giải trình thành công: ID={}, DecidedBy={}", saved.getId(), decidedBy.getEmployeeCode());
        return ExcuseRequestResponse.fromEntity(saved);
    }

    /**
     * Từ chối đơn giải trình công (FR-BE-015, API-BE-029).
     *
     * @param requestId        định danh đơn giải trình
     * @param decidedByUserId  định danh nhân sự từ chối (HR/ADMIN)
     * @param request          lý do từ chối (bắt buộc)
     * @return thông tin đơn giải trình đã từ chối
     */
    @Transactional
    public ExcuseRequestResponse rejectExcuseRequest(Long requestId, Long decidedByUserId, RejectExcuseRequest request) {
        if (request == null || request.rejectionReason() == null || request.rejectionReason().trim().isEmpty()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Lý do từ chối không được để trống");
        }

        User decidedBy = userRepository.findById(decidedByUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy người xử lý ID=" + decidedByUserId));

        ExcuseRequest excuseRequest = excuseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đơn giải trình ID=" + requestId));

        if (excuseRequest.getStatus() != ExcuseRequestStatus.PENDING) {
            log.warn("Từ chối xử lý đơn: đơn ID={} đã ở trạng thái {}", requestId, excuseRequest.getStatus());
            throw new ApiException(ApiErrorCode.EXCUSE_ALREADY_PROCESSED,
                    "Đơn giải trình ID=" + requestId + " đã được xử lý (trạng thái: " + excuseRequest.getStatus() + ")");
        }

        Instant decidedAt = clock.instant();
        excuseRequest.setStatus(ExcuseRequestStatus.REJECTED);
        excuseRequest.setDecidedBy(decidedBy);
        excuseRequest.setDecidedAt(decidedAt);
        excuseRequest.setRejectionReason(request.rejectionReason().trim());

        ExcuseRequest saved = excuseRequestRepository.save(excuseRequest);
        log.info("Từ chối đơn giải trình thành công: ID={}, DecidedBy={}, Reason={}",
                saved.getId(), decidedBy.getEmployeeCode(), excuseRequest.getRejectionReason());
        return ExcuseRequestResponse.fromEntity(saved);
    }

    private String serializeAttendanceLogState(AttendanceLog attendanceLog) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("id", attendanceLog.getId());
        state.put("punchTimestamp", attendanceLog.getPunchTimestamp() != null ? attendanceLog.getPunchTimestamp().toString() : null);
        state.put("punchType", attendanceLog.getPunchType() != null ? attendanceLog.getPunchType().name() : null);
        state.put("verificationMethod", attendanceLog.getVerificationMethod() != null ? attendanceLog.getVerificationMethod().name() : null);
        state.put("status", attendanceLog.getStatus() != null ? attendanceLog.getStatus().name() : null);
        state.put("lateMinutes", attendanceLog.getLateMinutes());
        try {
            return objectMapper.writeValueAsString(state);
        } catch (JsonProcessingException e) {
            log.error("Không thể chuyển đổi trạng thái AttendanceLog sang JSON: {}", e.getMessage());
            return "{\"id\":" + attendanceLog.getId() + ",\"status\":\"" + attendanceLog.getStatus() + "\"}";
        }
    }
}
