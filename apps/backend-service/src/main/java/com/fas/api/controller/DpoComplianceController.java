package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.response.ConsentRecordItem;
import com.fas.api.dto.response.RetentionScheduleItem;
import com.fas.service.AuditQueryService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller Tra cứu Dữ liệu Tuân thủ Bảo vệ Dữ liệu (DPO Compliance) ở Chế độ Chỉ đọc
 * (APD-BE-017, API-BE-031, FR-BE-016, BLD-BE-029, TASK-BE-034).
 *
 * <p>Yêu cầu vai trò: {@code DPO} hoặc {@code ADMIN}. Chế độ chỉ đọc, không có thao tác ghi.</p>
 */
@RestController
@RequestMapping("/api/v1/dpo")
@PreAuthorize("hasAnyRole('DPO', 'ADMIN')")
public class DpoComplianceController {

    private final AuditQueryService auditQueryService;

    public DpoComplianceController(AuditQueryService auditQueryService) {
        this.auditQueryService = auditQueryService;
    }

    /**
     * Tra cứu lịch sử thỏa thuận Informed Consent phục vụ DPO (GET /api/v1/dpo/consents - API-BE-031).
     *
     * @param pageable thông số phân trang
     * @return danh sách bản ghi Consent phân trang kèm HTTP 200 OK
     */
    @GetMapping("/consents")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<ConsentRecordItem>> getConsents(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<ConsentRecordItem> response = auditQueryService.queryConsents(pageable);
        return ApiResponse.ok("CONSENTS_FETCHED", "Tra cứu danh sách Informed Consent thành công", response);
    }

    /**
     * Tra cứu lịch trình tiêu hủy dữ liệu sinh trắc học nhân sự thôi việc (GET /api/v1/dpo/retention-schedule - API-BE-031).
     *
     * @param pageable thông số phân trang
     * @return danh sách lịch trình tiêu hủy phân trang kèm HTTP 200 OK
     */
    @GetMapping("/retention-schedule")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<RetentionScheduleItem>> getRetentionSchedule(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<RetentionScheduleItem> response = auditQueryService.queryRetentionSchedule(pageable);
        return ApiResponse.ok("RETENTION_SCHEDULE_FETCHED", "Tra cứu lịch trình tiêu hủy dữ liệu sinh trắc học thành công", response);
    }
}
