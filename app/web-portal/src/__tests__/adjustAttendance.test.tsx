import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdjustAttendanceModal } from '@/components/attendance/AdjustAttendanceModal'
import { attendanceService } from '@/services/attendanceService'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import type { AttendanceRecord } from '@/types'

vi.mock('@/services/attendanceService', () => ({
  attendanceService: {
    adjustAttendance: vi.fn(),
  },
}))

describe('AdjustAttendanceModal Component (API-BE-048, API-WEB-021)', () => {
  const mockRecord: AttendanceRecord = {
    recordId: 101,
    employeeId: 1,
    employeeCode: 'NV-001',
    fullName: 'Nguyễn Văn A',
    department: 'Phòng Kỹ thuật',
    punchTimestamp: '2026-10-15T08:45:00.000Z',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'LATE',
    lateMinutes: 15,
    kioskId: 'KIOSK-01',
  }

  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

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

  it('1. Hiển thị thông tin lượt quẹt và các trường chỉnh sửa khi mở modal', () => {
    render(
      <AdjustAttendanceModal
        isOpen={true}
        onClose={mockOnClose}
        record={mockRecord}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('Điều Chỉnh Giờ Công #101')).toBeTruthy()
    expect(screen.getByText('Nguyễn Văn A')).toBeTruthy()
    expect(screen.getByText('NV-001')).toBeTruthy()
    expect((screen.getByTestId('adjust-status-select') as HTMLSelectElement).value).toBe('LATE')
    expect((screen.getByTestId('late-minutes-input') as HTMLInputElement).value).toBe('15')
  })

  it('2. Báo lỗi và không submit khi để trống lý do điều chỉnh', async () => {
    render(
      <AdjustAttendanceModal
        isOpen={true}
        onClose={mockOnClose}
        record={mockRecord}
        onSuccess={mockOnSuccess}
      />
    )

    const submitBtn = screen.getByTestId('submit-adjust-btn') as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true) // Nút disabled khi reason trống
  })

  it('3. Gọi attendanceService.adjustAttendance thành công khi nhập đầy đủ thông tin', async () => {
    vi.mocked(attendanceService.adjustAttendance).mockResolvedValueOnce({
      ...mockRecord,
      status: 'ON_TIME',
      lateMinutes: 0,
    })

    render(
      <AdjustAttendanceModal
        isOpen={true}
        onClose={mockOnClose}
        record={mockRecord}
        onSuccess={mockOnSuccess}
      />
    )

    // Đổi trạng thái sang ON_TIME
    fireEvent.change(screen.getByTestId('adjust-status-select'), {
      target: { value: 'ON_TIME' },
    })

    // Nhập lý do điều chỉnh
    fireEvent.change(screen.getByTestId('adjust-reason-input'), {
      target: { value: 'Nhân viên có mặt đúng giờ nhưng camera Kiosk nhận diện chậm' },
    })

    const submitBtn = screen.getByTestId('submit-adjust-btn') as HTMLButtonElement
    expect(submitBtn.disabled).toBe(false)
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(attendanceService.adjustAttendance).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          status: 'ON_TIME',
          lateMinutes: 0,
          reason: 'Nhân viên có mặt đúng giờ nhưng camera Kiosk nhận diện chậm',
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Điều chỉnh giờ công thành công!')).toBeTruthy()
    })
  })

  it('4. Khóa form và cảnh báo khi kỳ công của ngày điểm danh đã bị LOCKED', () => {
    // Đặt kỳ công 2026-10 thành LOCKED
    usePayrollPeriodStore.setState({
      periods: [
        {
          id: 1,
          periodYear: 2026,
          periodMonth: 10,
          status: 'LOCKED',
          createdAt: '2026-10-01T00:00:00Z',
        },
      ],
    })

    render(
      <AdjustAttendanceModal
        isOpen={true}
        onClose={mockOnClose}
        record={mockRecord}
        onSuccess={mockOnSuccess}
      />
    )

    expect(
      screen.getByText('Kỳ công của ngày này đã bị CHỐT (LOCKED)')
    ).toBeTruthy()

    expect((screen.getByTestId('punch-datetime-input') as HTMLInputElement).disabled).toBe(true)
    expect((screen.getByTestId('adjust-status-select') as HTMLSelectElement).disabled).toBe(true)
    expect((screen.getByTestId('submit-adjust-btn') as HTMLButtonElement).disabled).toBe(true)
  })
})
