package com.fas.service;

import com.fas.api.dto.request.ChangePasswordRequest;
import com.fas.api.dto.request.CreateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeStatusRequest;
import com.fas.api.dto.response.CreateEmployeeResponse;
import com.fas.api.dto.response.EmployeeItem;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.RefreshToken;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.RefreshTokenRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho AccountManagementService
 * (TASK-BE-024, BLD-BE-019, SOL-BE-014, FR-BE-010, FR-BE-011, DD-BE-013, FR-BE-020).
 */
@ExtendWith(MockitoExtension.class)
class AccountManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private BiometricTemplateRepository biometricTemplateRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private Clock fixedClock;
    private AccountManagementService accountManagementService;

    private static final Instant NOW = Instant.parse("2026-10-10T10:00:00Z");
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(NOW, ZONE);
        accountManagementService = new AccountManagementService(
                userRepository,
                refreshTokenRepository,
                biometricTemplateRepository,
                passwordEncoder,
                fixedClock
        );
    }

    @Nested
    @DisplayName("Khởi tạo hồ sơ nhân sự (createEmployee)")
    class CreateEmployeeTests {

        @Test
        @DisplayName("Tạo nhân viên thành công: sinh mật khẩu tạm, mã hóa BCrypt, trạng thái PENDING_CONSENT")
        void createEmployee_Success() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "NV-1001",
                    "Nguyễn Văn A",
                    "nguyenvana@company.com",
                    "Kỹ thuật",
                    Role.EMPLOYEE
            );

            when(userRepository.existsByEmployeeCode("NV-1001")).thenReturn(false);
            when(userRepository.existsByEmail("nguyenvana@company.com")).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashedTemporaryPassword");

            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User u = invocation.getArgument(0);
                return User.builder()
                        .id(1L)
                        .employeeCode(u.getEmployeeCode())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .passwordHash(u.getPasswordHash())
                        .role(u.getRole())
                        .status(u.getStatus())
                        .department(u.getDepartment())
                        .createdAt(NOW)
                        .updatedAt(NOW)
                        .build();
            });

            CreateEmployeeResponse response = accountManagementService.createEmployee(request);

            assertThat(response).isNotNull();
            assertThat(response.employeeId()).isEqualTo(1L);
            assertThat(response.employeeCode()).isEqualTo("NV-1001");
            assertThat(response.fullName()).isEqualTo("Nguyễn Văn A");
            assertThat(response.email()).isEqualTo("nguyenvana@company.com");
            assertThat(response.role()).isEqualTo(Role.EMPLOYEE);
            assertThat(response.status()).isEqualTo(EmployeeStatus.PENDING_CONSENT);
            assertThat(response.department()).isEqualTo("Kỹ thuật");
            assertThat(response.temporaryPassword()).isNotBlank().hasSize(12);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User saved = userCaptor.getValue();
            assertThat(saved.getPasswordHash()).isEqualTo("$2a$12$hashedTemporaryPassword");
            assertThat(saved.getStatus()).isEqualTo(EmployeeStatus.PENDING_CONSENT);
        }

        @Test
        @DisplayName("Tạo nhân viên thất bại khi mã nhân viên đã tồn tại -> 409 Conflict")
        void createEmployee_DuplicateEmployeeCode_ThrowsException() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "NV-1001",
                    "Nguyễn Văn A",
                    "nguyenvana@company.com",
                    "Kỹ thuật",
                    Role.EMPLOYEE
            );

            when(userRepository.existsByEmployeeCode("NV-1001")).thenReturn(true);

            assertThatThrownBy(() -> accountManagementService.createEmployee(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS);
                    });

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Tạo nhân viên thất bại khi email đã tồn tại -> 409 Conflict")
        void createEmployee_DuplicateEmail_ThrowsException() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "NV-1001",
                    "Nguyễn Văn A",
                    "nguyenvana@company.com",
                    "Kỹ thuật",
                    Role.EMPLOYEE
            );

            when(userRepository.existsByEmployeeCode("NV-1001")).thenReturn(false);
            when(userRepository.existsByEmail("nguyenvana@company.com")).thenReturn(true);

            assertThatThrownBy(() -> accountManagementService.createEmployee(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS);
                    });

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Tạo nhân viên thất bại khi request null -> 400 Bad Request")
        void createEmployee_NullRequest_ThrowsException() {
            assertThatThrownBy(() -> accountManagementService.createEmployee(null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });
        }
    }

    @Nested
    @DisplayName("Cập nhật thông tin hồ sơ (updateEmployeeProfile)")
    class UpdateEmployeeProfileTests {

        private User existingUser;

        @BeforeEach
        void initUser() {
            existingUser = User.builder()
                    .id(2L)
                    .employeeCode("NV-1002")
                    .fullName("Trần Thị B")
                    .email("tranthib@company.com")
                    .passwordHash("hashedPass")
                    .role(Role.EMPLOYEE)
                    .status(EmployeeStatus.ACTIVE)
                    .department("Kế toán")
                    .createdAt(NOW)
                    .updatedAt(NOW)
                    .build();
        }

        @Test
        @DisplayName("Cập nhật hồ sơ thành công khi thay đổi thông tin hợp lệ")
        void updateEmployeeProfile_Success() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(existingUser));
            when(userRepository.existsByEmail("new.email@company.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
            when(biometricTemplateRepository.existsByUserIdAndIsActiveTrue(2L)).thenReturn(false);

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    "Trần Thị Bích",
                    "new.email@company.com",
                    "Tài chính",
                    Role.HR_MANAGER
            );

            EmployeeItem result = accountManagementService.updateEmployeeProfile(2L, request);

            assertThat(result.fullName()).isEqualTo("Trần Thị Bích");
            assertThat(result.email()).isEqualTo("new.email@company.com");
            assertThat(result.department()).isEqualTo("Tài chính");
            assertThat(result.role()).isEqualTo(Role.HR_MANAGER);
            assertThat(result.hasBiometric()).isFalse();
            assertThat(result.hasPin()).isFalse();
        }

        @Test
        @DisplayName("Cập nhật hồ sơ thành công khi giữ nguyên email của chính mình")
        void updateEmployeeProfile_SameEmail_Success() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
            when(biometricTemplateRepository.existsByUserIdAndIsActiveTrue(2L)).thenReturn(false);

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    "Trần Thị B",
                    "tranthib@company.com", // cùng email
                    "Kế toán",
                    Role.EMPLOYEE
            );

            EmployeeItem result = accountManagementService.updateEmployeeProfile(2L, request);

            assertThat(result.email()).isEqualTo("tranthib@company.com");
            verify(userRepository, never()).existsByEmail(anyString());
        }

        @Test
        @DisplayName("Cập nhật hồ sơ thất bại khi email mới trùng với người khác -> 409 Conflict")
        void updateEmployeeProfile_DuplicateEmail_ThrowsException() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(existingUser));
            when(userRepository.existsByEmail("other@company.com")).thenReturn(true);

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    null,
                    "other@company.com",
                    null,
                    null
            );

            assertThatThrownBy(() -> accountManagementService.updateEmployeeProfile(2L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS);
                    });
        }

        @Test
        @DisplayName("Cập nhật hồ sơ thất bại khi không tìm thấy nhân viên -> 404 Not Found")
        void updateEmployeeProfile_NotFound_ThrowsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            UpdateEmployeeRequest request = new UpdateEmployeeRequest("Tên mới", null, null, null);

            assertThatThrownBy(() -> accountManagementService.updateEmployeeProfile(999L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND);
                    });
        }

        @Test
        @DisplayName("Hạ cấp ADMIN thất bại khi là ADMIN đang hoạt động cuối cùng -> 409 Conflict")
        void updateEmployeeProfile_DemoteLastAdmin_ThrowsConflict() {
            User lastAdmin = User.builder()
                    .id(1L)
                    .role(Role.ADMIN)
                    .status(EmployeeStatus.ACTIVE)
                    .build();
            when(userRepository.findById(1L)).thenReturn(Optional.of(lastAdmin));
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(lastAdmin));

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    "Admin Name",
                    null,
                    null,
                    Role.EMPLOYEE
            );

            assertThatThrownBy(() -> accountManagementService.updateEmployeeProfile(1L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.LAST_ADMIN_CANNOT_BE_DEMOTED);
                    });
        }

        @Test
        @DisplayName("Hạ cấp ADMIN thành công khi hệ thống còn ADMIN đang hoạt động khác")
        void updateEmployeeProfile_DemoteAdminWhenMultipleAdminsExist_Success() {
            User adminToDemote = User.builder()
                    .id(1L)
                    .role(Role.ADMIN)
                    .status(EmployeeStatus.ACTIVE)
                    .fullName("Admin One")
                    .email("admin1@company.com")
                    .createdAt(NOW)
                    .build();
            User secondAdmin = User.builder()
                    .id(2L)
                    .role(Role.ADMIN)
                    .status(EmployeeStatus.ACTIVE)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(adminToDemote));
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(adminToDemote, secondAdmin));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
            when(biometricTemplateRepository.existsByUserIdAndIsActiveTrue(1L)).thenReturn(false);

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    "Admin One",
                    null,
                    null,
                    Role.EMPLOYEE
            );

            EmployeeItem result = accountManagementService.updateEmployeeProfile(1L, request);
            assertThat(result.role()).isEqualTo(Role.EMPLOYEE);
        }
    }

    @Nested
    @DisplayName("Cập nhật trạng thái nhân sự (updateEmployeeStatus)")
    class UpdateEmployeeStatusTests {

        private User adminUser;

        @BeforeEach
        void initUser() {
            adminUser = User.builder()
                    .id(3L)
                    .employeeCode("NV-ADMIN")
                    .fullName("Lê Quản Trị")
                    .email("admin.le@company.com")
                    .role(Role.ADMIN)
                    .status(EmployeeStatus.ACTIVE)
                    .createdAt(NOW)
                    .build();
        }

        @Test
        @DisplayName("Vô hiệu hóa TERMINATED: gán ngày thôi việc, hạ role xuống EMPLOYEE, thu hồi Refresh Token")
        void updateEmployeeStatus_Terminated_Success() {
            when(userRepository.findById(3L)).thenReturn(Optional.of(adminUser));
            User secondAdmin = User.builder().id(99L).role(Role.ADMIN).status(EmployeeStatus.ACTIVE).build();
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(adminUser, secondAdmin));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            RefreshToken token1 = RefreshToken.builder().id(101L).user(adminUser).tokenHash("hash1").build();
            RefreshToken token2 = RefreshToken.builder().id(102L).user(adminUser).tokenHash("hash2").build();
            when(refreshTokenRepository.findByUserIdAndRevokedAtIsNull(3L)).thenReturn(List.of(token1, token2));

            UpdateEmployeeStatusRequest request = new UpdateEmployeeStatusRequest(
                    EmployeeStatus.TERMINATED,
                    "Nghỉ việc theo nguyện vọng"
            );

            EmployeeItem result = accountManagementService.updateEmployeeStatus(3L, request);

            assertThat(result.status()).isEqualTo(EmployeeStatus.TERMINATED);
            assertThat(result.role()).isEqualTo(Role.EMPLOYEE); // Thu hồi admin

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(captor.capture());
            User saved = captor.getValue();
            assertThat(saved.getTerminatedDate()).isEqualTo(LocalDate.now(fixedClock));
            assertThat(saved.getRole()).isEqualTo(Role.EMPLOYEE);

            // Kiểm tra thu hồi token
            assertThat(token1.getRevokedAt()).isEqualTo(NOW);
            assertThat(token2.getRevokedAt()).isEqualTo(NOW);
            verify(refreshTokenRepository).saveAll(List.of(token1, token2));
        }

        @Test
        @DisplayName("Vô hiệu hóa ADMIN thất bại khi là ADMIN đang hoạt động cuối cùng -> 409 Conflict")
        void updateEmployeeStatus_LastAdmin_ThrowsConflict() {
            when(userRepository.findById(3L)).thenReturn(Optional.of(adminUser));
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(adminUser));

            UpdateEmployeeStatusRequest request = new UpdateEmployeeStatusRequest(
                    EmployeeStatus.TERMINATED,
                    "Vô hiệu hóa admin cuối cùng"
            );

            assertThatThrownBy(() -> accountManagementService.updateEmployeeStatus(3L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.LAST_ADMIN_CANNOT_BE_DEMOTED);
                    });
        }

        @Test
        @DisplayName("Kích hoạt lại ACTIVE: xóa ngày thôi việc")
        void updateEmployeeStatus_Reactivate_ClearsTerminatedDate() {
            adminUser.setStatus(EmployeeStatus.TERMINATED);
            adminUser.setTerminatedDate(LocalDate.now(fixedClock).minusDays(5));

            when(userRepository.findById(3L)).thenReturn(Optional.of(adminUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            UpdateEmployeeStatusRequest request = new UpdateEmployeeStatusRequest(
                    EmployeeStatus.ACTIVE,
                    "Quay lại làm việc"
            );

            EmployeeItem result = accountManagementService.updateEmployeeStatus(3L, request);

            assertThat(result.status()).isEqualTo(EmployeeStatus.ACTIVE);
            assertThat(adminUser.getTerminatedDate()).isNull();
        }

        @Test
        @DisplayName("Tạm đình chỉ SUSPENDED: thu hồi toàn bộ Refresh Token")
        void updateEmployeeStatus_Suspended_RevokesTokens() {
            when(userRepository.findById(3L)).thenReturn(Optional.of(adminUser));
            User secondAdmin = User.builder().id(99L).role(Role.ADMIN).status(EmployeeStatus.ACTIVE).build();
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(adminUser, secondAdmin));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            RefreshToken token = RefreshToken.builder().id(101L).user(adminUser).tokenHash("hash1").build();
            when(refreshTokenRepository.findByUserIdAndRevokedAtIsNull(3L)).thenReturn(List.of(token));

            UpdateEmployeeStatusRequest request = new UpdateEmployeeStatusRequest(
                    EmployeeStatus.SUSPENDED,
                    "Đang kiểm tra kỷ luật"
            );

            EmployeeItem result = accountManagementService.updateEmployeeStatus(3L, request);

            assertThat(result.status()).isEqualTo(EmployeeStatus.SUSPENDED);
            assertThat(token.getRevokedAt()).isEqualTo(NOW);
            verify(refreshTokenRepository).saveAll(List.of(token));
        }

        @Test
        @DisplayName("Cập nhật trạng thái thất bại khi request null -> 400 Bad Request")
        void updateEmployeeStatus_NullRequest_ThrowsException() {
            assertThatThrownBy(() -> accountManagementService.updateEmployeeStatus(3L, null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });
        }
    }

    @Nested
    @DisplayName("Đổi mật khẩu (changePassword)")
    class ChangePasswordTests {

        private User sampleUser;

        @BeforeEach
        void initUser() {
            sampleUser = User.builder()
                    .id(4L)
                    .employeeCode("NV-1004")
                    .fullName("Phạm Văn C")
                    .passwordHash("$2a$12$oldHashedPassword")
                    .role(Role.EMPLOYEE)
                    .status(EmployeeStatus.ACTIVE)
                    .build();
        }

        @Test
        @DisplayName("Đổi mật khẩu thành công: băm BCrypt mới, cập nhật db, thu hồi Refresh Token")
        void changePassword_Success() {
            when(userRepository.findById(4L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("OldPassword@123", "$2a$12$oldHashedPassword")).thenReturn(true);
            when(passwordEncoder.encode("NewPassword@456")).thenReturn("$2a$12$newHashedPassword");

            RefreshToken token = RefreshToken.builder().id(201L).user(sampleUser).tokenHash("active_token").build();
            when(refreshTokenRepository.findByUserIdAndRevokedAtIsNull(4L)).thenReturn(List.of(token));

            ChangePasswordRequest request = new ChangePasswordRequest(
                    "OldPassword@123",
                    "NewPassword@456",
                    "NewPassword@456"
            );

            accountManagementService.changePassword(4L, request);

            verify(userRepository).save(sampleUser);
            assertThat(sampleUser.getPasswordHash()).isEqualTo("$2a$12$newHashedPassword");
            assertThat(token.getRevokedAt()).isEqualTo(NOW);
            verify(refreshTokenRepository).saveAll(List.of(token));
        }

        @Test
        @DisplayName("Đổi mật khẩu thất bại khi mật khẩu xác nhận không khớp")
        void changePassword_ConfirmMismatch_ThrowsException() {
            when(userRepository.findById(4L)).thenReturn(Optional.of(sampleUser));

            ChangePasswordRequest request = new ChangePasswordRequest(
                    "OldPassword@123",
                    "NewPassword@456",
                    "DifferentConfirm@456"
            );

            assertThatThrownBy(() -> accountManagementService.changePassword(4L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });
        }

        @Test
        @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới dưới 8 ký tự")
        void changePassword_TooShort_ThrowsException() {
            when(userRepository.findById(4L)).thenReturn(Optional.of(sampleUser));

            ChangePasswordRequest request = new ChangePasswordRequest(
                    "OldPassword@123",
                    "Short@1",
                    "Short@1"
            );

            assertThatThrownBy(() -> accountManagementService.changePassword(4L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });
        }

        @Test
        @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu hiện tại")
        void changePassword_SameAsCurrent_ThrowsException() {
            when(userRepository.findById(4L)).thenReturn(Optional.of(sampleUser));

            ChangePasswordRequest request = new ChangePasswordRequest(
                    "SamePassword@123",
                    "SamePassword@123",
                    "SamePassword@123"
            );

            assertThatThrownBy(() -> accountManagementService.changePassword(4L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });
        }

        @Test
        @DisplayName("Đổi mật khẩu thất bại khi mật khẩu hiện tại không đúng -> 401 Unauthorized")
        void changePassword_WrongCurrentPassword_ThrowsException() {
            when(userRepository.findById(4L)).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("WrongPassword@123", "$2a$12$oldHashedPassword")).thenReturn(false);

            ChangePasswordRequest request = new ChangePasswordRequest(
                    "WrongPassword@123",
                    "NewPassword@456",
                    "NewPassword@456"
            );

            assertThatThrownBy(() -> accountManagementService.changePassword(4L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS);
                    });

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Lấy chi tiết nhân sự (getEmployeeById)")
    class GetEmployeeByIdTests {

        @Test
        @DisplayName("Lấy chi tiết nhân sự thành công kèm cờ sinh trắc và PIN")
        void getEmployeeById_Success() {
            User user = User.builder()
                    .id(5L)
                    .employeeCode("NV-1005")
                    .fullName("Vũ Thị E")
                    .email("vuthie@company.com")
                    .pinHash("$2a$12$pinHash")
                    .role(Role.EMPLOYEE)
                    .status(EmployeeStatus.ACTIVE)
                    .createdAt(NOW)
                    .build();

            when(userRepository.findById(5L)).thenReturn(Optional.of(user));
            when(biometricTemplateRepository.existsByUserIdAndIsActiveTrue(5L))
                    .thenReturn(true);

            EmployeeItem item = accountManagementService.getEmployeeById(5L);

            assertThat(item.id()).isEqualTo(5L);
            assertThat(item.employeeCode()).isEqualTo("NV-1005");
            assertThat(item.hasBiometric()).isTrue();
            assertThat(item.hasPin()).isTrue();
        }

        @Test
        @DisplayName("Lấy chi tiết thất bại khi không tìm thấy nhân viên -> 404 Not Found")
        void getEmployeeById_NotFound_ThrowsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> accountManagementService.getEmployeeById(999L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND);
                    });
        }
    }
}
