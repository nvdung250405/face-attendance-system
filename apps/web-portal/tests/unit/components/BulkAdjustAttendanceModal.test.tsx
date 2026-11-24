/**
 * Unit Tests cho BulkAdjustAttendanceModal (F-SPEC-01)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BulkAdjustAttendanceModal } from '@/components/attendance/BulkAdjustAttendanceModal'
import { attendanceService } from '@/services/attendanceService'
import type { AttendanceRecord } from '@/types'

vi.mock('@/services/attendanceService', () => ({
  attendanceService: {
    adjustAttendance: vi.fn(),
  },
}))

describe('BulkAdjustAttendanceModal (F-SPEC-01 Resilient Bulk Processing)', () => {
  const mockRecords: AttendanceRecord[] = [
    {
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
    },
    {
      recordId: 102,
      employeeId: 2,
      employeeCode: 'NV-002',
      fullName: 'Trần Thị B',
      department: 'Phòng Nhân sự',
      punchTimestamp: '2026-10-15T08:50:00.000Z',
      punchType: 'CHECK_IN',
      verificationMethod: 'VERIFICATION_FACE',
      status: 'LATE',
      lateMinutes: 20,
      kioskId: 'KIOSK-01',
    },
    {
      recordId: 103,
      employeeId: 3,
      employeeCode: 'NV-003',
      fullName: 'Lê Văn C',
      department: 'Phòng Kế toán',
      punchTimestamp: '2026-10-15T08:55:00.000Z',
      punchType: 'CHECK_IN',
      verificationMethod: 'VERIFICATION_FACE',
      status: 'LATE',
      lateMinutes: 25,
      kioskId: 'KIOSK-01',
    },
    {
      recordId: 104,
      employeeId: 4,
      employeeCode: 'NV-004',
      fullName: 'Phạm Thị D',
      department: 'Phòng Kinh doanh',
      punchTimestamp: '2026-10-15T09:00:00.000Z',
      punchType: 'CHECK_IN',
      verificationMethod: 'VERIFICATION_FACE',
      status: 'LATE',
      lateMinutes: 30,
      kioskId: 'KIOSK-01',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('xử lý tất cả thành công: gọi onSuccess và onClose', async () => {
    vi.mocked(attendanceService.adjustAttendance).mockResolvedValue({} as AttendanceRecord)
    const mockSuccess = vi.fn()
    const mockClose = vi.fn()

    render(
      <BulkAdjustAttendanceModal
        isOpen={true}
        onClose={mockClose}
        selectedRecords={mockRecords}
        onSuccess={mockSuccess}
      />
    )

    fireEvent.change(screen.getByTestId('bulk-justification-input'), {
      target: { value: 'Giải trình sự cố mất điện toàn nhà máy' },
    })

    fireEvent.click(screen.getByTestId('submit-bulk-adjust-btn'))

    await waitFor(() => {
      expect(attendanceService.adjustAttendance).toHaveBeenCalledTimes(4)
      expect(mockSuccess).toHaveBeenCalled()
      expect(mockClose).toHaveBeenCalled()
    })
  })

  it('xử lý thất bại cục bộ: hiển thị breakdown lỗi và giữ lại chỉ các bản ghi bị lỗi để retry', async () => {
    // 101, 102, 104 thành công; 103 bị lỗi
    vi.mocked(attendanceService.adjustAttendance).mockImplementation(async (id) => {
      if (id === 103) {
        throw new Error('Bản ghi đã bị khóa bởi kỳ lương')
      }
      return {} as AttendanceRecord
    })

    const mockSuccess = vi.fn()
    const mockClose = vi.fn()

    render(
      <BulkAdjustAttendanceModal
        isOpen={true}
        onClose={mockClose}
        selectedRecords={mockRecords}
        onSuccess={mockSuccess}
      />
    )

    fireEvent.change(screen.getByTestId('bulk-justification-input'), {
      target: { value: 'Giải trình sự cố mất điện toàn nhà máy' },
    })

    fireEvent.click(screen.getByTestId('submit-bulk-adjust-btn'))

    await waitFor(() => {
      // Modal không đóng khi có lỗi cục bộ, nhưng gọi onSuccess để đồng bộ các bản ghi đã thành công
      expect(mockClose).not.toHaveBeenCalled()
      expect(mockSuccess).toHaveBeenCalledTimes(1)

      // Hiển thị breakdown lỗi
      expect(screen.getByTestId('bulk-failed-records-breakdown')).toBeTruthy()
      expect(screen.getByTestId('failed-record-item-103')).toBeTruthy()
      expect(screen.getByText(/Lê Văn C/)).toBeTruthy()
      expect(screen.getByText(/Bản ghi đã bị khóa bởi kỳ lương/)).toBeTruthy()

      // Nút submit cập nhật số lượng còn lại: chỉ còn 1 bản ghi lỗi
      expect(screen.getByTestId('submit-bulk-adjust-btn').textContent).toContain('Áp dụng cho 1 bản ghi')
    })
  })

  it('giữ nguyên danh sách lỗi retry khi selectedRecords thay đổi tham chiếu lúc modal đang mở (F-SPEC-01)', async () => {
    vi.mocked(attendanceService.adjustAttendance).mockImplementation(async (id) => {
      if (id === 103) {
        throw new Error('Bản ghi bị khóa')
      }
      return {} as AttendanceRecord
    })

    const mockSuccess = vi.fn()
    const mockClose = vi.fn()

    const { rerender } = render(
      <BulkAdjustAttendanceModal
        isOpen={true}
        onClose={mockClose}
        selectedRecords={mockRecords}
        onSuccess={mockSuccess}
      />
    )

    fireEvent.change(screen.getByTestId('bulk-justification-input'), {
      target: { value: 'Giải trình sự cố mất điện toàn nhà máy' },
    })
    fireEvent.click(screen.getByTestId('submit-bulk-adjust-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('bulk-failed-records-breakdown')).toBeTruthy()
      expect(screen.getByTestId('submit-bulk-adjust-btn').textContent).toContain('Áp dụng cho 1 bản ghi')
    })

    // Mô phỏng parent nhận STOMP event khiến selectedRecords có mảng tham chiếu mới (hoặc rỗng sau khi parent clear selection)
    rerender(
      <BulkAdjustAttendanceModal
        isOpen={true}
        onClose={mockClose}
        selectedRecords={[...mockRecords]}
        onSuccess={mockSuccess}
      />
    )

    // Trạng thái retry lỗi cục bộ vẫn được giữ nguyên
    expect(screen.getByTestId('bulk-failed-records-breakdown')).toBeTruthy()
    expect(screen.getByTestId('failed-record-item-103')).toBeTruthy()
    expect(screen.getByTestId('submit-bulk-adjust-btn').textContent).toContain('Áp dụng cho 1 bản ghi')
  })

  it('không gọi onSuccess nếu toàn bộ bản ghi đều thất bại', async () => {
    vi.mocked(attendanceService.adjustAttendance).mockRejectedValue(new Error('Lỗi hệ thống'))
    const mockSuccess = vi.fn()
    const mockClose = vi.fn()

    render(
      <BulkAdjustAttendanceModal
        isOpen={true}
        onClose={mockClose}
        selectedRecords={mockRecords}
        onSuccess={mockSuccess}
      />
    )

    fireEvent.change(screen.getByTestId('bulk-justification-input'), {
      target: { value: 'Giải trình sự cố mất điện toàn nhà máy' },
    })
    fireEvent.click(screen.getByTestId('submit-bulk-adjust-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('bulk-failed-records-breakdown')).toBeTruthy()
      expect(mockSuccess).not.toHaveBeenCalled()
      expect(mockClose).not.toHaveBeenCalled()
      expect(screen.getByTestId('submit-bulk-adjust-btn').textContent).toContain('Áp dụng cho 4 bản ghi')
    })
  })
})
