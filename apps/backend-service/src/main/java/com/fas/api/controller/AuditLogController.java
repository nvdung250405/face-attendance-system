package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.AuditLogFilterCriteria;
import com.fas.api.dto.response.AuditLogItemResponse;
import com.fas.service.AuditQueryService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller Tra cứu Nhật ký Kiểm toán ở Chế độ Chỉ đọc
 * (APD-BE-017, API-BE-030, FR-BE-016, BLD-BE-029, TASK-BE-034).
 *
 * <p>Yêu cầu vai trò: {@code ADMIN}. Không hỗ trợ thao tác ghi/sửa/xóa.</p>
 */
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditQueryService auditQueryService;

    public AuditLogController(AuditQueryService auditQueryService) {
        this.auditQueryService = auditQueryService;
    }

    /**
     * Tra cứu nhật ký kiểm toán bất biến có lọc và phân trang (GET /api/v1/admin/audit-logs - API-BE-030).
     *
     * @param criteria tiêu chí lọc (khoảng thời gian, actorId, action, entityType)
     * @param pageable thông số phân trang và sắp xếp
     * @return danh sách nhật ký kiểm toán phân trang kèm HTTP 200 OK
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<AuditLogItemResponse>> getAuditLogs(
            @ModelAttribute AuditLogFilterCriteria criteria,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<AuditLogItemResponse> response = auditQueryService.queryAuditLogs(criteria, pageable);
        return ApiResponse.ok("AUDIT_LOGS_FETCHED", "Tra cứu nhật ký kiểm toán thành công", response);
    }
}
