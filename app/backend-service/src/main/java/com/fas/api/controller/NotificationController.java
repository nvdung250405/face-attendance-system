package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.response.NotificationResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.NotificationService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

/**
 * REST Controller Thông báo Trong ứng dụng
 * (APD-BE-026, API-BE-044, FR-BE-024, DATA-BE-023, BLD-BE-034, TASK-BE-039).
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /**
     * Tra cứu danh sách thông báo của người dùng đang đăng nhập
     * (GET /api/v1/notifications - API-BE-044).
     *
     * @param pageable       thông số phân trang và sắp xếp
     * @param principal      thông tin người dùng đang thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return danh sách thông báo phân trang
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<NotificationResponse>> getMyNotifications(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long explicitUserId) {
        Long userId = resolveUserId(principal, explicitUserId);
        Page<NotificationResponse> notifications = notificationService.getUserNotifications(userId, pageable);
        return ApiResponse.ok("NOTIFICATIONS_FETCHED", "Lấy danh sách thông báo thành công", notifications);
    }

    /**
     * Đếm số lượng thông báo chưa đọc của người dùng đang đăng nhập
     * (GET /api/v1/notifications/unread-count).
     *
     * @param principal      thông tin người dùng đang thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return số lượng thông báo chưa đọc
     */
    @GetMapping("/unread-count")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Long>> getUnreadCount(
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long explicitUserId) {
        Long userId = resolveUserId(principal, explicitUserId);
        long unreadCount = notificationService.getUnreadCount(userId);
        return ApiResponse.ok("UNREAD_COUNT_FETCHED", "Lấy số lượng thông báo chưa đọc thành công", Map.of("unreadCount", unreadCount));
    }

    /**
     * Đánh dấu một thông báo đã đọc
     * (PATCH /api/v1/notifications/{id}/read - API-BE-044).
     *
     * @param id             định danh thông báo
     * @param principal      thông tin người dùng đang thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return thông báo sau khi đánh dấu đã đọc
     */
    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationResponse> markAsRead(
            @PathVariable("id") Long id,
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long explicitUserId) {
        Long userId = resolveUserId(principal, explicitUserId);
        NotificationResponse notification = notificationService.markAsRead(id, userId);
        return ApiResponse.ok("NOTIFICATION_READ", "Đánh dấu đã đọc thông báo thành công", notification);
    }

    /**
     * Đánh dấu tất cả thông báo của người dùng đã đọc
     * (POST /api/v1/notifications/read-all).
     *
     * @param principal      thông tin người dùng đang thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return kết quả thao tác
     */
    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> markAllAsRead(
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long explicitUserId) {
        Long userId = resolveUserId(principal, explicitUserId);
        notificationService.markAllAsRead(userId);
        return ApiResponse.ok("NOTIFICATIONS_READ_ALL", "Đánh dấu đã đọc tất cả thông báo thành công", null);
    }

    private Long resolveUserId(Principal principal, Long explicitUserId) {
        if (explicitUserId != null) {
            return explicitUserId;
        }

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
