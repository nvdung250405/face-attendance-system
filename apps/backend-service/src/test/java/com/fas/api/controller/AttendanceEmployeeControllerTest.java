package com.fas.api.controller;

import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.DailyAttendanceItem;
import com.fas.api.dto.response.PersonalAttendanceResponse;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.VerificationMethod;
import com.fas.data.repository.UserRepository;
import com.fas.service.EmployeeAttendanceQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho AttendanceEmployeeController
 * (API-BE-009, APD-BE-002, FR-BE-008, FR-BE-025, TASK-BE-020, BLD-BE-007).
 */
@ExtendWith(MockitoExtension.class)
class AttendanceEmployeeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EmployeeAttendanceQueryService employeeAttendanceQueryService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AttendanceEmployeeController attendanceEmployeeController;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(attendanceEmployeeController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleUser = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .email("dung.nv@company.com")
                .build();
    }

    @Nested
    @DisplayName("1. Tra cứu Lịch sử Chấm công Tháng (GET /api/v1/employee/attendance)")
    class GetMonthlyAttendanceTests {

        @Test
        @DisplayName("Tra cứu thành công với thông tin Principal")
        void getMonthlyAttendance_WithPrincipal_Success() throws Exception {
            Principal mockPrincipal = () -> "dung.nv@company.com";
            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));

            DailyAttendanceItem daily = new DailyAttendanceItem(
                    LocalDate.of(2026, 10, 8),
                    LocalTime.of(8, 25),
                    LocalTime.of(17, 30),
                    AttendanceStatus.ON_TIME,
                    0,
                    201L,
                    202L
            );

            PersonalAttendanceResponse response = new PersonalAttendanceResponse(
                    10, 2026, 1, 1, 0, List.of(daily)
            );

            when(employeeAttendanceQueryService.getMonthlyPersonalAttendance(eq(1042L), eq(2026), eq(10)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/v1/employee/attendance")
                            .principal(mockPrincipal)
                            .param("year", "2026")
                            .param("month", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PERSONAL_ATTENDANCE_FETCHED"))
                    .andExpect(jsonPath("$.data.year").value(2026))
                    .andExpect(jsonPath("$.data.month").value(10))
                    .andExpect(jsonPath("$.data.totalWorkDays").value(1))
                    .andExpect(jsonPath("$.data.records", hasSize(1)));

            verify(employeeAttendanceQueryService).getMonthlyPersonalAttendance(1042L, 2026, 10);
        }

        @Test
        @DisplayName("Tra cứu thành công với principal là mã nhân viên")
        void getMonthlyAttendance_WithEmployeeCodePrincipal_Success() throws Exception {
            DailyAttendanceItem daily = new DailyAttendanceItem(
                    LocalDate.of(2026, 10, 8),
                    LocalTime.of(8, 25),
                    null,
                    AttendanceStatus.ON_TIME,
                    0,
                    201L,
                    null
            );

            PersonalAttendanceResponse response = new PersonalAttendanceResponse(
                    10, 2026, 1, 1, 0, List.of(daily)
            );

            when(employeeAttendanceQueryService.getMonthlyPersonalAttendance(eq(1042L), eq(2026), eq(10)))
                    .thenReturn(response);

            Principal mockPrincipal = () -> "NV-1042";
            when(userRepository.findByEmail("NV-1042")).thenReturn(Optional.empty());
            when(userRepository.findByEmployeeCode("NV-1042")).thenReturn(Optional.of(sampleUser));

            mockMvc.perform(get("/api/v1/employee/attendance")
                            .principal(mockPrincipal)
                            .param("year", "2026")
                            .param("month", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("PERSONAL_ATTENDANCE_FETCHED"));

            verify(employeeAttendanceQueryService).getMonthlyPersonalAttendance(1042L, 2026, 10);
        }

        @Test
        @DisplayName("Không có thông tin xác thực -> trả về 403 Forbidden ACCESS_DENIED")
        void getMonthlyAttendance_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(get("/api/v1/employee/attendance"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }
    }

    @Nested
    @DisplayName("2. Tra cứu Chi tiết Lượt Chấm công (GET /api/v1/employee/attendance/logs)")
    class GetPersonalLogsTests {

        @Test
        @DisplayName("Tra cứu danh sách lượt chấm công phân trang thành công")
        void getPersonalLogs_Success() throws Exception {
            AttendanceLogItem item = new AttendanceLogItem(
                    201L, 1042L, "NV-1042", "Ngô Văn Dũng", "Phòng Kỹ thuật",
                    OffsetDateTime.parse("2026-10-08T08:25:00+07:00"),
                    PunchType.CHECK_IN, VerificationMethod.VERIFICATION_FACE,
                    AttendanceStatus.ON_TIME, 0, "KIOSK-HN-01"
            );

            Page<AttendanceLogItem> page = new PageImpl<>(List.of(item));

            when(employeeAttendanceQueryService.getPersonalAttendanceLogs(eq(1042L), eq(2026), eq(10), any(Pageable.class)))
                    .thenReturn(page);

            Principal mockPrincipal = () -> "dung.nv@company.com";
            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));

            mockMvc.perform(get("/api/v1/employee/attendance/logs")
                            .principal(mockPrincipal)
                            .param("year", "2026")
                            .param("month", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("PERSONAL_LOGS_FETCHED"))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].recordId").value(201));

            verify(employeeAttendanceQueryService).getPersonalAttendanceLogs(eq(1042L), eq(2026), eq(10), any(Pageable.class));
        }
    }
}
