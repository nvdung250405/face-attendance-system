package com.fas.service;

import com.fas.api.dto.request.KioskVerifyPinRequest;
import com.fas.api.dto.request.PinChangeRequest;
import com.fas.api.dto.request.PinResetRequest;
import com.fas.api.dto.request.PinSetupRequest;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.dto.response.PinVerificationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho PinService (SOL-BE-016, FR-BE-012, DATA-BE-012, BLD-BE-020, TASK-BE-025).
 */
@ExtendWith(MockitoExtension.class)
class PinServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private PinService pinService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        pinService = new PinService(userRepository, passwordEncoder);

        sampleUser = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .email("dung.nv@company.com")
                .passwordHash("$2a$12$hashedPassword1234567890")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .department("Phòng Kỹ thuật")
                .pinHash(null)
                .pinLockedUntil(null)
                .build();
    }

    @Nested
    @DisplayName("1. Thiết lập mã PIN lần đầu (setupPin)")
    class SetupPinTests {

        @Test
        @DisplayName("Thiết lập mã PIN thành công khi dữ liệu hợp lệ và chưa có PIN")
        void setupPin_Success() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.encode("123456")).thenReturn("$2a$12$hashedPin123456");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            PinOperationResult result = pinService.setupPin(1042L, new PinSetupRequest("123456", "123456"));

            assertThat(result.hasPin()).isTrue();
            assertThat(sampleUser.getPinHash()).isEqualTo("$2a$12$hashedPin123456");
            assertThat(sampleUser.getPinLockedUntil()).isNull();
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Ném lỗi EMPLOYEE_NOT_FOUND khi không tìm thấy người dùng")
        void setupPin_UserNotFound_ThrowsException() {
            when(userRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> pinService.setupPin(9999L, "123456", "123456"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND);
        }

        @Test
        @DisplayName("Ném lỗi DATA_INTEGRITY_VIOLATION khi người dùng đã có mã PIN")
        void setupPin_AlreadyHasPin_ThrowsException() {
            sampleUser.setPinHash("$2a$12$existingPinHash");
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> pinService.setupPin(1042L, "123456", "123456"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.DATA_INTEGRITY_VIOLATION);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi mã PIN không đủ 6 chữ số")
        void setupPin_InvalidFormat_ThrowsException() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> pinService.setupPin(1042L, "12345", "12345"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);

            assertThatThrownBy(() -> pinService.setupPin(1042L, "12a456", "12a456"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi mã PIN xác nhận không khớp")
        void setupPin_ConfirmPinMismatch_ThrowsException() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> pinService.setupPin(1042L, "123456", "654321"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }
    }

    @Nested
    @DisplayName("2. Đổi mã PIN dự phòng (changePin)")
    class ChangePinTests {

        @BeforeEach
        void initPin() {
            sampleUser.setPinHash("$2a$12$currentHashedPin");
        }

        @Test
        @DisplayName("Đổi mã PIN thành công khi mã PIN hiện tại đúng và mã mới hợp lệ")
        void changePin_Success() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("123456", "$2a$12$currentHashedPin")).thenReturn(true);
            when(passwordEncoder.encode("654321")).thenReturn("$2a$12$newHashedPin");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            PinOperationResult result = pinService.changePin(1042L, new PinChangeRequest("123456", "654321", "654321"));

            assertThat(result.hasPin()).isTrue();
            assertThat(sampleUser.getPinHash()).isEqualTo("$2a$12$newHashedPin");
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi người dùng chưa từng thiết lập mã PIN")
        void changePin_NoExistingPin_ThrowsException() {
            sampleUser.setPinHash(null);
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> pinService.changePin(1042L, "123456", "654321", "654321"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }

        @Test
        @DisplayName("Ném lỗi PIN_INVALID khi mã PIN hiện tại không chính xác")
        void changePin_IncorrectCurrentPin_ThrowsException() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("999999", "$2a$12$currentHashedPin")).thenReturn(false);

            assertThatThrownBy(() -> pinService.changePin(1042L, "999999", "654321", "654321"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_INVALID);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi mã PIN mới trùng với mã PIN hiện tại")
        void changePin_SamePin_ThrowsException() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("123456", "$2a$12$currentHashedPin")).thenReturn(true);

            assertThatThrownBy(() -> pinService.changePin(1042L, "123456", "123456", "123456"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi mã PIN mới xác nhận không khớp")
        void changePin_NewPinMismatch_ThrowsException() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("123456", "$2a$12$currentHashedPin")).thenReturn(true);

            assertThatThrownBy(() -> pinService.changePin(1042L, "123456", "654321", "111111"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }
    }

    @Nested
    @DisplayName("3. Đặt lại mã PIN bằng mật khẩu (resetPinWithPassword)")
    class ResetPinTests {

        @Test
        @DisplayName("Đặt lại mã PIN thành công khi mật khẩu tài khoản chính xác")
        void resetPinWithPassword_Success() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("Password@123", sampleUser.getPasswordHash())).thenReturn(true);
            when(passwordEncoder.encode("987654")).thenReturn("$2a$12$resetHashedPin");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            PinOperationResult result = pinService.resetPinWithPassword(1042L,
                    new PinResetRequest("Password@123", "987654", "987654"));

            assertThat(result.hasPin()).isTrue();
            assertThat(sampleUser.getPinHash()).isEqualTo("$2a$12$resetHashedPin");
            assertThat(sampleUser.getPinLockedUntil()).isNull();
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Ném lỗi AUTH_INVALID_CREDENTIALS khi mật khẩu tài khoản không đúng")
        void resetPinWithPassword_WrongPassword_ThrowsException() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("WrongPassword", sampleUser.getPasswordHash())).thenReturn(false);

            assertThatThrownBy(() -> pinService.resetPinWithPassword(1042L, "WrongPassword", "987654", "987654"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS);
        }
    }

    @Nested
    @DisplayName("4. Thẩm định mã PIN tại trạm Kiosk (verifyPin) & Khóa 15 phút")
    class VerifyPinTests {

        @BeforeEach
        void initPin() {
            sampleUser.setPinHash("$2a$12$correctPinHash");
        }

        @Test
        @DisplayName("Xác thực thành công khi mã nhân viên và mã PIN chính xác")
        void verifyPin_Success() {
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("123456", "$2a$12$correctPinHash")).thenReturn(true);

            PinVerificationResult result = pinService.verifyPin(new KioskVerifyPinRequest("NV-1042", "123456"));

            assertThat(result).isNotNull();
            assertThat(result.employeeId()).isEqualTo(1042L);
            assertThat(result.employeeCode()).isEqualTo("NV-1042");
            assertThat(result.fullName()).isEqualTo("Ngô Văn Dũng");
            assertThat(result.department()).isEqualTo("Phòng Kỹ thuật");
        }

        @Test
        @DisplayName("Ném lỗi EMPLOYEE_NOT_FOUND khi mã nhân viên không tồn tại")
        void verifyPin_EmployeeNotFound_ThrowsException() {
            when(userRepository.findByEmployeeCode("NV-UNKNOWN")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> pinService.verifyPin("NV-UNKNOWN", "123456"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND);
        }

        @Test
        @DisplayName("Ném lỗi ACCESS_DENIED khi nhân viên có trạng thái TERMINATED")
        void verifyPin_TerminatedEmployee_ThrowsException() {
            sampleUser.setStatus(EmployeeStatus.TERMINATED);
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "123456"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.ACCESS_DENIED);
        }

        @Test
        @DisplayName("Ném lỗi PIN_INVALID khi nhân viên chưa từng thiết lập mã PIN")
        void verifyPin_NoPinConfigured_ThrowsException() {
            sampleUser.setPinHash(null);
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "123456"))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_INVALID);
        }

        @Test
        @DisplayName("Lần sai 1 đến 4: ném PIN_INVALID và báo số lần thử còn lại")
        void verifyPin_FailedAttempts_UnderLimit() {
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("999999", "$2a$12$correctPinHash")).thenReturn(false);

            // Lần 1
            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Bạn còn 4 lần thử")
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_INVALID);

            // Lần 2
            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Bạn còn 3 lần thử")
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_INVALID);

            // Lần 3
            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Bạn còn 2 lần thử")
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_INVALID);

            // Lần 4
            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Bạn còn 1 lần thử")
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_INVALID);

            // Chưa bị khóa
            assertThat(sampleUser.getPinLockedUntil()).isNull();
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Lần sai thứ 5 liên tiếp: ném PIN_LOCKED và đặt pinLockedUntil = now + 15m")
        void verifyPin_FifthFailure_LocksAccount() {
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("999999", "$2a$12$correctPinHash")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // 4 lần sai đầu
            for (int i = 0; i < 4; i++) {
                assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                        .isInstanceOf(ApiException.class)
                        .extracting("errorCode")
                        .isEqualTo(ApiErrorCode.PIN_INVALID);
            }

            // Lần sai thứ 5
            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("bị khóa 15 phút")
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_LOCKED);

            // Kiểm tra trạng thái khóa 15 phút
            assertThat(sampleUser.getPinLockedUntil()).isNotNull();
            assertThat(sampleUser.getPinLockedUntil()).isAfter(Instant.now().plus(14, ChronoUnit.MINUTES));
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Khi tài khoản đang bị khóa, từ chối ngay lập tức với mã lỗi PIN_LOCKED")
        void verifyPin_CurrentlyLocked_RejectsImmediately() {
            Instant futureLock = Instant.now().plus(12, ChronoUnit.MINUTES);
            sampleUser.setPinLockedUntil(futureLock);
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "123456"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("đang bị khóa")
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.PIN_LOCKED);

            // Không gọi so khớp mật khẩu khi đang bị khóa
            verify(passwordEncoder, never()).matches(anyString(), anyString());
        }

        @Test
        @DisplayName("Khi mốc khóa đã hết hạn, tự động mở khóa và cho phép xác thực")
        void verifyPin_LockExpired_UnlocksAndVerifies() {
            Instant pastLock = Instant.now().minus(2, ChronoUnit.MINUTES);
            sampleUser.setPinLockedUntil(pastLock);
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("123456", "$2a$12$correctPinHash")).thenReturn(true);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            PinVerificationResult result = pinService.verifyPin("NV-1042", "123456");

            assertThat(result).isNotNull();
            assertThat(sampleUser.getPinLockedUntil()).isNull();
            verify(userRepository, atLeastOnce()).save(sampleUser);
        }

        @Test
        @DisplayName("Xác thực đúng sau các lần sai: xóa bộ đếm và không bị khóa")
        void verifyPin_CorrectPinAfterFailures_ResetsCounter() {
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("999999", "$2a$12$correctPinHash")).thenReturn(false);
            when(passwordEncoder.matches("123456", "$2a$12$correctPinHash")).thenReturn(true);

            // Sai 2 lần
            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                    .isInstanceOf(ApiException.class);
            assertThatThrownBy(() -> pinService.verifyPin("NV-1042", "999999"))
                    .isInstanceOf(ApiException.class);

            // Lần 3 nhập đúng
            PinVerificationResult result = pinService.verifyPin("NV-1042", "123456");
            assertThat(result).isNotNull();
            assertThat(pinService.getRemainingAttempts(1042L)).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("5. Các phương thức kiểm tra trạng thái (hasPin, isPinLocked)")
    class StatusCheckTests {

        @Test
        void hasPin_ReturnsTrueWhenPinHashExists() {
            sampleUser.setPinHash("$2a$12$someHash");
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThat(pinService.hasPin(1042L)).isTrue();
        }

        @Test
        void hasPin_ReturnsFalseWhenPinHashIsNull() {
            sampleUser.setPinHash(null);
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThat(pinService.hasPin(1042L)).isFalse();
        }

        @Test
        void isPinLocked_ReturnsTrueWhenLockedUntilInFuture() {
            sampleUser.setPinLockedUntil(Instant.now().plus(10, ChronoUnit.MINUTES));
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThat(pinService.isPinLocked(1042L)).isTrue();
        }

        @Test
        void isPinLocked_ReturnsFalseWhenLockedUntilInPastOrNull() {
            sampleUser.setPinLockedUntil(Instant.now().minus(5, ChronoUnit.MINUTES));
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            assertThat(pinService.isPinLocked(1042L)).isFalse();

            sampleUser.setPinLockedUntil(null);
            assertThat(pinService.isPinLocked(1042L)).isFalse();
        }
    }
}
