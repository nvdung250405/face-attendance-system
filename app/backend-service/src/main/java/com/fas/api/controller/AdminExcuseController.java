package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.ApproveExcuseRequest;
import com.fas.api.dto.request.DecideExcuseRequest;
import com.fas.api.dto.request.RejectExcuseRequest;
import com.fas.api.dto.response.ExcuseRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.enums.ExcuseRequestStatus;
import com.fas.data.repository.UserRepository;
import com.fas.service.ExcuseRequestService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller Quản trị & Phê duyệt Đơn Giải trình Công dành cho HR/Admin
 * (APD-BE-016, API-BE-028, API-BE-029, FR-BE-015, BLD-BE-028, TASK-BE-033).
 *
 * <p>Yêu cầu quyền: {@code HR_MANAGER} hoặc {@code ADMIN}.
 */
@RestController
@RequestMapping("/api/v1/admin/excuse-requests")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class AdminExcuseController {

    private final ExcuseRequestService excuseRequestService;
    private final UserRepository userRepository;

    public AdminExcuseController(ExcuseRequestService excuseRequestService, UserRepository userRepository) {
        this.excuseRequestService = excuseRequestService;
        this.userRepository = userRepository;
    }

    /**
     * Tra cứu danh sách đơn giải trình công phục vụ xử lý (GET /api/v1/admin/excuse-requests - API-BE-028).
     *
     * @param status   trạng thái đơn cần lọc (tùy chọn: PENDING, APPROVED, REJECTED)
     * @param pageable thông số phân trang và sắp xếp
     * @return danh sách đơn giải trình kèm mã HTTP 200 OK
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<ExcuseRequestResponse>> getExcuseRequests(
            @RequestParam(name = "status", required = false) ExcuseRequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ExcuseRequestResponse> page = excuseRequestService.getExcuseRequests(status, pageable);
        return ApiResponse.ok("EXCUSE_REQUEST_LIST_FETCHED", "Lấy danh sách đơn giải trình thành công", PageResponse.from(page));
    }

    /**
     * Lấy chi tiết đơn giải trình công theo ID (GET /api/v1/admin/excuse-requests/{id}).
     *
     * @param id mã định danh đơn giải trình
     * @return chi tiết đơn giải trình kèm mã HTTP 200 OK
     */
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ExcuseRequestResponse> getExcuseRequestById(@PathVariable("id") Long id) {
        ExcuseRequestResponse response = excuseRequestService.getExcuseRequestById(id);
        return ApiResponse.ok("EXCUSE_REQUEST_FETCHED", "Lấy chi tiết đơn giải trình thành công", response);
    }

    /**
     * Ra quyết định duyệt hoặc từ chối đơn giải trình công (PATCH /api/v1/admin/excuse-requests/{id} - API-BE-029).
     *
     * <p>Quy tắc:
     * <ul>
     *   <li>Duyệt đơn: cập nhật bản ghi điểm danh tương ứng trong cùng giao dịch, ghi vết audit_logs.</li>
     *   <li>Từ chối đơn: bắt buộc phải có lý do từ chối (rejectionReason không rỗng).</li>
     *   <li>Đơn đã duyệt/từ chối trước đó sẽ bị từ chối với HTTP 409 {@code EXCUSE_ALREADY_PROCESSED}.</li>
     * </ul>
     *
     * @param id             mã định danh đơn giải trình
     * @param request        thông tin quyết định (trạng thái, ghi chú, lý do)
     * @param authentication thông tin tài khoản người thực hiện duyệt
     * @param headerUserId   mã định danh người duyệt dự phòng từ header (phục vụ test)
     * @return kết quả đơn giải trình sau khi xử lý kèm HTTP 200 OK
     */
    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ExcuseRequestResponse> decideExcuseRequest(
            @PathVariable("id") Long id,
            @Valid @RequestBody DecideExcuseRequest request,
            java.security.Principal principal) {

        Long decidedByUserId = resolveActorId(principal);

        if (request.status() == ExcuseRequestStatus.APPROVED) {
            ApproveExcuseRequest approveRequest = new ApproveExcuseRequest(request.reviewNote());
            ExcuseRequestResponse response = excuseRequestService.approveExcuseRequest(id, decidedByUserId, approveRequest);
            return ApiResponse.ok("EXCUSE_REQUEST_APPROVED", "Phê duyệt đơn giải trình công thành công", response);
        } else if (request.status() == ExcuseRequestStatus.REJECTED) {
            if (!StringUtils.hasText(request.rejectionReason())) {
                throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Lý do từ chối không được để trống khi từ chối đơn");
            }
            RejectExcuseRequest rejectRequest = new RejectExcuseRequest(request.rejectionReason());
            ExcuseRequestResponse response = excuseRequestService.rejectExcuseRequest(id, decidedByUserId, rejectRequest);
            return ApiResponse.ok("EXCUSE_REQUEST_REJECTED", "Từ chối đơn giải trình công thành công", response);
        } else {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Trạng thái quyết định chỉ có thể là APPROVED hoặc REJECTED");
        }
    }

    /**
     * Phê duyệt đơn giải trình công (POST /api/v1/admin/excuse-requests/{id}/approve).
     *
     * @param id           mã định danh đơn giải trình
     * @param request      ghi chú phê duyệt (tùy chọn)
     * @param principal    thông tin tài khoản người thực hiện duyệt
     * @param headerUserId mã định danh người duyệt dự phòng từ header
     * @return thông tin đơn giải trình sau phê duyệt kèm HTTP 200 OK
     */
    @PostMapping("/{id}/approve")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ExcuseRequestResponse> approveExcuseRequest(
            @PathVariable("id") Long id,
            @Valid @RequestBody(required = false) ApproveExcuseRequest request,
            java.security.Principal principal) {

        Long decidedByUserId = resolveActorId(principal);
        ApproveExcuseRequest approveReq = request != null ? request : new ApproveExcuseRequest(null);
        ExcuseRequestResponse response = excuseRequestService.approveExcuseRequest(id, decidedByUserId, approveReq);
        return ApiResponse.ok("EXCUSE_REQUEST_APPROVED", "Phê duyệt đơn giải trình công thành công", response);
    }

    /**
     * Từ chối đơn giải trình công (POST /api/v1/admin/excuse-requests/{id}/reject).
     *
     * @param id           mã định danh đơn giải trình
     * @param request      lý do từ chối (bắt buộc)
     * @param principal    thông tin tài khoản người thực hiện duyệt
     * @param headerUserId mã định danh người duyệt dự phòng từ header
     * @return thông tin đơn giải trình sau từ chối kèm HTTP 200 OK
     */
    @PostMapping("/{id}/reject")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ExcuseRequestResponse> rejectExcuseRequest(
            @PathVariable("id") Long id,
            @Valid @RequestBody RejectExcuseRequest request,
            java.security.Principal principal) {

        Long decidedByUserId = resolveActorId(principal);
        ExcuseRequestResponse response = excuseRequestService.rejectExcuseRequest(id, decidedByUserId, request);
        return ApiResponse.ok("EXCUSE_REQUEST_REJECTED", "Từ chối đơn giải trình công thành công", response);
    }

    private Long resolveActorId(java.security.Principal principal) {
        String principalName = null;
        if (principal != null && StringUtils.hasText(principal.getName())) {
            principalName = principal.getName();
        } else {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
                principalName = auth.getName();
            }
        }

        if (StringUtils.hasText(principalName)) {
            final String name = principalName;
            return userRepository.findByEmail(name)
                    .or(() -> userRepository.findByEmployeeCode(name))
                    .map(u -> u.getId())
                    .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                            "Không tìm thấy người duyệt tương ứng với tài khoản: " + name));
        }

        throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Yêu cầu đăng nhập để thực hiện thao tác");
    }
}
