package com.fas.security;

import com.fas.common.error.ApiErrorCode;
import com.fas.common.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.Principal;

/**
 * Service tiện ích truy xuất thông tin tài khoản người dùng hiện tại (Principal).
 * Đóng gói logic phân giải Principal từ SecurityContext hoặc Principal parameter,
 * ngăn chặn rò rỉ tầng dữ liệu (UserRepository) lên tầng REST Controller (ARCH-F-01).
 */
@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Lấy thông tin thực thể User đang đăng nhập từ Principal hoặc SecurityContext.
     */
    public User getRequiredCurrentUser(Principal principal) {
        String principalName = resolvePrincipalName(principal);
        if (StringUtils.hasText(principalName)) {
            final String name = principalName;
            return userRepository.findByEmail(name)
                    .or(() -> userRepository.findByEmployeeCode(name))
                    .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                            "Không tìm thấy thông tin tài khoản người dùng"));
        }
        throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Người dùng chưa đăng nhập");
    }

    /**
     * Lấy ID tài khoản người dùng đang đăng nhập từ Principal hoặc SecurityContext.
     */
    public Long getCurrentUserId(Principal principal) {
        return getRequiredCurrentUser(principal).getId();
    }

    /**
     * Lấy thông tin thực thể User đang đăng nhập trực tiếp từ SecurityContext.
     */
    public User getRequiredCurrentUser() {
        return getRequiredCurrentUser(null);
    }

    /**
     * Lấy ID tài khoản người dùng đang đăng nhập trực tiếp từ SecurityContext.
     */
    public Long getCurrentUserId() {
        return getCurrentUserId(null);
    }

    private String resolvePrincipalName(Principal principal) {
        if (principal != null && StringUtils.hasText(principal.getName())) {
            return principal.getName();
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            return auth.getName();
        }
        return null;
    }
}
