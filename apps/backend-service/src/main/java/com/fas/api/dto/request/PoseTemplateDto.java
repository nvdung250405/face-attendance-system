package com.fas.api.dto.request;

import com.fas.api.validation.L2Normalized;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * DTO đại diện cho một mẫu khuôn mặt theo tư thế (FEAT-ENROLL-001, Task 3).
 *
 * @param poseType      tư thế khuôn mặt ('FRONTAL', 'LEFT_TILT', 'RIGHT_TILT')
 * @param vector512     mảng số thực 512 chiều đã chuẩn hóa L2
 * @param yaw           góc quay đầu ngang ước lượng từ landmarks (độ)
 * @param pitch         góc gật/ngửa đầu ước lượng từ landmarks (độ)
 * @param laplacian     độ sắc nét hình ảnh theo phương sai toán tử Laplace
 * @param livenessScore điểm số phát hiện thực thể sống (MiniFASNet >= 0.90)
 */
public record PoseTemplateDto(
        @NotBlank(message = "poseType không được để trống")
        @Pattern(regexp = "FRONTAL|LEFT_TILT|RIGHT_TILT", message = "poseType phải là FRONTAL, LEFT_TILT hoặc RIGHT_TILT")
        String poseType,

        @NotNull(message = "vector512 không được để trống")
        @Size(min = 512, max = 512, message = "vector512 phải có đúng 512 phần tử")
        @L2Normalized
        List<Float> vector512,

        Float yaw,
        Float pitch,
        Float laplacian,
        Float livenessScore) {

    /**
     * Constructor rút gọn phục vụ kiểm thử và các yêu cầu chỉ truyền tư thế kèm vector.
     */
    public PoseTemplateDto(String poseType, List<Float> vector512) {
        this(poseType, vector512, null, null, null, null);
    }
}
