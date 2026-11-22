package com.fas.api.dto.event;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Lệnh cập nhật danh mục vector phát sóng trên topic STOMP {@code /topic/kiosk-gallery}
 * (API-BE-014, APD-SYS-011, SOL-BE-006, FEAT-ENROLL-001 R3).
 *
 * <p>Hỗ trợ song song cả vector đơn FRONTAL (phục vụ Kiosk phiên bản cũ) và mảng đa mẫu templates.</p>
 *
 * @param action       hành động, {@value #ADD_VECTOR} hoặc {@value #DELETE_VECTOR}
 * @param employeeId   mã định danh nhân viên
 * @param employeeCode mã nhân viên (chỉ có ở lệnh thêm)
 * @param fullName     họ tên nhân viên (chỉ có ở lệnh thêm)
 * @param vector512    vector đặc trưng FRONTAL 512D đã giải mã (phục vụ tương thích ngược)
 * @param templates    danh sách mẫu đa tư thế kèm vector 512D
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
        List<TemplateItem> templates,
        String reason,
        OffsetDateTime updatedAt) {

    public static final String ADD_VECTOR = "ADD_VECTOR";
    public static final String DELETE_VECTOR = "DELETE_VECTOR";

    /** Mục mẫu đa tư thế trong thông điệp nạp nóng. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record TemplateItem(
            String poseType,
            List<Float> vector512) {
    }

    /** Lệnh nạp nóng hỗ trợ đa mẫu kèm vector FRONTAL phục vụ Kiosk phiên bản cũ. */
    public static GalleryUpdateEvent added(
            Long employeeId,
            String employeeCode,
            String fullName,
            List<Float> vector512,
            List<TemplateItem> templates,
            OffsetDateTime updatedAt) {
        return new GalleryUpdateEvent(ADD_VECTOR, employeeId, employeeCode, fullName, vector512, templates, null, updatedAt);
    }

    /** Lệnh nạp nóng vector đơn (tương thích ngược cho các lời gọi cũ). */
    public static GalleryUpdateEvent added(
            Long employeeId,
            String employeeCode,
            String fullName,
            List<Float> vector512,
            OffsetDateTime updatedAt) {
        List<TemplateItem> defaultTemplates = vector512 != null
                ? List.of(new TemplateItem("FRONTAL", vector512))
                : null;
        return new GalleryUpdateEvent(ADD_VECTOR, employeeId, employeeCode, fullName, vector512, defaultTemplates, null, updatedAt);
    }

    /** Lệnh gỡ vector khỏi danh mục RAM của mọi trạm Kiosk (ví dụ nhân viên thôi việc hoặc rút Consent). */
    public static GalleryUpdateEvent deleted(Long employeeId, String reason, OffsetDateTime updatedAt) {
        return new GalleryUpdateEvent(DELETE_VECTOR, employeeId, null, null, null, null, reason, updatedAt);
    }
}
