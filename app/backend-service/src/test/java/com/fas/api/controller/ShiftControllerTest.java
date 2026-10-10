package com.fas.api.controller;

import com.fas.api.dto.request.CreateShiftRequest;
import com.fas.api.dto.request.UpdateShiftRequest;
import com.fas.api.dto.response.ShiftResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.service.ShiftManagementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Bộ kiểm thử REST Controller cho ShiftController (TASK-BE-032, BLD-BE-027, APD-BE-013, API-BE-023).
 */
@ExtendWith(MockitoExtension.class)
class ShiftControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private ShiftManagementService shiftManagementService;

    @InjectMocks
    private ShiftController shiftController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(shiftController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("1. Khởi tạo ca làm việc (POST /api/v1/admin/shifts)")
    class CreateShiftTests {

        @Test
        @DisplayName("Khởi tạo ca thành công trả về 201 Created và ApiResponse hợp lệ")
        void createShift_Success_Returns201() throws Exception {
            CreateShiftRequest request = new CreateShiftRequest(
                    "CA-SANG",
                    "Ca sáng tiêu chuẩn",
                    LocalTime.of(8, 0),
                    LocalTime.of(12, 0),
                    15
            );

            ShiftResponse response = new ShiftResponse(
                    1L,
                    "CA-SANG",
                    "Ca sáng tiêu chuẩn",
                    LocalTime.of(8, 0),
                    LocalTime.of(12, 0),
                    15,
                    true
            );

            when(shiftManagementService.createShift(any(CreateShiftRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/admin/shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("SHIFT_CREATED"))
                    .andExpect(jsonPath("$.data.id").value(1L))
                    .andExpect(jsonPath("$.data.shiftCode").value("CA-SANG"))
                    .andExpect(jsonPath("$.data.shiftName").value("Ca sáng tiêu chuẩn"))
                    .andExpect(jsonPath("$.data.isActive").value(true));

            verify(shiftManagementService).createShift(any(CreateShiftRequest.class));
        }

        @Test
        @DisplayName("Validation thất bại khi thiếu shiftCode hoặc startTime -> trả về 400 Bad Request")
        void createShift_ValidationFailed_Returns400() throws Exception {
            // Thiếu shiftCode và startTime
            String invalidJson = """
                    {
                        "shiftCode": "",
                        "shiftName": "Ca test",
                        "endTime": "12:00:00",
                        "gracePeriodMinutes": 15
                    }
                    """;

            mockMvc.perform(post("/api/v1/admin/shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.invalidParams", hasSize(greaterThan(0))));

            verify(shiftManagementService, never()).createShift(any());
        }

        @Test
        @DisplayName("Thời gian bắt đầu lớn hơn giờ kết thúc -> Service ném 400 VALIDATION_FAILED")
        void createShift_InvalidTimes_Returns400() throws Exception {
            CreateShiftRequest request = new CreateShiftRequest(
                    "CA-LOI",
                    "Ca lỗi",
                    LocalTime.of(18, 0),
                    LocalTime.of(8, 0),
                    15
            );

            when(shiftManagementService.createShift(any(CreateShiftRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.VALIDATION_FAILED, "Giờ bắt đầu ca phải nhỏ hơn giờ kết thúc ca."));

            mockMvc.perform(post("/api/v1/admin/shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.detail").value(containsString("Giờ bắt đầu ca phải nhỏ hơn giờ kết thúc ca")));
        }

        @Test
        @DisplayName("Mã ca đã tồn tại trong CSDL -> Service ném DATA_INTEGRITY_VIOLATION trả về 400")
        void createShift_DuplicateCode_Returns400() throws Exception {
            CreateShiftRequest request = new CreateShiftRequest(
                    "CA-SANG",
                    "Ca sáng trùng",
                    LocalTime.of(8, 0),
                    LocalTime.of(12, 0),
                    15
            );

            when(shiftManagementService.createShift(any(CreateShiftRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.DATA_INTEGRITY_VIOLATION, "Mã ca làm việc 'CA-SANG' đã tồn tại."));

            mockMvc.perform(post("/api/v1/admin/shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("DATA_INTEGRITY_VIOLATION"));
        }
    }

    @Nested
    @DisplayName("2. Cập nhật ca làm việc (PATCH /api/v1/admin/shifts/{id})")
    class UpdateShiftTests {

        @Test
        @DisplayName("Cập nhật thông tin ca thành công trả về 200 OK")
        void updateShift_Success_Returns200() throws Exception {
            UpdateShiftRequest request = new UpdateShiftRequest(
                    "Ca sáng mới",
                    LocalTime.of(8, 30),
                    LocalTime.of(12, 30),
                    10,
                    true
            );

            ShiftResponse response = new ShiftResponse(
                    2L,
                    "CA-SANG",
                    "Ca sáng mới",
                    LocalTime.of(8, 30),
                    LocalTime.of(12, 30),
                    10,
                    true
            );

            when(shiftManagementService.updateShift(eq(2L), any(UpdateShiftRequest.class))).thenReturn(response);

            mockMvc.perform(patch("/api/v1/admin/shifts/2")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("SHIFT_UPDATED"))
                    .andExpect(jsonPath("$.data.shiftName").value("Ca sáng mới"));
        }

        @Test
        @DisplayName("Cập nhật thất bại khi không tìm thấy ca -> trả về 404 Not Found")
        void updateShift_NotFound_Returns404() throws Exception {
            UpdateShiftRequest request = new UpdateShiftRequest(
                    "Tên mới",
                    LocalTime.of(8, 0),
                    LocalTime.of(12, 0),
                    15,
                    true
            );

            when(shiftManagementService.updateShift(eq(999L), any(UpdateShiftRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ca làm việc"));

            mockMvc.perform(patch("/api/v1/admin/shifts/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
        }

        @Test
        @DisplayName("Vô hiệu hóa ca đang được phân công cho nhân sự -> trả về 409 Conflict SHIFT_IN_USE")
        void updateShift_ShiftInUse_Returns409() throws Exception {
            UpdateShiftRequest request = new UpdateShiftRequest(
                    "Ca hành chính",
                    LocalTime.of(8, 0),
                    LocalTime.of(17, 0),
                    15,
                    false
            );

            when(shiftManagementService.updateShift(eq(1L), any(UpdateShiftRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.SHIFT_IN_USE, "Không thể vô hiệu hóa ca đang được phân công"));

            mockMvc.perform(patch("/api/v1/admin/shifts/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("SHIFT_IN_USE"));
        }
    }

    @Nested
    @DisplayName("3. Tra cứu danh mục ca làm việc (GET /api/v1/admin/shifts)")
    class GetShiftsTests {

        @Test
        @DisplayName("Lấy danh sách tất cả ca làm việc thành công")
        void getAllShifts_Success_Returns200() throws Exception {
            ShiftResponse shift1 = new ShiftResponse(1L, "CA-1", "Ca 1", LocalTime.of(8, 0), LocalTime.of(12, 0), 15, true);
            ShiftResponse shift2 = new ShiftResponse(2L, "CA-2", "Ca 2", LocalTime.of(13, 0), LocalTime.of(17, 0), 15, false);

            when(shiftManagementService.getAllShifts(null)).thenReturn(List.of(shift1, shift2));

            mockMvc.perform(get("/api/v1/admin/shifts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SHIFT_LIST_FETCHED"))
                    .andExpect(jsonPath("$.data", hasSize(2)));
        }

        @Test
        @DisplayName("Lấy chi tiết ca theo ID thành công")
        void getShiftById_Success_Returns200() throws Exception {
            ShiftResponse shift = new ShiftResponse(1L, "CA-1", "Ca 1", LocalTime.of(8, 0), LocalTime.of(12, 0), 15, true);
            when(shiftManagementService.getShift(1L)).thenReturn(shift);

            mockMvc.perform(get("/api/v1/admin/shifts/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SHIFT_FETCHED"))
                    .andExpect(jsonPath("$.data.shiftCode").value("CA-1"));
        }

        @Test
        @DisplayName("Vô hiệu hóa ca làm việc qua POST /deactivate thành công")
        void deactivateShift_Success_Returns200() throws Exception {
            ShiftResponse shift = new ShiftResponse(1L, "CA-1", "Ca 1", LocalTime.of(8, 0), LocalTime.of(12, 0), 15, false);
            when(shiftManagementService.deactivateShift(1L)).thenReturn(shift);

            mockMvc.perform(post("/api/v1/admin/shifts/1/deactivate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SHIFT_DEACTIVATED"))
                    .andExpect(jsonPath("$.data.isActive").value(false));
        }

        @Test
        @DisplayName("Kích hoạt lại ca làm việc qua POST /activate thành công")
        void activateShift_Success_Returns200() throws Exception {
            ShiftResponse shift = new ShiftResponse(1L, "CA-1", "Ca 1", LocalTime.of(8, 0), LocalTime.of(12, 0), 15, true);
            when(shiftManagementService.activateShift(1L)).thenReturn(shift);

            mockMvc.perform(post("/api/v1/admin/shifts/1/activate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SHIFT_ACTIVATED"))
                    .andExpect(jsonPath("$.data.isActive").value(true));
        }
    }
}
