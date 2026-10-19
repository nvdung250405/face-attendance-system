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
import com.fas.data.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.regex.Pattern;

/**
 * Dịch vụ Quản lý Mã PIN & Thẩm định PIN cho Trạm Kiosk
 * (SOL-BE-016, FR-BE-012, DATA-BE-012, BLD-BE-020, TASK-BE-025).
 *
 * <p>Quy tắc cốt lõi:
 * <ul>
 *   <li>Mã PIN gồm đúng 6 chữ số, lưu trữ dưới dạng băm một chiều (BCrypt) tại {@code users.pin_hash}.</li>
 *   <li>Thiết lập lần đầu kiểm tra xác nhận trùng khớp; đổi PIN yêu cầu mã PIN hiện tại; đặt lại PIN yêu cầu mật khẩu tài khoản.</li>
 *   <li>Thẩm định mã PIN tại trạm Kiosk: PIN đúng trả về thông tin nhân viên; PIN sai ném 401 {@code PIN_INVALID}.</li>
 *   <li>Sai 5 lần liên tiếp đặt {@code pin_locked_until = NOW() + 15m} và ném 423 {@code PIN_LOCKED}.</li>
 *   <li>Bộ đếm lần sai được lưu bền vững tại cột {@code users.pin_failed_attempts} (không phụ thuộc RAM/JVM,
 *       không bị reset khi restart hay khi chạy nhiều instance).</li>
 *   <li>Không tạo bất kỳ bản ghi điểm danh nào khi thẩm định thất bại.</li>
 * </ul>
 */
@Service
public class PinService {

    private static final Logger logger = LoggerFactory.getLogger(PinService.class);

    public static final int PIN_LENGTH = 6;
    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final int LOCKOUT_DURATION_MINUTES = 15;
    private static final Pattern PIN_PATTERN = Pattern.compile("^\\d{6}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PinService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Thiết lập mã PIN dự phòng lần đầu cho nhân viên.
     *
     * @param userId  định danh nhân viên
     * @param request dữ liệu gồm mã PIN và xác nhận mã PIN
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @Transactional
    public PinOperationResult setupPin(Long userId, PinSetupRequest request) {
        return setupPin(userId, request.pin(), request.confirmPin());
    }

    /**
     * Thiết lập mã PIN dự phòng lần đầu cho nhân viên.
     *
     * @param userId     định danh nhân viên
     * @param pin        mã PIN 6 chữ số
     * @param confirmPin mã PIN xác nhận lại
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @Transactional
    public PinOperationResult setupPin(Long userId, String pin, String confirmPin) {
        User user = findUserById(userId);

        if (user.getPinHash() != null && !user.getPinHash().isBlank()) {
            throw new ApiException(ApiErrorCode.DATA_INTEGRITY_VIOLATION,
                    "Nhân viên đã thiết lập mã PIN. Vui lòng sử dụng tính năng đổi mã PIN.");
        }

        validatePinFormat(pin);
        if (!pin.equals(confirmPin)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã PIN xác nhận không khớp.");
        }

        user.setPinHash(passwordEncoder.encode(pin));
        user.setPinLockedUntil(null);
        user.setPinFailedAttempts(0);
        userRepository.save(user);

        logger.info("Thiết lập mã PIN dự phòng thành công cho nhân viên ID={}", userId);
        return new PinOperationResult(true, "Thiết lập mã PIN dự phòng thành công");
    }

    /**
     * Đổi mã PIN dự phòng cho nhân viên đã có mã PIN.
     *
     * @param userId  định danh nhân viên
     * @param request dữ liệu gồm PIN hiện tại, PIN mới và xác nhận PIN mới
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @Transactional
    public PinOperationResult changePin(Long userId, PinChangeRequest request) {
        return changePin(userId, request.currentPin(), request.newPin(), request.confirmPin());
    }

    /**
     * Đổi mã PIN dự phòng cho nhân viên đã có mã PIN.
     *
     * @param userId     định danh nhân viên
     * @param currentPin mã PIN hiện tại
     * @param newPin     mã PIN mới gồm 6 chữ số
     * @param confirmPin mã PIN mới xác nhận lại
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @Transactional
    public PinOperationResult changePin(Long userId, String currentPin, String newPin, String confirmPin) {
        User user = findUserById(userId);

        if (user.getPinHash() == null || user.getPinHash().isBlank()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Nhân viên chưa thiết lập mã PIN dự phòng. Vui lòng thiết lập mã PIN trước.");
        }

        if (!passwordEncoder.matches(currentPin, user.getPinHash())) {
            throw new ApiException(ApiErrorCode.PIN_INVALID, "Mã PIN hiện tại không chính xác.");
        }

        validatePinFormat(newPin);
        if (!newPin.equals(confirmPin)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã PIN xác nhận không khớp.");
        }

        if (currentPin.equals(newPin)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Mã PIN mới không được trùng với mã PIN hiện tại.");
        }

        user.setPinHash(passwordEncoder.encode(newPin));
        user.setPinLockedUntil(null);
        user.setPinFailedAttempts(0);
        userRepository.save(user);

        logger.info("Đổi mã PIN dự phòng thành công cho nhân viên ID={}", userId);
        return new PinOperationResult(true, "Đổi mã PIN dự phòng thành công");
    }

    /**
     * Đặt lại mã PIN dự phòng bằng mật khẩu tài khoản khi nhân viên quên PIN.
     *
     * @param userId  định danh nhân viên
     * @param request dữ liệu gồm mật khẩu hiện tại, PIN mới và xác nhận PIN mới
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @Transactional
    public PinOperationResult resetPinWithPassword(Long userId, PinResetRequest request) {
        return resetPinWithPassword(userId, request.currentPassword(), request.newPin(), request.confirmPin());
    }

    /**
     * Đặt lại mã PIN dự phòng bằng mật khẩu tài khoản khi nhân viên quên PIN.
     *
     * @param userId          định danh nhân viên
     * @param currentPassword mật khẩu đăng nhập hiện tại
     * @param newPin          mã PIN mới gồm 6 chữ số
     * @param confirmPin      mã PIN mới xác nhận lại
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @Transactional
    public PinOperationResult resetPinWithPassword(Long userId, String currentPassword, String newPin, String confirmPin) {
        User user = findUserById(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Mật khẩu xác thực không chính xác.");
        }

        validatePinFormat(newPin);
        if (!newPin.equals(confirmPin)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã PIN xác nhận không khớp.");
        }

        user.setPinHash(passwordEncoder.encode(newPin));
        user.setPinLockedUntil(null);
        user.setPinFailedAttempts(0);
        userRepository.save(user);

        logger.info("Đặt lại mã PIN dự phòng bằng mật khẩu thành công cho nhân viên ID={}", userId);
        return new PinOperationResult(true, "Đặt lại mã PIN thành công");
    }

    /**
     * Thẩm định mã PIN dự phòng gửi từ trạm Kiosk ({@code POST /api/v1/kiosk/verify-pin}).
     *
     * @param request dữ liệu yêu cầu từ trạm Kiosk gồm mã nhân viên và mã PIN
     * @return kết quả thẩm định chứa định danh nhân viên
     */
    @Transactional
    public PinVerificationResult verifyPin(KioskVerifyPinRequest request) {
        return verifyPin(request.employeeCode(), request.pin());
    }

    /**
     * Thẩm định mã PIN dự phòng gửi từ trạm Kiosk.
     *
     * @param employeeCode mã nhân viên
     * @param pin          mã PIN 6 chữ số
     * @return kết quả thẩm định chứa định danh nhân viên
     */
    @Transactional
    public PinVerificationResult verifyPin(String employeeCode, String pin) {
        if (employeeCode == null || employeeCode.isBlank()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã nhân viên không được để trống.");
        }
        validatePinFormat(pin);

        User user = userRepository.findByEmployeeCode(employeeCode.trim())
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                        "Không tìm thấy nhân sự với mã: " + employeeCode));

        if (user.getStatus() == EmployeeStatus.TERMINATED || user.getStatus() == EmployeeStatus.SUSPENDED) {
            throw new ApiException(ApiErrorCode.ACCESS_DENIED,
                    "Tài khoản nhân viên không ở trạng thái hoạt động.");
        }

        if (user.getPinHash() == null || user.getPinHash().isBlank()) {
            throw new ApiException(ApiErrorCode.PIN_INVALID,
                    "Nhân viên chưa thiết lập mã PIN dự phòng.");
        }

        Instant now = Instant.now();

        // 1. Kiểm tra trạng thái khóa brute-force
        if (user.getPinLockedUntil() != null) {
            if (user.getPinLockedUntil().isAfter(now)) {
                long remainingSeconds = Duration.between(now, user.getPinLockedUntil()).getSeconds();
                long remainingMinutes = Math.max(1, (remainingSeconds + 59) / 60);
                logger.warn("Nhân viên {} cố gắng nhập PIN trong khi đang bị khóa đến {}",
                        employeeCode, user.getPinLockedUntil());
                throw new ApiException(ApiErrorCode.PIN_LOCKED,
                        "Mã PIN đang bị khóa do nhập sai quá 5 lần liên tiếp. Vui lòng thử lại sau "
                                + remainingMinutes + " phút.");
            } else {
                // Khóa đã hết hạn: tự động mở khóa và reset lượt sai
                user.setPinLockedUntil(null);
                user.setPinFailedAttempts(0);
                userRepository.save(user);
            }
        }

        // 2. Thẩm định mã PIN
        if (!passwordEncoder.matches(pin, user.getPinHash())) {
            int attempts = (user.getPinFailedAttempts() != null ? user.getPinFailedAttempts() : 0) + 1;

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                Instant lockedUntil = now.plus(LOCKOUT_DURATION_MINUTES, ChronoUnit.MINUTES);
                user.setPinFailedAttempts(0);
                user.setPinLockedUntil(lockedUntil);
                userRepository.save(user);

                logger.warn("Nhân viên {} (ID={}) nhập sai mã PIN 5 lần liên tiếp. Khóa tài khoản 15 phút đến {}",
                        employeeCode, user.getId(), lockedUntil);
                throw new ApiException(ApiErrorCode.PIN_LOCKED,
                        "Mã PIN đã bị khóa 15 phút do nhập sai 5 lần liên tiếp.");
            } else {
                user.setPinFailedAttempts(attempts);
                userRepository.save(user);
                int remaining = MAX_FAILED_ATTEMPTS - attempts;
                logger.warn("Nhân viên {} (ID={}) nhập sai mã PIN (lần {}/{}).",
                        employeeCode, user.getId(), attempts, MAX_FAILED_ATTEMPTS);
                throw new ApiException(ApiErrorCode.PIN_INVALID,
                        "Mã PIN không chính xác. Bạn còn " + remaining + " lần thử trước khi bị khóa.");
            }
        }

        // 3. Xác thực thành công: xóa bộ đếm sai và xóa mốc khóa nếu có
        if (user.getPinLockedUntil() != null || (user.getPinFailedAttempts() != null && user.getPinFailedAttempts() != 0)) {
            user.setPinLockedUntil(null);
            user.setPinFailedAttempts(0);
            userRepository.save(user);
        }

        logger.info("Thẩm định mã PIN thành công cho nhân viên {} (ID={})", employeeCode, user.getId());
        return new PinVerificationResult(
                user.getId(),
                user.getEmployeeCode(),
                user.getFullName(),
                user.getDepartment()
        );
    }

    /**
     * Kiểm tra nhân viên đã thiết lập mã PIN dự phòng hay chưa.
     */
    @Transactional(readOnly = true)
    public boolean hasPin(Long userId) {
        User user = findUserById(userId);
        return user.getPinHash() != null && !user.getPinHash().isBlank();
    }

    /**
     * Kiểm tra mã PIN của nhân viên có đang bị khóa hay không.
     */
    @Transactional(readOnly = true)
    public boolean isPinLocked(Long userId) {
        User user = findUserById(userId);
        return user.getPinLockedUntil() != null && user.getPinLockedUntil().isAfter(Instant.now());
    }

    /**
     * Lấy số lần nhập sai còn lại trước khi bị khóa.
     */
    @Transactional(readOnly = true)
    public int getRemainingAttempts(Long userId) {
        User user = findUserById(userId);
        if (user.getPinLockedUntil() != null && user.getPinLockedUntil().isAfter(Instant.now())) {
            return 0;
        }
        int attempts = user.getPinFailedAttempts() != null ? user.getPinFailedAttempts() : 0;
        return Math.max(0, MAX_FAILED_ATTEMPTS - attempts);
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                        "Không tìm thấy nhân sự với ID: " + userId));
    }

    private void validatePinFormat(String pin) {
        if (pin == null || !PIN_PATTERN.matcher(pin).matches()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Mã PIN phải gồm đúng " + PIN_LENGTH + " chữ số.");
        }
    }
}
