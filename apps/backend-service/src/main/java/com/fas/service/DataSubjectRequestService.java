package com.fas.service;

import com.fas.api.dto.request.CreateDataSubjectRequest;
import com.fas.api.dto.request.UpdateDataSubjectRequest;
import com.fas.api.dto.response.DataSubjectRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.DataSubjectRequest;
import com.fas.data.entity.User;
import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.DataSubjectRequestRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

/**
 * Dịch vụ Yêu cầu của Chủ thể Dữ liệu Cá nhân (SOL-BE-025, FR-BE-022, DATA-BE-024).
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Nhân viên gửi yêu cầu truy cập hoặc chỉnh sửa dữ liệu cá nhân (trạng thái ban đầu RECEIVED).</li>
 *   <li>DPO tra cứu danh sách, cập nhật tiến độ xử lý và gửi phản hồi.</li>
 *   <li>Mỗi lần chuyển trạng thái đều tự động sinh thông báo trong ứng dụng cho người nộp đơn.</li>
 *   <li>Mọi thay đổi trạng thái đều được ghi nhật ký kiểm toán bất biến.</li>
 * </ul>
 */
@Slf4j
@Service
public class DataSubjectRequestService {

    private final DataSubjectRequestRepository dataSubjectRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;
    private final Clock clock;

    @Autowired
    public DataSubjectRequestService(
            DataSubjectRequestRepository dataSubjectRequestRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditLogRepository auditLogRepository) {
        this(dataSubjectRequestRepository, userRepository, notificationService, auditLogRepository, Clock.systemDefaultZone());
    }

    public DataSubjectRequestService(
            DataSubjectRequestRepository dataSubjectRequestRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditLogRepository auditLogRepository,
            Clock clock) {
        this.dataSubjectRequestRepository = dataSubjectRequestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
    }

    /**
     * Nhân viên gửi yêu cầu mới về dữ liệu cá nhân (ACCESS hoặc CORRECTION).
     */
    @Transactional
    public DataSubjectRequestResponse createRequest(Long userId, CreateDataSubjectRequest request) {
        if (request == null || request.requestType() == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Loại yêu cầu không được để trống");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId));

        Instant now = clock.instant();
        DataSubjectRequest entity = DataSubjectRequest.builder()
                .user(user)
                .requestType(request.requestType())
                .detail(request.detail() != null ? request.detail().trim() : null)
                .status(DataSubjectRequestStatus.RECEIVED)
                .createdAt(now)
                .updatedAt(now)
                .build();

        DataSubjectRequest saved = dataSubjectRequestRepository.save(entity);
        log.info("Nhân viên ID={} đã gửi yêu cầu dữ liệu cá nhân: ID={}, Type={}", userId, saved.getId(), request.requestType());
        return DataSubjectRequestResponse.fromEntity(saved);
    }

    /**
     * Tra cứu danh sách yêu cầu của chính nhân viên.
     */
    @Transactional(readOnly = true)
    public Page<DataSubjectRequestResponse> getRequestsByUser(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId);
        }
        return dataSubjectRequestRepository.findByUserId(userId, pageable)
                .map(DataSubjectRequestResponse::fromEntity);
    }

    /**
     * Tra cứu danh sách yêu cầu dành cho DPO (có lọc theo trạng thái).
     */
    @Transactional(readOnly = true)
    public Page<DataSubjectRequestResponse> getAllRequests(DataSubjectRequestStatus status, Pageable pageable) {
        if (status != null) {
            return dataSubjectRequestRepository.findByStatus(status, pageable)
                    .map(DataSubjectRequestResponse::fromEntity);
        }
        return dataSubjectRequestRepository.findAll(pageable)
                .map(DataSubjectRequestResponse::fromEntity);
    }

    /**
     * Tra cứu chi tiết một yêu cầu theo ID.
     */
    @Transactional(readOnly = true)
    public DataSubjectRequestResponse getRequestById(Long requestId) {
        DataSubjectRequest request = dataSubjectRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu ID=" + requestId));
        return DataSubjectRequestResponse.fromEntity(request);
    }

    /**
     * Tra cứu chi tiết một yêu cầu của chính nhân viên (chống truy cập chéo - IDOR).
     * Trả HTTP 404 {@code RESOURCE_NOT_FOUND} khi yêu cầu không thuộc người gọi.
     */
    @Transactional(readOnly = true)
    public DataSubjectRequestResponse getRequestByIdForUser(Long requestId, Long userId) {
        DataSubjectRequest request = dataSubjectRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu ID=" + requestId));

        if (request.getUser() == null || !request.getUser().getId().equals(userId)) {
            log.warn("Nhân viên ID={} cố gắng xem yêu cầu dữ liệu ID={} của người khác (User ID={})",
                    userId, requestId, request.getUser() != null ? request.getUser().getId() : null);
            throw new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu ID=" + requestId);
        }

        return DataSubjectRequestResponse.fromEntity(request);
    }

    /**
     * DPO cập nhật trạng thái xử lý và gửi phản hồi cho yêu cầu.
     */
    @Transactional
    public DataSubjectRequestResponse updateRequestStatus(Long requestId, Long dpoUserId, UpdateDataSubjectRequest request) {
        if (request == null || request.status() == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Trạng thái mới không được để trống");
        }

        User dpoUser = userRepository.findById(dpoUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy cán bộ DPO ID=" + dpoUserId));

        DataSubjectRequest entity = dataSubjectRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy yêu cầu ID=" + requestId));

        Instant now = clock.instant();
        String beforeStatus = entity.getStatus().name();
        entity.setStatus(request.status());
        entity.setHandledBy(dpoUser);
        if (request.response() != null) {
            entity.setResponse(request.response().trim());
        }
        entity.setRespondedAt(now);
        entity.setUpdatedAt(now);

        DataSubjectRequest saved = dataSubjectRequestRepository.save(entity);

        // 1. Sinh thông báo trong ứng dụng cho người gửi yêu cầu
        notificationService.createNotification(
                entity.getUser().getId(),
                NotificationEventType.DATA_REQUEST_UPDATED,
                "Cập nhật yêu cầu dữ liệu cá nhân",
                "Yêu cầu #" + requestId + " (" + entity.getRequestType() + ") đã chuyển sang trạng thái: " + request.status()
                        + (request.response() != null ? ". Phản hồi: " + request.response().trim() : ""),
                "DATA_SUBJECT_REQUEST",
                String.valueOf(saved.getId())
        );

        // 2. Ghi nhật ký kiểm toán bất biến
        AuditLog auditLog = AuditLog.builder()
                .actor(dpoUser)
                .actorEmail(dpoUser.getEmail())
                .action("UPDATE_DATA_SUBJECT_REQUEST")
                .entityType("DATA_SUBJECT_REQUEST")
                .entityId(String.valueOf(saved.getId()))
                .beforeState("{\"status\":\"" + beforeStatus + "\"}")
                .afterState("{\"status\":\"" + request.status() + "\",\"response\":\"" + entity.getResponse() + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        log.info("DPO ID={} đã cập nhật yêu cầu ID={}: Status={}", dpoUserId, saved.getId(), request.status());
        return DataSubjectRequestResponse.fromEntity(saved);
    }
}
