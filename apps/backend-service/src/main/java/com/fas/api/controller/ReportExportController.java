package com.fas.api.controller;

import com.fas.api.dto.request.AttendanceSearchCriteria;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.service.AttendanceService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * REST Controller Kết xuất Báo cáo Bảng công Định dạng Excel An toàn
 * (APD-BE-019, API-BE-035, FR-BE-008, API-SYS-011, SRS-007, BLD-BE-029, TASK-BE-034).
 *
 * <p>Yêu cầu vai trò: {@code HR_MANAGER} hoặc {@code ADMIN}.</p>
 * <p>Tự động khử mã độc chèn công thức (Anti-Formula Injection / CWE-1236) bằng cách chèn dấu nháy đơn ({@code '})
 * trước các ô dữ liệu văn bản bắt đầu bằng {@code =}, {@code +}, {@code -}, {@code @}.</p>
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class ReportExportController {

    private static final String EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final int MAX_EXPORT_LIMIT = 5000;

    private final AttendanceService attendanceService;

    public ReportExportController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * Kết xuất báo cáo bảng công định dạng Excel (.xlsx) an toàn chống Formula Injection
     * (GET /api/v1/admin/reports/export - API-BE-035).
     *
     * @param criteria tiêu chí lọc báo cáo
     * @return tệp nhị phân Excel dạng .xlsx đính kèm trong response
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAttendanceReport(@ModelAttribute AttendanceSearchCriteria criteria) throws IOException {
        // Lấy danh sách điểm danh theo bộ lọc (tối đa MAX_EXPORT_LIMIT bản ghi)
        List<AttendanceLogItem> records = attendanceService.queryAttendanceLogs(
                criteria,
                PageRequest.of(0, MAX_EXPORT_LIMIT, Sort.by(Sort.Direction.DESC, "punchTimestamp"))
        ).content();

        byte[] excelBytes = generateExcelReport(records);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(EXCEL_MIME_TYPE));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance_report.xlsx\"");
        headers.setContentLength(excelBytes.length);

        return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
    }

    /**
     * Sinh tệp Excel .xlsx từ danh sách bản ghi và làm sạch các chuỗi nguy hiểm (CWE-1236).
     */
    private byte[] generateExcelReport(List<AttendanceLogItem> records) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Bang_Cham_Cong");

            // Tạo kiểu tiêu đề
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);

            // Dòng tiêu đề
            String[] headers = {
                    "STT", "Mã nhân viên", "Họ và tên", "Phòng ban",
                    "Thời gian điểm danh", "Loại điểm danh", "Trạng thái",
                    "Đi muộn (phút)", "Trạm Kiosk", "Phương thức"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Điền dữ liệu các dòng
            int rowIdx = 1;
            for (AttendanceLogItem item : records) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(sanitizeFormula(item.employeeCode()));
                row.createCell(2).setCellValue(sanitizeFormula(item.fullName()));
                row.createCell(3).setCellValue(sanitizeFormula(item.department()));
                row.createCell(4).setCellValue(item.punchTimestamp() != null ? ISO_FORMATTER.format(item.punchTimestamp()) : "");
                row.createCell(5).setCellValue(item.punchType() != null ? item.punchType().name() : "");
                row.createCell(6).setCellValue(item.status() != null ? item.status().name() : "");
                row.createCell(7).setCellValue(item.lateMinutes());
                row.createCell(8).setCellValue(sanitizeFormula(item.kioskId()));
                row.createCell(9).setCellValue(item.verificationMethod() != null ? item.verificationMethod().name() : "");
            }

            // Tự động căn chỉnh độ rộng cột cơ bản
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Vô hiệu hóa mã độc chèn công thức Excel (Anti-Formula Injection / CWE-1236, SRS-007, FR-BE-008).
     *
     * <p>Nếu chuỗi văn bản bắt đầu bằng {@code =}, {@code +}, {@code -}, {@code @},
     * tự động chèn dấu nháy đơn ({@code '}) ở đầu để biến công thức thành văn bản thuần túy.</p>
     *
     * @param value giá trị chuỗi cần kiểm tra
     * @return chuỗi đã được escape an toàn
     */
    public static String sanitizeFormula(String value) {
        if (value == null) {
            return "";
        }
        if (value.startsWith("=") || value.startsWith("+") || value.startsWith("-") || value.startsWith("@")) {
            return "'" + value;
        }
        return value;
    }
}
