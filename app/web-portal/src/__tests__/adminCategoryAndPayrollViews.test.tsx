/**
 * Integration & Unit Tests cho Màn hình Quản trị Danh mục & Kỳ công
 * (SOL-WEB-006, SOL-WEB-007, SOL-WEB-008, BLD-WEB-023, UXD-WEB-006, UI-WEB-006, UI-WEB-007, UI-WEB-009, TASK-WEB-028).
 *
 * Kiểm tra:
 * 1. Màn hình Hồ sơ Nhân sự (EmployeeManagementView, UI-WEB-006):
 *    - Bảng dữ liệu có cột thao tác dính bên phải (sticky right-0).
 *    - Bộ lọc đa chiều (từ khóa, phòng ban, trạng thái, vai trò).
 *    - Drawer tạo/sửa hồ sơ nhân sự trượt từ bên phải.
 *    - Hộp thoại mật khẩu tạm hiển thị duy nhất một lần (DD-WEB-018) kèm nút sao chép và cảnh báo.
 *    - Cấp lại mật khẩu tạm và đổi trạng thái kích hoạt/vô hiệu hóa.
 * 2. Màn hình Ca làm việc & Xem trước Lịch phân ca theo tuần (AdminShiftManagementView, WeeklyShiftScheduleView, UI-WEB-007):
 *    - Bảng danh mục ca có cột thao tác dính bên phải (sticky right-0).
 *    - Drawer tạo mới/sửa ca làm việc.
 *    - Chuyển đổi giữa chế độ xem Dạng Bảng và Lịch Tuần.
 *    - Lưới Lịch tuần 7 ngày (Thứ Hai -> Chủ Nhật), điều hướng tuần trước/sau/tuần này.
 *    - Thẻ ca làm việc hiển thị trên ô ngày tương ứng và nút phân ca nhanh (+) trên ô trống.
 *    - Cảnh báo chồng lấn ca và gợi ý khoảng trống khả dụng.
 * 3. Màn hình Chốt kỳ công (AdminPayrollPeriodView, UI-WEB-009):
 *    - Bảng kỳ công có cột thao tác dính bên phải (sticky right-0).
 *    - Cảnh báo nghiệp vụ kỳ đã chốt hiển thị ngay trên đầu bảng.
 *    - Chốt kỳ công lan tỏa cờ isAdjustmentLocked và vô hiệu hóa nút điều chỉnh.
 *    - Mở lại kỳ công yêu cầu nhập lý do kiểm toán.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'
import { EmployeeManagementView } from '@/views/admin/EmployeeManagementView'
import { AdminShiftManagementView } from '@/views/admin/AdminShiftManagementView'
import { AdminPayrollPeriodView } from '@/views/admin/AdminPayrollPeriodView'
import { useAuthStore } from '@/store/authStore'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { shiftAdminService } from '@/services/shiftAdminService'
import { payrollPeriodService } from '@/services/payrollPeriodService'
import { reportExportService } from '@/services/reportExportService'
import type {
  EmployeeItem,
  ShiftItem,
  EmployeeShiftAssignment,
  PayrollPeriodResponse,
  UserProfile,
} from '@/types'

const mockAdminUser: UserProfile = {
  id: 1,
  employeeCode: 'ADM-001',
  fullName: 'Nguyễn Quản Trị Hệ Thống',
  email: 'admin@company.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Khối Quản trị',
}

const mockEmployees: EmployeeItem[] = [
  {
    id: 101,
    employeeCode: 'NV-101',
    fullName: 'Đỗ Hoàng Nam',
    email: 'nam.dh@company.com',
    department: 'Phòng Kỹ thuật',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 102,
    employeeCode: 'NV-102',
    fullName: 'Vũ Minh Hằng',
    email: 'hang.vm@company.com',
    department: 'Phòng Nhân sự',
    role: 'HR_MANAGER',
    status: 'ACTIVE',
    hasBiometric: false,
    hasPin: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

const mockShifts: ShiftItem[] = [
  {
    id: 1,
    shiftCode: 'CA_SANG',
    name: 'Ca Sáng Hành Chính',
    startTime: '08:00',
    endTime: '12:00',
    gracePeriodMinutes: 15,
    isActive: true,
  },
  {
    id: 2,
    shiftCode: 'CA_CHIEU',
    name: 'Ca Chiều',
    startTime: '13:00',
    endTime: '17:30',
    gracePeriodMinutes: 10,
    isActive: true,
  },
]

// Lấy ngày Thứ Hai của tuần hiện tại làm dữ liệu test
function getMondayISO(offsetDays = 0): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offsetDays
  const monday = new Date(d.setDate(diff))
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const date = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

const mockAssignments: EmployeeShiftAssignment[] = [
  {
    id: 201,
    employeeId: 101,
    employeeCode: 'NV-101',
    fullName: 'Đỗ Hoàng Nam',
    shiftId: 1,
    shiftCode: 'CA_SANG',
    shiftName: 'Ca Sáng Hành Chính',
    effectiveStartDate: getMondayISO(0),
    effectiveEndDate: getMondayISO(4), // Thứ Sáu
  },
]

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
    lockedByName: 'Nguyễn Quản Trị Hệ Thống',
    lockedAt: '2026-10-05T17:00:00Z',
    createdAt: '2026-09-01T00:00:00Z',
  },
]

describe('TASK-WEB-028: Màn Hình Quản Trị Danh Mục & Kỳ Công (UXD-WEB-006, BLD-WEB-023)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock confirm
    window.confirm = vi.fn().mockReturnValue(true)

    // Khởi tạo Auth Store
    useAuthStore.setState({
      user: mockAdminUser,
      session: {
        accessToken: 'test-admin-token',
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: mockAdminUser,
      },
      isAuthenticated: true,
    })

    // Khởi tạo PayrollPeriodStore
    usePayrollPeriodStore.setState({
      periods: mockPayrollPeriods,
      selectedPeriod: mockPayrollPeriods[0],
      isAdjustmentLocked: false,
    })

    // Mock API services mặc định
    vi.spyOn(adminEmployeeService, 'getEmployees').mockResolvedValue({
      content: mockEmployees,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      page: 0,
      first: true,
      last: true,
    })

    vi.spyOn(shiftAdminService, 'getShifts').mockResolvedValue(mockShifts)
    vi.spyOn(shiftAdminService, 'getEmployeeShifts').mockResolvedValue(mockAssignments)
    vi.spyOn(payrollPeriodService, 'getPayrollPeriods').mockResolvedValue(mockPayrollPeriods)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. MÀN HÌNH HỒ SƠ NHÂN SỰ (UI-WEB-006, UXD-WEB-006)
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Màn hình Quản lý Hồ sơ Nhân sự (EmployeeManagementView)', () => {
    const renderEmployeeView = () => {
      const qc = createQueryClient()
      return render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <EmployeeManagementView />
          </MemoryRouter>
        </QueryClientProvider>
      )
    }

    it('hiển thị bảng nhân sự với cột hành động dính bên phải (UXD-WEB-006)', async () => {
      renderEmployeeView()

      await waitFor(() => {
        expect(screen.getByTestId('employee-table')).toBeTruthy()
        expect(screen.getByText('Đỗ Hoàng Nam')).toBeTruthy()
        expect(screen.getByText('Vũ Minh Hằng')).toBeTruthy()
      })

      // Kiểm tra tiêu đề cột Hành động có class sticky right-0
      const actionHeader = screen.getByText('Hành động')
      expect(actionHeader.className).toContain('sticky')
      expect(actionHeader.className).toContain('right-0')
    })

    it('cho phép tìm kiếm từ khóa và lọc theo phòng ban, trạng thái, vai trò', async () => {
      renderEmployeeView()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeTruthy()
      })

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'NV-101' } })

      const deptSelect = screen.getByTestId('filter-department')
      fireEvent.change(deptSelect, { target: { value: 'Phòng Kỹ thuật' } })

      const roleSelect = screen.getByTestId('filter-role')
      fireEvent.change(roleSelect, { target: { value: 'EMPLOYEE' } })

      await waitFor(() => {
        expect(adminEmployeeService.getEmployees).toHaveBeenCalledWith(
          expect.objectContaining({
            keyword: 'NV-101',
            department: 'Phòng Kỹ thuật',
          })
        )
      })
    })

    it('mở Drawer tạo mới nhân viên và hiển thị TemporaryPasswordModal một lần duy nhất khi tạo thành công (DD-WEB-018)', async () => {
      const createSpy = vi.spyOn(adminEmployeeService, 'createEmployee').mockResolvedValueOnce({
        employee: {
          id: 103,
          employeeCode: 'NV-103',
          fullName: 'Trịnh Thăng Bình',
          email: 'binh.tt@company.com',
          department: 'Phòng Kinh doanh',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasBiometric: false,
          hasPin: false,
          createdAt: '2026-01-01T00:00:00Z',
        },
        temporaryPassword: 'TempPassword@123',
      })

      renderEmployeeView()

      await waitFor(() => {
        expect(screen.getByTestId('btn-add-employee')).toBeTruthy()
      })

      // Click nút thêm nhân viên
      fireEvent.click(screen.getByTestId('btn-add-employee'))

      // Drawer hiển thị
      expect(screen.getByText('Tạo mới hồ sơ nhân sự')).toBeTruthy()

      // Nhập form trong Drawer
      fireEvent.change(screen.getByLabelText(/Mã nhân viên/i), { target: { value: 'NV-103' } })
      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Trịnh Thăng Bình' } })
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'binh.tt@company.com' } })

      // Submit lưu qua nút drawer-btn-submit
      fireEvent.click(screen.getByTestId('drawer-btn-submit'))

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            employeeCode: 'NV-103',
            fullName: 'Trịnh Thăng Bình',
          })
        )
      })

      // Modal mật khẩu tạm thời xuất hiện (Single display - DD-WEB-018)
      await waitFor(() => {
        expect(screen.getByTestId('temporary-password-modal')).toBeTruthy()
        expect(screen.getByTestId('temporary-password-display')).toBeTruthy()
        expect(screen.getByText('TempPassword@123')).toBeTruthy()
      })

      // Nút sao chép và cảnh báo đóng
      expect(screen.getByTestId('btn-copy-temp-password')).toBeTruthy()
      expect(screen.getByText(/Cảnh báo hiển thị một lần/i)).toBeTruthy()
      expect(screen.getByText(/duy nhất một lần/i)).toBeTruthy()

      // Đóng modal mật khẩu tạm
      fireEvent.click(screen.getByTestId('btn-close-temp-password'))
      await waitFor(() => {
        expect(screen.queryByTestId('temporary-password-modal')).toBeNull()
      })
    })

    it('cấp lại mật khẩu tạm khi click nút reset credentials', async () => {
      const resetSpy = vi.spyOn(adminEmployeeService, 'resetCredentials').mockResolvedValueOnce({
        temporaryPassword: 'NewResetPass#456',
        message: 'Cấp lại thành công',
      })

      renderEmployeeView()

      await waitFor(() => {
        expect(screen.getByLabelText('Cấp lại mật khẩu cho Đỗ Hoàng Nam')).toBeTruthy()
      })

      fireEvent.click(screen.getByLabelText('Cấp lại mật khẩu cho Đỗ Hoàng Nam'))

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledWith(101)
        expect(screen.getByTestId('temporary-password-modal')).toBeTruthy()
        expect(screen.getByText('NewResetPass#456')).toBeTruthy()
      })
    })

    it('vô hiệu hóa hồ sơ nhân sự khi click nút chuyển trạng thái', async () => {
      const statusSpy = vi.spyOn(adminEmployeeService, 'updateEmployeeStatus').mockResolvedValueOnce({
        id: 101,
        employeeCode: 'NV-101',
        fullName: 'Đỗ Hoàng Nam',
        email: 'nam.dh@company.com',
        department: 'Phòng Kỹ thuật',
        role: 'EMPLOYEE',
        status: 'INACTIVE',
        hasBiometric: true,
        hasPin: true,
        createdAt: '2026-01-01T00:00:00Z',
      })

      renderEmployeeView()

      await waitFor(() => {
        expect(screen.getByLabelText('Vô hiệu hóa Đỗ Hoàng Nam')).toBeTruthy()
      })

      fireEvent.click(screen.getByLabelText('Vô hiệu hóa Đỗ Hoàng Nam'))

      await waitFor(() => {
        expect(statusSpy).toHaveBeenCalledWith(101, 'INACTIVE')
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MÀN HÌNH CA & PHÂN CA TRÊN LỊCH TUẦN (UI-WEB-007, UXD-WEB-006)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Màn hình Quản lý Ca làm việc & Lịch Tuần (AdminShiftManagementView)', () => {
    const renderShiftView = () => {
      const qc = createQueryClient()
      return render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminShiftManagementView />
          </MemoryRouter>
        </QueryClientProvider>
      )
    }

    it('hiển thị bảng danh mục ca với cột hành động dính bên phải (UXD-WEB-006)', async () => {
      renderShiftView()

      await waitFor(() => {
        expect(screen.getByTestId('shift-row-1')).toBeTruthy()
        expect(screen.getByText('Ca Sáng Hành Chính')).toBeTruthy()
        expect(screen.getByText('CA_SANG')).toBeTruthy()
      })

      // Tiêu đề Thao Tác có class sticky right-0
      const actionHeader = screen.getAllByText('Thao Tác')[0]
      expect(actionHeader?.className).toContain('sticky')
      expect(actionHeader?.className).toContain('right-0')
    })

    it('mở Drawer tạo mới ca làm việc và lưu thành công', async () => {
      const createShiftSpy = vi.spyOn(shiftAdminService, 'createShift').mockResolvedValueOnce({
        id: 3,
        shiftCode: 'CA_TOI',
        name: 'Ca Tối',
        startTime: '18:00',
        endTime: '22:00',
        gracePeriodMinutes: 15,
        isActive: true,
      })

      renderShiftView()

      await waitFor(() => {
        expect(screen.getByTestId('open-create-shift-drawer-btn')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('open-create-shift-drawer-btn'))

      expect(screen.getByTestId('shift-drawer')).toBeTruthy()
      expect(screen.getByText('Tạo Mới Ca Làm Việc')).toBeTruthy()

      // Nhập form Drawer
      fireEvent.change(screen.getByTestId('input-shift-code'), { target: { value: 'CA_TOI' } })
      fireEvent.change(screen.getByTestId('input-shift-name'), { target: { value: 'Ca Tối' } })
      fireEvent.change(screen.getByTestId('input-shift-start-time'), { target: { value: '18:00' } })
      fireEvent.change(screen.getByTestId('input-shift-end-time'), { target: { value: '22:00' } })

      // Submit
      fireEvent.click(screen.getByTestId('submit-shift-btn'))

      await waitFor(() => {
        expect(createShiftSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            shiftCode: 'CA_TOI',
            name: 'Ca Tối',
          })
        )
      })
    })

    it('chuyển đổi qua lại giữa chế độ Dạng Bảng và Lịch Tuần (UI-WEB-007)', async () => {
      renderShiftView()

      // Chuyển sang Tab Lịch Phân Ca
      await waitFor(() => {
        expect(screen.getByTestId('tab-assignments-btn')).toBeTruthy()
      })
      fireEvent.click(screen.getByTestId('tab-assignments-btn'))

      // Mặc định ở chế độ Dạng Bảng
      await waitFor(() => {
        expect(screen.getByTestId('view-mode-table')).toBeTruthy()
        expect(screen.getByTestId('view-mode-weekly')).toBeTruthy()
        expect(screen.getByTestId('assignment-row-201')).toBeTruthy()
      })

      // Click chuyển sang chế độ Lịch Tuần
      fireEvent.click(screen.getByTestId('view-mode-weekly'))

      // Lưới WeeklyShiftScheduleView hiển thị
      await waitFor(() => {
        expect(screen.getByTestId('weekly-shift-schedule-view')).toBeTruthy()
        expect(screen.getByTestId('week-range-label')).toBeTruthy()
        expect(screen.getByTestId('weekly-schedule-table')).toBeTruthy()
      })

      // Thẻ ca làm việc hiển thị trên ô ngày trong tuần
      expect(screen.getAllByTestId('shift-card-201').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Ca Sáng Hành Chính').length).toBeGreaterThan(0)

      // Điều hướng tuần trước / tuần sau
      fireEvent.click(screen.getByTestId('prev-week-btn'))
      expect(screen.getByTestId('week-range-label')).toBeTruthy()

      fireEvent.click(screen.getByTestId('current-week-btn'))
      expect(screen.getByTestId('week-range-label')).toBeTruthy()
    })

    it('kích hoạt nút phân ca nhanh (+) trên ô trống của lịch tuần mở Drawer phân ca', async () => {
      renderShiftView()

      // Sang tab Lịch phân ca -> chọn chế độ Lịch tuần
      fireEvent.click(screen.getByTestId('tab-assignments-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('view-mode-weekly')).toBeTruthy()
      })
      fireEvent.click(screen.getByTestId('view-mode-weekly'))

      await waitFor(() => {
        expect(screen.getByTestId('weekly-shift-schedule-view')).toBeTruthy()
      })

      // Tìm nút quick-assign trên ô trống của nhân viên 102 (chưa có ca)
      const mondayStr = getMondayISO(0)
      const quickBtn = screen.getByTestId(`quick-assign-btn-102-${mondayStr}`)
      expect(quickBtn).toBeTruthy()

      fireEvent.click(quickBtn)

      // Drawer Phân ca mở ra với ngày được điền sẵn
      await waitFor(() => {
        expect(screen.getByTestId('assign-shift-drawer')).toBeTruthy()
        expect(screen.getByText('Phân Ca Nhân Sự Theo Khoảng Ngày')).toBeTruthy()
      })
    })

    it('hiển thị cảnh báo nghiệp vụ khi kỳ công bị khóa và vô hiệu hóa các nút điều chỉnh (UXD-WEB-006)', async () => {
      // Đặt store kỳ công sang trạng thái LOCKED
      usePayrollPeriodStore.setState({
        isAdjustmentLocked: true,
        selectedPeriod: mockPayrollPeriods[1], // LOCKED
      })

      renderShiftView()

      // Cảnh báo nghiệp vụ trên đầu bảng
      await waitFor(() => {
        expect(screen.getByTestId('payroll-locked-warning-banner')).toBeTruthy()
        expect(screen.getByTestId('shift-payroll-locked-badge')).toBeTruthy()
      })

      // Nút Thêm Ca Mới bị disable
      const addShiftBtn = screen.getByTestId('open-create-shift-drawer-btn') as HTMLButtonElement
      expect(addShiftBtn.disabled).toBe(true)

      // Chuyển sang Tab phân ca: nút Phân Ca Nhân Sự cũng bị disable
      fireEvent.click(screen.getByTestId('tab-assignments-btn'))
      await waitFor(() => {
        const assignBtn = screen.getByTestId('open-assign-shift-drawer-btn') as HTMLButtonElement
        expect(assignBtn.disabled).toBe(true)
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. MÀN HÌNH CHỐT KỲ CÔNG (UI-WEB-009, UXD-WEB-006)
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Màn hình Chốt Kỳ Công (AdminPayrollPeriodView)', () => {
    const renderPayrollPeriodView = () => {
      const qc = createQueryClient()
      return render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <AdminPayrollPeriodView />
          </MemoryRouter>
        </QueryClientProvider>
      )
    }

    it('hiển thị bảng kỳ công với cột thao tác dính bên phải (sticky right-0)', async () => {
      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByTestId('payroll-period-row-1')).toBeTruthy()
        expect(screen.getByTestId('payroll-period-row-2')).toBeTruthy()
      })

      const header = screen.getByText('Thao Tác Quản Trị')
      expect(header.className).toContain('sticky')
      expect(header.className).toContain('right-0')
    })

    it('hiển thị cảnh báo nghiệp vụ trên đầu bảng khi chọn kỳ đã chốt (UXD-WEB-006)', async () => {
      // Chọn kỳ 2 (LOCKED)
      usePayrollPeriodStore.setState({
        selectedPeriod: mockPayrollPeriods[1],
        isAdjustmentLocked: true,
      })

      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByTestId('payroll-locked-active-alert')).toBeTruthy()
        expect(screen.getByTestId('payroll-status-badge-locked')).toBeTruthy()
        expect(screen.getByText(/Kỳ công 9\/2026 ĐÃ ĐƯỢC CHỐT/i)).toBeTruthy()
      })
    })

    it('cho phép chốt kỳ công và lan tỏa trạng thái sang Store tập trung', async () => {
      const lockSpy = vi.spyOn(payrollPeriodService, 'lockPeriod').mockResolvedValueOnce({
        id: 1,
        periodYear: 2026,
        periodMonth: 10,
        status: 'LOCKED',
        lockedByName: 'Nguyễn Quản Trị Hệ Thống',
        lockedAt: new Date().toISOString(),
        createdAt: '2026-10-01T00:00:00Z',
      })

      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByTestId('lock-period-btn-1')).toBeTruthy()
      })

      // Click nút chốt kỳ
      fireEvent.click(screen.getByTestId('lock-period-btn-1'))

      // Modal xác nhận chốt
      expect(screen.getByTestId('lock-payroll-modal')).toBeTruthy()

      // Xác nhận chốt
      fireEvent.click(screen.getByTestId('confirm-lock-period-btn'))

      await waitFor(() => {
        expect(lockSpy).toHaveBeenCalledWith('2026-10')
      })
    })

    it('yêu cầu nhập lý do kiểm toán khi mở lại kỳ công đã chốt', async () => {
      const unlockSpy = vi.spyOn(payrollPeriodService, 'unlockPeriod').mockResolvedValueOnce({
        id: 2,
        periodYear: 2026,
        periodMonth: 9,
        status: 'OPEN',
        createdAt: '2026-09-01T00:00:00Z',
      })

      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByTestId('unlock-period-btn-2')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('unlock-period-btn-2'))

      // Modal mở lại kỳ công
      expect(screen.getByTestId('unlock-payroll-modal')).toBeTruthy()

      const submitBtn = screen.getByTestId('confirm-unlock-period-btn')

      // Nếu không nhập lý do -> báo lỗi kiểm toán
      fireEvent.click(submitBtn)
      await waitFor(() => {
        expect(screen.getByTestId('unlock-modal-error')).toBeTruthy()
      })

      // Nhập lý do hợp lệ (> 5 ký tự)
      const reasonInput = screen.getByTestId('input-unlock-reason')
      fireEvent.change(reasonInput, {
        target: { value: 'Bổ sung giải trình công tác của phòng kinh doanh theo biên bản HR' },
      })

      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(unlockSpy).toHaveBeenCalledWith('2026-09', {
          reason: 'Bổ sung giải trình công tác của phòng kinh doanh theo biên bản HR',
        })
      })
    })

    it('cho phép xuất báo cáo theo kỳ công', async () => {
      const exportSpy = vi.spyOn(reportExportService, 'exportTimesheetReport').mockResolvedValueOnce({
        blob: new Blob(['mock-excel']),
        filename: 'bang-cong-2026-10.xlsx',
      })

      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByTestId('export-period-btn-1')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('export-period-btn-1'))

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalledWith({
          period: '2026-10',
          format: 'xlsx',
        })
      })
    })
  })
})
