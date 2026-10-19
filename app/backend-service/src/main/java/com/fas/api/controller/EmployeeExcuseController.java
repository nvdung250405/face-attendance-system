package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.SubmitExcuseRequest;
import com.fas.api.dto.response.ExcuseRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
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
import org.springframework.web.bind.annotation.*;

import org.springframework.util.StringUtils;

import java.security.Principal;

/**
 * REST Controller Tự phục vụ Đơn Giải trình Công của Nhân viên
 * (APD-BE-015, API-BE-026, API-BE-027, FR-BE-014, BLD-BE-028, TASK-BE-033).
 *
 * <p>Yêu cầu xác thực: Người dùng đã đăng nhập hệ thống (mọi vai trò hợp lệ).
 */
@RestController
@RequestMapping("/api/v1/employee/excuse-requests")
@PreAuthorize("isAuthenticated()")
public class EmployeeExcuseController {

    private final ExcuseRequestService excuseRequestService;
    private final UserRepository userRepository;

    public EmployeeExcuseController(ExcuseRequestService excuseRequestService, UserRepository userRepository) {
        this.excuseRequestService = excuseRequestService;
        this.userRepository = userRepository;
    }

    /**
     * Nộp đơn giải trình công cho một lượt điểm danh (POST /api/v1/employee/excuse-requests - API-BE-026).
     *
     * <p>Quy tắc:
     * <ul>
     *   <li>Chỉ nhận bản ghi điểm danh thuộc chính người gửi trong vòng 30 ngày gần nhất.</li>
     *   <li>Bản ghi không thuộc người gửi trả HTTP 404 {@code RESOURCE_NOT_FOUND}.</li>
     *   <li>Đã quá 30 ngày trả HTTP 400 {@code EXCUSE_WINDOW_EXPIRED}.</li>
     *   <li>Đã có đơn PENDING cho lượt này trả HTTP 409 {@code EXCUSE_ALREADY_PENDING}.</li>
     * </ul>
     *
     * @param request      dữ liệu nộp đơn giải trình
     * @param principal    thông tin người dùng hiện tại
     * @param headerUserId mã định danh nhân viên dự phòng từ header (phục vụ test)
     * @return chi tiết đơn giải trình vừa tạo kèm HTTP 201 Created
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExcuseRequestResponse> submitExcuseRequest(
            @Valid @RequestBody SubmitExcuseRequest request,
            Principal principal) {

        Long userId = resolveUserId(principal);
        ExcuseRequestResponse response = excuseRequestService.submitExcuseRequest(userId, request);
        return ApiResponse.ok("EXCUSE_REQUEST_SUBMITTED", "Nộp đơn giải trình công thành công", response);
    }

    /**
     * Tra cứu danh sách đơn giải trình của chính nhân viên đang đăng nhập
     * (GET /api/v1/employee/excuse-requests - API-BE-027).
     *
     * @param pageable     thông số phân trang và sắp xếp
     * @param principal    thông tin người dùng hiện tại
     * @param headerUserId mã định danh nhân viên dự phòng từ header (phục vụ test)
     * @return trang kết quả các đơn giải trình kèm HTTP 200 OK
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Page<ExcuseRequestResponse>> getMyExcuseRequests(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal) {

        Long userId = resolveUserId(principal);
        Page<ExcuseRequestResponse> page = excuseRequestService.getEmployeeExcuseRequests(userId, pageable);
        return ApiResponse.ok("EMPLOYEE_EXCUSES_FETCHED", "Lấy danh sách đơn giải trình thành công", page);
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
                    .map(u -> u.getId())
                    .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                            "Không tìm thấy nhân viên tương ứng với tài khoản: " + name));
        }

        throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Yêu cầu đăng nhập để thực hiện thao tác");
    }
}
