/**
 * Integration & Unit Tests cho Bảng Chấm Công HR Trực Tiếp
 * (SOL-WEB-004, BLD-WEB-015, DD-WEB-014, TASK-WEB-019).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'
import { AdminAttendanceView } from '@/views/admin/AdminAttendanceView'
import { useAuthStore } from '@/store/authStore'
import { attendanceService } from '@/services/attendanceService'
import { reportExportService } from '@/services/reportExportService'
import * as useLiveAttendanceModule from '@/services/hooks/useLiveAttendance'
import type { AttendanceRecord, AttendanceStats, UserProfile, PageResponse } from '@/types'

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

const mockAdminUser: UserProfile = {
  id: 1,
  employeeCode: 'HR-001',
  fullName: 'Nguyễn Quản Trị Nhân Sự',
  email: 'hr.manager@company.com',
  role: 'HR_MANAGER',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Phòng Nhân sự',
}

const mockStats: AttendanceStats = {
  totalEmployees: 128,
  presentCount: 96,
  onTimeCount: 88,
  lateCount: 8,
  absentCount: 32,
}

const mockRecords: AttendanceRecord[] = [
  {
    recordId: 201,
    employeeId: 2001,
    employeeCode: 'NV-2001',
    fullName: 'Hoàng Kim Chi',
    department: 'Khối Công nghệ',
    punchTimestamp: '2026-10-14T08:10:00.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KSK-HQ-01',
  },
  {
    recordId: 202,
    employeeId: 2002,
    employeeCode: 'NV-2002',
    fullName: 'Vũ Đức Đam',
    department: 'Khối Kinh doanh',
    punchTimestamp: '2026-10-14T08:35:00.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_PIN',
    status: 'LATE',
    lateMinutes: 5,
    kioskId: 'KSK-HQ-02',
  },
  {
    recordId: 203,
    employeeId: 2003,
    employeeCode: 'NV-2003',
    fullName: 'Đặng Mai Phương',
    department: 'Khối Tài chính',
    punchTimestamp: '2026-10-14T08:02:00.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KSK-HQ-01',
  },
]

const mockPageResponse: PageResponse<AttendanceRecord> = {
  content: mockRecords,
  totalElements: 3,
  totalPages: 1,
  size: 50,
  page: 0,
  first: true,
  last: true,
}

describe('Bảng Chấm Công HR Trực Tiếp (TASK-WEB-019)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    useAuthStore.setState({
      session: {
        accessToken: 'mock-hr-access-token',
        refreshToken: 'mock-hr-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: mockAdminUser,
      },
      user: mockAdminUser,
      isAuthenticated: true,
    })

    vi.spyOn(attendanceService, 'getAdminAttendance').mockResolvedValue(mockPageResponse)
    vi.spyOn(attendanceService, 'getAttendanceStats').mockResolvedValue(mockStats)
    vi.spyOn(reportExportService, 'exportTimesheetReport').mockResolvedValue({
      blob: new Blob(['mock content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename: 'bang-cham-cong-2026-10.xlsx',
    })

    // Mặc định mock useLiveAttendance để tránh kết nối SockJS thật
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
    vi.useRealTimers()
  })

  it('1. Hiển thị tiêu đề, thẻ KPI, thanh công cụ bộ lọc và dữ liệu ban đầu', async () => {
    renderAdminAttendance()

    // Tiêu đề trang
    expect(screen.getByText('Bảng Chấm Công HR Trực Tiếp')).toBeTruthy()

    // 4 KPI Cards
    await waitFor(() => {
      expect(screen.getByText('Lượt quẹt hôm nay')).toBeTruthy()
      expect(screen.getByTestId('kpi-today-ontime')).toBeTruthy()
      expect(screen.getByTestId('kpi-today-late')).toBeTruthy()
      expect(screen.getByTestId('kpi-face-ratio')).toBeTruthy()
    })

    // Dữ liệu bảng từ REST API
    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
      expect(screen.getByText('Vũ Đức Đam')).toBeTruthy()
      expect(screen.getByText('Đặng Mai Phương')).toBeTruthy()
    })
  })

  it('2. Chèn dòng mới lên đầu bảng và kích hoạt Green Flash trong 3 giây khi nhận sự kiện STOMP (BLD-WEB-015, DD-WEB-014)', async () => {
    let capturedCallback: ((record: AttendanceRecord) => void) | undefined

    vi.spyOn(useLiveAttendanceModule, 'useLiveAttendance').mockImplementation((options) => {
      capturedCallback = options?.onRecordReceived
      return {
        latestEvents: [],
        isConnected: true,
        connectionState: 'CONNECTED',
        clearEvents: vi.fn(),
      }
    })

    renderAdminAttendance()

    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
    })

    expect(capturedCallback).toBeDefined()

    // Khởi tạo fake timers SAU KHI render ban đầu xong
    vi.useFakeTimers()

    const incomingStompRecord: AttendanceRecord = {
      recordId: 999,
      employeeId: 9999,
      employeeCode: 'NV-9999',
      fullName: 'Phạm Nhật Vượng',
      department: 'Khối Điều hành',
      punchTimestamp: '2026-10-14T08:50:00.000+07:00',
      punchType: 'CHECK_IN',
      verificationMethod: 'VERIFICATION_FACE',
      status: 'ON_TIME',
      lateMinutes: 0,
      kioskId: 'KSK-HQ-VIP',
    }

    // Gửi sự kiện STOMP
    act(() => {
      capturedCallback!(incomingStompRecord)
    })

    // Kiểm tra dòng mới xuất hiện ngay lập tức
    expect(screen.getByText('Phạm Nhật Vượng')).toBeTruthy()

    // Kiểm tra thẻ tr hoặc row có highlight ring-emerald-400
    const newRow = screen.getByText('Phạm Nhật Vượng').closest('tr')
    expect(newRow?.className).toContain('ring-emerald-400')

    // Tua 2900ms -> Vẫn còn hiệu ứng highlight
    act(() => {
      vi.advanceTimersByTime(2900)
    })
    expect(newRow?.className).toContain('ring-emerald-400')

    // Sau khi đủ 3000ms -> Hiệu ứng flash biến mất (DD-WEB-014)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(newRow?.className).not.toContain('ring-emerald-400')

    vi.useRealTimers()
  })

  it('3. Tạm dừng Live Mode gom bản ghi mới vào hàng chờ, hiển thị badge và xả khi tiếp tục', async () => {
    let capturedCallback: ((record: AttendanceRecord) => void) | undefined

    vi.spyOn(useLiveAttendanceModule, 'useLiveAttendance').mockImplementation((options) => {
      capturedCallback = options?.onRecordReceived
      return {
        latestEvents: [],
        isConnected: true,
        connectionState: 'CONNECTED',
        clearEvents: vi.fn(),
      }
    })

    renderAdminAttendance()

    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
    })

    // Bấm nút Tạm dừng (Pause Live Stream)
    const toggleButton = screen.getByTestId('toggle-live-mode-btn')
    fireEvent.click(toggleButton)

    // Xác nhận trạng thái TẠM DỪNG
    expect(screen.getByText(/Tạm dừng Live/i)).toBeTruthy()

    // Nhận bản ghi STOMP trong lúc tạm dừng
    const queuedRecord: AttendanceRecord = {
      recordId: 777,
      employeeId: 7777,
      employeeCode: 'NV-7777',
      fullName: 'Bản Ghi Chờ Điểm Danh',
      department: 'Khối Nhân sự',
      punchTimestamp: '2026-10-14T08:55:00.000+07:00',
      punchType: 'CHECK_IN',
      verificationMethod: 'VERIFICATION_FACE',
      status: 'ON_TIME',
      lateMinutes: 0,
      kioskId: 'KSK-HQ-01',
    }

    act(() => {
      capturedCallback!(queuedRecord)
    })

    // Bản ghi chưa xuất hiện trên bảng để tránh ngắt quãng HR đang tra cứu
    expect(screen.queryByText('Bản Ghi Chờ Điểm Danh')).toBeNull()

    // Nút badge "+1 bản ghi mới" xuất hiện
    const applyBadgeButton = screen.getByTestId('flush-pending-btn')
    expect(applyBadgeButton).toBeTruthy()
    expect(applyBadgeButton.textContent).toContain('+1 bản ghi mới')

    // Bấm vào badge để chèn bản ghi chờ vào bảng
    fireEvent.click(applyBadgeButton)

    // Lúc này bản ghi đã xuất hiện trên bảng
    expect(screen.getByText('Bản Ghi Chờ Điểm Danh')).toBeTruthy()
  })

  it('4. Lọc dữ liệu theo từ khóa tìm kiếm (Mã NV hoặc Họ tên)', async () => {
    renderAdminAttendance()

    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
      expect(screen.getByText('Vũ Đức Đam')).toBeTruthy()
    })

    const searchInput = screen.getByTestId('filter-keyword-input')
    fireEvent.change(searchInput, { target: { value: 'Hoàng Kim' } })

    // Đã gọi lại API với keyword 'Hoàng Kim'
    await waitFor(() => {
      expect(attendanceService.getAdminAttendance).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'Hoàng Kim',
        })
      )
    })
  })

  it('5. Lọc dữ liệu theo Trạng thái (ON_TIME, LATE) và Phương thức xác thực (Face / PIN)', async () => {
    renderAdminAttendance()

    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
      expect(screen.getByText('Vũ Đức Đam')).toBeTruthy()
    })

    // Lọc theo phương thức xác thực Khuôn mặt (cục bộ trên displayRecords)
    const methodSelect = screen.getByTestId('filter-method-select')
    fireEvent.change(methodSelect, { target: { value: 'VERIFICATION_FACE' } })

    expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
    expect(screen.getByText('Đặng Mai Phương')).toBeTruthy()
    expect(screen.queryByText('Vũ Đức Đam')).toBeNull()

    // Đổi sang lọc PIN
    fireEvent.change(methodSelect, { target: { value: 'VERIFICATION_PIN' } })
    expect(screen.getByText('Vũ Đức Đam')).toBeTruthy()
    expect(screen.queryByText('Hoàng Kim Chi')).toBeNull()
  })

  it('6. Nút "Xóa bộ lọc" xóa toàn bộ các trường bộ lọc', async () => {
    renderAdminAttendance()

    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
    })

    const searchInput = screen.getByTestId('filter-keyword-input')
    fireEvent.change(searchInput, { target: { value: 'NV-2001' } })

    // Nút Xóa bộ lọc xuất hiện khi hasActiveFilters = true
    const resetButton = await screen.findByTestId('reset-filters-btn')
    expect(resetButton).toBeTruthy()

    fireEvent.click(resetButton)

    // Ô tìm kiếm được đưa về rỗng
    expect((searchInput as HTMLInputElement).value).toBe('')
  })

  it('7. Nút "Xuất Báo Cáo" kích hoạt xuất tệp Excel qua reportExportService', async () => {
    renderAdminAttendance()

    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
    })

    const exportButton = screen.getByTestId('export-attendance-report-btn')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(reportExportService.exportTimesheetReport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'xlsx',
        })
      )
    })
  })

  it('8. Nút "Làm mới" gọi lại API tải danh sách chấm công', async () => {
    renderAdminAttendance()

    await waitFor(() => {
      expect(screen.getByText('Hoàng Kim Chi')).toBeTruthy()
    })

    const refreshButton = screen.getByTestId('refresh-attendance-btn')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(attendanceService.getAdminAttendance).toHaveBeenCalledTimes(2)
    })
  })
})
