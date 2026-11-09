package com.fas.api.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Một mục vector ArcFace 512D trong danh mục nạp RAM của trạm Kiosk
 * ({@code GET /api/v1/kiosk/gallery} - APD-BE-001, FEAT-ENROLL-001 R3).
 *
 * @param employeeId   mã định danh nhân viên
 * @param employeeCode mã nhân viên
 * @param fullName     họ tên nhân viên
 * @param department   phòng ban công tác
 * @param poseType     tư thế khuôn mặt ('FRONTAL', 'LEFT_TILT', 'RIGHT_TILT')
 * @param vector512    vector đặc trưng 512D đã giải mã
 * @param updatedAt    mốc thời gian cập nhật vector gần nhất
 */
public record GalleryItem(
        Long employeeId,
        String employeeCode,
        String fullName,
        String department,
        String poseType,
        List<Float> vector512,
        OffsetDateTime updatedAt) {

    /** Constructor tương thích ngược cho các lời gọi 6 tham số (mặc định FRONTAL). */
    public GalleryItem(
            Long employeeId,
            String employeeCode,
            String fullName,
            String department,
            List<Float> vector512,
            OffsetDateTime updatedAt) {
        this(employeeId, employeeCode, fullName, department, "FRONTAL", vector512, updatedAt);
    }
}
