package com.fas.api.error;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.AttendanceSearchCriteria;
import com.fas.api.dto.request.KioskEnrollFaceRequest;
import com.fas.api.dto.request.KioskPunchRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm thử hợp đồng DTO, Jakarta Validation và cấu trúc lỗi RFC 7807
 * ProblemDetails
 * của TASK-BE-010 (BLD-BE-005: APD-BE-001, APD-BE-002, APD-BE-004).
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("Hợp đồng DTO, Validation & ProblemDetails RFC 7807")
class ProblemDetailsContractTest {

    private static final String PUNCH_URL = "/api/v1/probe/kiosk/punch";
    private static final String ENROLL_URL = "/api/v1/probe/kiosk/enroll-face";
    private static final String ATTENDANCE_URL = "/api/v1/probe/admin/attendance";
    private static final String ISO_8601_VN_PATTERN = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?\\+07:00";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Request Body vi phạm ràng buộc trả về 400 kèm invalidParams chi tiết từng trường")
    void invalidPunchBodyShouldReturn400WithInvalidParams() throws Exception {
        String payload = """
                {
                  "employeeId": 0,
                  "verificationMethod": "PIN_CODE",
                  "confidenceScore": 1.5
                }
                """;

        MvcResult result = mockMvc.perform(post(PUNCH_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertThat(result.getResponse().getContentType()).contains("application/problem+json");
        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());

        assertThat(body.path("type").asText()).isEqualTo("https://fas.company.com/errors/validation-failed");
        assertThat(body.path("title").asText()).isEqualTo("Dữ liệu không hợp lệ");
        assertThat(body.path("status").asInt()).isEqualTo(400);
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(body.path("message").asText()).isNotBlank();
        assertThat(body.path("instance").asText()).isEqualTo(PUNCH_URL);
        assertThat(body.path("timestamp").asText()).matches(ISO_8601_VN_PATTERN);

        assertThat(invalidParamFields(body))
                .containsExactlyInAnyOrder("employeeId", "punchTimestamp", "verificationMethod", "confidenceScore",
                        "kioskId");
        assertThat(reasonsFor(body, "kioskId")).containsExactly("kioskId không được để trống");
        assertThat(reasonsFor(body, "employeeId")).containsExactly("employeeId phải là số nguyên dương");
        assertThat(reasonsFor(body, "verificationMethod"))
                .containsExactly("verificationMethod chỉ chấp nhận giá trị VERIFICATION_FACE hoặc VERIFICATION_PIN");
    }

    @Test
    @DisplayName("Request Body hợp lệ trả về cấu trúc bao bọc chuẩn kèm mốc thời gian ISO-8601 +07:00")
    void validPunchBodyShouldReturnStandardEnvelope() throws Exception {
        String payload = """
                {
                  "employeeId": 1042,
                  "punchTimestamp": "2026-10-03T08:29:45.120+07:00",
                  "verificationMethod": "VERIFICATION_FACE",
                  "confidenceScore": 0.8924,
                  "kioskId": "KIOSK-HN-01"
                }
                """;

        MvcResult result = mockMvc.perform(post(PUNCH_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());

        assertThat(body.path("success").asBoolean()).isTrue();
        assertThat(body.path("code").asText()).isEqualTo("PUNCH_RECORDED");
        assertThat(body.path("message").asText()).isEqualTo("Ghi nhận điểm danh thành công");
        assertThat(body.path("data").asText()).isEqualTo("KIOSK-HN-01");
        assertThat(body.path("timestamp").asText()).matches(ISO_8601_VN_PATTERN);
    }

    @Test
    @DisplayName("Request Body sai kiểu dữ liệu trả về 400 ProblemDetails thay vì lỗi hệ thống")
    void malformedRequestBodyShouldReturn400ProblemDetails() throws Exception {
        String payload = """
                {
                  "employeeId": "khong-phai-so",
                  "punchTimestamp": "2026-10-03T08:29:45.120+07:00",
                  "verificationMethod": "VERIFICATION_FACE",
                  "kioskId": "KIOSK-HN-01"
                }
                """;

        MvcResult result = mockMvc.perform(post(PUNCH_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(body.path("instance").asText()).isEqualTo(PUNCH_URL);
    }

    @Test
    @DisplayName("Vector sai kích thước bị từ chối kèm chi tiết trường vector512")
    void enrollFaceWithWrongVectorDimensionShouldReturn400() throws Exception {
        String payload = enrollFacePayload(vectorOf(10, unitVectorComponent()));

        MvcResult result = mockMvc.perform(post(ENROLL_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalidParamFields(body)).contains("vector512");
        assertThat(reasonsFor(body, "vector512")).contains("vector512 phải có đúng 512 phần tử");
    }

    @Test
    @DisplayName("Vector 512D chưa chuẩn hóa L2 bị từ chối kèm chi tiết trường vector512")
    void enrollFaceWithNonNormalizedVectorShouldReturn400() throws Exception {
        String payload = enrollFacePayload(vectorOf(512, 0.1f));

        MvcResult result = mockMvc.perform(post(ENROLL_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(reasonsFor(body, "vector512")).contains("Vector 512D phải được chuẩn hóa L2 = 1.0 ± 1e-4");
    }

    @Test
    @DisplayName("Vector 512D chuẩn hóa L2 được chấp nhận")
    void enrollFaceWithNormalizedVectorShouldSucceed() throws Exception {
        String payload = enrollFacePayload(vectorOf(512, unitVectorComponent()));

        mockMvc.perform(post(ENROLL_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Tham số truy vấn vi phạm ràng buộc trả về 400 kèm invalidParams")
    void invalidQueryCriteriaShouldReturn400WithInvalidParams() throws Exception {
        MvcResult result = mockMvc.perform(get(ATTENDANCE_URL)
                .param("page", "-1")
                .param("size", "500"))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(body.path("instance").asText()).isEqualTo(ATTENDANCE_URL);
        assertThat(invalidParamFields(body)).contains("page", "size");
    }

    @Test
    @DisplayName("Tham số truy vấn sai kiểu dữ liệu trả về 400 kèm tên tham số vi phạm")
    void malformedQueryParameterShouldReturn400WithInvalidParams() throws Exception {
        MvcResult result = mockMvc.perform(get(ATTENDANCE_URL).param("page", "khong-phai-so"))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalidParamFields(body)).contains("page");
    }

    @Test
    @DisplayName("Truy cập vượt quyền trả về 403 ProblemDetails với mã ACCESS_DENIED")
    void accessDeniedShouldReturn403ProblemDetails() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/probe/forbidden"))
                .andExpect(status().isForbidden())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("ACCESS_DENIED");
        assertThat(body.path("title").asText()).isEqualTo("Không đủ quyền");
        assertThat(body.path("status").asInt()).isEqualTo(403);
        assertThat(body.has("invalidParams")).isFalse();
    }

    @Test
    @DisplayName("Lỗi hệ thống ngoài dự kiến trả về 500 ProblemDetails không lộ chi tiết kỹ thuật")
    void unexpectedExceptionShouldReturn500ProblemDetails() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/probe/boom"))
                .andExpect(status().isInternalServerError())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(body.path("detail").asText()).isEqualTo("Lỗi hệ thống nội bộ.");
        assertThat(result.getResponse().getContentAsString()).doesNotContain("IllegalStateException");
    }

    @Test
    @DisplayName("Tham số request vi phạm ràng buộc khai báo trực tiếp trả về 400 kèm tên tham số")
    void constrainedRequestParameterShouldReturn400WithInvalidParams() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/probe/admin/report").param("month", "13"))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalidParamFields(body)).contains("month");
    }

    @Test
    @DisplayName("Thiếu tham số bắt buộc trả về 400 kèm tên tham số và lý do tiếng Việt")
    void missingRequiredParameterShouldReturn400WithLocalizedReason() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/probe/admin/report"))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalidParamFields(body)).contains("month");
        assertThat(reasonsFor(body, "month")).containsExactly("Thiếu tham số bắt buộc 'month'");
    }

    @Test
    @DisplayName("Tài nguyên không tồn tại giữ đúng HTTP 404 ProblemDetails thay vì bị chuyển thành lỗi 500")
    void unknownResourceShouldReturn404ProblemDetails() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/probe/khong-ton-tai"))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("RESOURCE_NOT_FOUND");
        assertThat(body.path("status").asInt()).isEqualTo(404);
        assertThat(body.path("instance").asText()).isEqualTo("/api/v1/probe/khong-ton-tai");
    }

    @Test
    @DisplayName("Thiếu header bắt buộc trả về 400 kèm tên header trong invalidParams")
    void missingRequiredHeaderShouldReturn400WithInvalidParams() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/probe/kiosk/secure"))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalidParamFields(body)).contains("X-Kiosk-Id");
        assertThat(reasonsFor(body, "X-Kiosk-Id")).containsExactly("Thiếu header bắt buộc 'X-Kiosk-Id'");
    }

    @Test
    @DisplayName("Phương thức HTTP không được hỗ trợ giữ đúng HTTP 405 ProblemDetails")
    void unsupportedMethodShouldReturn405ProblemDetails() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/probe/forbidden"))
                .andExpect(status().isMethodNotAllowed())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("METHOD_NOT_ALLOWED");
        assertThat(body.path("status").asInt()).isEqualTo(405);
    }

    @Test
    @DisplayName("Định dạng nội dung không được hỗ trợ giữ đúng HTTP 415 ProblemDetails")
    void unsupportedMediaTypeShouldReturn415ProblemDetails() throws Exception {
        MvcResult result = mockMvc.perform(post(PUNCH_URL)
                .contentType(MediaType.TEXT_PLAIN)
                .content("employeeId=1042"))
                .andExpect(status().isUnsupportedMediaType())
                .andReturn();

        JsonNode body = OBJECT_MAPPER.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("code").asText()).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
        assertThat(body.path("status").asInt()).isEqualTo(415);
    }

    private Set<String> invalidParamFields(JsonNode body) {
        Set<String> fields = new HashSet<>();
        body.path("invalidParams").forEach(node -> fields.add(node.path("field").asText()));
        return fields;
    }

    private List<String> reasonsFor(JsonNode body, String field) {
        List<String> reasons = new ArrayList<>();
        body.path("invalidParams").forEach(node -> {
            if (field.equals(node.path("field").asText())) {
                reasons.add(node.path("reason").asText());
            }
        });
        return reasons;
    }

    private String enrollFacePayload(List<Float> vector512) throws Exception {
        return OBJECT_MAPPER.writeValueAsString(new KioskEnrollFaceRequest(
                "839201",
                "tmp_sess_9a8b7c6d5e4f3a2b1c0d",
                vector512,
                "KIOSK-HN-01"));
    }

    private List<Float> vectorOf(int dimension, float component) {
        List<Float> vector = new ArrayList<>(dimension);
        for (int index = 0; index < dimension; index++) {
            vector.add(component);
        }
        return vector;
    }

    private float unitVectorComponent() {
        return (float) (1.0 / Math.sqrt(512));
    }

    @TestConfiguration
    static class ContractProbeConfiguration {

        @Bean
        ContractProbeController contractProbeController() {
            return new ContractProbeController();
        }
    }

    /**
     * Controller thăm dò chỉ phục vụ kiểm thử hợp đồng DTO/ProblemDetails của tầng
     * REST.
     */
    @RestController
    @RequestMapping("/api/v1/probe")
    static class ContractProbeController {

        @PostMapping("/kiosk/punch")
        ApiResponse<String> punch(@Valid @RequestBody KioskPunchRequest request) {
            return ApiResponse.ok("PUNCH_RECORDED", "Ghi nhận điểm danh thành công", request.kioskId());
        }

        @PostMapping("/kiosk/enroll-face")
        ApiResponse<String> enrollFace(@Valid @RequestBody KioskEnrollFaceRequest request) {
            return ApiResponse.ok("ENROLLMENT_COMPLETED", "Đăng ký khuôn mặt thành công", request.kioskId());
        }

        @GetMapping("/admin/attendance")
        ApiResponse<Integer> searchAttendance(@Valid AttendanceSearchCriteria criteria) {
            return ApiResponse.ok("ATTENDANCE_QUERY_SUCCESS", "Truy vấn danh sách điểm danh thành công",
                    criteria.page());
        }

        @GetMapping("/admin/report")
        ApiResponse<String> monthlyReport(
                @RequestParam @Min(1) @Max(12) Integer month) {
            return ApiResponse.ok("REPORT_FETCHED", "Lấy báo cáo thành công", "T" + month);
        }

        @GetMapping("/forbidden")
        ApiResponse<String> forbidden() {
            throw new AccessDeniedException("Tài khoản không có vai trò phù hợp");
        }

        @GetMapping("/kiosk/secure")
        ApiResponse<String> secure(@RequestHeader("X-Kiosk-Id") String kioskId) {
            return ApiResponse.ok("SECURE_ACCESS_GRANTED", "Truy cập hợp lệ", kioskId);
        }

        @GetMapping("/boom")
        ApiResponse<String> boom() {
            throw new IllegalStateException("Sự cố mô phỏng trong kiểm thử");
        }
    }
}
