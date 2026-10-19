package com.fas.api.controller;

import com.fas.api.dto.request.ApproveExcuseRequest;
import com.fas.api.dto.request.DecideExcuseRequest;
import com.fas.api.dto.request.RejectExcuseRequest;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho AdminExcuseController
 * (TASK-BE-033, BLD-BE-028, APD-BE-016, API-BE-028, API-BE-029, FR-BE-015).
 */
@ExtendWith(MockitoExtension.class)
class AdminExcuseControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private ExcuseRequestService excuseRequestService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminExcuseController adminExcuseController;

    private static ExcuseRequestResponse createMockResponse(
            Long id, Long userId, String employeeCode, String fullName,
            Long logId, ExcuseRequestStatus status, String rejectionReason) {
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
                status == ExcuseRequestStatus.PENDING ? null : 1001L,
                status == ExcuseRequestStatus.PENDING ? null : "HR Manager",
                status == ExcuseRequestStatus.PENDING ? null : Instant.parse("2026-10-10T10:00:00Z"),
                rejectionReason,
                Instant.parse("2026-10-10T09:00:00Z"),
                Instant.parse("2026-10-10T09:00:00Z")
        );
    }

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(adminExcuseController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private static User hrUser() {
        return User.builder().id(1001L).email("hr@company.com").employeeCode("HR-1001").build();
    }

    @Nested
    @DisplayName("1. Tra cứu danh sách đơn giải trình (GET /api/v1/admin/excuse-requests)")
    class GetExcuseRequestsTests {

        @Test
        @DisplayName("Lấy danh sách tất cả đơn giải trình thành công trả về 200 OK")
        void getExcuseRequests_Success_Returns200() throws Exception {
            ExcuseRequestResponse item = createMockResponse(1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L, ExcuseRequestStatus.PENDING, null);

            when(excuseRequestService.getExcuseRequests(isNull(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(item), PageRequest.of(0, 20), 1));

            mockMvc.perform(get("/api/v1/admin/excuse-requests")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_LIST_FETCHED"))
                    .andExpect(jsonPath("$.data.content", hasSize(1)));

            verify(excuseRequestService).getExcuseRequests(isNull(), any(Pageable.class));
        }

        @Test
        @DisplayName("Lọc danh sách theo trạng thái PENDING thành công")
        void getExcuseRequests_FilterByStatus_Returns200() throws Exception {
            ExcuseRequestResponse item = createMockResponse(1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L, ExcuseRequestStatus.PENDING, null);

            when(excuseRequestService.getExcuseRequests(eq(ExcuseRequestStatus.PENDING), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(item), PageRequest.of(0, 20), 1));

            mockMvc.perform(get("/api/v1/admin/excuse-requests")
                            .param("status", "PENDING"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));

            verify(excuseRequestService).getExcuseRequests(eq(ExcuseRequestStatus.PENDING), any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("2. Tra cứu chi tiết đơn giải trình (GET /api/v1/admin/excuse-requests/{id})")
    class GetExcuseRequestByIdTests {

        @Test
        @DisplayName("Lấy chi tiết đơn giải trình theo ID thành công trả về 200 OK")
        void getExcuseRequestById_Success_Returns200() throws Exception {
            ExcuseRequestResponse response = createMockResponse(1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L, ExcuseRequestStatus.PENDING, null);

            when(excuseRequestService.getExcuseRequestById(1L)).thenReturn(response);

            mockMvc.perform(get("/api/v1/admin/excuse-requests/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_FETCHED"))
                    .andExpect(jsonPath("$.data.id").value(1L))
                    .andExpect(jsonPath("$.data.employeeCode").value("NV-1042"));
        }

        @Test
        @DisplayName("Không tìm thấy đơn giải trình theo ID -> trả về 404 Not Found")
        void getExcuseRequestById_NotFound_Returns404() throws Exception {
            when(excuseRequestService.getExcuseRequestById(999L))
                    .thenThrow(new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đơn giải trình ID=999"));

            mockMvc.perform(get("/api/v1/admin/excuse-requests/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("3. Quyết định phê duyệt hoặc từ chối đơn (PATCH /api/v1/admin/excuse-requests/{id})")
    class DecideExcuseRequestTests {

        @Test
        @DisplayName("Phê duyệt đơn qua PATCH thành công trả về 200 OK")
        void decideExcuseRequest_Approve_Success_Returns200() throws Exception {
            DecideExcuseRequest request = new DecideExcuseRequest(
                    ExcuseRequestStatus.APPROVED,
                    "Đã xác nhận sự cố hệ thống",
                    null
            );

            ExcuseRequestResponse response = createMockResponse(
                    1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L,
                    ExcuseRequestStatus.APPROVED, null
            );

            when(excuseRequestService.approveExcuseRequest(eq(1L), eq(1001L), any(ApproveExcuseRequest.class)))
                    .thenReturn(response);

            when(userRepository.findByEmail("hr@company.com")).thenReturn(java.util.Optional.of(hrUser()));

            mockMvc.perform(patch("/api/v1/admin/excuse-requests/1")
                            .principal(() -> "hr@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_APPROVED"))
                    .andExpect(jsonPath("$.data.status").value("APPROVED"));

            verify(excuseRequestService).approveExcuseRequest(eq(1L), eq(1001L), any(ApproveExcuseRequest.class));
        }

        @Test
        @DisplayName("Từ chối đơn qua PATCH thành công trả về 200 OK")
        void decideExcuseRequest_Reject_Success_Returns200() throws Exception {
            DecideExcuseRequest request = new DecideExcuseRequest(
                    ExcuseRequestStatus.REJECTED,
                    null,
                    "Camera xác nhận nhân viên không có mặt tại công ty"
            );

            ExcuseRequestResponse response = createMockResponse(
                    1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L,
                    ExcuseRequestStatus.REJECTED, "Camera xác nhận nhân viên không có mặt tại công ty"
            );

            when(excuseRequestService.rejectExcuseRequest(eq(1L), eq(1001L), any(RejectExcuseRequest.class)))
                    .thenReturn(response);

            when(userRepository.findByEmail("hr@company.com")).thenReturn(java.util.Optional.of(hrUser()));

            mockMvc.perform(patch("/api/v1/admin/excuse-requests/1")
                            .principal(() -> "hr@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_REJECTED"))
                    .andExpect(jsonPath("$.data.status").value("REJECTED"))
                    .andExpect(jsonPath("$.data.rejectionReason").value(containsString("Camera xác nhận")));

            verify(excuseRequestService).rejectExcuseRequest(eq(1L), eq(1001L), any(RejectExcuseRequest.class));
        }

        @Test
        @DisplayName("Từ chối đơn nhưng thiếu lý do -> ném 400 Bad Request VALIDATION_FAILED")
        void decideExcuseRequest_Reject_MissingReason_Returns400() throws Exception {
            DecideExcuseRequest request = new DecideExcuseRequest(
                    ExcuseRequestStatus.REJECTED,
                    null,
                    ""
            );

            when(userRepository.findByEmail("hr@company.com")).thenReturn(java.util.Optional.of(hrUser()));

            mockMvc.perform(patch("/api/v1/admin/excuse-requests/1")
                            .principal(() -> "hr@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.detail").value(containsString("Lý do từ chối không được để trống")));

            verify(excuseRequestService, never()).rejectExcuseRequest(any(), any(), any());
        }

        @Test
        @DisplayName("Xử lý đơn đã hoàn tất trước đó -> Service ném 409 EXCUSE_ALREADY_PROCESSED")
        void decideExcuseRequest_AlreadyProcessed_Returns409() throws Exception {
            DecideExcuseRequest request = new DecideExcuseRequest(
                    ExcuseRequestStatus.APPROVED,
                    "Duyệt lại",
                    null
            );

            when(excuseRequestService.approveExcuseRequest(eq(1L), eq(1001L), any(ApproveExcuseRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EXCUSE_ALREADY_PROCESSED, "Đơn giải trình ID=1 đã được xử lý"));

            when(userRepository.findByEmail("hr@company.com")).thenReturn(java.util.Optional.of(hrUser()));

            mockMvc.perform(patch("/api/v1/admin/excuse-requests/1")
                            .principal(() -> "hr@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("EXCUSE_ALREADY_PROCESSED"));
        }
    }

    @Nested
    @DisplayName("4. Các endpoint chuyên biệt (POST /approve và POST /reject)")
    class SpecializedActionEndpointsTests {

        @Test
        @DisplayName("POST /approve thành công trả về 200 OK")
        void approveEndpoint_Success_Returns200() throws Exception {
            ApproveExcuseRequest request = new ApproveExcuseRequest("Duyệt ghi chú");
            ExcuseRequestResponse response = createMockResponse(
                    1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L,
                    ExcuseRequestStatus.APPROVED, null
            );

            when(excuseRequestService.approveExcuseRequest(eq(1L), eq(1001L), any(ApproveExcuseRequest.class)))
                    .thenReturn(response);

            when(userRepository.findByEmail("hr@company.com")).thenReturn(java.util.Optional.of(hrUser()));

            mockMvc.perform(post("/api/v1/admin/excuse-requests/1/approve")
                            .principal(() -> "hr@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_APPROVED"));
        }

        @Test
        @DisplayName("POST /reject thành công trả về 200 OK")
        void rejectEndpoint_Success_Returns200() throws Exception {
            RejectExcuseRequest request = new RejectExcuseRequest("Lý do từ chối hợp lệ");
            ExcuseRequestResponse response = createMockResponse(
                    1L, 1042L, "NV-1042", "Ngô Văn Dũng", 101L,
                    ExcuseRequestStatus.REJECTED, "Lý do từ chối hợp lệ"
            );

            when(excuseRequestService.rejectExcuseRequest(eq(1L), eq(1001L), any(RejectExcuseRequest.class)))
                    .thenReturn(response);

            when(userRepository.findByEmail("hr@company.com")).thenReturn(java.util.Optional.of(hrUser()));

            mockMvc.perform(post("/api/v1/admin/excuse-requests/1/reject")
                            .principal(() -> "hr@company.com")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("EXCUSE_REQUEST_REJECTED"));
        }
    }
}
