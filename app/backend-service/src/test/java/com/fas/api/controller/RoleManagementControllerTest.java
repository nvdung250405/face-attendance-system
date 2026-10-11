package com.fas.api.controller;

import com.fas.api.dto.request.UpdateUserRoleRequest;
import com.fas.api.dto.response.UserRoleResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.enums.Role;
import com.fas.data.repository.UserRepository;
import com.fas.service.RoleManagementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RoleManagementControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RoleManagementService roleManagementService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RoleManagementController roleManagementController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(roleManagementController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Admin cập nhật role thành công -> trả về 200 OK ROLE_UPDATED")
    void updateUserRole_Success() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.HR_MANAGER);
        UserRoleResponse response = new UserRoleResponse(
                100L, "NV-100", "Ngô Văn Dũng", "dung@fas.com",
                Role.HR_MANAGER
        );

        when(roleManagementService.updateUserRole(100L, Role.HR_MANAGER, 1L))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/admin/users/100/role")
                        .header("X-User-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("ROLE_UPDATED"))
                .andExpect(jsonPath("$.data.role").value("HR_MANAGER"));

        verify(roleManagementService).updateUserRole(100L, Role.HR_MANAGER, 1L);
    }

    @Test
    @DisplayName("Hạ cấp ADMIN cuối cùng -> trả về 409 Conflict LAST_ADMIN_CANNOT_BE_DEMOTED")
    void updateUserRole_LastAdmin_Returns409() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.EMPLOYEE);

        when(roleManagementService.updateUserRole(1L, Role.EMPLOYEE, 1L))
                .thenThrow(new ApiException(ApiErrorCode.LAST_ADMIN_CANNOT_BE_DEMOTED, "Không thể hạ cấp ADMIN cuối cùng"));

        mockMvc.perform(patch("/api/v1/admin/users/1/role")
                        .header("X-User-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LAST_ADMIN_CANNOT_BE_DEMOTED"));
    }
}
