package com.fas.api.controller;

import com.fas.api.dto.request.CreateDataSubjectRequest;
import com.fas.api.dto.request.UpdateDataSubjectRequest;
import com.fas.api.dto.response.DataSubjectRequestResponse;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.enums.DataSubjectRequestType;
import com.fas.data.repository.UserRepository;
import com.fas.service.DataSubjectRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DataSubjectRequestControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private DataSubjectRequestService dataSubjectRequestService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DataSubjectRequestController dataSubjectRequestController;

    private DataSubjectRequestResponse sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(dataSubjectRequestController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = new DataSubjectRequestResponse(
                1L, 1042L, "NV-1042", "Ngô Văn Dũng",
                DataSubjectRequestType.ACCESS, "Yêu cầu truy cập dữ liệu cá nhân",
                DataSubjectRequestStatus.RECEIVED,
                null, null, null, null,
                Instant.now(), Instant.now()
        );
    }

    private static User employeeUser() {
        return User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
    }

    private static User dpoUser() {
        return User.builder().id(200L).email("dpo@company.com").employeeCode("DPO-200").build();
    }

    @Test
    @DisplayName("Nhân viên gửi yêu cầu dữ liệu cá nhân mới -> trả về 201 Created")
    void createRequest_Success() throws Exception {
        CreateDataSubjectRequest request = new CreateDataSubjectRequest(
                DataSubjectRequestType.ACCESS, "Yêu cầu truy cập dữ liệu cá nhân"
        );
        when(dataSubjectRequestService.createRequest(eq(1042L), any())).thenReturn(sampleResponse);

        when(userRepository.findByEmail("dung@company.com"))
                .thenReturn(java.util.Optional.of(employeeUser()));

        mockMvc.perform(post("/api/v1/employee/data-requests")
                        .principal(() -> "dung@company.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("DATA_REQUEST_CREATED"))
                .andExpect(jsonPath("$.data.id").value(1));

        verify(dataSubjectRequestService).createRequest(eq(1042L), any());
    }

    @Test
    @DisplayName("Nhân viên tra cứu các yêu cầu của mình -> trả về 200 OK")
    void getMyRequests_Success() throws Exception {
        when(dataSubjectRequestService.getRequestsByUser(eq(1042L), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 20), 1));

        when(userRepository.findByEmail("dung@company.com"))
                .thenReturn(java.util.Optional.of(employeeUser()));

        mockMvc.perform(get("/api/v1/employee/data-requests")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("DATA_REQUESTS_FETCHED"));

        verify(dataSubjectRequestService).getRequestsByUser(eq(1042L), any());
    }

    @Test
    @DisplayName("Nhân viên tra cứu chi tiết yêu cầu của chính mình -> trả về 200 OK")
    void getMyRequestDetail_Success() throws Exception {
        when(dataSubjectRequestService.getRequestByIdForUser(1L, 1042L)).thenReturn(sampleResponse);

        when(userRepository.findByEmail("dung@company.com"))
                .thenReturn(java.util.Optional.of(employeeUser()));

        mockMvc.perform(get("/api/v1/employee/data-requests/1")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("DATA_REQUEST_FETCHED"))
                .andExpect(jsonPath("$.data.id").value(1));

        verify(dataSubjectRequestService).getRequestByIdForUser(1L, 1042L);
    }

    @Test
    @DisplayName("Nhân viên tra cứu yêu cầu của người khác -> trả về 404 RESOURCE_NOT_FOUND")
    void getMyRequestDetail_OtherUsersRequest_Returns404() throws Exception {
        when(dataSubjectRequestService.getRequestByIdForUser(1L, 1042L))
                .thenThrow(new com.fas.api.error.ApiException(com.fas.api.error.ApiErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy yêu cầu ID=1"));

        when(userRepository.findByEmail("dung@company.com"))
                .thenReturn(java.util.Optional.of(employeeUser()));

        mockMvc.perform(get("/api/v1/employee/data-requests/1")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("DPO tra cứu danh sách yêu cầu -> trả về 200 OK")
    void getDpoRequests_Success() throws Exception {
        when(dataSubjectRequestService.getAllRequests(eq(DataSubjectRequestStatus.RECEIVED), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/dpo/data-requests?status=RECEIVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("DPO_REQUESTS_FETCHED"));

        verify(dataSubjectRequestService).getAllRequests(eq(DataSubjectRequestStatus.RECEIVED), any());
    }

    @Test
    @DisplayName("DPO cập nhật trạng thái yêu cầu -> trả về 200 OK")
    void updateRequestStatus_Success() throws Exception {
        UpdateDataSubjectRequest updateRequest = new UpdateDataSubjectRequest(
                DataSubjectRequestStatus.FULFILLED, "Đã trích xuất và cung cấp dữ liệu"
        );
        DataSubjectRequestResponse updatedResponse = new DataSubjectRequestResponse(
                1L, 1042L, "NV-1042", "Ngô Văn Dũng",
                DataSubjectRequestType.ACCESS, "Yêu cầu truy cập dữ liệu cá nhân",
                DataSubjectRequestStatus.FULFILLED,
                200L, "DPO User", "Đã trích xuất và cung cấp dữ liệu", Instant.now(),
                Instant.now(), Instant.now()
        );
        when(dataSubjectRequestService.updateRequestStatus(eq(1L), eq(200L), any()))
                .thenReturn(updatedResponse);

        when(userRepository.findByEmail("dpo@company.com"))
                .thenReturn(java.util.Optional.of(dpoUser()));

        mockMvc.perform(patch("/api/v1/dpo/data-requests/1")
                        .principal(() -> "dpo@company.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("DATA_REQUEST_UPDATED"))
                .andExpect(jsonPath("$.data.status").value("FULFILLED"));

        verify(dataSubjectRequestService).updateRequestStatus(eq(1L), eq(200L), any());
    }
}
