package com.fas.api.controller;

import com.fas.api.dto.request.SubmitExcuseRequest;
import com.fas.api.dto.response.ExcuseRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.enums.ExcuseRequestStatus;
import com.fas.data.repository.UserRepository;
import com.fas.service.ExcuseRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho EmployeeExcuseController
 * (TASK-BE-033, BLD-BE-028, APD-BE-015, API-BE-026, API-BE-027, FR-BE-014).
 */
@ExtendWith(MockitoExtension.class)
class EmployeeExcuseControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private ExcuseRequestService excuseRequestService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmployeeExcuseController employeeExcuseController;

    private static ExcuseRequestResponse createMockResponse(
            Long id, Long userId, String employeeCode, String fullName,
            Long logId, ExcuseRequestStatus status) {
        return new ExcuseRequestResponse(
                id,
                userId,
                employeeCode,
                fullName,
                logId,
                Instant.parse("2026-10-10T08:00:00Z"),
                Instant.parse("2026-10-10T08:00:00Z"),
                "Quên quẹt thẻ do vội họp",
                status,
                null,
                null,
                null,
                null,
                Instant.parse("2026-10-10T09:00:00Z"),
                Instant.parse("2026-10-10T09:00:00Z")
        );
    }

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(employeeExcuseController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("1. Nộp đơn giải trình (POST /api/v1/employee/excuse-requests)")
    class SubmitExcuseTests {

        @Test
        @DisplayName("Nộp đơn thành công trả về 201 Created và ApiResponse hợp lệ")
        void submitExcuseRequest_Success_Returns201() throws Exception {
            SubmitExcuseRequest request = new SubmitExcuseRequest(
                    101L,
                    "Quên quẹt thẻ do vội họp",
                    Instant.parse("2026-10-10T08:00:00Z")
            );

            ExcuseRequestResponse response = createMockResponse(1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L, ExcuseRequestStatus.PENDING);

            when(excuseRequestService.submitExcuseRequest(eq(1042L), any(SubmitExcuseRequest.class)))
                    .thenReturn(response);

            User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
            when(userRepository.findByEmail("dung@company.com")).thenReturn(Optional.of(employee));

            mockMvc.perform(post("/api/v1/employee/excuse-requests")
                            .principal(() -> "dung@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_SUBMITTED"))
                    .andExpect(jsonPath("$.data.id").value(1L))
                    .andExpect(jsonPath("$.data.status").value("PENDING"))
                    .andExpect(jsonPath("$.data.userId").value(1042L))
                    .andExpect(jsonPath("$.data.attendanceLogId").value(101L));

            verify(excuseRequestService).submitExcuseRequest(eq(1042L), any(SubmitExcuseRequest.class));
        }

        @Test
        @DisplayName("Validation thất bại khi thiếu attendanceLogId hoặc lý do để trống -> trả về 400 Bad Request")
        void submitExcuseRequest_ValidationFailed_Returns400() throws Exception {
            String invalidJson = """
                    {
                        "attendanceLogId": null,
                        "reason": ""
                    }
                    """;

            mockMvc.perform(post("/api/v1/employee/excuse-requests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.invalidParams", hasSize(greaterThan(0))));

            verify(excuseRequestService, never()).submitExcuseRequest(any(), any());
        }

        @Test
        @DisplayName("Bản ghi điểm danh không thuộc nhân viên -> Service ném 404 RESOURCE_NOT_FOUND")
        void submitExcuseRequest_LogNotOwnedByUser_Returns404() throws Exception {
            SubmitExcuseRequest request = new SubmitExcuseRequest(
                    999L,
                    "Quên quẹt thẻ",
                    null
            );

            when(excuseRequestService.submitExcuseRequest(eq(1042L), any(SubmitExcuseRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi điểm danh thuộc nhân viên ID=1042"));

            User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
            when(userRepository.findByEmail("dung@company.com")).thenReturn(Optional.of(employee));

            mockMvc.perform(post("/api/v1/employee/excuse-requests")
                            .principal(() -> "dung@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
                    .andExpect(jsonPath("$.detail").value(containsString("Không tìm thấy bản ghi điểm danh")));
        }

        @Test
        @DisplayName("Bản ghi điểm danh vượt quá 30 ngày -> Service ném 400 EXCUSE_WINDOW_EXPIRED")
        void submitExcuseRequest_WindowExpired_Returns400() throws Exception {
            SubmitExcuseRequest request = new SubmitExcuseRequest(
                    101L,
                    "Giải trình quá hạn 30 ngày",
                    null
            );

            when(excuseRequestService.submitExcuseRequest(eq(1042L), any(SubmitExcuseRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EXCUSE_WINDOW_EXPIRED, "Bản ghi điểm danh đã vượt quá thời hạn 30 ngày"));

            User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
            when(userRepository.findByEmail("dung@company.com")).thenReturn(Optional.of(employee));

            mockMvc.perform(post("/api/v1/employee/excuse-requests")
                            .principal(() -> "dung@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("EXCUSE_WINDOW_EXPIRED"));
        }

        @Test
        @DisplayName("Bản ghi điểm danh đã có đơn chờ xử lý -> Service ném 409 EXCUSE_ALREADY_PENDING")
        void submitExcuseRequest_AlreadyPending_Returns409() throws Exception {
            SubmitExcuseRequest request = new SubmitExcuseRequest(
                    101L,
                    "Nộp đơn lần 2 khi đơn trước chưa duyệt",
                    null
            );

            when(excuseRequestService.submitExcuseRequest(eq(1042L), any(SubmitExcuseRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EXCUSE_ALREADY_PENDING, "Lượt điểm danh đã có đơn giải trình đang chờ xử lý"));

            User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
            when(userRepository.findByEmail("dung@company.com")).thenReturn(Optional.of(employee));

            mockMvc.perform(post("/api/v1/employee/excuse-requests")
                            .principal(() -> "dung@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("EXCUSE_ALREADY_PENDING"));
        }

        @Test
        @DisplayName("Người dùng xác thực qua Authentication principal email thành công")
        void submitExcuseRequest_ViaAuthenticationPrincipal_Success() throws Exception {
            SubmitExcuseRequest request = new SubmitExcuseRequest(101L, "Lý do hợp lệ", null);

            User user = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
            when(userRepository.findByEmail("dung@company.com")).thenReturn(Optional.of(user));

            ExcuseRequestResponse response = createMockResponse(1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L, ExcuseRequestStatus.PENDING);
            when(excuseRequestService.submitExcuseRequest(eq(1042L), any(SubmitExcuseRequest.class)))
                    .thenReturn(response);

            Authentication auth = new UsernamePasswordAuthenticationToken("dung@company.com", "password");

            mockMvc.perform(post("/api/v1/employee/excuse-requests")
                            .principal(auth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_SUBMITTED"));
        }
    }

    @Nested
    @DisplayName("2. Tra cứu danh sách đơn giải trình của chính mình (GET /api/v1/employee/excuse-requests)")
    class GetMyExcuseTests {

        @Test
        @DisplayName("Tra cứu danh sách đơn của chính nhân viên thành công trả về 200 OK")
        void getMyExcuseRequests_Success_Returns200() throws Exception {
            ExcuseRequestResponse item = createMockResponse(1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L, ExcuseRequestStatus.PENDING);

            when(excuseRequestService.getEmployeeExcuseRequests(eq(1042L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(item), PageRequest.of(0, 20), 1));

            User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
            when(userRepository.findByEmail("dung@company.com")).thenReturn(Optional.of(employee));

            mockMvc.perform(get("/api/v1/employee/excuse-requests")
                            .principal(() -> "dung@company.com")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_EXCUSES_FETCHED"))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].id").value(1L))
                    .andExpect(jsonPath("$.data.content[0].employeeCode").value("NV-1042"));
        }

        @Test
        @DisplayName("Chưa xác thực người dùng -> ném 403 ACCESS_DENIED")
        void getMyExcuseRequests_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(get("/api/v1/employee/excuse-requests"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }
    }
}
