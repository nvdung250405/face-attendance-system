package com.fas.service;

import com.fas.api.dto.request.PinResetRequest;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.dto.response.ResetCredentialsResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử Dịch vụ Khôi phục Thông tin Xác thực (Reset Password & Reset PIN)
 * (SOL-BE-022, FR-BE-019, DD-BE-022, API-BE-036, API-BE-037, TST-BE-034, BLD-BE-031, TASK-BE-036).
 */
@ExtendWith(MockitoExtension.class)
class CredentialRecoveryServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SessionService sessionService;

    @Mock
    private PinService pinService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private CredentialRecoveryService credentialRecoveryService;

    @BeforeEach
    void setUp() {
        credentialRecoveryService = new CredentialRecoveryService(
                userRepository,
                sessionService,
                pinService,
                passwordEncoder
        );
    }

    @Test
    @DisplayName("TST-BE-034: HR cấp lại mật khẩu tạm: sinh mật khẩu mới hiển thị 1 lần, cập nhật hash, thu hồi toàn bộ phiên cũ")
    void resetPassword_ActiveEmployee_Success() {
        // Given
        Long employeeId = 100L;
        User user = User.builder()
                .id(employeeId)
                .employeeCode("NV-100")
                .fullName("Nguyen Van A")
                .email("nva@fas.com")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .passwordHash("$2a$12$oldHashedPassword")
                .build();

        when(userRepository.findById(employeeId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "$2a$12$newHashed_" + inv.getArgument(0));

        // When
        ResetCredentialsResponse response = credentialRecoveryService.resetPassword(employeeId);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.employeeId()).isEqualTo(employeeId);
        assertThat(response.employeeCode()).isEqualTo("NV-100");
        assertThat(response.email()).isEqualTo("nva@fas.com");
        assertThat(response.temporaryPassword()).isNotBlank().hasSize(12);

        // Mật khẩu mới được băm và lưu
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User updated = captor.getValue();
        assertThat(updated.getPasswordHash()).startsWith("$2a$12$newHashed_");

        // Toàn bộ phiên cũ bị thu hồi ngay lập tức
        verify(sessionService).revokeAllSessionsForUser(employeeId);
    }

    @Test
    @DisplayName("TST-BE-034: Cấp lại mật khẩu cho nhân sự không tồn tại ném EMPLOYEE_NOT_FOUND")
    void resetPassword_EmployeeNotFound_ThrowsException() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> credentialRecoveryService.resetPassword(999L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));

        verify(sessionService, never()).revokeAllSessionsForUser(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("TST-BE-034: Từ chối cấp lại mật khẩu cho nhân sự đã thôi việc (TERMINATED)")
    void resetPassword_TerminatedEmployee_ThrowsAccessDenied() {
        // Given
        Long employeeId = 101L;
        User user = User.builder()
                .id(employeeId)
                .employeeCode("NV-101")
                .status(EmployeeStatus.TERMINATED)
                .build();

        when(userRepository.findById(employeeId)).thenReturn(Optional.of(user));

        // When / Then
        assertThatThrownBy(() -> credentialRecoveryService.resetPassword(employeeId))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.ACCESS_DENIED));

        verify(sessionService, never()).revokeAllSessionsForUser(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("TST-BE-034: Đặt lại mã PIN dự phòng ủy quyền cho PinService xử lý")
    void resetPin_ValidRequest_DelegatesToPinService() {
        // Given
        Long userId = 100L;
        PinResetRequest request = new PinResetRequest("CurrentPassword123!", "654321", "654321");
        PinOperationResult expectedResult = new PinOperationResult(true, "Đặt lại mã PIN thành công");

        when(pinService.resetPinWithPassword(userId, request)).thenReturn(expectedResult);

        // When
        PinOperationResult actualResult = credentialRecoveryService.resetPin(userId, request);

        // Then
        assertThat(actualResult).isNotNull();
        assertThat(actualResult.hasPin()).isTrue();
        assertThat(actualResult.message()).isEqualTo("Đặt lại mã PIN thành công");
        verify(pinService).resetPinWithPassword(userId, request);
    }

    @Test
    @DisplayName("TST-BE-034: Đặt lại PIN với request null ném VALIDATION_FAILED")
    void resetPin_NullRequest_ThrowsException() {
        // When / Then
        assertThatThrownBy(() -> credentialRecoveryService.resetPin(100L, null))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

        verify(pinService, never()).resetPinWithPassword(any(), any());
    }
}
