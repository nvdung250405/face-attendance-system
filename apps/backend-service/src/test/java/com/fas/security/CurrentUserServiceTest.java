package com.fas.security;

import com.fas.common.error.ApiErrorCode;
import com.fas.common.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CurrentUserService currentUserService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1042L)
                .email("dung.nv@company.com")
                .employeeCode("NV-1042")
                .fullName("Ngo Van Dung")
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Lấy User thành công theo email từ Principal")
    void getRequiredCurrentUser_ByEmail_Success() {
        Principal principal = () -> "dung.nv@company.com";
        when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));

        User user = currentUserService.getRequiredCurrentUser(principal);

        assertThat(user).isNotNull();
        assertThat(user.getId()).isEqualTo(1042L);
        assertThat(user.getEmail()).isEqualTo("dung.nv@company.com");
    }

    @Test
    @DisplayName("Lấy User thành công theo employeeCode từ Principal")
    void getRequiredCurrentUser_ByEmployeeCode_Success() {
        Principal principal = () -> "NV-1042";
        when(userRepository.findByEmail("NV-1042")).thenReturn(Optional.empty());
        when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));

        User user = currentUserService.getRequiredCurrentUser(principal);

        assertThat(user).isNotNull();
        assertThat(user.getId()).isEqualTo(1042L);
        assertThat(user.getEmployeeCode()).isEqualTo("NV-1042");
    }

    @Test
    @DisplayName("Lấy CurrentUserId thành công từ Principal")
    void getCurrentUserId_WithPrincipal_Success() {
        Principal principal = () -> "dung.nv@company.com";
        when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));

        Long userId = currentUserService.getCurrentUserId(principal);

        assertThat(userId).isEqualTo(1042L);
    }

    @Test
    @DisplayName("Lấy User thành công từ SecurityContextHolder khi Principal null")
    void getRequiredCurrentUser_FromSecurityContext_Success() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "dung.nv@company.com", "password", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));

        User user = currentUserService.getRequiredCurrentUser();
        Long userId = currentUserService.getCurrentUserId();

        assertThat(user).isNotNull();
        assertThat(userId).isEqualTo(1042L);
    }

    @Test
    @DisplayName("Quăng ngoại lệ EMPLOYEE_NOT_FOUND khi không tìm thấy tài khoản")
    void getRequiredCurrentUser_NotFound_ThrowsException() {
        Principal principal = () -> "unknown@company.com";
        when(userRepository.findByEmail("unknown@company.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmployeeCode("unknown@company.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> currentUserService.getRequiredCurrentUser(principal))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND);
                });
    }

    @Test
    @DisplayName("Quăng ngoại lệ ACCESS_DENIED khi chưa xác thực")
    void getRequiredCurrentUser_Unauthenticated_ThrowsException() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        AnonymousAuthenticationToken anonAuth = new AnonymousAuthenticationToken(
                "key", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));
        context.setAuthentication(anonAuth);
        SecurityContextHolder.setContext(context);

        assertThatThrownBy(() -> currentUserService.getRequiredCurrentUser(null))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.ACCESS_DENIED);
                });
    }
}
