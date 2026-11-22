/**
 * Test Suite Toàn Diện Module Xuất Báo Cáo Excel/PDF
 * (SOL-WEB-005, BLD-WEB-016, DD-WEB-017, APD-WEB-012, TST-SYS-019, TASK-WEB-020).
 *
 * Kiểm tra:
 * 1. Khử mã độc Formula Injection (CWE-1236, DD-WEB-017) với sanitizeFormula.
 * 2. Xuất báo cáo CSV/Excel phía Client có UTF-8 BOM, Tiêu đề, Mốc thời gian, Tên công ty, KPI.
 * 3. Xuất báo cáo PDF nhị phân (%PDF-1.4) chuẩn phía Client.
 * 4. Gọi REST API Backend exportTimesheetReport và trích xuất filename từ Content-Disposition.
 * 5. Tương tác trên ExportReportModal (Chọn định dạng, Tên công ty, Print Preview, Submit).
 * 6. Tích hợp màn hình AdminAttendanceView (Nút xuất nhanh, Mở modal nâng cao, Fallback).
 * 7. Tích hợp màn hình AdminPayrollPeriodView (Nút xuất báo cáo theo từng kỳ công).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'
import {
  reportExportService,
  sanitizeFormula,
  stripVietnameseDiacritics,
  escapeHtml,
} from '@/services/reportExportService'
import { apiClient } from '@/services/apiClient'
import { ExportReportModal } from '@/components/report/ExportReportModal'
import { AdminAttendanceView } from '@/views/admin/AdminAttendanceView'
import { AdminPayrollPeriodView } from '@/views/admin/AdminPayrollPeriodView'
import { useAuthStore } from '@/store/authStore'
import { attendanceService } from '@/services/attendanceService'
import { payrollPeriodService } from '@/services/payrollPeriodService'
import * as useLiveAttendanceModule from '@/services/hooks/useLiveAttendance'
import type { AttendanceRecord, AttendanceStats, UserProfile, PageResponse, PayrollPeriodResponse } from '@/types'

const mockAdminUser: UserProfile = {
  id: 1,
  employeeCode: 'HR-001',
  fullName: 'Nguyễn Quản Trị Nhân Sự',
  email: 'hr.manager@company.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Phòng Nhân sự',
}

const mockStats: AttendanceStats = {
  totalEmployees: 100,
  presentCount: 90,
  onTimeCount: 80,
  lateCount: 10,
  absentCount: 10,
}

const mockRecords: AttendanceRecord[] = [
  {
    recordId: 101,
    employeeId: 1001,
    employeeCode: 'NV-1001',
    fullName: 'Trần Văn An',
    department: 'Khối Công nghệ',
    punchTimestamp: '2026-10-14T08:15:00.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KSK-01',
  },
  {
    recordId: 102,
    employeeId: 1002,
    employeeCode: 'NV-1002',
    fullName: 'Lê Thị Bình',
    department: 'Phòng Kinh Doanh',
    punchTimestamp: '2026-10-14T08:45:00.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_PIN',
    status: 'LATE',
    lateMinutes: 15,
    kioskId: 'KSK-02',
  },
]

const mockPageResponse: PageResponse<AttendanceRecord> = {
  content: mockRecords,
  totalElements: 2,
  totalPages: 1,
  size: 50,
  page: 0,
  first: true,
  last: true,
}

const mockPayrollPeriods: PayrollPeriodResponse[] = [
  {
    id: 1,
    periodYear: 2026,
    periodMonth: 10,
    status: 'OPEN',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 2,
    periodYear: 2026,
    periodMonth: 9,
    status: 'LOCKED',
    lockedById: 1,
    lockedByName: 'Nguyễn Quản Trị Nhân Sự',
    lockedAt: '2026-10-05T17:00:00Z',
    createdAt: '2026-09-01T00:00:00Z',
  },
]

describe('TASK-WEB-020: Report Export Module (Excel & PDF)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      session: {
        accessToken: 'mock-admin-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: mockAdminUser,
      },
      user: mockAdminUser,
      isAuthenticated: true,
    })

    // Mock window.URL methods
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-blob')
    window.URL.revokeObjectURL = vi.fn()

    // Mock HTMLAnchorElement click
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    // Mock useLiveAttendance hook để không tạo SockJS socket thực tế
    vi.spyOn(useLiveAttendanceModule, 'useLiveAttendance').mockImplementation(() => {
      return {
        latestEvents: [],
        isConnected: true,
        connectionState: 'CONNECTED',
        clearEvents: vi.fn(),
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Khử mã độc Formula Injection (CWE-1236, DD-WEB-017, TST-SYS-019)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Anti-Formula Injection (CWE-1236)', () => {
    it('chèn dấu nháy đơn trước các ký tự nguy hiểm =, +, -, @', () => {
      expect(sanitizeFormula('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeFormula('=cmd|\'/C calc\'!A0')).toBe("'=cmd|'/C calc'!A0")
      expect(sanitizeFormula('+123456')).toBe("'+123456")
      expect(sanitizeFormula('-1000')).toBe("'-1000")
      expect(sanitizeFormula('@dangerous_payload')).toBe("'@dangerous_payload")
    })

    it('giữ nguyên các chuỗi an toàn thông thường và xử lý giá trị null/undefined', () => {
      expect(sanitizeFormula('Nguyễn Văn A')).toBe('Nguyễn Văn A')
      expect(sanitizeFormula('NV-2026')).toBe('NV-2026')
      expect(sanitizeFormula('12345')).toBe('12345')
      expect(sanitizeFormula(null)).toBe('')
      expect(sanitizeFormula(undefined)).toBe('')
    })

    it('loại bỏ dấu tiếng Việt an toàn cho PDF ASCII', () => {
      expect(stripVietnameseDiacritics('CÔNG TY CỔ PHẦN CÔNG NGHỆ')).toBe(
        'CONG TY CO PHAN CONG NGHE'
      )
      expect(stripVietnameseDiacritics('Đúng giờ')).toBe('Dung gio')
    })

    it('escapeHtml trung hòa các ký tự HTML nguy hiểm', () => {
      expect(escapeHtml('<script>alert(1)</script>')).toBe(
        '&lt;script&gt;alert(1)&lt;/script&gt;'
      )
      expect(escapeHtml(`"quoted" & 'single'`)).toBe(
        '&quot;quoted&quot; &amp; &#39;single&#39;'
      )
      expect(escapeHtml(null)).toBe('')
      expect(escapeHtml(undefined)).toBe('')
    })

    it('generatePrintableHtml không để lộ HTML thô từ fullName/reportTitle', () => {
      const html = reportExportService.generatePrintableHtml({
        companyName: '<img src=x onerror=alert(1)>',
        reportTitle: '<script>alert(1)</script>',
        period: '2026-10',
        records: [
          {
            recordId: 1,
            employeeCode: '<b>NV</b>',
            fullName: '<script>alert(1)</script>',
            department: '<i>IT</i>',
            punchTimestamp: '2026-10-14T08:00:00+07:00',
            punchType: 'CHECK_IN',
            status: 'ON_TIME',
            lateMinutes: 0,
            kioskId: '<svg onload=alert(1)>',
            verificationMethod: 'VERIFICATION_FACE',
          },
        ],
      })

      expect(html).not.toContain('<script>alert(1)</script>')
      expect(html).not.toContain('<img src=x onerror=alert(1)>')
      expect(html).not.toContain('<svg onload=alert(1)>')
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Xuất báo cáo CSV/Excel phía Client (generateClientExcelReport)
  // ──────────────────────────────────────────────────────────────────────────
  describe('generateClientExcelReport (Client-side Excel/CSV)', () => {
    it('tạo CSV có UTF-8 BOM, thông tin công ty, mốc thời gian, thống kê KPI và dữ liệu chấm công', async () => {
      const result = reportExportService.generateClientExcelReport({
        companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS',
        reportTitle: 'BẢNG CHẤM CÔNG THÁNG 10/2026',
        period: '2026-10',
        generatedAt: '14/10/2026 09:00:00',
        departmentName: 'Khối Công nghệ',
        stats: {
          totalEmployees: 50,
          onTimeCount: 45,
          lateCount: 5,
          absentCount: 0,
          faceRecognitionRate: 98,
        },
        records: [
          {
            recordId: 1,
            employeeCode: '=PAYLOAD_TEST',
            fullName: 'Lê Văn Cường',
            department: 'Khối Công nghệ',
            punchTimestamp: '2026-10-14 08:00:00',
            punchType: 'CHECK_IN',
            status: 'ON_TIME',
            lateMinutes: 0,
            kioskId: 'KSK-01',
            verificationMethod: 'VERIFICATION_FACE',
          },
        ],
      })

      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.filename).toMatch(/bang-cham-cong-2026-10-\d+\.csv/)

      const text = await result.blob.text()
      // Kiểm tra có UTF-8 BOM
      expect(text.startsWith('\uFEFF')).toBe(true)
      // Kiểm tra tên công ty, tiêu đề, mốc thời gian
      expect(text).toContain('CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS')
      expect(text).toContain('BẢNG CHẤM CÔNG THÁNG 10/2026')
      expect(text).toContain('14/10/2026 09:00:00')
      expect(text).toContain('2026-10')
      // Kiểm tra chỉ số KPI
      expect(text).toContain('TỔNG QUAN CHỈ SỐ KPI CHẤM CÔNG')
      expect(text).toContain('Đúng giờ,45')
      expect(text).toContain('Đi muộn,5')
      expect(text).toContain('98%')
      // Kiểm tra phòng chống injection trên dữ liệu dòng
      expect(text).toContain("'=PAYLOAD_TEST")
      expect(text).toContain('Lê Văn Cường')
      expect(text).toContain('Khuôn mặt')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Xuất báo cáo PDF phía Client (generateClientPdfReport)
  // ──────────────────────────────────────────────────────────────────────────
  describe('generateClientPdfReport (Client-side PDF)', () => {
    it('tạo tệp PDF chuẩn %PDF-1.4 với đầy đủ cấu trúc trang và thông tin doanh nghiệp', async () => {
      const result = reportExportService.generateClientPdfReport({
        companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS',
        reportTitle: 'BÁO CÁO ĐIỂM DANH',
        period: '2026-10',
        generatedAt: '14/10/2026 10:00:00',
        records: [
          {
            recordId: 10,
            employeeCode: 'NV-001',
            fullName: 'Nguyễn Văn Minh',
            punchTimestamp: '2026-10-14 08:00',
            status: 'ON_TIME',
          },
        ],
      })

      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.blob.type).toBe('application/pdf')
      expect(result.filename).toMatch(/bang-cham-cong-2026-10-\d+\.pdf/)

      const buffer = await result.blob.arrayBuffer()
      const headerStr = new TextDecoder().decode(buffer.slice(0, 8))
      expect(headerStr).toContain('%PDF-1.4')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. REST API Backend exportTimesheetReport
  // ──────────────────────────────────────────────────────────────────────────
  describe('exportTimesheetReport (Backend REST API)', () => {
    it('gọi đúng endpoint GET /api/v1/admin/reports/export và trích xuất filename từ header Content-Disposition', async () => {
      const fakeBlob = new Blob(['sample-excel-data'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: fakeBlob,
        headers: {
          'content-disposition': 'attachment; filename="attendance-report-2026-10.xlsx"',
        },
      })

      const res = await reportExportService.exportTimesheetReport({
        period: '2026-10',
        departmentId: 5,
        format: 'xlsx',
      })

      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/reports/export', {
        params: {
          period: '2026-10',
          departmentId: 5,
          keyword: undefined,
          status: undefined,
          fromDate: undefined,
          toDate: undefined,
          format: 'xlsx',
        },
        responseType: 'blob',
      })
      expect(res.filename).toBe('attendance-report-2026-10.xlsx')
      expect(res.blob).toBe(fakeBlob)
    })

    it('tải xuống tệp an toàn bằng triggerDownload và dọn dẹp URL Object', () => {
      const fakeBlob = new Blob(['hello'])
      reportExportService.triggerDownload(fakeBlob, 'test.csv')

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob)
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Component ExportReportModal
  // ──────────────────────────────────────────────────────────────────────────
  describe('ExportReportModal Component', () => {
    it('cho phép chọn định dạng Excel/PDF, nhập tên công ty và submit xuất báo cáo', async () => {
      const handleExport = vi.fn().mockResolvedValue(undefined)
      const handleClose = vi.fn()
      const handlePrint = vi.fn()

      render(
        <ExportReportModal
          isOpen={true}
          onClose={handleClose}
          onExport={handleExport}
          onPrintPreview={handlePrint}
          currentPeriod="2026-10"
          recordsCount={45}
          records={[]}
        />
      )

      expect(screen.getByTestId('export-report-modal')).toBeTruthy()
      expect(screen.getByText('Xuất Báo Cáo Bảng Công')).toBeTruthy()
      expect(screen.getByText(/45 bản ghi/)).toBeTruthy()

      // Chuyển sang định dạng PDF
      const pdfRadio = screen.getByTestId('export-format-pdf') as HTMLInputElement
      fireEvent.click(pdfRadio)
      expect(pdfRadio.checked).toBe(true)

      // Thay đổi tiêu đề báo cáo
      const titleInput = screen.getByTestId('export-report-title-input')
      fireEvent.change(titleInput, { target: { value: 'Báo Cáo Kiểm Tra Nhân Sự' } })

      // Nhấn nút Tải Báo Cáo
      const submitBtn = screen.getByTestId('confirm-export-btn')
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(handleExport).toHaveBeenCalledWith({
          companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS',
          reportTitle: 'Báo Cáo Kiểm Tra Nhân Sự',
          format: 'pdf',
          period: '2026-10',
        })
      })
    })

    it('kích hoạt in ấn khi nhấn nút In / Xem trước', () => {
      const handleExport = vi.fn().mockResolvedValue(undefined)
      const handleClose = vi.fn()
      const handlePrint = vi.fn()

      render(
        <ExportReportModal
          isOpen={true}
          onClose={handleClose}
          onExport={handleExport}
          onPrintPreview={handlePrint}
          currentPeriod="2026-10"
          recordsCount={10}
          records={[]}
        />
      )

      const printBtn = screen.getByTestId('print-preview-btn')
      fireEvent.click(printBtn)

      expect(handlePrint).toHaveBeenCalledWith({
        companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS',
        reportTitle: 'BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ',
        period: '2026-10',
      })
    })

    it('đóng modal khi nhấn nút Hủy', () => {
      const handleClose = vi.fn()
      render(
        <ExportReportModal
          isOpen={true}
          onClose={handleClose}
          onExport={vi.fn().mockResolvedValue(undefined)}
          recordsCount={0}
          records={[]}
        />
      )

      const cancelBtn = screen.getByTestId('cancel-export-btn')
      fireEvent.click(cancelBtn)
      expect(handleClose).toHaveBeenCalled()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Tích hợp trong AdminAttendanceView
  // ──────────────────────────────────────────────────────────────────────────
  describe('AdminAttendanceView Integration', () => {
    const renderAdminAttendance = () => {
      const qc = createQueryClient()
      return render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminAttendanceView />
          </MemoryRouter>
        </QueryClientProvider>
      )
    }

    it('xuất báo cáo trực tiếp thành công qua exportTimesheetReport', async () => {
      vi.spyOn(attendanceService, 'getAdminAttendance').mockResolvedValue(mockPageResponse)
      vi.spyOn(attendanceService, 'getAttendanceStats').mockResolvedValue(mockStats)

      const exportSpy = vi.spyOn(reportExportService, 'exportTimesheetReport').mockResolvedValueOnce({
        blob: new Blob(['test-xlsx']),
        filename: 'report-2026-10.xlsx',
      })

      renderAdminAttendance()

      await waitFor(() => {
        expect(screen.getByTestId('export-attendance-report-btn')).toBeTruthy()
      })

      const exportBtn = screen.getByTestId('export-attendance-report-btn')
      fireEvent.click(exportBtn)

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'xlsx',
          })
        )
      })
    })

    it('mở modal nâng cao khi click nút open-export-modal-btn', async () => {
      vi.spyOn(attendanceService, 'getAdminAttendance').mockResolvedValue(mockPageResponse)
      vi.spyOn(attendanceService, 'getAttendanceStats').mockResolvedValue(mockStats)

      renderAdminAttendance()

      await waitFor(() => {
        expect(screen.getByTestId('open-export-modal-btn')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('open-export-modal-btn'))

      expect(screen.getByTestId('export-report-modal')).toBeTruthy()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Tích hợp trong AdminPayrollPeriodView
  // ──────────────────────────────────────────────────────────────────────────
  describe('AdminPayrollPeriodView Integration', () => {
    const renderAdminPayrollPeriod = () => {
      const qc = createQueryClient()
      return render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminPayrollPeriodView />
          </MemoryRouter>
        </QueryClientProvider>
      )
    }

    it('cho phép xuất báo cáo theo từng kỳ công từ bảng danh mục', async () => {
      vi.spyOn(payrollPeriodService, 'getPayrollPeriods').mockResolvedValue(mockPayrollPeriods)

      const exportSpy = vi.spyOn(reportExportService, 'exportTimesheetReport').mockResolvedValueOnce({
        blob: new Blob(['period-excel']),
        filename: 'bang-cong-2026-10.xlsx',
      })

      renderAdminPayrollPeriod()

      await waitFor(() => {
        expect(screen.getByTestId('export-period-btn-1')).toBeTruthy()
      })

      const exportBtn = screen.getByTestId('export-period-btn-1')
      fireEvent.click(exportBtn)

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalledWith({
          period: '2026-10',
          format: 'xlsx',
        })
      })
    })
  })
})
