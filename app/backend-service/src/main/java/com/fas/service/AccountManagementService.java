package com.fas.service;

import com.fas.api.dto.request.ChangePasswordRequest;
import com.fas.api.dto.request.CreateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeStatusRequest;
import com.fas.api.dto.response.CreateEmployeeResponse;
import com.fas.api.dto.response.EmployeeItem;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.RefreshToken;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.RefreshTokenRepository;
import com.fas.data.repository.UserRepository;
import com.fas.service.audit.AuditContextHolder;
import com.fas.service.audit.Auditable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dịch vụ Quản lý Hồ sơ Nhân sự & Vòng đời Mật khẩu
 * (TASK-BE-024, BLD-BE-019, SOL-BE-014, FR-BE-010, FR-BE-011, DD-BE-013).
 *
 * <p>Các chức năng chính:
 * <ul>
 *   <li>Khởi tạo hồ sơ nhân sự kèm tài khoản, sinh mật khẩu tạm ngẫu nhiên hiển thị duy nhất một lần.</li>
 *   <li>Cập nhật thông tin hồ sơ nhân sự (họ tên, email, phòng ban, vai trò) kèm kiểm tra trùng lặp.</li>
 *   <li>Vô hiệu hóa hoặc phục hồi trạng thái nhân sự kèm thu hồi phiên và gán mốc thời gian thôi việc 20 ngày.</li>
 *   <li>Đổi mật khẩu tự nguyện của chính người dùng (không ép buộc, không chặn nghiệp vụ).</li>
 * </ul>
 */
@Slf4j
@Service
public class AccountManagementService {

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SPECIAL;
    private static final int TEMP_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final BiometricTemplateRepository biometricTemplateRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    public AccountManagementService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            BiometricTemplateRepository biometricTemplateRepository,
            PasswordEncoder passwordEncoder) {
        this(userRepository, refreshTokenRepository, biometricTemplateRepository, passwordEncoder, Clock.systemDefaultZone());
    }

    public AccountManagementService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            BiometricTemplateRepository biometricTemplateRepository,
            PasswordEncoder passwordEncoder,
            Clock clock) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.biometricTemplateRepository = biometricTemplateRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    /**
     * Khởi tạo hồ sơ nhân sự kèm tài khoản đăng nhập và mật khẩu tạm dùng một lần
     * (FR-BE-010, FR-BE-011, API-BE-017, SOL-BE-014).
     *
     * @param request dữ liệu tạo hồ sơ
     * @return thông tin hồ sơ kèm mật khẩu tạm (chỉ hiển thị một lần)
     */
    @Auditable(action = "CREATE_EMPLOYEE", entityType = "USER", entityId = "#result.employeeId")
    @Transactional
    public CreateEmployeeResponse createEmployee(CreateEmployeeRequest request) {
        if (request == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Dữ liệu tạo nhân viên không được để trống");
        }

        String employeeCode = request.employeeCode().trim().toUpperCase();
        String email = request.email().trim().toLowerCase();

        // 1. Kiểm tra trùng lặp mã nhân viên hoặc email (HTTP 409)
        if (userRepository.existsByEmployeeCode(employeeCode)) {
            log.warn("Từ chối tạo hồ sơ: Mã nhân viên '{}' đã tồn tại", employeeCode);
            throw new ApiException(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS, "Mã nhân viên đã tồn tại: " + employeeCode);
        }
        if (userRepository.existsByEmail(email)) {
            log.warn("Từ chối tạo hồ sơ: Email '{}' đã tồn tại", email);
            throw new ApiException(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS, "Email đã tồn tại: " + email);
        }

        // 2. Sinh mật khẩu tạm ngẫu nhiên an toàn và băm BCrypt
        String temporaryPassword = generateTemporaryPassword();
        String passwordHash = passwordEncoder.encode(temporaryPassword);

        // 3. Khởi tạo đối tượng User
        User user = User.builder()
                .employeeCode(employeeCode)
                .fullName(request.fullName().trim())
                .email(email)
                .passwordHash(passwordHash)
                .department(StringUtils.hasText(request.department()) ? request.department().trim() : null)
                .role(request.role() != null ? request.role() : Role.EMPLOYEE)
                .status(EmployeeStatus.PENDING_CONSENT)
                .build();

        User saved = userRepository.save(user);
        log.info("Khởi tạo hồ sơ nhân sự thành công: ID={}, EmployeeCode={}, Email={}, Role={}",
                saved.getId(), saved.getEmployeeCode(), saved.getEmail(), saved.getRole());

        // 4. Trả về kết quả kèm mật khẩu tạm duy nhất một lần
        return new CreateEmployeeResponse(
                saved.getId(),
                saved.getEmployeeCode(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getStatus(),
                saved.getDepartment(),
                temporaryPassword,
                saved.getCreatedAt().atZone(clock.getZone()).toOffsetDateTime()
        );
    }

    /**
     * Cập nhật thông tin hồ sơ nhân sự (họ tên, email, phòng ban, vai trò)
     * (FR-BE-010, API-BE-018, SOL-BE-014).
     *
     * @param employeeId định danh nhân viên cần cập nhật
     * @param request    dữ liệu cập nhật
     * @return hồ sơ nhân viên sau khi cập nhật
     */
    @Auditable(action = "UPDATE_EMPLOYEE", entityType = "USER", entityId = "#employeeId")
    @Transactional
    public EmployeeItem updateEmployeeProfile(Long employeeId, UpdateEmployeeRequest request) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy nhân sự ID={}", employeeId);
                    return new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + employeeId);
                });

        // Chụp trạng thái trước khi sửa vào AuditContextHolder
        AuditContextHolder.setBeforeState(mapToAuditState(user));

        if (request != null) {
            // Cập nhật email nếu có và kiểm tra trùng lặp
            if (StringUtils.hasText(request.email())) {
                String newEmail = request.email().trim().toLowerCase();
                if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                    if (userRepository.existsByEmail(newEmail)) {
                        log.warn("Cập nhật thất bại: Email '{}' đã được sử dụng bởi tài khoản khác", newEmail);
                        throw new ApiException(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS, "Email đã tồn tại: " + newEmail);
                    }
                    user.setEmail(newEmail);
                }
            }

            if (StringUtils.hasText(request.fullName())) {
                user.setFullName(request.fullName().trim());
            }

            if (request.department() != null) {
                user.setDepartment(StringUtils.hasText(request.department()) ? request.department().trim() : null);
            }

            if (request.role() != null) {
                user.setRole(request.role());
            }
        }

        User saved = userRepository.save(user);
        log.info("Cập nhật hồ sơ nhân sự thành công: ID={}, Email={}", saved.getId(), saved.getEmail());

        return toEmployeeItem(saved);
    }

    /**
     * Vô hiệu hóa hoặc cập nhật trạng thái công tác của nhân sự
     * (FR-BE-010, FR-BE-020, API-BE-019, SOL-BE-014).
     *
     * @param employeeId định danh nhân viên
     * @param request    dữ liệu trạng thái mới và lý do
     * @return hồ sơ nhân viên sau khi cập nhật
     */
    @Auditable(action = "UPDATE_EMPLOYEE_STATUS", entityType = "USER", entityId = "#employeeId")
    @Transactional
    public EmployeeItem updateEmployeeStatus(Long employeeId, UpdateEmployeeStatusRequest request) {
        if (request == null || request.status() == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Trạng thái nhân sự không được để trống");
        }

        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy nhân sự ID={}", employeeId);
                    return new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + employeeId);
                });

        // Chụp trạng thái trước khi cập nhật
        AuditContextHolder.setBeforeState(mapToAuditState(user));

        EmployeeStatus newStatus = request.status();
        user.setStatus(newStatus);

        if (newStatus == EmployeeStatus.TERMINATED) {
            // Thiết lập ngày thôi việc phục vụ tác vụ tiêu hủy sinh trắc sau 20 ngày
            user.setTerminatedDate(LocalDate.now(clock));
            // Thu hồi vai trò quản trị (chuyển về EMPLOYEE) theo SOL-SYS-029
            user.setRole(Role.EMPLOYEE);
            // Thu hồi toàn bộ Refresh Token của tài khoản
            revokeAllRefreshTokensForUser(employeeId);
            log.info("Đã vô hiệu hóa nhân sự ID={}, kích hoạt mốc thôi việc {}", employeeId, user.getTerminatedDate());
        } else if (newStatus == EmployeeStatus.ACTIVE) {
            user.setTerminatedDate(null);
            log.info("Đã kích hoạt lại nhân sự ID={}", employeeId);
        } else if (newStatus == EmployeeStatus.SUSPENDED) {
            revokeAllRefreshTokensForUser(employeeId);
            log.info("Đã tạm đình chỉ nhân sự ID={}", employeeId);
        }

        User saved = userRepository.save(user);
        return toEmployeeItem(saved);
    }

    /**
     * Đổi mật khẩu tự nguyện của chính người dùng đang đăng nhập
     * (FR-BE-011, FR-BE-020, API-BE-020, DD-BE-013).
     *
     * @param userId  định danh người dùng đổi mật khẩu
     * @param request dữ liệu mật khẩu cũ và mới
     */
    @Auditable(action = "CHANGE_PASSWORD", entityType = "USER", entityId = "#userId", includeState = false)
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        if (request == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Yêu cầu đổi mật khẩu không được để trống");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy người dùng ID=" + userId));

        // 1. Kiểm tra mật khẩu xác nhận
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mật khẩu xác nhận không khớp với mật khẩu mới");
        }

        // 2. Kiểm tra độ dài tối thiểu 8 ký tự
        if (request.newPassword().length() < 8) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mật khẩu mới phải có tối thiểu 8 ký tự");
        }

        // 3. Mật khẩu mới phải khác mật khẩu hiện tại
        if (request.newPassword().equals(request.currentPassword())) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        // 4. Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            log.warn("Đổi mật khẩu thất bại cho user ID={}: Mật khẩu hiện tại không chính xác", userId);
            throw new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Mật khẩu hiện tại không chính xác");
        }

        // 5. Cập nhật mật khẩu mới băm BCrypt
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // 6. Thu hồi 100% Refresh Token cũ của tài khoản
        revokeAllRefreshTokensForUser(userId);
        log.info("Người dùng ID={} đã đổi mật khẩu thành công và thu hồi mọi phiên đăng nhập cũ", userId);
    }

    /**
     * Lấy thông tin chi tiết một nhân sự theo ID.
     */
    @Transactional(readOnly = true)
    public EmployeeItem getEmployeeById(Long employeeId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + employeeId));
        return toEmployeeItem(user);
    }

    /**
     * Thu hồi toàn bộ Refresh Token của tài khoản người dùng (FR-BE-020).
     */
    private void revokeAllRefreshTokensForUser(Long userId) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId);
        if (!activeTokens.isEmpty()) {
            Instant now = clock.instant();
            activeTokens.forEach(t -> t.setRevokedAt(now));
            refreshTokenRepository.saveAll(activeTokens);
            log.info("Đã thu hồi {} Refresh Token đang hoạt động của người dùng ID={}", activeTokens.size(), userId);
        }
    }

    /**
     * Chuyển đổi entity User sang EmployeeItem DTO.
     */
    private EmployeeItem toEmployeeItem(User user) {
        boolean hasBiometric = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId()).isPresent();
        boolean hasPin = StringUtils.hasText(user.getPinHash());

        return new EmployeeItem(
                user.getId(),
                user.getEmployeeCode(),
                user.getFullName(),
                user.getEmail(),
                user.getDepartment(),
                user.getRole(),
                user.getStatus(),
                hasBiometric,
                hasPin,
                user.getCreatedAt().atZone(clock.getZone()).toOffsetDateTime()
        );
    }

    /**
     * Ánh xạ thông tin User sang Map phục vụ chụp before state cho Audit Log.
     */
    private Map<String, Object> mapToAuditState(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("employeeCode", user.getEmployeeCode());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole() != null ? user.getRole().name() : null);
        map.put("status", user.getStatus() != null ? user.getStatus().name() : null);
        map.put("department", user.getDepartment());
        map.put("terminatedDate", user.getTerminatedDate() != null ? user.getTerminatedDate().toString() : null);
        return map;
    }

    /**
     * Sinh mật khẩu tạm ngẫu nhiên đáp ứng tiêu chuẩn an toàn (12 ký tự: chữ hoa, chữ thường, số, ký tự đặc biệt).
     */
    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMP_PASSWORD_LENGTH);
        // Đảm bảo có ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
        password.append(UPPER.charAt(secureRandom.nextInt(UPPER.length())));
        password.append(LOWER.charAt(secureRandom.nextInt(LOWER.length())));
        password.append(DIGITS.charAt(secureRandom.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(secureRandom.nextInt(SPECIAL.length())));

        for (int i = 4; i < TEMP_PASSWORD_LENGTH; i++) {
            password.append(ALL_CHARS.charAt(secureRandom.nextInt(ALL_CHARS.length())));
        }

        // Trộn ngẫu nhiên các ký tự
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
