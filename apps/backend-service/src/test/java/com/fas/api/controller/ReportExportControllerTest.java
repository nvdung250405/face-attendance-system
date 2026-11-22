package com.fas.api.controller;

import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.AttendanceSearchCriteria;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.VerificationMethod;
import com.fas.service.AttendanceService;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.ByteArrayInputStream;
import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho ReportExportController
 * (APD-BE-019, API-BE-035, FR-BE-008, API-SYS-011, SRS-007, BLD-BE-029, TST-BE-029, TASK-BE-034).
 */
@ExtendWith(MockitoExtension.class)
class ReportExportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AttendanceService attendanceService;

    @InjectMocks
    private ReportExportController reportExportController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(reportExportController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Kết xuất báo cáo Excel thành công trả về 200 OK và header attachment")
    void exportAttendanceReport_Success_Returns200AndAttachment() throws Exception {
        AttendanceLogItem normalItem = new AttendanceLogItem(
                1L, 1042L, "NV-1042", "Ngô Văn Dũng", "Phòng Kỹ thuật",
                OffsetDateTime.parse("2026-10-08T08:00:00+07:00"),
                PunchType.CHECK_IN, VerificationMethod.VERIFICATION_FACE, AttendanceStatus.ON_TIME, 0,
                "KIOSK-HN-01"
        );

        // Bản ghi chứa mã độc chèn công thức Excel (Formula Injection - CWE-1236)
        AttendanceLogItem formulaInjectionItem = new AttendanceLogItem(
                2L, 1043L, "=cmd|' /C calc'!A0", "+123456", "-SUM(A1:A10)",
                OffsetDateTime.parse("2026-10-08T08:15:00+07:00"),
                PunchType.CHECK_IN, VerificationMethod.VERIFICATION_PIN, AttendanceStatus.LATE, 15,
                "@macro()"
        );

        PageResponse<AttendanceLogItem> pageResponse = new PageResponse<>(
                List.of(normalItem, formulaInjectionItem),
                0, 5000, 2L, 1, true, true
        );

        when(attendanceService.queryAttendanceLogs(any(AttendanceSearchCriteria.class), any(Pageable.class)))
                .thenReturn(pageResponse);

        MvcResult result = mockMvc.perform(get("/api/v1/admin/reports/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"attendance_report.xlsx\""))
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        assertThat(content).isNotEmpty();

        // Kiểm tra nội dung file Excel đã tạo
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            Sheet sheet = workbook.getSheet("Bang_Cham_Cong");
            assertThat(sheet).isNotNull();

            // Dòng 1: normalItem
            Row row1 = sheet.getRow(1);
            assertThat(row1.getCell(1).getStringCellValue()).isEqualTo("NV-1042");
            assertThat(row1.getCell(2).getStringCellValue()).isEqualTo("Ngô Văn Dũng");
            assertThat(row1.getCell(3).getStringCellValue()).isEqualTo("Phòng Kỹ thuật");
            assertThat(row1.getCell(5).getStringCellValue()).isEqualTo("CHECK_IN");
            assertThat(row1.getCell(6).getStringCellValue()).isEqualTo("ON_TIME");
            assertThat(row1.getCell(7).getNumericCellValue()).isEqualTo(0.0);

            // Dòng 2: formulaInjectionItem -> đã được escape thêm dấu ' ở đầu
            Row row2 = sheet.getRow(2);
            assertThat(row2.getCell(1).getStringCellValue()).isEqualTo("'=cmd|' /C calc'!A0");
            assertThat(row2.getCell(2).getStringCellValue()).isEqualTo("'+123456");
            assertThat(row2.getCell(3).getStringCellValue()).isEqualTo("'-SUM(A1:A10)");
            assertThat(row2.getCell(8).getStringCellValue()).isEqualTo("'@macro()");
        }

        verify(attendanceService).queryAttendanceLogs(any(AttendanceSearchCriteria.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Kiểm tra hàm sanitizeFormula vô hiệu hóa chính xác các ký tự chèn công thức")
    void sanitizeFormula_EscapesSpecialCharactersCorrectly() {
        assertThat(ReportExportController.sanitizeFormula("=cmd|' /C calc'!A0")).isEqualTo("'=cmd|' /C calc'!A0");
        assertThat(ReportExportController.sanitizeFormula("+SUM(1,2)")).isEqualTo("'+SUM(1,2)");
        assertThat(ReportExportController.sanitizeFormula("-100")).isEqualTo("'-100");
        assertThat(ReportExportController.sanitizeFormula("@dangerous")).isEqualTo("'@dangerous");
        assertThat(ReportExportController.sanitizeFormula("NV-1042")).isEqualTo("NV-1042");
        assertThat(ReportExportController.sanitizeFormula("Ngô Văn Dũng")).isEqualTo("Ngô Văn Dũng");
        assertThat(ReportExportController.sanitizeFormula("")).isEqualTo("");
        assertThat(ReportExportController.sanitizeFormula(null)).isEqualTo("");
    }
}
