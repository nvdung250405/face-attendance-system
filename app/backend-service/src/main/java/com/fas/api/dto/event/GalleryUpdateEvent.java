package com.fas.api.dto.event;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Lệnh cập nhật danh mục vector phát sóng trên topic STOMP {@code /topic/kiosk-gallery}
 * (API-BE-014, APD-SYS-011, SOL-BE-006).
 *
 * <p>Payload đúng hợp đồng Mục 5.2 của {@code api-design.md}: trường không dùng tới của từng biến thể
 * ({@code vector512} khi gỡ, {@code reason} khi thêm) bị lược bỏ khỏi JSON nhờ {@link JsonInclude}.
 *
 * @param action       hành động, {@value #ADD_VECTOR} hoặc {@value #DELETE_VECTOR}
 * @param employeeId   mã định danh nhân viên
 * @param employeeCode mã nhân viên (chỉ có ở lệnh thêm)
 * @param fullName     họ tên nhân viên (chỉ có ở lệnh thêm)
 * @param vector512    vector đặc trưng 512D đã giải mã (chỉ có ở lệnh thêm)
 * @param reason       lý do gỡ vector (chỉ có ở lệnh gỡ)
 * @param updatedAt    mốc thời gian cập nhật
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GalleryUpdateEvent(
        String action,
        Long employeeId,
        String employeeCode,
        String fullName,
        List<Float> vector512,
        String reason,
        OffsetDateTime updatedAt) {

    public static final String ADD_VECTOR = "ADD_VECTOR";
    public static final String DELETE_VECTOR = "DELETE_VECTOR";

    /** Lệnh nạp nóng vector mới của một nhân viên về mọi trạm Kiosk. */
    public static GalleryUpdateEvent added(
            Long employeeId,
            String employeeCode,
            String fullName,
            List<Float> vector512,
            OffsetDateTime updatedAt) {
        return new GalleryUpdateEvent(ADD_VECTOR, employeeId, employeeCode, fullName, vector512, null, updatedAt);
    }

    /** Lệnh gỡ vector khỏi danh mục RAM của mọi trạm Kiosk (ví dụ nhân viên thôi việc hoặc rút Consent). */
    public static GalleryUpdateEvent deleted(Long employeeId, String reason, OffsetDateTime updatedAt) {
        return new GalleryUpdateEvent(DELETE_VECTOR, employeeId, null, null, null, reason, updatedAt);
    }
}
