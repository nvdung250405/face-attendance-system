/**
 * Test Suite: Lịch Chấm công Cá nhân & Xuất Báo Cáo
 * (TASK-WEB-012, BLD-WEB-008, UXD-WEB-005, UI-WEB-005, DD-WEB-017, TST-WEB-008).
 *
 * Kiểm định:
 * 1. Calendar Grid 7 cột (Thứ 2 -> Chủ Nhật) theo tiêu chuẩn UXD-WEB-005.
 * 2. Tô màu ô ngày phân biệt: Xanh lá (Đúng giờ), Vàng (Đi muộn), Xám (Nghỉ tuần).
 * 3. Mở và đóng Drawer chi tiết ngày 420px (3:25772).
 * 4. Xuất file CSV bảng công có phòng chống Formula Injection (DD-WEB-017).
 * 5. Điều hướng chuyển tháng/năm và hiển thị các thẻ tóm tắt KPI.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PersonalAttendanceCalendar } from '@/components/calendar/PersonalAttendanceCalendar'
import { AttendanceDayDetailDrawer } from '@/components/calendar/AttendanceDayDetailDrawer'
import {
  attendanceService,
  sanitizeFormulaValue,
} from '@/services/attendanceService'
import { useAuthStore } from '@/store/authStore'
import type { PersonalAttendanceResponse } from '@/types'

const mockPersonalData: PersonalAttendanceResponse = {
  month: 10,
  year: 2026,
  totalWorkDays: 22,
  totalOnTimeDays: 20,
  totalLateDays: 2,
  records: [
    {
      date: '2026-10-14',
      dayOfWeek: 'Thứ Tư',
      checkIn: '08:28:10',
      checkOut: '17:32:00',
      status: 'ON_TIME',
      workingHours: 8.0,
      lateMinutes: 0,
      shiftCode: 'CA_HANH_CHINH',
      verificationMethod: 'VERIFICATION_FACE',
      kioskId: 'KIOSK-HN-01',
    },
    {
      date: '2026-10-13',
      dayOfWeek: 'Thứ Ba',
      checkIn: '08:42:00',
      checkOut: '17:30:00',
      status: 'LATE',
      workingHours: 7.8,
      lateMinutes: 12,
      shiftCode: 'CA_HANH_CHINH',
      verificationMethod: 'VERIFICATION_FACE',
      kioskId: 'KIOSK-HN-01',
    },
    {
      date: '2026-10-11',
      dayOfWeek: 'Chủ Nhật',
      checkIn: null,
      checkOut: null,
      status: 'REST_DAY',
      workingHours: 0,
      lateMinutes: 0,
      shiftCode: 'CA_HANH_CHINH',
    },
    {
      date: '2026-10-05',
      dayOfWeek: 'Thứ Hai',
      checkIn: null,
      checkOut: null,
      status: 'ABSENT',
      workingHours: 0,
      lateMinutes: 0,
      shiftCode: 'CA_HANH_CHINH',
    },
  ],
}

describe('Lịch Chấm công Cá nhân & Xuất Báo Cáo (TASK-WEB-012)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    // Cấu hình AuthStore với nhân viên mẫu
    useAuthStore.setState({
      user: {
        id: 1042,
        employeeCode: 'NV-1042',
        fullName: 'Ngô Văn Dũng',
        email: 'dung.nv@company.com',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        department: 'Phòng Kỹ thuật',
        hasBiometric: true,
        hasPin: true,
      },
      isAuthenticated: true,
    })

    // Mock API getPersonalAttendance
    vi.spyOn(attendanceService, 'getPersonalAttendance').mockResolvedValue(mockPersonalData)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Calendar Grid 7 Cột & Điều Hướng (UXD-WEB-005, TST-WEB-008)', () => {
    it('render đầy đủ 7 tiêu đề cột thứ trong tuần từ Thứ 2 đến Chủ Nhật', async () => {
      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        expect(screen.getByTestId('personal-attendance-calendar')).toBeTruthy()
      })

      // Tiêu đề 7 thứ trong tuần
      expect(screen.getByText('Thứ 2')).toBeTruthy()
      expect(screen.getByText('Thứ 3')).toBeTruthy()
      expect(screen.getByText('Thứ 4')).toBeTruthy()
      expect(screen.getByText('Thứ 5')).toBeTruthy()
      expect(screen.getByText('Thứ 6')).toBeTruthy()
      expect(screen.getByText('Thứ 7')).toBeTruthy()
      expect(screen.getByText('Chủ Nhật')).toBeTruthy()
    })

    it('hiển thị đúng tiêu đề tháng và thanh tóm tắt chỉ số', async () => {
      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        expect(screen.getByText(/Bảng Công Cá Nhân Tháng 10\/2026/i)).toBeTruthy()
      })

      // KPI số ngày
      expect(screen.getByTestId('kpi-total-work-days').textContent).toBe('22')
      expect(screen.getByTestId('kpi-total-ontime-days').textContent).toBe('20')
      expect(screen.getByTestId('kpi-total-late-days').textContent).toBe('2')
    })

    it('cho phép chuyển sang tháng tiếp theo và tháng trước đó', async () => {
      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        expect(screen.getByText(/Tháng 10\/2026/i)).toBeTruthy()
      })

      // Click nút Tháng sau (Next Month)
      const nextBtn = screen.getByTestId('calendar-next-month-btn')
      fireEvent.click(nextBtn)

      await waitFor(() => {
        expect(screen.getByText(/Tháng 11\/2026/i)).toBeTruthy()
      })

      // Click nút Tháng trước 2 lần để về Tháng 9
      const prevBtn = screen.getByTestId('calendar-prev-month-btn')
      fireEvent.click(prevBtn)
      fireEvent.click(prevBtn)

      await waitFor(() => {
        expect(screen.getByText(/Tháng 9\/2026/i)).toBeTruthy()
      })
    })

    it('phân biệt trực quan màu sắc trạng thái các ô ngày (Đúng giờ, Đi muộn, Vắng mặt)', async () => {
      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        // Ô ngày 14/10: Đúng giờ (Xanh lá)
        expect(screen.getByTestId('cell-status-on-time')).toBeTruthy()
        // Ô ngày 13/10: Đi muộn (Vàng)
        expect(screen.getByTestId('cell-status-late')).toBeTruthy()
        expect(screen.getByText(/Muộn 12p/i)).toBeTruthy()
        // Ô ngày 05/10: Vắng mặt (Đỏ)
        expect(screen.getByTestId('cell-status-absent')).toBeTruthy()
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Drawer Chi Tiết Ngày 420px (3:25772, UXD-WEB-005)', () => {
    it('nhấp chuột vào ô ngày sẽ mở Drawer trượt từ bên phải 420px', async () => {
      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        expect(screen.getByTestId('calendar-day-cell-2026-10-14')).toBeTruthy()
      })

      // Click ô ngày 14/10
      const dayCell = screen.getByTestId('calendar-day-cell-2026-10-14')
      fireEvent.click(dayCell)

      // Drawer hiển thị
      const drawer = screen.getByTestId('attendance-day-detail-drawer')
      expect(drawer).toBeTruthy()

      // Kiểm tra thông tin trong Drawer
      expect(screen.getByText(/14\/10\/2026/i)).toBeTruthy()
      expect(screen.getByTestId('drawer-check-in-time').textContent).toBe('08:28:10')
      expect(screen.getByTestId('drawer-check-out-time').textContent).toBe('17:32:00')
      expect(screen.getByText(/KIOSK-HN-01/i)).toBeTruthy()
      expect(screen.getByText(/Khuôn mặt \(Face\)/i)).toBeTruthy()
    })

    it('hiển thị cảnh báo giải trình và nút nộp đơn khi ngày có đi muộn', async () => {
      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        expect(screen.getByTestId('calendar-day-cell-2026-10-13')).toBeTruthy()
      })

      // Click ô ngày 13/10 (Đi muộn 12 phút)
      const dayCell = screen.getByTestId('calendar-day-cell-2026-10-13')
      fireEvent.click(dayCell)

      expect(screen.getByText(/Cần giải trình công\?/i)).toBeTruthy()
      expect(screen.getByText(/\+12 phút/i)).toBeTruthy()
    })

    it('đóng Drawer khi bấm phím Escape hoặc nút đóng', async () => {
      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        expect(screen.getByTestId('calendar-day-cell-2026-10-14')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('calendar-day-cell-2026-10-14'))
      expect(screen.getByTestId('attendance-day-detail-drawer')).toBeTruthy()

      // Bấm nút đóng
      const closeBtn = screen.getByTestId('close-drawer-btn')
      fireEvent.click(closeBtn)

      expect(screen.queryByTestId('attendance-day-detail-drawer')).toBeNull()

      // Mở lại và test phím Escape
      fireEvent.click(screen.getByTestId('calendar-day-cell-2026-10-14'))
      expect(screen.getByTestId('attendance-day-detail-drawer')).toBeTruthy()

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(screen.queryByTestId('attendance-day-detail-drawer')).toBeNull()
    })

    it('AttendanceDayDetailDrawer hoạt động độc lập và gọi onOpenExcuseModal', () => {
      const handleExcuse = vi.fn()
      const handleClose = vi.fn()

      render(
        <AttendanceDayDetailDrawer
          isOpen={true}
          onClose={handleClose}
          record={mockPersonalData.records[1]} // ngày 13/10 đi muộn
          onOpenExcuseModal={handleExcuse}
        />
      )

      expect(screen.getByTestId('attendance-day-detail-drawer')).toBeTruthy()
      const excuseBtn = screen.getByTestId('open-excuse-btn')
      fireEvent.click(excuseBtn)

      expect(handleExcuse).toHaveBeenCalledWith('2026-10-13')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Xuất Báo Cáo CSV & Phòng Chống Formula Injection (DD-WEB-017)', () => {
    it('sanitizeFormulaValue khử các ký tự nguy hiểm (=, +, -, @) bằng dấu nháy đơn', () => {
      // Công thức nguy hiểm
      expect(sanitizeFormulaValue('=cmd|\'/C calc\'!A0')).toBe('\'=cmd|\'/C calc\'!A0')
      expect(sanitizeFormulaValue('@SUM(1,2)')).toBe('\'@SUM(1,2)')
      expect(sanitizeFormulaValue('+12345')).toBe('\'+12345')
      expect(sanitizeFormulaValue('-67890')).toBe('\'-67890')

      // Dữ liệu văn bản bình thường không bị ảnh hưởng
      expect(sanitizeFormulaValue('Ngô Văn Dũng')).toBe('Ngô Văn Dũng')
      expect(sanitizeFormulaValue('08:30:00')).toBe('08:30:00')
      expect(sanitizeFormulaValue(null)).toBe('')
      expect(sanitizeFormulaValue(undefined)).toBe('')
    })

    it('exportPersonalAttendanceCsv tạo nội dung CSV có UTF-8 BOM và dữ liệu được làm sạch', () => {
      const maliciousRecords = [
        {
          date: '2026-10-15',
          dayOfWeek: 'Thứ Năm',
          checkIn: '=1+1', // Formula
          checkOut: '17:30:00',
          status: 'ON_TIME',
          workingHours: 8,
          shiftCode: '@MALICIOUS_SHIFT', // Formula
        },
      ]

      const csv = attendanceService.exportPersonalAttendanceCsv(
        10,
        2026,
        maliciousRecords,
        {
          fullName: '=Ngô Văn Dũng',
          employeeCode: '+NV-1042',
          department: '-Phòng IT',
        }
      )

      // Có chứa UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn
      expect(csv.startsWith('\uFEFF')).toBe(true)

      // Các trường có ký tự nguy hiểm đã được làm sạch
      expect(csv).toContain('\'=1+1')
      expect(csv).toContain('\'@MALICIOUS_SHIFT')
      expect(csv).toContain('\'=Ngô Văn Dũng')
      expect(csv).toContain('\'+NV-1042')
      expect(csv).toContain('\'-Phòng IT')
    })

    it('click nút Xuất Báo Cáo kích hoạt callback onExport hoặc hàm xuất service', async () => {
      const onExportMock = vi.fn()
      render(
        <PersonalAttendanceCalendar
          initialMonth={10}
          initialYear={2026}
          onExport={onExportMock}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('calendar-export-csv-btn')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('calendar-export-csv-btn'))
      expect(onExportMock).toHaveBeenCalledWith(10, 2026)
    })
  })
})
