package com.fas.service;

import com.fas.api.dto.response.UserRoleResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Dịch vụ Quản lý Vòng đời Quyền Quản trị (SOL-BE-026, FR-BE-023, DD-BE-026).
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Gán và thu hồi role {@code HR_MANAGER}/{@code DPO}/{@code ADMIN} kèm audit log giá trị trước/sau.</li>
 *   <li>Chặn thu hồi hoặc hạ cấp tài khoản {@code ADMIN} đang hoạt động cuối cùng bằng phép đếm/khóa bi quan
 *       trong cùng giao dịch với thao tác cập nhật (trả HTTP 409 {@code LAST_ADMIN_CANNOT_BE_DEMOTED}).</li>
 *   <li>Cung cấp kiểm tra bảo vệ khi vô hiệu hóa tài khoản quản trị viên.</li>
 * </ul>
 */
@Slf4j
@Service
public class RoleManagementService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Autowired
    public RoleManagementService(UserRepository userRepository, AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Cập nhật vai trò người dùng (gán hoặc thu hồi vai trò quản trị).
     *
     * @param targetUserId ID của người dùng cần cập nhật vai trò
     * @param newRole      vai trò mới cần gán
     * @param actorUserId  ID của quản trị viên thực hiện thao tác
     * @return phản hồi chi tiết sau khi cập nhật vai trò
     */
    @Transactional
    public UserRoleResponse updateUserRole(Long targetUserId, Role newRole, Long actorUserId) {
        if (newRole == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Vai trò mới không được để trống");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                        "Không tìm thấy người dùng ID=" + targetUserId));

        User actorUser = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                        "Không tìm thấy quản trị viên ID=" + actorUserId));

        Role oldRole = targetUser.getRole();

        // Bảo vệ tài khoản ADMIN đang hoạt động cuối cùng (DD-BE-026, FR-BE-023)
        if (oldRole == Role.ADMIN && newRole != Role.ADMIN && targetUser.getStatus() == EmployeeStatus.ACTIVE) {
            ensureNotLastActiveAdmin(targetUserId);
        }

        String beforeState = "{\"role\":\"" + (oldRole != null ? oldRole.name() : "NONE") + "\"}";
        targetUser.setRole(newRole);
        User saved = userRepository.save(targetUser);
        String afterState = "{\"role\":\"" + newRole.name() + "\"}";

        // Ghi nhật ký kiểm toán bất biến
        AuditLog auditLog = AuditLog.builder()
                .actor(actorUser)
                .actorEmail(actorUser.getEmail())
                .action("UPDATE_USER_ROLE")
                .entityType("USER")
                .entityId(String.valueOf(targetUserId))
                .beforeState(beforeState)
                .afterState(afterState)
                .build();
        auditLogRepository.save(auditLog);

        log.info("Cập nhật vai trò người dùng ID={} từ {} sang {} bởi Admin ID={}",
                targetUserId, oldRole, newRole, actorUserId);

        return UserRoleResponse.fromEntity(saved);
    }

    /**
     * Kiểm tra và ngăn chặn vô hiệu hóa nếu nhân viên là ADMIN đang hoạt động cuối cùng.
     *
     * @param targetUserId ID người dùng sắp bị vô hiệu hóa
     */
    @Transactional
    public void assertCanDeactivateAdmin(Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                        "Không tìm thấy người dùng ID=" + targetUserId));

        if (targetUser.getRole() == Role.ADMIN && targetUser.getStatus() == EmployeeStatus.ACTIVE) {
            ensureNotLastActiveAdmin(targetUserId);
        }
    }

    /**
     * Khóa bi quan và kiểm tra xem tài khoản có phải ADMIN đang hoạt động cuối cùng hay không.
     */
    private void ensureNotLastActiveAdmin(Long targetUserId) {
        List<User> activeAdmins = userRepository.findByRoleAndStatusForUpdate(Role.ADMIN, EmployeeStatus.ACTIVE);
        long activeAdminCount = activeAdmins.size();

        if (activeAdminCount <= 1) {
            log.warn("Từ chối thao tác hạ cấp/thu hồi role: Người dùng ID={} là ADMIN đang hoạt động cuối cùng", targetUserId);
            throw new ApiException(ApiErrorCode.LAST_ADMIN_CANNOT_BE_DEMOTED,
                    "Không thể thu hồi hoặc hạ cấp tài khoản Quản trị viên (ADMIN) đang hoạt động cuối cùng");
        }
    }
}
