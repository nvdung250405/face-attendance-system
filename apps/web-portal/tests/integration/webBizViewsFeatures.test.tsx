/**
 * Test Suite: Web Portal Business Workflows and Responsive Views
 * (RCT-01, BIZ-01, RFC-02, BIZ-02, FINDING-A11Y-007, BIZ-03, BIZ-04)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { isOvernightShift } from '@/utils/date'
import { ShiftCatalogTable } from '@/components/shift/ShiftCatalogTable'
import { AttendanceStatusBadge } from '@/components/attendance/AttendanceStatusBadge'
import { BulkAdjustAttendanceModal } from '@/components/attendance/BulkAdjustAttendanceModal'
import { AdjustAttendanceModal } from '@/components/attendance/AdjustAttendanceModal'
import { AuditDiffModal } from '@/components/compliance/AuditDiffModal'
import { ConsentWithdrawalModal } from '@/components/consent/ConsentWithdrawalModal'
import { PersonalAttendanceCalendar } from '@/components/calendar/PersonalAttendanceCalendar'
import { attendanceService } from '@/services/attendanceService'
import { useAuthStore } from '@/store/authStore'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import type { AttendanceRecord, ShiftItem, AuditLogItem } from '@/types'

vi.mock('@/services/attendanceService', () => ({
  attendanceService: {
    getAdminAttendance: vi.fn(),
    getAttendanceStats: vi.fn(),
    adjustAttendance: vi.fn(),
    getPersonalAttendance: vi.fn(),
    exportPersonalAttendanceCsv: vi.fn(),
  },
  sanitizeFormula: vi.fn((x) => x),
}))

describe('Web Portal Business Workflows and Responsive Views Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePayrollPeriodStore.setState({
      periods: [
        {
          id: 1,
          periodYear: 2026,
          periodMonth: 10,
          status: 'OPEN',
          createdAt: '2026-10-01T00:00:00Z',
        },
      ],
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('1. BIZ-02 (Overnight Shift Representation)', () => {
    it('nhận diện chính xác ca làm việc qua đêm khi endTime < startTime', () => {
      expect(isOvernightShift('22:00', '06:00')).toBe(true)
      expect(isOvernightShift('23:00', '07:30')).toBe(true)
      expect(isOvernightShift('08:00', '17:00')).toBe(false)
      expect(isOvernightShift('06:00', '14:00')).toBe(false)
      expect(isOvernightShift(undefined, '06:00')).toBe(false)
    })

    it('hiển thị huy hiệu "+1 ngày" trong ShiftCatalogTable khi ca vắt qua nửa đêm', () => {
      const mockShifts: ShiftItem[] = [
        {
          id: 1,
          shiftCode: 'CA_NGAY',
          name: 'Ca Ngày Chuẩn',
          shiftName: 'Ca Ngày Chuẩn',
          startTime: '08:00',
          endTime: '17:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
        {
          id: 2,
          shiftCode: 'CA_DEM',
          name: 'Ca Đêm Vắt Ngày',
          shiftName: 'Ca Đêm Vắt Ngày',
          startTime: '22:00',
          endTime: '06:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
      ]

      render(
        <ShiftCatalogTable
          shifts={mockShifts}
          isLoadingShifts={false}
          isAdjustmentLocked={false}
          onEditShift={vi.fn()}
          onToggleShiftActive={vi.fn()}
        />
      )

      expect(screen.queryByTestId('overnight-badge-1')).toBeNull()
      expect(screen.getByTestId('overnight-badge-2')).toBeTruthy()
      expect(screen.getByTestId('overnight-badge-2').textContent).toBe('+1 ngày')
    })

    it('hiển thị huy hiệu "+1 ngày" trong AttendanceStatusBadge khi có cờ isOvernight hoặc giờ qua đêm', () => {
      const { rerender } = render(
        <AttendanceStatusBadge status="ON_TIME" isOvernight />
      )
      expect(screen.getByTestId('overnight-badge')).toBeTruthy()
      expect(screen.getByTestId('overnight-badge').textContent).toBe('+1 ngày')

      rerender(
        <AttendanceStatusBadge status="ON_TIME" startTime="22:00" endTime="06:00" />
      )
      expect(screen.getByTestId('overnight-badge')).toBeTruthy()

      rerender(
        <AttendanceStatusBadge status="ON_TIME" startTime="08:00" endTime="17:00" />
      )
      expect(screen.queryByTestId('overnight-badge')).toBeNull()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('2. BIZ-01 & RFC-02 (Bulk Adjustments & Field Errors)', () => {
    const mockRecords: AttendanceRecord[] = [
      {
        recordId: 101,
        employeeId: 1,
        employeeCode: 'NV-001',
        fullName: 'Nguyễn Văn A',
        department: 'Kỹ thuật',
        punchTimestamp: '2026-10-15T08:45:00.000Z',
        punchType: 'CHECK_IN',
        verificationMethod: 'FALLBACK_PIN',
        status: 'LATE',
        lateMinutes: 15,
        kioskId: 'KIOSK-01',
      },
      {
        recordId: 102,
        employeeId: 2,
        employeeCode: 'NV-002',
        fullName: 'Trần Thị B',
        department: 'Nhân sự',
        punchTimestamp: '2026-10-15T08:50:00.000Z',
        punchType: 'CHECK_IN',
        verificationMethod: 'FALLBACK_PIN',
        status: 'LATE',
        lateMinutes: 20,
        kioskId: 'KIOSK-01',
      },
    ]

    it('yêu cầu lý do giải trình ít nhất 10 ký tự trong BulkAdjustAttendanceModal', async () => {
      render(
        <BulkAdjustAttendanceModal
          isOpen={true}
          selectedRecords={mockRecords}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      )

      expect(screen.getByText(/Chỉnh Sửa Điểm Danh Hàng Loạt/i)).toBeTruthy()
      const submitBtn = screen.getByTestId('submit-bulk-adjust-btn') as HTMLButtonElement
      expect(submitBtn.disabled).toBe(true)

      const reasonInput = screen.getByTestId('bulk-justification-input')
      // Nhập dưới 10 ký tự
      fireEvent.change(reasonInput, { target: { value: 'Sự cố' } })
      expect(submitBtn.disabled).toBe(true)

      // Nhập >= 10 ký tự
      fireEvent.change(reasonInput, { target: { value: 'Sự cố mất điện trạm Kiosk số 1' } })
      expect(submitBtn.disabled).toBe(false)
    })

    it('thực hiện gọi adjustAttendance với mã lý do chuẩn hóa cho từng bản ghi được chọn', async () => {
      vi.mocked(attendanceService.adjustAttendance).mockResolvedValue({} as AttendanceRecord)
      const mockSuccess = vi.fn()
      const mockClose = vi.fn()

      render(
        <BulkAdjustAttendanceModal
          isOpen={true}
          selectedRecords={mockRecords}
          onClose={mockClose}
          onSuccess={mockSuccess}
        />
      )

      // Chọn mã lý do
      fireEvent.change(screen.getByTestId('bulk-reason-code-select'), {
        target: { value: 'DEVICE_OFFLINE' },
      })
      // Chọn trạng thái áp dụng
      fireEvent.change(screen.getByTestId('bulk-target-status-select'), {
        target: { value: 'ON_TIME' },
      })
      // Nhập giải trình >= 10 ký tự
      fireEvent.change(screen.getByTestId('bulk-justification-input'), {
        target: { value: 'Trạm Kiosk ngoại tuyến do đứt cáp mạng nội bộ' },
      })

      fireEvent.click(screen.getByTestId('submit-bulk-adjust-btn'))

      await waitFor(() => {
        expect(attendanceService.adjustAttendance).toHaveBeenCalledTimes(2)
        expect(attendanceService.adjustAttendance).toHaveBeenCalledWith(
          101,
          expect.objectContaining({
            status: 'ON_TIME',
            reason: '[DEVICE_OFFLINE] Trạm Kiosk ngoại tuyến do đứt cáp mạng nội bộ',
          })
        )
        expect(attendanceService.adjustAttendance).toHaveBeenCalledWith(
          102,
          expect.objectContaining({
            status: 'ON_TIME',
            reason: '[DEVICE_OFFLINE] Trạm Kiosk ngoại tuyến do đứt cáp mạng nội bộ',
          })
        )
      })
    })

    it('ràng buộc fieldErrors từ normalizeApiError và yêu cầu tối thiểu 10 ký tự trong AdjustAttendanceModal', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            code: 'VALIDATION_FAILED',
            message: 'Dữ liệu không hợp lệ',
            invalidParams: [
              { field: 'reason', reason: 'Lý do giải trình không đạt yêu cầu kiểm toán' },
            ],
          },
        },
      }
      vi.mocked(attendanceService.adjustAttendance).mockRejectedValueOnce(axiosError)

      render(
        <AdjustAttendanceModal
          isOpen={true}
          record={mockRecords[0]}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      )

      const reasonInput = screen.getByTestId('adjust-reason-input')
      const submitBtn = screen.getByTestId('submit-adjust-btn') as HTMLButtonElement

      // Dưới 10 ký tự: nút bị khóa
      fireEvent.change(reasonInput, { target: { value: 'Quên chấm' } })
      expect(submitBtn.disabled).toBe(true)

      // >= 10 ký tự
      fireEvent.change(reasonInput, { target: { value: 'Quên quẹt thẻ do vào họp gấp lúc sáng' } })
      expect(submitBtn.disabled).toBe(false)

      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Lý do giải trình không đạt yêu cầu kiểm toán')).toBeTruthy()
        expect(reasonInput.getAttribute('aria-invalid')).toBe('true')
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('3. FINDING-A11Y-007 (Mobile Calendar Reflow & Agenda Toggle)', () => {
    it('cho phép chuyển đổi giữa chế độ xem Grid và Agenda', async () => {
      vi.mocked(attendanceService.getPersonalAttendance).mockResolvedValueOnce({
        month: 10,
        year: 2026,
        totalWorkDays: 1,
        totalOnTimeDays: 1,
        totalLateDays: 0,
        records: [
          {
            date: '2026-10-15',
            status: 'ON_TIME',
            checkIn: '08:30:00',
            checkOut: '17:30:00',
          },
        ],
      })

      render(<PersonalAttendanceCalendar initialMonth={10} initialYear={2026} />)

      await waitFor(() => {
        expect(screen.getByTestId('calendar-grid-cells')).toBeTruthy()
      })

      // Chuyển sang Agenda
      fireEvent.click(screen.getByTestId('calendar-view-agenda-btn'))
      expect(screen.getByTestId('calendar-agenda-view')).toBeTruthy()

      // Chuyển lại Grid
      fireEvent.click(screen.getByTestId('calendar-view-grid-btn'))
      expect(screen.getByTestId('calendar-grid-cells')).toBeTruthy()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('4. BIZ-03 (Structured Audit Diff Modal)', () => {
    it('hiển thị bảng so sánh đối chiếu có cấu trúc cho các trường thêm mới, xóa và thay đổi', () => {
      const mockLog: AuditLogItem = {
        id: 999,
        action: 'UPDATE_SHIFT',
        actorEmail: 'admin@fas.vn',
        targetResource: 'Shift #1',
        createdAt: '2026-10-15T10:00:00Z',
        oldValues: {
          startTime: '08:00',
          gracePeriod: 15,
          deprecatedNote: 'Ghi chú cũ',
        },
        newValues: {
          startTime: '08:30',
          gracePeriod: 15,
          newPolicy: 'Chính sách mới',
        },
      }

      render(<AuditDiffModal selectedLogDetail={mockLog} onClose={vi.fn()} />)

      expect(screen.getByTestId('audit-diff-table')).toBeTruthy()
      expect(screen.getByTestId('diff-row-startTime')).toBeTruthy()
      expect(screen.getByTestId('diff-row-deprecatedNote')).toBeTruthy()
      expect(screen.getByTestId('diff-row-newPolicy')).toBeTruthy()

      // Hiển thị phân loại
      expect(screen.getByText('Đã xóa')).toBeTruthy()
      expect(screen.getByText('Thêm mới')).toBeTruthy()
      expect(screen.getByText('Thay đổi')).toBeTruthy()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('5. BIZ-04 (Consent Withdrawal PIN Guard)', () => {
    it('hiển thị cảnh báo thiếu PIN khi user.hasPin là false', () => {
      useAuthStore.setState({
        user: {
          id: 1,
          employeeCode: 'NV-001',
          fullName: 'Nguyễn Văn A',
          email: 'a@fas.vn',
          department: 'Engineering',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasBiometric: true,
          hasPin: false, // CHƯA CÓ PIN
        },
        isAuthenticated: true,
      })

      render(<ConsentWithdrawalModal isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByTestId('missing-pin-warning')).toBeTruthy()
      expect(screen.getByText(/Bạn chưa thiết lập mã PIN dự phòng/i)).toBeTruthy()
    })

    it('không hiển thị cảnh báo thiếu PIN khi user.hasPin là true', () => {
      useAuthStore.setState({
        user: {
          id: 1,
          employeeCode: 'NV-001',
          fullName: 'Nguyễn Văn A',
          email: 'a@fas.vn',
          department: 'Engineering',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasBiometric: true,
          hasPin: true, // ĐÃ CÓ PIN
        },
        isAuthenticated: true,
      })

      render(<ConsentWithdrawalModal isOpen={true} onClose={vi.fn()} />)

      expect(screen.queryByTestId('missing-pin-warning')).toBeNull()
    })
  })
})
