package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.CreateDataSubjectRequest;
import com.fas.api.dto.request.UpdateDataSubjectRequest;
import com.fas.api.dto.response.DataSubjectRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.repository.UserRepository;
import com.fas.service.DataSubjectRequestService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * REST Controller Tiếp nhận & Xử lý Yêu cầu Quyền Chủ thể Dữ liệu Cá nhân
 * (APD-BE-024, API-BE-042, FR-BE-022, DATA-BE-024, BLD-BE-034, TASK-BE-039).
 */
@RestController
@RequestMapping("/api/v1")
public class DataSubjectRequestController {

    private final DataSubjectRequestService dataSubjectRequestService;
    private final UserRepository userRepository;

    public DataSubjectRequestController(
            DataSubjectRequestService dataSubjectRequestService,
            UserRepository userRepository) {
        this.dataSubjectRequestService = dataSubjectRequestService;
        this.userRepository = userRepository;
    }

    /**
     * Nhân viên gửi yêu cầu truy cập hoặc chỉnh sửa dữ liệu cá nhân
     * (POST /api/v1/employee/data-requests - API-BE-042).
     *
     * @param request        nội dung yêu cầu gồm loại yêu cầu và chi tiết
     * @param principal      thông tin người dùng đang thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return kết quả tạo yêu cầu với mã HTTP 201 Created
     */
    @PostMapping("/employee/data-requests")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<DataSubjectRequestResponse> createRequest(
            @Valid @RequestBody CreateDataSubjectRequest request,
            Principal principal) {
        Long userId = resolveUserId(principal);
        DataSubjectRequestResponse response = dataSubjectRequestService.createRequest(userId, request);
        return ApiResponse.ok("DATA_REQUEST_CREATED", "Gửi yêu cầu dữ liệu cá nhân thành công", response);
    }

    /**
     * Nhân viên tra cứu danh sách các yêu cầu dữ liệu cá nhân của chính mình
     * (GET /api/v1/employee/data-requests - API-BE-042).
     *
     * @param pageable       thông số phân trang
     * @param principal      thông tin người dùng đang thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return danh sách yêu cầu dữ liệu cá nhân
     */
    @GetMapping("/employee/data-requests")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<DataSubjectRequestResponse>> getMyRequests(
            @PageableDefault(size = 20) Pageable pageable,
            Principal principal) {
        Long userId = resolveUserId(principal);
        Page<DataSubjectRequestResponse> requests = dataSubjectRequestService.getRequestsByUser(userId, pageable);
        return ApiResponse.ok("DATA_REQUESTS_FETCHED", "Tra cứu yêu cầu dữ liệu cá nhân thành công", requests);
    }

    /**
     * Nhân viên tra cứu chi tiết một yêu cầu dữ liệu cá nhân.
     *
     * @param id        định danh yêu cầu
     * @param principal thông tin người dùng đang thực hiện
     * @return chi tiết yêu cầu
     */
    @GetMapping("/employee/data-requests/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<DataSubjectRequestResponse> getMyRequestDetail(
            @PathVariable("id") Long id,
            Principal principal) {
        Long userId = resolveUserId(principal);
        DataSubjectRequestResponse response = dataSubjectRequestService.getRequestByIdForUser(id, userId);
        return ApiResponse.ok("DATA_REQUEST_FETCHED", "Tra cứu chi tiết yêu cầu thành công", response);
    }

    /**
     * Cán bộ DPO tra cứu toàn bộ danh sách yêu cầu dữ liệu cá nhân để xử lý
     * (GET /api/v1/dpo/data-requests - API-BE-042).
     *
     * @param status   bộ lọc theo trạng thái yêu cầu (tùy chọn)
     * @param pageable thông số phân trang
     * @return danh sách yêu cầu dữ liệu cá nhân phân trang
     */
    @GetMapping("/dpo/data-requests")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('DPO', 'ADMIN')")
    public ApiResponse<Page<DataSubjectRequestResponse>> getDpoRequests(
            @RequestParam(name = "status", required = false) DataSubjectRequestStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<DataSubjectRequestResponse> requests = dataSubjectRequestService.getAllRequests(status, pageable);
        return ApiResponse.ok("DPO_REQUESTS_FETCHED", "Tra cứu danh sách yêu cầu DPO thành công", requests);
    }

    /**
     * Cán bộ DPO cập nhật trạng thái xử lý và gửi phản hồi cho yêu cầu
     * (PATCH /api/v1/dpo/data-requests/{id} - API-BE-042).
     *
     * @param id             định danh yêu cầu
     * @param request        nội dung cập nhật trạng thái và phản hồi
     * @param principal      thông tin cán bộ DPO thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return kết quả sau khi cập nhật
     */
    @PatchMapping("/dpo/data-requests/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('DPO', 'ADMIN')")
    public ApiResponse<DataSubjectRequestResponse> updateRequestStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDataSubjectRequest request,
            Principal principal) {
        Long dpoUserId = resolveUserId(principal);
        DataSubjectRequestResponse response = dataSubjectRequestService.updateRequestStatus(id, dpoUserId, request);
        return ApiResponse.ok("DATA_REQUEST_UPDATED", "Cập nhật yêu cầu dữ liệu cá nhân thành công", response);
    }

    private Long resolveUserId(Principal principal) {
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
                    .map(User::getId)
                    .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
        }

        throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Người dùng chưa đăng nhập");
    }
}
