package com.fas.api.controller;

import com.fas.api.dto.response.NotificationResponse;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.repository.UserRepository;
import com.fas.service.NotificationService;
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
class NotificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationController notificationController;

    private NotificationResponse sampleNotification;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(notificationController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleNotification = new NotificationResponse(
                1L, 1042L, NotificationEventType.CONSENT_WITHDRAWN,
                "Rút Consent", "Nội dung thông báo",
                "CONSENT", "1", null, Instant.now()
        );
    }

    @Test
    @DisplayName("Lấy danh sách thông báo người dùng -> trả về 200 OK")
    void getMyNotifications_Success() throws Exception {
        when(notificationService.getUserNotifications(eq(1042L), any()))
                .thenReturn(new PageImpl<>(List.of(sampleNotification), PageRequest.of(0, 20), 1));

        User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
        when(userRepository.findByEmail("dung@company.com")).thenReturn(java.util.Optional.of(employee));

        mockMvc.perform(get("/api/v1/notifications")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("NOTIFICATIONS_FETCHED"))
                .andExpect(jsonPath("$.data.content[0].id").value(1));

        verify(notificationService).getUserNotifications(eq(1042L), any());
    }

    @Test
    @DisplayName("Đếm số thông báo chưa đọc -> trả về 200 OK")
    void getUnreadCount_Success() throws Exception {
        when(notificationService.getUnreadCount(1042L)).thenReturn(5L);

        User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
        when(userRepository.findByEmail("dung@company.com")).thenReturn(java.util.Optional.of(employee));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("UNREAD_COUNT_FETCHED"))
                .andExpect(jsonPath("$.data.unreadCount").value(5));

        verify(notificationService).getUnreadCount(1042L);
    }

    @Test
    @DisplayName("Đánh dấu đã đọc một thông báo -> trả về 200 OK")
    void markAsRead_Success() throws Exception {
        NotificationResponse readNotification = new NotificationResponse(
                1L, 1042L, NotificationEventType.CONSENT_WITHDRAWN,
                "Rút Consent", "Nội dung thông báo",
                "CONSENT", "1", Instant.now(), Instant.now()
        );
        when(notificationService.markAsRead(1L, 1042L)).thenReturn(readNotification);

        User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
        when(userRepository.findByEmail("dung@company.com")).thenReturn(java.util.Optional.of(employee));

        mockMvc.perform(patch("/api/v1/notifications/1/read")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("NOTIFICATION_READ"))
                .andExpect(jsonPath("$.data.readAt").isNotEmpty());

        verify(notificationService).markAsRead(1L, 1042L);
    }

    @Test
    @DisplayName("Đánh dấu tất cả thông báo đã đọc -> trả về 200 OK")
    void markAllAsRead_Success() throws Exception {
        User employee = User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
        when(userRepository.findByEmail("dung@company.com")).thenReturn(java.util.Optional.of(employee));

        mockMvc.perform(post("/api/v1/notifications/read-all")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("NOTIFICATIONS_READ_ALL"));

        verify(notificationService).markAllAsRead(1042L);
    }
}
