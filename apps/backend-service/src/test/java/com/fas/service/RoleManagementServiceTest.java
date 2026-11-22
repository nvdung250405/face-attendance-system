package com.fas.service;

import com.fas.api.dto.response.UserRoleResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho RoleManagementService (SOL-BE-026, FR-BE-023, DD-BE-026, BLD-BE-033, TASK-BE-038).
 */
@ExtendWith(MockitoExtension.class)
class RoleManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    private RoleManagementService roleService;

    private User actorAdmin;
    private User employeeUser;
    private User adminTarget;

    @BeforeEach
    void setUp() {
        roleService = new RoleManagementService(userRepository, auditLogRepository);

        actorAdmin = User.builder()
                .id(1L)
                .employeeCode("ADM001")
                .fullName("Super Admin")
                .email("admin@fas.com")
                .role(Role.ADMIN)
                .status(EmployeeStatus.ACTIVE)
                .build();

        employeeUser = User.builder()
                .id(100L)
                .employeeCode("EMP001")
                .fullName("Nguyen Van A")
                .email("nva@fas.com")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();

        adminTarget = User.builder()
                .id(2L)
                .employeeCode("ADM002")
                .fullName("Second Admin")
                .email("admin2@fas.com")
                .role(Role.ADMIN)
                .status(EmployeeStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("Gán vai trò người dùng (updateUserRole)")
    class AssignRoleTests {

        @Test
        @DisplayName("Gán role mới cho EMPLOYEE thành HR_MANAGER thành công và ghi AuditLog")
        void updateUserRole_promoteToHr_success() {
            when(userRepository.findById(100L)).thenReturn(Optional.of(employeeUser));
            when(userRepository.findById(1L)).thenReturn(Optional.of(actorAdmin));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UserRoleResponse response = roleService.updateUserRole(100L, Role.HR_MANAGER, 1L);

            assertThat(response).isNotNull();
            assertThat(response.userId()).isEqualTo(100L);
            assertThat(response.role()).isEqualTo(Role.HR_MANAGER);
            assertThat(employeeUser.getRole()).isEqualTo(Role.HR_MANAGER);

            verify(auditLogRepository).save(argThat(log ->
                    "UPDATE_USER_ROLE".equals(log.getAction()) &&
                    "USER".equals(log.getEntityType()) &&
                    "100".equals(log.getEntityId()) &&
                    log.getBeforeState().contains("EMPLOYEE") &&
                    log.getAfterState().contains("HR_MANAGER") &&
                    actorAdmin.equals(log.getActor())
            ));
        }

        @Test
        @DisplayName("Gán role mới cho EMPLOYEE thành DPO thành công và ghi AuditLog")
        void updateUserRole_promoteToDpo_success() {
            when(userRepository.findById(100L)).thenReturn(Optional.of(employeeUser));
            when(userRepository.findById(1L)).thenReturn(Optional.of(actorAdmin));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UserRoleResponse response = roleService.updateUserRole(100L, Role.DPO, 1L);

            assertThat(response.role()).isEqualTo(Role.DPO);
            verify(auditLogRepository).save(argThat(log -> log.getAfterState().contains("DPO")));
        }

        @Test
        @DisplayName("Ném lỗi khi vai trò mới bị null")
        void updateUserRole_nullRole_throwsException() {
            assertThatThrownBy(() -> roleService.updateUserRole(100L, null, 1L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Ném lỗi khi người dùng đích hoặc quản trị viên không tồn tại")
        void updateUserRole_userNotFound_throwsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> roleService.updateUserRole(999L, Role.HR_MANAGER, 1L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));

            when(userRepository.findById(100L)).thenReturn(Optional.of(employeeUser));
            when(userRepository.findById(888L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> roleService.updateUserRole(100L, Role.HR_MANAGER, 888L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("Bảo vệ tài khoản ADMIN đang hoạt động cuối cùng (DD-BE-026)")
    class ProtectLastAdminTests {

        @Test
        @DisplayName("Hạ cấp ADMIN thành công khi hệ thống vẫn còn ADMIN đang hoạt động khác")
        void updateUserRole_demoteAdminWhenMultipleAdminsExist_success() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(adminTarget));
            when(userRepository.findById(1L)).thenReturn(Optional.of(actorAdmin));
            // Còn 2 ADMIN đang active (actorAdmin và adminTarget)
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(actorAdmin, adminTarget));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UserRoleResponse response = roleService.updateUserRole(2L, Role.EMPLOYEE, 1L);

            assertThat(response.role()).isEqualTo(Role.EMPLOYEE);
            assertThat(adminTarget.getRole()).isEqualTo(Role.EMPLOYEE);
            verify(auditLogRepository).save(any());
        }

        @Test
        @DisplayName("Từ chối 409 LAST_ADMIN_CANNOT_BE_DEMOTED khi cố hạ cấp ADMIN đang hoạt động duy nhất")
        void updateUserRole_demoteLastAdmin_throwsConflict() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(actorAdmin));
            // Chỉ còn duy nhất 1 ADMIN active trong hệ thống
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(actorAdmin));

            assertThatThrownBy(() -> roleService.updateUserRole(1L, Role.EMPLOYEE, 1L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.LAST_ADMIN_CANNOT_BE_DEMOTED));

            // Không thay đổi trạng thái và không ghi audit log
            verify(userRepository, never()).save(any());
            verify(auditLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("assertCanDeactivateAdmin ném 409 khi tài khoản là ADMIN đang hoạt động cuối cùng")
        void assertCanDeactivateAdmin_lastAdmin_throwsConflict() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(actorAdmin));
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(actorAdmin));

            assertThatThrownBy(() -> roleService.assertCanDeactivateAdmin(1L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.LAST_ADMIN_CANNOT_BE_DEMOTED));
        }

        @Test
        @DisplayName("assertCanDeactivateAdmin pass khi tài khoản không phải ADMIN hoặc không phải ADMIN duy nhất")
        void assertCanDeactivateAdmin_multipleAdmins_passes() {
            when(userRepository.findById(100L)).thenReturn(Optional.of(employeeUser));
            assertThatCode(() -> roleService.assertCanDeactivateAdmin(100L)).doesNotThrowAnyException();

            when(userRepository.findById(2L)).thenReturn(Optional.of(adminTarget));
            when(userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE))
                    .thenReturn(List.of(actorAdmin, adminTarget));
            assertThatCode(() -> roleService.assertCanDeactivateAdmin(2L)).doesNotThrowAnyException();
        }
    }
}
