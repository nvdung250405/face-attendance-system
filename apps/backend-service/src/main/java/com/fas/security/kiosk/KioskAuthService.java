package com.fas.security.kiosk;

import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.Kiosk;
import com.fas.data.repository.KioskRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Dịch vụ Xác thực Trạm Kiosk cho giao diện REST.
 *
 * <p>Xác thực dựa trên cặp {@code X-Kiosk-Id} + {@code X-Kiosk-Secret} (plaintext token riêng mỗi trạm
 * do {@code KioskAdminService} cấp, lưu dạng băm BCrypt ở cột {@code kiosks.secret_token_hash}).
 * Giữ nguyên mã lỗi {@code KIOSK_UNAUTHORIZED} cho mọi trường hợp thất bại.
 */
@Service
public class KioskAuthService {

    private final KioskRepository kioskRepository;
    private final PasswordEncoder passwordEncoder;

    public KioskAuthService(KioskRepository kioskRepository, PasswordEncoder passwordEncoder) {
        this.kioskRepository = kioskRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Xác thực trạm Kiosk và trả về thực thể trạm đang hoạt động.
     *
     * @param kioskId mã định danh trạm gửi trong header {@code X-Kiosk-Id}
     * @param secret  mã bí mật plaintext gửi trong header {@code X-Kiosk-Secret}
     * @return trạm Kiosk hợp lệ và còn hoạt động
     * @throws ApiException {@code KIOSK_UNAUTHORIZED} khi trạm không tồn tại/vô hiệu hóa, chưa cấp mã bí mật hoặc sai mã bí mật
     */
    public Kiosk authenticate(String kioskId, String secret) {
        Kiosk kiosk = kioskRepository.findByIdAndIsActiveTrue(kioskId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                        "Trạm Kiosk không tồn tại hoặc đã bị vô hiệu hóa: " + kioskId));

        if (!StringUtils.hasText(kiosk.getSecretTokenHash())) {
            throw new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                    "Trạm Kiosk chưa được cấp mã bí mật: " + kioskId);
        }

        if (!StringUtils.hasText(secret) || !passwordEncoder.matches(secret, kiosk.getSecretTokenHash())) {
            throw new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                    "Mã bí mật của trạm Kiosk không chính xác: " + kioskId);
        }

        return kiosk;
    }
}
