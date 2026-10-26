/**
 * Integration & Unit Tests cho Module Ca kíp & Kỳ công
 * (SOL-WEB-007, SOL-WEB-008, BLD-WEB-019, UXD-WEB-006, FR-WEB-008, FR-WEB-010, TASK-WEB-025).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'
import { AdminShiftManagementView } from '@/views/admin/AdminShiftManagementView'
import { AdminPayrollPeriodView } from '@/views/admin/AdminPayrollPeriodView'
import { useAuthStore } from '@/store/authStore'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { shiftAdminService } from '@/services/shiftAdminService'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { payrollPeriodService } from '@/services/payrollPeriodService'
import type {
  ShiftItem,
  EmployeeShiftAssignment,
  EmployeeItem,
  PayrollPeriodResponse,
  UserProfile,
} from '@/types'

const mockAdminUser: UserProfile = {
  id: 1,
  employeeCode: 'ADM-001',
  fullName: 'Quản trị viên Hệ thống',
  email: 'admin@company.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Khối Quản trị',
}

const mockShifts: ShiftItem[] = [
  {
    id: 1,
    shiftCode: 'CA_HC',
    name: 'Ca Hành Chính',
    startTime: '08:00',
    endTime: '17:30',
    gracePeriodMinutes: 15,
    isActive: true,
  },
  {
    id: 2,
    shiftCode: 'CA_CHIEU',
    name: 'Ca Chiều',
    startTime: '13:00',
    endTime: '21:00',
    gracePeriodMinutes: 10,
    isActive: true,
  },
]

const mockEmployees: EmployeeItem[] = [
  {
    id: 101,
    employeeCode: 'NV-101',
    fullName: 'Nguyễn Văn Nam',
    email: 'nam.nv@company.com',
    department: 'Phòng Kỹ thuật',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

const mockAssignments: EmployeeShiftAssignment[] = [
  {
    id: 501,
    employeeId: 101,
    employeeCode: 'NV-101',
    fullName: 'Nguyễn Văn Nam',
    shiftId: 1,
    shiftCode: 'CA_HC',
    shiftName: 'Ca Hành Chính',
    effectiveStartDate: '2026-10-01',
    effectiveEndDate: '2026-10-15',
  },
]

const mockPayrollPeriods: PayrollPeriodResponse[] = [
  {
    id: 1,
    periodYear: 2026,
    periodMonth: 10,
    status: 'OPEN',
    lockedById: null,
    lockedByName: null,
    lockedAt: null,
    unlockedById: null,
    unlockedByName: null,
    unlockedAt: null,
    unlockReason: null,
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 2,
    periodYear: 2026,
    periodMonth: 9,
    status: 'LOCKED',
    lockedById: 1,
    lockedByName: 'Quản trị viên Hệ thống',
    lockedAt: '2026-10-01T08:00:00Z',
    unlockedById: null,
    unlockedByName: null,
    unlockedAt: null,
    unlockReason: null,
    createdAt: '2026-09-01T00:00:00Z',
  },
]

const renderShiftManagementView = () => {
  const qc = createQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminShiftManagementView />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

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

describe('Module Ca kíp & Kỳ công (TASK-WEB-025)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    useAuthStore.setState({
      session: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: mockAdminUser,
      },
      user: mockAdminUser,
      isAuthenticated: true,
    })

    usePayrollPeriodStore.setState({
      selectedPeriod: mockPayrollPeriods[0],
      periods: mockPayrollPeriods,
      isAdjustmentLocked: false,
    })

    vi.spyOn(shiftAdminService, 'getShifts').mockResolvedValue(mockShifts)
    vi.spyOn(shiftAdminService, 'getEmployeeShifts').mockResolvedValue(mockAssignments)
    vi.spyOn(shiftAdminService, 'createShift').mockImplementation(async (req) => ({
      id: 3,
      shiftCode: req.shiftCode,
      name: req.name,
      startTime: req.startTime,
      endTime: req.endTime,
      gracePeriodMinutes: req.gracePeriodMinutes || 15,
      isActive: true,
    }))
    vi.spyOn(shiftAdminService, 'updateShift').mockImplementation(async (id, req) => ({
      id,
      shiftCode: 'CA_HC',
      name: req.name || 'Ca Hành Chính',
      startTime: req.startTime || '08:00',
      endTime: req.endTime || '17:30',
      gracePeriodMinutes: req.gracePeriodMinutes || 15,
      isActive: req.isActive !== undefined ? req.isActive : true,
    }))
    vi.spyOn(shiftAdminService, 'assignShift').mockResolvedValue({
      id: 502,
      employeeId: 101,
      employeeCode: 'NV-101',
      fullName: 'Nguyễn Văn Nam',
      shiftId: 2,
      shiftCode: 'CA_CHIEU',
      shiftName: 'Ca Chiều',
      effectiveStartDate: '2026-10-16',
      effectiveEndDate: '2026-10-31',
    })
    vi.spyOn(shiftAdminService, 'removeShiftAssignment').mockResolvedValue(undefined)
    vi.spyOn(adminEmployeeService, 'getEmployees').mockResolvedValue({
      content: mockEmployees,
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 50,
      first: true,
      last: true,
    })

    vi.spyOn(payrollPeriodService, 'getPayrollPeriods').mockResolvedValue(mockPayrollPeriods)
    vi.spyOn(payrollPeriodService, 'lockPeriod').mockResolvedValue({
      id: 1,
      periodYear: 2026,
      periodMonth: 10,
      status: 'LOCKED',
      lockedById: 1,
      lockedByName: 'Quản trị viên Hệ thống',
      lockedAt: '2026-10-14T10:00:00Z',
      createdAt: '2026-10-01T00:00:00Z',
    })
    vi.spyOn(payrollPeriodService, 'unlockPeriod').mockResolvedValue({
      id: 2,
      periodYear: 2026,
      periodMonth: 9,
      status: 'OPEN',
      unlockedById: 1,
      unlockedByName: 'Quản trị viên Hệ thống',
      unlockedAt: '2026-10-14T10:05:00Z',
      unlockReason: 'Điều chỉnh bổ sung giờ công phòng Kỹ thuật',
      createdAt: '2026-09-01T00:00:00Z',
    })
  })

  // ── 1. Quản lý Danh mục Ca làm việc (Shift Catalog) ─────────────────────────

  describe('1. Quản lý Danh mục Ca làm việc (AdminShiftManagementView)', () => {
    it('1. Hiển thị tiêu đề, tabs và danh mục ca ban đầu', async () => {
      renderShiftManagementView()

      expect(screen.getByText('Quản Lý Ca Làm Việc & Phân Ca')).toBeTruthy()

      await waitFor(() => {
        expect(screen.getByText('Ca Hành Chính')).toBeTruthy()
        expect(screen.getByText('CA_HC')).toBeTruthy()
        expect(screen.getByText('Ca Chiều')).toBeTruthy()
        expect(screen.getByText('CA_CHIEU')).toBeTruthy()
      })
    })

    it('2. Mở Drawer và tạo mới ca làm việc thành công', async () => {
      renderShiftManagementView()

      await waitFor(() => {
        expect(screen.getByText('Ca Hành Chính')).toBeTruthy()
      })

      // Bấm nút Thêm Ca Mới
      const createButton = screen.getByTestId('open-create-shift-drawer-btn')
      fireEvent.click(createButton)

      expect(screen.getByTestId('shift-drawer')).toBeTruthy()

      // Điền form
      fireEvent.change(screen.getByTestId('input-shift-code'), { target: { value: 'CA_DEM' } })
      fireEvent.change(screen.getByTestId('input-shift-name'), { target: { value: 'Ca Đêm' } })
      fireEvent.change(screen.getByTestId('input-shift-start-time'), { target: { value: '22:00' } })
      fireEvent.change(screen.getByTestId('input-shift-end-time'), { target: { value: '06:00' } })

      // Submit
      fireEvent.click(screen.getByTestId('submit-shift-btn'))

      await waitFor(() => {
        expect(shiftAdminService.createShift).toHaveBeenCalledWith(
          expect.objectContaining({
            shiftCode: 'CA_DEM',
            name: 'Ca Đêm',
            startTime: '22:00',
            endTime: '06:00',
          })
        )
      })
    })

    it('3. Đổi trạng thái ca làm việc (Tạm dừng / Kích hoạt)', async () => {
      renderShiftManagementView()

      await waitFor(() => {
        expect(screen.getByText('Ca Hành Chính')).toBeTruthy()
      })

      const toggleButton = screen.getByTestId('toggle-shift-active-btn-1')
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(shiftAdminService.updateShift).toHaveBeenCalledWith(1, { isActive: false })
      })
    })
  })

  // ── 2. Phân ca Nhân sự & Gợi ý Chồng lấn (Shift Assignment) ────────────────

  describe('2. Phân ca Nhân sự & Gợi ý Chồng lấn (SOL-WEB-007, BLD-WEB-019)', () => {
    it('4. Chuyển sang Tab Lịch Phân ca và hiển thị danh sách phân ca', async () => {
      renderShiftManagementView()

      await waitFor(() => {
        expect(screen.getByText('Ca Hành Chính')).toBeTruthy()
      })

      const assignTabButton = screen.getByTestId('tab-assignments-btn')
      fireEvent.click(assignTabButton)

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy()
        expect(screen.getByText('2026-10-01')).toBeTruthy()
        expect(screen.getByText('2026-10-15')).toBeTruthy()
      })
    })

    it('5. Phát hiện chồng lấn ca (409) và hiển thị hộp gợi ý khoảng trống khả dụng', async () => {
      renderShiftManagementView()

      // Chuyển sang Tab phân ca
      fireEvent.click(screen.getByTestId('tab-assignments-btn'))

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy()
      })

      // Mở Drawer phân ca
      fireEvent.click(screen.getByTestId('open-assign-shift-drawer-btn'))
      expect(screen.getByTestId('assign-shift-drawer')).toBeTruthy()

      // Chuyển sang chế độ Từng Cá Nhân
      fireEvent.click(screen.getByTestId('mode-single-btn'))

      // Chọn nhân viên 101 và khoảng ngày trùng (2026-10-10 đến 2026-10-25)
      fireEvent.change(screen.getByTestId('select-assign-employee'), { target: { value: '101' } })
      fireEvent.change(screen.getByTestId('select-assign-shift'), { target: { value: '2' } })
      fireEvent.change(screen.getByTestId('input-assign-start-date'), {
        target: { value: '2026-10-10' },
      })
      fireEvent.change(screen.getByTestId('input-assign-end-date'), {
        target: { value: '2026-10-25' },
      })

      // Submit
      fireEvent.click(screen.getByTestId('submit-assign-shift-btn'))

      // Kiểm tra xuất hiện cảnh báo lỗi chồng lấn và hộp gợi ý khoảng trống
      await waitFor(() => {
        expect(screen.getByTestId('assign-form-error')).toBeTruthy()
        expect(screen.getByTestId('overlap-conflict-suggestion-box')).toBeTruthy()
      })

      // Hộp gợi ý hiển thị khoảng trống khả dụng (từ ngày 2026-10-16)
      expect(screen.getByText('2026-10-16')).toBeTruthy()
      expect(screen.getByTestId('apply-suggested-slot-btn')).toBeTruthy()
    })

    it('6. Bấm "Áp Dụng Khoảng Trống Này" tự động cập nhật ngày bắt đầu và kết thúc vào form', async () => {
      renderShiftManagementView()

      fireEvent.click(screen.getByTestId('tab-assignments-btn'))
      await waitFor(() => expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy())

      fireEvent.click(screen.getByTestId('open-assign-shift-drawer-btn'))

      // Chuyển sang chế độ Từng Cá Nhân
      fireEvent.click(screen.getByTestId('mode-single-btn'))

      // Cố ý chọn ngày trùng lấn
      fireEvent.change(screen.getByTestId('select-assign-employee'), { target: { value: '101' } })
      fireEvent.change(screen.getByTestId('select-assign-shift'), { target: { value: '2' } })
      fireEvent.change(screen.getByTestId('input-assign-start-date'), {
        target: { value: '2026-10-05' },
      })
      fireEvent.change(screen.getByTestId('input-assign-end-date'), {
        target: { value: '2026-10-20' },
      })
      fireEvent.click(screen.getByTestId('submit-assign-shift-btn'))

      // Đợi hộp gợi ý xuất hiện
      const applySlotButton = await screen.findByTestId('apply-suggested-slot-btn')
      expect(applySlotButton).toBeTruthy()

      // Bấm áp dụng gợi ý
      fireEvent.click(applySlotButton)

      // Ô ngày bắt đầu được cập nhật thành ngày trống gợi ý (2026-10-16)
      const startDateInput = screen.getByTestId('input-assign-start-date') as HTMLInputElement
      expect(startDateInput.value).toBe('2026-10-16')
    })

    it('7. Hủy lịch phân ca của nhân sự', async () => {
      window.confirm = vi.fn().mockReturnValue(true)

      renderShiftManagementView()

      fireEvent.click(screen.getByTestId('tab-assignments-btn'))
      await waitFor(() => expect(screen.getByText('Nguyễn Văn Nam')).toBeTruthy())

      const removeBtn = screen.getByTestId('remove-assignment-btn-501')
      fireEvent.click(removeBtn)

      await waitFor(() => {
        expect(shiftAdminService.removeShiftAssignment).toHaveBeenCalledWith(501)
      })
    })

    it('8. Khi kỳ công bị KHÓA (isAdjustmentLocked = true), hiển thị cảnh báo nghiệp vụ và vô hiệu hóa nút thêm ca / phân ca', async () => {
      // Đặt store ở trạng thái LOCKED
      usePayrollPeriodStore.setState({
        isAdjustmentLocked: true,
        selectedPeriod: mockPayrollPeriods[1],
      })

      renderShiftManagementView()

      await waitFor(() => {
        expect(screen.getByText('Quản Lý Ca Làm Việc & Phân Ca')).toBeTruthy()
      })

      // Banner cảnh báo UXD-WEB-006 xuất hiện
      expect(screen.getByTestId('payroll-locked-warning-banner')).toBeTruthy()
      expect(screen.getByTestId('shift-payroll-locked-badge')).toBeTruthy()

      // Nút Thêm Ca Mới bị disabled
      const createShiftBtn = screen.getByTestId('open-create-shift-drawer-btn') as HTMLButtonElement
      expect(createShiftBtn.disabled).toBe(true)

      // Chuyển tab sang Phân ca
      fireEvent.click(screen.getByTestId('tab-assignments-btn'))

      // Nút Phân Ca Nhân Sự bị disabled
      const assignShiftBtn = screen.getByTestId('open-assign-shift-drawer-btn') as HTMLButtonElement
      expect(assignShiftBtn.disabled).toBe(true)
    })
  })

  // ── 3. Quản lý Chốt kỳ công (Payroll Period Locking) ─────────────────────────

  describe('3. Quản lý Chốt kỳ công & Lan tỏa Khóa (AdminPayrollPeriodView - SOL-WEB-008)', () => {
    it('9. Hiển thị danh sách kỳ công theo năm và trạng thái MỞ / KHÓA', async () => {
      renderPayrollPeriodView()

      expect(screen.getByText('Quản Lý & Chốt Kỳ Công')).toBeTruthy()

      await waitFor(() => {
        expect(screen.getByText(/Tháng 10\/2026/i)).toBeTruthy()
        expect(screen.getByText(/Tháng 09\/2026/i)).toBeTruthy()
        expect(screen.getByTestId('period-status-badge-1').textContent).toContain('ĐANG MỞ')
        expect(screen.getByTestId('period-status-badge-2').textContent).toContain('ĐÃ CHỐT')
      })
    })

    it('10. Chốt kỳ công: Mở modal xác nhận -> Chốt thành công -> Cập nhật trạng thái LOCKED', async () => {
      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByText(/Tháng 10\/2026/i)).toBeTruthy()
      })

      // Bấm nút Chốt Kỳ của Tháng 10
      const lockButton = screen.getByTestId('lock-period-btn-1')
      fireEvent.click(lockButton)

      // Modal xác nhận xuất hiện
      expect(screen.getByTestId('lock-payroll-modal')).toBeTruthy()

      // Xác nhận chốt kỳ
      const confirmButton = screen.getByTestId('confirm-lock-period-btn')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(payrollPeriodService.lockPeriod).toHaveBeenCalledWith('2026-10')
      })

      // Trạng thái store được cập nhật sang LOCKED
      expect(usePayrollPeriodStore.getState().isAdjustmentLocked).toBe(true)
    })

    it('11. Mở lại kỳ công (ADMIN): Yêu cầu nhập lý do bắt buộc -> Mở lại thành công -> OPEN', async () => {
      // Đặt kỳ chọn là kỳ đã chốt (Tháng 9)
      usePayrollPeriodStore.setState({
        selectedPeriod: mockPayrollPeriods[1],
        isAdjustmentLocked: true,
      })

      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByText(/Tháng 09\/2026/i)).toBeTruthy()
      })

      // Bấm nút Mở Lại Kỳ của Tháng 9
      const unlockButton = screen.getByTestId('unlock-period-btn-2')
      fireEvent.click(unlockButton)

      // Modal yêu cầu lý do xuất hiện
      expect(screen.getByTestId('unlock-payroll-modal')).toBeTruthy()

      // Nhập lý do mở lại kỳ công
      const reasonInput = screen.getByTestId('input-unlock-reason')
      fireEvent.change(reasonInput, {
        target: { value: 'Điều chỉnh bổ sung giờ công phòng Kỹ thuật' },
      })

      // Xác nhận mở lại
      const confirmUnlockButton = screen.getByTestId('confirm-unlock-period-btn')
      fireEvent.click(confirmUnlockButton)

      await waitFor(() => {
        expect(payrollPeriodService.unlockPeriod).toHaveBeenCalledWith('2026-09', {
          reason: 'Điều chỉnh bổ sung giờ công phòng Kỹ thuật',
        })
      })

      // Trạng thái store được cập nhật sang OPEN (isAdjustmentLocked = false)
      expect(usePayrollPeriodStore.getState().isAdjustmentLocked).toBe(false)
    })

    it('12. Khi kỳ công đang chọn bị LOCKED, hiển thị banner cảnh báo nghiệp vụ UXD-WEB-006 trên đầu trang', async () => {
      usePayrollPeriodStore.setState({
        selectedPeriod: mockPayrollPeriods[1], // Kỳ Tháng 9 đã LOCKED
        isAdjustmentLocked: true,
      })

      renderPayrollPeriodView()

      await waitFor(() => {
        expect(screen.getByText('Quản Lý & Chốt Kỳ Công')).toBeTruthy()
      })

      // Xuất hiện banner cảnh báo kỳ đã chốt
      expect(screen.getByTestId('payroll-locked-active-alert')).toBeTruthy()
      expect(screen.getByText(/Kỳ công 9\/2026 ĐÃ ĐƯỢC CHỐT/i)).toBeTruthy()
    })

    it('13. adminEmployeeService.getAllEmployees tuân thủ giới hạn size=100 và gom đủ nhân sự khi có nhiều trang', async () => {
      const page1Emp: EmployeeItem = {
        id: 201,
        employeeCode: 'NV-201',
        fullName: 'Trần Văn A',
        email: 'a@company.com',
        department: 'Sản xuất',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        hasBiometric: false,
        hasPin: false,
        createdAt: '2026-01-01T00:00:00Z',
      }
      const page2Emp: EmployeeItem = {
        id: 202,
        employeeCode: 'NV-202',
        fullName: 'Lê Thị B',
        email: 'b@company.com',
        department: 'Kho vận',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        hasBiometric: false,
        hasPin: false,
        createdAt: '2026-01-01T00:00:00Z',
      }

      vi.spyOn(adminEmployeeService, 'getEmployees').mockImplementation(async (criteria) => {
        // Kiểm tra kích thước không vượt quá @Max(100) backend
        expect(criteria?.size).toBeLessThanOrEqual(100)
        if (criteria?.page === 0) {
          return {
            content: [page1Emp],
            totalElements: 2,
            totalPages: 2,
            page: 0,
            size: 100,
            first: true,
            last: false,
          }
        }
        return {
          content: [page2Emp],
          totalElements: 2,
          totalPages: 2,
          page: 1,
          size: 100,
          first: false,
          last: true,
        }
      })

      const all = await adminEmployeeService.getAllEmployees()
      expect(all).toHaveLength(2)
      expect(all[0].employeeCode).toBe('NV-201')
      expect(all[1].employeeCode).toBe('NV-202')
    })

    it('14. Khi mở Drawer phân ca, danh sách nhân viên hiển thị đầy đủ tên, mã và phòng ban', async () => {
      vi.spyOn(adminEmployeeService, 'getAllEmployees').mockResolvedValue(mockEmployees)

      renderShiftManagementView()

      await waitFor(() => {
        expect(screen.getByText('Quản Lý Ca Làm Việc & Phân Ca')).toBeTruthy()
      })

      // Chuyển sang tab Lịch Phân Ca
      const assignmentsTabBtn = screen.getByTestId('tab-assignments-btn')
      fireEvent.click(assignmentsTabBtn)

      // Bấm nút Mở Phân Ca Nhân Sự
      const openAssignBtn = screen.getByTestId('open-assign-shift-drawer-btn')
      fireEvent.click(openAssignBtn)

      // Kiểm tra Drawer phân ca xuất hiện
      await waitFor(() => {
        expect(screen.getByTestId('assign-shift-drawer')).toBeTruthy()
      })

      // Kiểm tra chuyển sang tab single thì thấy select nhân sự
      const singleModeBtn = screen.getByTestId('mode-single-btn')
      fireEvent.click(singleModeBtn)

      const employeeSelect = screen.getByTestId('select-assign-employee')
      expect(employeeSelect.textContent).toContain('Nguyễn Văn Nam (NV-101) - Phòng Kỹ thuật')
    })

    it('15. Phân ca theo Phòng ban (Department-Level): Chọn phòng ban và tự động gom toàn bộ nhân sự (TASK-WEB-034)', async () => {
      const mockDeptEmployees: EmployeeItem[] = [
        {
          id: 101,
          employeeCode: 'NV-101',
          fullName: 'Nguyễn Văn Nam',
          email: 'nam@company.com',
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
          fullName: 'Trần Văn Bình',
          email: 'binh@company.com',
          department: 'Phòng Kỹ thuật',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasBiometric: true,
          hasPin: true,
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 103,
          employeeCode: 'NV-103',
          fullName: 'Lê Thị Cúc',
          email: 'cuc@company.com',
          department: 'Phòng Kinh doanh',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasBiometric: true,
          hasPin: true,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ]

      vi.spyOn(adminEmployeeService, 'getAllEmployees').mockResolvedValue(mockDeptEmployees)
      const batchSpy = vi.spyOn(shiftAdminService, 'assignShiftBatch').mockResolvedValue({
        total: 2,
        successCount: 2,
        failedCount: 0,
        failures: [],
        assignments: [],
      })

      renderShiftManagementView()

      await waitFor(() => {
        expect(screen.getByText('Quản Lý Ca Làm Việc & Phân Ca')).toBeTruthy()
      })

      // Mở modal phân ca
      fireEvent.click(screen.getByTestId('tab-assignments-btn'))
      fireEvent.click(screen.getByTestId('open-assign-shift-drawer-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('assign-shift-drawer')).toBeTruthy()
      })

      // Mặc định ở chế độ Theo Phòng Ban
      expect(screen.getByTestId('select-assign-department')).toBeTruthy()

      // Chọn Phòng Kỹ thuật
      fireEvent.change(screen.getByTestId('select-assign-department'), {
        target: { value: 'Phòng Kỹ thuật' },
      })

      // Kiểm tra quy mô áp dụng hiển thị 2 nhân sự
      expect(screen.getByTestId('dept-employees-count').textContent).toContain('2 nhân sự')

      // Chọn ca làm việc
      fireEvent.change(screen.getByTestId('select-assign-shift'), { target: { value: '1' } })

      // Bấm nút Phân ca cho phòng ban
      const submitBtn = screen.getByTestId('submit-assign-shift-btn')
      fireEvent.click(submitBtn)

      // Kiểm tra assignShiftBatch được gọi với đúng 2 nhân viên thuộc Phòng Kỹ thuật (101, 102)
      await waitFor(() => {
        expect(batchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            employeeIds: [101, 102],
            shiftId: 1,
          }),
          expect.any(Map),
          expect.any(Function)
        )
      })
    })

    it('16. Phân ca Chọn Hàng Loạt (Multi-Select): Lọc và chọn danh sách nhân sự (TASK-WEB-034)', async () => {
      const mockMultiEmployees: EmployeeItem[] = [
        {
          id: 101,
          employeeCode: 'NV-101',
          fullName: 'Nguyễn Văn Nam',
          email: 'nam@company.com',
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
          fullName: 'Trần Văn Bình',
          email: 'binh@company.com',
          department: 'Phòng Kỹ thuật',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasBiometric: true,
          hasPin: true,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ]

      vi.spyOn(adminEmployeeService, 'getAllEmployees').mockResolvedValue(mockMultiEmployees)
      const batchSpy = vi.spyOn(shiftAdminService, 'assignShiftBatch').mockResolvedValue({
        total: 1,
        successCount: 1,
        failedCount: 0,
        failures: [],
        assignments: [],
      })

      renderShiftManagementView()

      fireEvent.click(screen.getByTestId('tab-assignments-btn'))
      fireEvent.click(screen.getByTestId('open-assign-shift-drawer-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('assign-shift-drawer')).toBeTruthy()
      })

      // Chuyển sang chế độ Chọn Hàng Loạt
      fireEvent.click(screen.getByTestId('mode-multi-btn'))

      // Kiểm tra có ô tìm kiếm
      expect(screen.getByTestId('search-multi-employee-input')).toBeTruthy()

      // Chọn 1 nhân viên qua checkbox
      const checkbox101 = screen.getByTestId('checkbox-employee-101')
      fireEvent.click(checkbox101)

      // Kiểm tra badge hiển thị "Đã chọn 1 / 2 nhân sự"
      expect(screen.getByTestId('multi-selected-count').textContent).toContain('Đã chọn 1 / 2')

      // Chọn ca làm việc
      fireEvent.change(screen.getByTestId('select-assign-shift'), { target: { value: '1' } })

      // Bấm nút Phân ca hàng loạt
      fireEvent.click(screen.getByTestId('submit-assign-shift-btn'))

      await waitFor(() => {
        expect(batchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            employeeIds: [101],
            shiftId: 1,
          }),
          expect.any(Map),
          expect.any(Function)
        )
      })
    })
  })
})
