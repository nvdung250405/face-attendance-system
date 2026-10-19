package com.fas.bootstrap;

import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.Optional;

/**
 * Bộ Khởi tạo Hệ thống & Tài khoản Quản trị Ban đầu (Bootstrap)
 * (SOL-BE-021, FR-BE-018, SRS-005, SRS-006, DD-BE-021, DD-SYS-022, TST-BE-033, BLD-BE-031, TASK-BE-036).
 *
 * <p>Quy tắc cốt lõi:
 * <ul>
 *   <li>Tạo tài khoản ADMIN đầu tiên trên CSDL trống khi chưa có bất kỳ quản trị viên nào.</li>
 *   <li>Idempotent: Nếu đã tồn tại tài khoản ADMIN, bỏ qua và không tạo thêm tài khoản nào.</li>
 *   <li>Không chứa mật khẩu mặc định cố định trong mã nguồn hay kịch bản migration.</li>
 *   <li>Nếu có biến môi trường/cấu hình mật khẩu, yêu cầu độ dài >= 12 ký tự; nếu không, tự sinh mật khẩu tạm an toàn 12 ký tự.</li>
 *   <li>Tài khoản ADMIN dùng được ngay, không phát sinh bước chặn buộc đổi mật khẩu.</li>
 * </ul>
 */
@Slf4j
@Component
public class BootstrapInitializer implements ApplicationRunner {

    public static final String DEFAULT_ADMIN_EMAIL = "admin@fas.com";
    public static final String DEFAULT_ADMIN_CODE = "ADMIN-001";
    public static final String DEFAULT_ADMIN_NAME = "System Administrator";
    public static final int MIN_PASSWORD_LENGTH = 12;

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "@$!%*?&#";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SPECIAL;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${fas.bootstrap.enabled:true}")
    private boolean enabled = true;

    @Value("${fas.bootstrap.admin-email:${BOOTSTRAP_ADMIN_EMAIL:}}")
    private String configuredAdminEmail;

    @Value("${fas.bootstrap.admin-password:${BOOTSTRAP_ADMIN_PASSWORD:}}")
    private String configuredAdminPassword;

    @Value("${fas.bootstrap.admin-code:${BOOTSTRAP_ADMIN_CODE:}}")
    private String configuredAdminCode;

    @Value("${fas.bootstrap.admin-name:${BOOTSTRAP_ADMIN_NAME:}}")
    private String configuredAdminName;

    private String lastGeneratedPassword;

    @Autowired
    public BootstrapInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this(userRepository, passwordEncoder, Clock.systemDefaultZone());
    }

    public BootstrapInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Override
    public void run(ApplicationArguments args) {
        initializeAdmin();
    }

    /**
     * Thực thi khởi tạo tài khoản ADMIN ban đầu (Idempotent).
     *
     * @return mật khẩu tạm được sử dụng/sinh ra (nếu khởi tạo mới), hoặc Optional.empty() nếu đã tồn tại ADMIN
     */
    @Transactional
    public Optional<String> initializeAdmin() {
        if (!enabled) {
            log.info("Bootstrap bị vô hiệu hóa qua cấu hình (fas.bootstrap.enabled=false).");
            return Optional.empty();
        }

        String email = StringUtils.hasText(configuredAdminEmail) ? configuredAdminEmail.trim() : DEFAULT_ADMIN_EMAIL;
        String employeeCode = StringUtils.hasText(configuredAdminCode) ? configuredAdminCode.trim() : DEFAULT_ADMIN_CODE;
        String fullName = StringUtils.hasText(configuredAdminName) ? configuredAdminName.trim() : DEFAULT_ADMIN_NAME;

        // Idempotency: Kiểm tra nếu đã có ADMIN trong hệ thống hoặc đã có tài khoản trùng email/mã nhân viên
        if (userRepository.countByRoleAndStatus(Role.ADMIN, EmployeeStatus.ACTIVE) > 0
                || userRepository.existsByRole(Role.ADMIN)
                || userRepository.existsByEmployeeCode(employeeCode)
                || userRepository.existsByEmail(email)) {
            log.info("Hệ thống đã có tài khoản Quản trị viên (ADMIN) hoặc đã tồn tại tài khoản bootstrap (email={}, code={}). Bỏ qua bước bootstrap.", email, employeeCode);
            return Optional.empty();
        }

        // Xử lý mật khẩu: nếu cấu hình có giá trị thì kiểm tra độ dài >= 12, nếu không thì tự sinh ngẫu nhiên
        String rawPassword;
        if (StringUtils.hasText(configuredAdminPassword)) {
            rawPassword = configuredAdminPassword.trim();
            if (rawPassword.length() < MIN_PASSWORD_LENGTH) {
                throw new IllegalArgumentException("Mật khẩu bootstrap cung cấp phải có độ dài tối thiểu " + MIN_PASSWORD_LENGTH + " ký tự (DD-SYS-022)");
            }
        } else {
            rawPassword = generateSecureTemporaryPassword();
        }

        User admin = User.builder()
                .employeeCode(employeeCode)
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(Role.ADMIN)
                .status(EmployeeStatus.ACTIVE)
                .department("IT")
                .createdAt(clock.instant())
                .updatedAt(clock.instant())
                .build();

        userRepository.save(admin);
        this.lastGeneratedPassword = rawPassword;

        log.info("Khởi tạo thành công tài khoản Quản trị viên đầu tiên: email={}, code={}",
                admin.getEmail(), admin.getEmployeeCode());
        log.warn("Tài khoản Quản trị viên đã được khởi tạo. Mật khẩu tạm đã được sinh an toàn và KHÔNG được ghi vào nhật ký; "
                + "hãy bàn giao qua kênh bảo mật riêng.");

        return Optional.of(rawPassword);
    }

    /**
     * Lấy mật khẩu tạm vừa được sinh ở lần bootstrap gần nhất (phục vụ bàn giao / kiểm thử).
     */
    public Optional<String> getLastGeneratedPassword() {
        return Optional.ofNullable(lastGeneratedPassword);
    }

    /**
     * Sinh mật khẩu tạm an toàn ngẫu nhiên 12 ký tự (chữ hoa, chữ thường, số, ký tự đặc biệt).
     */
    private String generateSecureTemporaryPassword() {
        StringBuilder password = new StringBuilder(MIN_PASSWORD_LENGTH);
        password.append(UPPER.charAt(secureRandom.nextInt(UPPER.length())));
        password.append(LOWER.charAt(secureRandom.nextInt(LOWER.length())));
        password.append(DIGITS.charAt(secureRandom.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(secureRandom.nextInt(SPECIAL.length())));

        for (int i = 4; i < MIN_PASSWORD_LENGTH; i++) {
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

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void setConfiguredAdminEmail(String configuredAdminEmail) {
        this.configuredAdminEmail = configuredAdminEmail;
    }

    public void setConfiguredAdminPassword(String configuredAdminPassword) {
        this.configuredAdminPassword = configuredAdminPassword;
    }

    public void setConfiguredAdminCode(String configuredAdminCode) {
        this.configuredAdminCode = configuredAdminCode;
    }

    public void setConfiguredAdminName(String configuredAdminName) {
        this.configuredAdminName = configuredAdminName;
    }
}
