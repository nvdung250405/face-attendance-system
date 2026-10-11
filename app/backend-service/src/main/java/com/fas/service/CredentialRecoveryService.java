package com.fas.service;

import com.fas.api.dto.request.PinResetRequest;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.dto.response.ResetCredentialsResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.repository.UserRepository;
import com.fas.service.audit.Auditable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

/**
 * Dịch vụ Khôi phục Thông tin Xác thực & Đặt lại PIN Dự phòng
 * (SOL-BE-022, FR-BE-019, DD-BE-022, API-BE-036, API-BE-037, TST-BE-034, BLD-BE-031, TASK-BE-036).
 *
 * <p>Quy tắc cốt lõi:
 * <ul>
 *   <li>HR/ADMIN cấp lại mật khẩu tạm cho nhân sự: sinh mật khẩu tạm ngẫu nhiên hiển thị duy nhất 1 lần,
 *       vô hiệu hóa mật khẩu cũ, thu hồi toàn bộ phiên (refresh tokens) cũ của tài khoản, ghi audit log.</li>
 *   <li>Từ chối cấp lại mật khẩu cho nhân sự đã thôi việc (TERMINATED).</li>
 *   <li>Nhân viên tự đặt lại PIN dự phòng: yêu cầu mật khẩu tài khoản hiện tại chính xác, PIN 6 chữ số khớp xác nhận,
 *       băm BCrypt lưu trữ, xóa cờ khóa PIN (pin_locked_until = null), ghi audit log.</li>
 * </ul>
 */
@Slf4j
@Service
public class CredentialRecoveryService {

    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "@$!%*?&#";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SPECIAL;

    private final UserRepository userRepository;
    private final SessionService sessionService;
    private final PinService pinService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    public CredentialRecoveryService(
            UserRepository userRepository,
            SessionService sessionService,
            PinService pinService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.sessionService = sessionService;
        this.pinService = pinService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cấp lại mật khẩu tạm mới cho nhân sự (POST /api/v1/admin/employees/{id}/credentials/reset - API-BE-036).
     *
     * @param employeeId định danh nhân viên
     * @return thông tin cấp lại kèm temporaryPassword hiển thị 1 lần duy nhất
     */
    @Auditable(action = "RESET_PASSWORD", entityType = "USER", entityId = "#employeeId", includeState = false)
    @Transactional
    public ResetCredentialsResponse resetPassword(Long employeeId) {
        if (employeeId == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Định danh nhân viên không được để trống");
        }

        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy hồ sơ nhân sự với ID=" + employeeId));

        if (user.getStatus() == EmployeeStatus.TERMINATED) {
            log.warn("Từ chối cấp lại mật khẩu: Nhân viên ID={} đã thôi việc (TERMINATED)", employeeId);
            throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Không thể cấp lại mật khẩu cho nhân sự đã thôi việc");
        }

        // 1. Sinh mật khẩu tạm mới ngẫu nhiên và băm
        String temporaryPassword = generateTemporaryPassword();
        String passwordHash = passwordEncoder.encode(temporaryPassword);

        // 2. Cập nhật mật khẩu tài khoản
        user.setPasswordHash(passwordHash);
        userRepository.save(user);

        // 3. Thu hồi toàn bộ phiên (refresh tokens) cũ của tài khoản
        sessionService.revokeAllSessionsForUser(employeeId);

        log.info("Đã cấp lại mật khẩu tạm thành công cho nhân viên ID={}, Mã NV={}, thu hồi toàn bộ phiên cũ",
                employeeId, user.getEmployeeCode());

        return new ResetCredentialsResponse(
                user.getId(),
                user.getEmployeeCode(),
                user.getEmail(),
                temporaryPassword
        );
    }

    /**
     * Đặt lại mã PIN dự phòng bằng mật khẩu tài khoản (POST /api/v1/employee/pin/reset - API-BE-037).
     *
     * @param userId  định danh nhân viên
     * @param request dữ liệu gồm mật khẩu hiện tại, mã PIN mới và xác nhận PIN
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @Auditable(action = "RESET_PIN", entityType = "USER", entityId = "#userId", includeState = false)
    @Transactional
    public PinOperationResult resetPin(Long userId, PinResetRequest request) {
        if (request == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Yêu cầu đặt lại PIN không được để trống");
        }

        return pinService.resetPinWithPassword(userId, request);
    }

    /**
     * Sinh mật khẩu tạm an toàn 12 ký tự ngẫu nhiên.
     */
    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMP_PASSWORD_LENGTH);
        password.append(UPPER.charAt(secureRandom.nextInt(UPPER.length())));
        password.append(LOWER.charAt(secureRandom.nextInt(LOWER.length())));
        password.append(DIGITS.charAt(secureRandom.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(secureRandom.nextInt(SPECIAL.length())));

        for (int i = 4; i < TEMP_PASSWORD_LENGTH; i++) {
            password.append(ALL_CHARS.charAt(secureRandom.nextInt(ALL_CHARS.length())));
        }

        char[] chars = password.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = secureRandom.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
}
