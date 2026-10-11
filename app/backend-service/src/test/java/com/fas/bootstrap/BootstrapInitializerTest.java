package com.fas.bootstrap;

import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử Bộ Khởi tạo Hệ thống An toàn & Idempotent Bootstrap
 * (SOL-BE-021, FR-BE-018, SRS-005, SRS-006, DD-BE-021, DD-SYS-022, TST-BE-033, BLD-BE-031, TASK-BE-036).
 */
@ExtendWith(MockitoExtension.class)
class BootstrapInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private final Clock clock = Clock.fixed(Instant.parse("2026-10-11T10:00:00Z"), ZoneId.of("UTC"));

    private BootstrapInitializer bootstrapInitializer;

    @BeforeEach
    void setUp() {
        bootstrapInitializer = new BootstrapInitializer(userRepository, passwordEncoder, clock);
    }

    @Test
    @DisplayName("TST-BE-033: Lần chạy đầu trên CSDL trống tạo đúng một tài khoản ADMIN dùng được ngay")
    void initializeAdmin_EmptyDatabase_CreatesAdminWithTemporaryPassword() {
        // Given
        when(userRepository.countByRoleAndStatus(Role.ADMIN, EmployeeStatus.ACTIVE)).thenReturn(0L);
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "$2a$12$hashed_" + inv.getArgument(0));

        // When
        Optional<String> tempPassword = bootstrapInitializer.initializeAdmin();

        // Then
        assertThat(tempPassword).isPresent();
        assertThat(tempPassword.get()).hasSize(12);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());

        User created = captor.getValue();
        assertThat(created.getEmail()).isEqualTo("admin@fas.com");
        assertThat(created.getEmployeeCode()).isEqualTo("ADMIN-001");
        assertThat(created.getFullName()).isEqualTo("System Administrator");
        assertThat(created.getRole()).isEqualTo(Role.ADMIN);
        assertThat(created.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
        assertThat(created.getPasswordHash()).startsWith("$2a$12$hashed_");
    }

    @Test
    @DisplayName("TST-BE-033: Idempotent - Restart nhiều lần không tạo thêm tài khoản khi đã có ADMIN")
    void initializeAdmin_AdminAlreadyExists_DoesNotCreateAccount() {
        // Given: Đã có tài khoản ADMIN hoạt động
        when(userRepository.countByRoleAndStatus(Role.ADMIN, EmployeeStatus.ACTIVE)).thenReturn(1L);

        // When
        Optional<String> tempPassword = bootstrapInitializer.initializeAdmin();

        // Then
        assertThat(tempPassword).isEmpty();
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("TST-BE-033: Cấu hình mật khẩu bootstrap từ biến môi trường >= 12 ký tự được chấp nhận")
    void initializeAdmin_CustomPasswordProvided_UsesConfiguredPassword() {
        // Given
        bootstrapInitializer.setConfiguredAdminPassword("CustomAdminPass2026!");
        bootstrapInitializer.setConfiguredAdminEmail("root@company.com");
        bootstrapInitializer.setConfiguredAdminCode("ADMIN-999");
        bootstrapInitializer.setConfiguredAdminName("Root Admin");

        when(userRepository.countByRoleAndStatus(Role.ADMIN, EmployeeStatus.ACTIVE)).thenReturn(0L);
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(passwordEncoder.encode("CustomAdminPass2026!")).thenReturn("$2a$12$hashed_CustomAdminPass2026!");

        // When
        Optional<String> result = bootstrapInitializer.initializeAdmin();

        // Then
        assertThat(result).contains("CustomAdminPass2026!");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User created = captor.getValue();
        assertThat(created.getEmail()).isEqualTo("root@company.com");
        assertThat(created.getEmployeeCode()).isEqualTo("ADMIN-999");
        assertThat(created.getFullName()).isEqualTo("Root Admin");
        assertThat(created.getPasswordHash()).isEqualTo("$2a$12$hashed_CustomAdminPass2026!");
    }

    @Test
    @DisplayName("TST-BE-033: Mật khẩu cấu hình ngắn hơn 12 ký tự bị từ chối theo DD-SYS-022")
    void initializeAdmin_PasswordTooShort_ThrowsException() {
        // Given: Mật khẩu chỉ có 10 ký tự (< 12)
        bootstrapInitializer.setConfiguredAdminPassword("shortpass1");
        when(userRepository.countByRoleAndStatus(Role.ADMIN, EmployeeStatus.ACTIVE)).thenReturn(0L);
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);

        // When / Then
        assertThatThrownBy(() -> bootstrapInitializer.initializeAdmin())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tối thiểu 12 ký tự");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("TST-BE-033: Khi bootstrap bị vô hiệu hóa qua cấu hình thì không tạo tài khoản")
    void initializeAdmin_Disabled_DoesNotCreateAccount() {
        // Given
        bootstrapInitializer.setEnabled(false);

        // When
        Optional<String> result = bootstrapInitializer.initializeAdmin();

        // Then
        assertThat(result).isEmpty();
        verify(userRepository, never()).save(any());
    }
}
