/**
 * Integration & Unit Tests cho Bảng Điều Khiển Chấm Công Trực Tiếp & Thẻ KPI
 * (UXD-WEB-003, UXD-WEB-004, UI-WEB-003, DD-WEB-007, DD-WEB-014, BLD-WEB-006, TASK-WEB-010).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'
import { KpiCardsGrid } from '@/components/dashboard/KpiCardsGrid'
import { LiveAttendanceTable } from '@/components/dashboard/LiveAttendanceTable'
import { AdminDashboardView } from '@/views/admin/AdminDashboardView'
import { useAuthStore } from '@/store/authStore'
import { attendanceService } from '@/services/attendanceService'
import * as useLiveAttendanceModule from '@/services/hooks/useLiveAttendance'
import type { AttendanceRecord, AttendanceStats, UserProfile } from '@/types'

const renderAdminDashboard = () => {
  const qc = createQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminDashboardView />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockAdminUser: UserProfile = {
  id: 1,
  employeeCode: 'ADM-001',
  fullName: 'Quản trị viên Nhân sự',
  email: 'hr.admin@company.com',
  role: 'HR_MANAGER',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Phòng Nhân sự',
}

const mockStats: AttendanceStats = {
  totalEmployees: 120,
  presentCount: 100,
  onTimeCount: 92,
  lateCount: 8,
  absentCount: 20,
}

const mockRecords: AttendanceRecord[] = [
  {
    recordId: 101,
    employeeId: 1001,
    employeeCode: 'NV-1001',
    fullName: 'Trần Văn An',
    department: 'Khối Công nghệ',
    punchTimestamp: '2026-10-14T08:15:30.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KSK-HQ-01',
  },
  {
    recordId: 102,
    employeeId: 1002,
    employeeCode: 'NV-1002',
    fullName: 'Lê Thị Bích',
    department: 'Khối Kinh doanh',
    punchTimestamp: '2026-10-14T08:35:10.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_PIN',
    status: 'LATE',
    lateMinutes: 5,
    kioskId: 'KSK-HQ-02',
  },
  {
    recordId: 103,
    employeeId: 1003,
    employeeCode: 'NV-1003',
    fullName: 'Phạm Minh Châu',
    department: 'Khối Tài chính',
    punchTimestamp: '2026-10-14T08:05:00.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KSK-HQ-01',
  },
]

describe('Bảng Chấm Công Trực Tiếp & Thẻ KPI (TASK-WEB-010)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    useAuthStore.setState({
      session: {
        accessToken: 'mock-hr-access-token',
        refreshToken: 'mock-hr-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: { ...mockAdminUser },
      },
      user: { ...mockAdminUser },
      isAuthenticated: true,
      isInitialized: true,
    })

    vi.spyOn(attendanceService, 'getAttendanceStats').mockResolvedValue({ ...mockStats })
    vi.spyOn(attendanceService, 'getAdminAttendance').mockResolvedValue({
      content: [...mockRecords],
      page: 0,
      size: 50,
      totalElements: mockRecords.length,
      totalPages: 1,
      first: true,
      last: true,
    })

    vi.spyOn(useLiveAttendanceModule, 'useLiveAttendance').mockImplementation(() => {
      return {
        latestEvents: [],
        isConnected: true,
        clearEvents: vi.fn(),
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 1. KpiCardsGrid Tests (UXD-WEB-003)
  // ────────────────────────────────────────────────────────────────────────────
  describe('1. KpiCardsGrid Component (Lưới 4 Thẻ Chỉ Số KPI)', () => {
    it('render đầy đủ 4 thẻ KPI với số liệu và tỷ lệ phần trăm chính xác', () => {
      render(<KpiCardsGrid stats={mockStats} />)

      // Thẻ 1: Tổng nhân sự
      expect(screen.getByTestId('kpi-total-employees').textContent).toBe('120')

      // Thẻ 2: Đã có mặt
      expect(screen.getByTestId('kpi-present-count').textContent).toBe('100')
      // Tỷ lệ có mặt = 100 / 120 = 83%
      expect(screen.getByTestId('kpi-present-percentage').textContent).toBe('83%')
      expect(screen.getByText(/Đúng giờ:/i)).toBeTruthy()

      // Thẻ 3: Đi muộn
      expect(screen.getByTestId('kpi-late-count').textContent).toBe('8')

      // Thẻ 4: Chưa đến
      expect(screen.getByTestId('kpi-absent-count').textContent).toBe('20')
    })

    it('hiển thị trạng thái loading khi isLoading = true', () => {
      render(<KpiCardsGrid stats={mockStats} isLoading={true} />)

      expect(screen.getByTestId('kpi-total-employees').textContent).toBe('...')
      expect(screen.getByTestId('kpi-present-count').textContent).toBe('...')
      expect(screen.getByTestId('kpi-late-count').textContent).toBe('...')
      expect(screen.getByTestId('kpi-absent-count').textContent).toBe('...')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 2. LiveAttendanceTable Tests (UXD-WEB-004, DD-WEB-014)
  // ────────────────────────────────────────────────────────────────────────────
  describe('2. LiveAttendanceTable Component (Bảng Chấm Công Trực Tiếp)', () => {
    it('render danh sách bản ghi điểm danh và thông tin sự kiện', () => {
      render(
        <LiveAttendanceTable
          records={mockRecords}
          highlightedRecordId={null}
        />
      )

      // Dữ liệu dòng
      expect(screen.getByText('NV-1001')).toBeTruthy()
      expect(screen.getByText('Trần Văn An')).toBeTruthy()
      expect(screen.getAllByText('Khối Công nghệ')[0]).toBeTruthy()
      expect(screen.getAllByText('Khuôn mặt')[0]).toBeTruthy()
      expect(screen.getAllByText('Đúng giờ')[0]).toBeTruthy()

      expect(screen.getByText('NV-1002')).toBeTruthy()
      expect(screen.getByText('Mã PIN')).toBeTruthy()
      expect(screen.getByText(/Đi muộn \(5p\)/i)).toBeTruthy()
    })

    it('kích hoạt hiệu ứng chớp sáng Green Flash (1.5s) trên hàng được chỉ định', () => {
      render(
        <LiveAttendanceTable
          records={mockRecords}
          isConnected={true}
          highlightedRecordId={101}
        />
      )

      const row = screen.getByTestId('attendance-row-101')
      expect(row.className).toContain('bg-emerald-50')
      expect(row.className).toContain('ring-emerald-400')
    })

    it('lọc dữ liệu theo từ khóa tìm kiếm (Mã NV hoặc Họ Tên)', () => {
      render(
        <LiveAttendanceTable
          records={mockRecords}
          isConnected={true}
          highlightedRecordId={null}
        />
      )

      const searchInput = screen.getByTestId('live-search-input')
      fireEvent.change(searchInput, { target: { value: 'Bích' } })

      expect(screen.getByText('Lê Thị Bích')).toBeTruthy()
      expect(screen.queryByText('Trần Văn An')).toBeNull()
      expect(screen.queryByText('Phạm Minh Châu')).toBeNull()
    })

    it('lọc dữ liệu theo phòng ban và trạng thái', () => {
      render(
        <LiveAttendanceTable
          records={mockRecords}
          isConnected={true}
          highlightedRecordId={null}
        />
      )

      const deptFilter = screen.getByTestId('live-filter-department')
      fireEvent.change(deptFilter, { target: { value: 'Khối Kinh doanh' } })

      expect(screen.getByText('Lê Thị Bích')).toBeTruthy()
      expect(screen.queryByText('Trần Văn An')).toBeNull()

      const statusFilter = screen.getByTestId('live-filter-status')
      fireEvent.change(statusFilter, { target: { value: 'ON_TIME' } })

      // Không có ai ở Khối Kinh doanh mà Đúng giờ
      expect(screen.getByText(/Chưa có lượt điểm danh nào phù hợp/i)).toBeTruthy()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 3. AdminDashboardView Integration Tests (STOMP + KPI + Live Flash)
  // ────────────────────────────────────────────────────────────────────────────
  describe('3. AdminDashboardView Integration (STOMP Event & Realtime KPI Update)', () => {
    it('tải dữ liệu ban đầu từ REST và hiển thị cả KPI và bảng Live', async () => {
      renderAdminDashboard()

      await waitFor(() => {
        expect(screen.getByText(/Chào mừng trở lại/i)).toBeTruthy()
      })

      // KPI số liệu ban đầu
      expect(screen.getByTestId('kpi-total-employees').textContent).toBe('120')
      expect(screen.getByTestId('kpi-present-count').textContent).toBe('100')
      expect(screen.getByTestId('kpi-late-count').textContent).toBe('8')
      expect(screen.getByTestId('kpi-absent-count').textContent).toBe('20')

      // Dữ liệu bảng ban đầu
      expect(screen.getByText('Trần Văn An')).toBeTruthy()
      expect(screen.getByText('Lê Thị Bích')).toBeTruthy()
    })

    it('tự động chèn dòng mới lên đầu bảng và tăng bộ đếm KPI khi nhận tin STOMP', async () => {
      let registeredCallback: ((record: AttendanceRecord) => void) | undefined

      vi.spyOn(useLiveAttendanceModule, 'useLiveAttendance').mockImplementation((options) => {
        registeredCallback = options?.onRecordReceived
        return {
          latestEvents: [],
          isConnected: true,
          clearEvents: vi.fn(),
        }
      })

      renderAdminDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('kpi-present-count').textContent).toBe('100')
      })

      expect(registeredCallback).toBeDefined()

      // Giả lập nhận bản tin STOMP mới: Nhân viên Đỗ Văn Dũng (Đúng giờ)
      const newStompRecord: AttendanceRecord = {
        recordId: 999,
        employeeId: 1099,
        employeeCode: 'NV-1099',
        fullName: 'Đỗ Văn Dũng',
        department: 'Khối Vận hành',
        punchTimestamp: '2026-10-14T08:45:00.000+07:00',
        punchType: 'CHECK_IN',
        verificationMethod: 'VERIFICATION_FACE',
        status: 'ON_TIME',
        lateMinutes: 0,
        kioskId: 'KSK-HQ-01',
      }

      // Bắn sự kiện
      act(() => {
        registeredCallback?.(newStompRecord)
      })

      // 1. Kiểm tra bộ đếm KPI tăng tự động theo thời gian thực (DD-WEB-014)
      await waitFor(() => {
        expect(screen.getByTestId('kpi-present-count').textContent).toBe('101') // 100 + 1
      })
      // Đúng giờ tăng 92 -> 93
      expect(screen.getByText(/Đúng giờ:/i).textContent).toContain('93')
      // Chưa đến giảm 20 -> 19
      expect(screen.getByTestId('kpi-absent-count').textContent).toBe('19')

      // 2. Kiểm tra dòng mới xuất hiện với hiệu ứng Green Flash
      expect(screen.getByText('Đỗ Văn Dũng')).toBeTruthy()
      const newRow = screen.getByTestId('attendance-row-999')
      expect(newRow.className).toContain('bg-emerald-50')
    })

    it('nhận sự kiện STOMP đi muộn: tăng đồng thời presentCount và lateCount', async () => {
      let registeredCallback: ((record: AttendanceRecord) => void) | undefined

      vi.spyOn(useLiveAttendanceModule, 'useLiveAttendance').mockImplementation((options) => {
        registeredCallback = options?.onRecordReceived
        return {
          latestEvents: [],
          isConnected: true,
          clearEvents: vi.fn(),
        }
      })

      renderAdminDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('kpi-late-count').textContent).toBe('8')
      })

      // Bản tin STOMP đi muộn
      const lateRecord: AttendanceRecord = {
        recordId: 888,
        employeeId: 1088,
        employeeCode: 'NV-1088',
        fullName: 'Hoàng Văn Em',
        department: 'Khối Kỹ thuật',
        punchTimestamp: '2026-10-14T09:10:00.000+07:00',
        punchType: 'CHECK_IN',
        verificationMethod: 'VERIFICATION_FACE',
        status: 'LATE',
        lateMinutes: 40,
        kioskId: 'KSK-HQ-02',
      }

      act(() => {
        registeredCallback?.(lateRecord)
      })

      await waitFor(() => {
        expect(screen.getByTestId('kpi-present-count').textContent).toBe('101')
      })
      expect(screen.getByTestId('kpi-late-count').textContent).toBe('9') // 8 + 1
    })

    it('nút Làm mới gọi lại API tải dữ liệu', async () => {
      renderAdminDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('refresh-dashboard-btn')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('refresh-dashboard-btn'))

      await waitFor(() => {
        expect(attendanceService.getAttendanceStats).toHaveBeenCalledTimes(2)
        expect(attendanceService.getAdminAttendance).toHaveBeenCalledTimes(2)
      })
    })
  })
})
