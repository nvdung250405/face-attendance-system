package com.fas.api.dto.response;

import java.time.Instant;

/**
 * Bản ghi thỏa thuận Informed Consent phục vụ Cán bộ Bảo vệ Dữ liệu DPO (API-BE-031, FR-BE-016).
 *
 * @param sessionId       định danh phiên đăng ký OTP
 * @param userId          định danh nhân viên
 * @param employeeCode    mã nhân viên
 * @param fullName        họ và tên nhân viên
 * @param email           email nhân viên
 * @param consentVersion  phiên bản điều khoản đồng ý
 * @param consentSignedAt thời điểm ký thỏa thuận
 * @param clientIp        địa chỉ IP tại thời điểm ký
 * @param isUsed          trạng thái hoàn tất đăng ký khuôn mặt
 */
public record ConsentRecordItem(
        Long sessionId,
        Long userId,
        String employeeCode,
        String fullName,
        String email,
        String consentVersion,
        Instant consentSignedAt,
        String clientIp,
        Boolean isUsed
) {
}
