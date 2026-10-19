/**
 * Bộ Kiểm thử Toàn diện Module Vòng đời Tài khoản & Phiên
 * (TASK-WEB-024, BLD-WEB-018, SOL-WEB-006, SOL-WEB-010, DD-WEB-018, DD-WEB-004, UXD-WEB-006, UXD-WEB-008).
 *
 * Kiểm thử:
 * 1. TemporaryPasswordModal: Hiển thị duy nhất một lần, sao chép clipboard, không cache storage.
 * 2. ChangePasswordModal: Tính toán độ mạnh mật khẩu, validation, đổi tự nguyện không chặn điều hướng, cảnh báo thu hồi phiên.
 * 3. EmployeeDrawer: Form tạo/sửa hồ sơ nhân sự, bóc tách lỗi 409, truyền mật khẩu tạm cho modal.
 * 4. EmployeeManagementView: Tra cứu danh sách, bộ lọc, thao tác vô hiệu hóa và cấp lại mật khẩu.
 * 5. LogoutService & Multi-Tab Sync: Thu hồi phiên tại backend, dọn dẹp storage, đồng bộ đa tab, fallback khi lỗi mạng.
 * 6. Tích hợp TopHeader & Sidebar: Kích hoạt đổi mật khẩu và đăng xuất qua LogoutService.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  TemporaryPasswordModal,
  ChangePasswordModal,
  EmployeeDrawer,
  calculatePasswordStrength,
} from '@/components/account'
import { EmployeeManagementView } from '@/views/admin/EmployeeManagementView'
import { TopHeader } from '@/components/layout/TopHeader'
import { Sidebar } from '@/components/layout/Sidebar'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { credentialService } from '@/services/credentialService'
import { logoutService } from '@/services/logoutService'
import { apiClient, AUTH_STORAGE_KEY } from '@/services/apiClient'
import { safeLocalStorage, safeSessionStorage, STORAGE_KEYS } from '@/services/storage'
import { useAuthStore, setupMultiTabAuthSync } from '@/store/authStore'
import {
  mockEmployeeList,
  mockPaginatedEmployees,
  mockCreateEmployeeSuccess,
  mockResetCredentialsSuccess,
} from '@/mocks/fixtures'
import type { UserProfile, EmployeeItem } from '@/types'

// Mock STOMP Connection store cho TopHeader
vi.mock('@/store/stompConnectionStore', () => ({
  useStompConnectionStore: () => ({ status: 'CONNECTED', setStatus: vi.fn() }),
}))

// Helper thiết lập auth user
const setupAuthUser = (role: 'HR_MANAGER' | 'ADMIN' | 'EMPLOYEE' = 'HR_MANAGER') => {
  const mockUser: UserProfile = {
    id: 101,
    employeeCode: 'NV-HR-001',
    fullName: 'Nguyễn Quản Trị Nhân Sự',
    email: 'hr.manager@company.com',
    role,
    status: 'ACTIVE',
    department: 'Phòng Nhân sự',
    hasBiometric: true,
    hasPin: true,
  }

  useAuthStore.setState({
    isAuthenticated: true,
    user: mockUser,
    session: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3600_000,
      user: mockUser,
    },
  })

  safeLocalStorage.setItem(AUTH_STORAGE_KEY, {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    expiresAt: Date.now() + 3600_000,
    user: mockUser,
  })

  return mockUser
}

describe('Module Vòng đời Tài khoản & Phiên (TASK-WEB-024, BLD-WEB-018)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    safeLocalStorage.clear()
    safeSessionStorage.clear()
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      session: null,
      isInitialized: true,
    })
  })

  afterEach(() => {
    cleanup()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 1. TemporaryPasswordModal (DD-WEB-018, SOL-WEB-006)
  // ────────────────────────────────────────────────────────────────────────────
  describe('1. TemporaryPasswordModal (Hộp thoại Mật khẩu Tạm thời Hiển thị 1 Lần)', () => {
    it('hiển thị đúng thông tin mật khẩu tạm và cảnh báo bảo mật khi mở', () => {
      render(
        <TemporaryPasswordModal
          isOpen={true}
          temporaryPassword="InitTempPassword@123"
          employeeName="Ngô Văn Dũng"
          employeeCode="NV-1042"
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('temporary-password-modal')).toBeDefined()
      expect(screen.getByText('Mật khẩu tạm thời khởi tạo')).toBeDefined()
      expect(screen.getByText('InitTempPassword@123')).toBeDefined()
      expect(screen.getByText(/Ngô Văn Dũng/i)).toBeDefined()
      expect(screen.getByText(/NV-1042/i)).toBeDefined()
      expect(screen.getByText(/Cảnh báo hiển thị một lần/i)).toBeDefined()
    })

    it('không hiển thị gì nếu isOpen=false hoặc temporaryPassword null', () => {
      const { container } = render(
        <TemporaryPasswordModal
          isOpen={false}
          temporaryPassword="InitTempPassword@123"
          onClose={vi.fn()}
        />
      )
      expect(container.firstChild).toBeNull()
    })

    it('sao chép mật khẩu vào clipboard khi bấm nút Sao chép', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        configurable: true,
        writable: true,
      })

      render(
        <TemporaryPasswordModal
          isOpen={true}
          temporaryPassword="InitTempPassword@123"
          onClose={vi.fn()}
        />
      )

      const copyBtn = screen.getByTestId('btn-copy-temp-password')
      fireEvent.click(copyBtn)

      expect(writeTextMock).toHaveBeenCalledWith('InitTempPassword@123')
      await waitFor(() => {
        expect(screen.getByText(/Đã chép/i)).toBeDefined()
      })
    })

    it('gọi onClose khi nhấn nút đóng và tuyệt đối không ghi mật khẩu vào storage', () => {
      const onClose = vi.fn()
      render(
        <TemporaryPasswordModal
          isOpen={true}
          temporaryPassword="SecretTempPassword!999"
          onClose={onClose}
        />
      )

      const closeBtn = screen.getByTestId('btn-close-temp-password')
      fireEvent.click(closeBtn)

      expect(onClose).toHaveBeenCalledTimes(1)

      // RÀNG BUỘC BẢO MẬT: Mật khẩu tạm không được lưu trong storage
      expect(safeLocalStorage.getItem('temporaryPassword')).toBeNull()
      expect(safeSessionStorage.getItem('temporaryPassword')).toBeNull()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 2. ChangePasswordModal & Password Strength (UXD-WEB-008, DD-WEB-018)
  // ────────────────────────────────────────────────────────────────────────────
  describe('2. ChangePasswordModal (Luồng Đổi Mật khẩu Tự nguyện & Độ mạnh)', () => {
    it('calculatePasswordStrength tính toán đúng thang điểm và nhãn độ mạnh', () => {
      expect(calculatePasswordStrength('').score).toBe(0)
      expect(calculatePasswordStrength('12345').label).toBe('Rất yếu')
      expect(calculatePasswordStrength('Abcdefgh').label).toBe('Yếu')
      expect(calculatePasswordStrength('Abcdef12').label).toBe('Trung bình')
      expect(calculatePasswordStrength('Abcdef12@').label).toBe('Mạnh')
      expect(calculatePasswordStrength('Abcdef12@SuperStrong').label).toBe('Rất mạnh')
    })

    it('hiển thị hộp thoại kèm cảnh báo thu hồi phiên khi isOpen=true', () => {
      render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByTestId('change-password-modal')).toBeDefined()
      expect(screen.getByText('Đổi mật khẩu tài khoản')).toBeDefined()
      expect(screen.getByText(/Lưu ý thu hồi phiên/i)).toBeDefined()
      expect(screen.getByTestId('input-old-password')).toBeDefined()
      expect(screen.getByTestId('input-new-password')).toBeDefined()
      expect(screen.getByTestId('input-confirm-password')).toBeDefined()
    })

    it('báo lỗi khi mật khẩu mới dưới 8 ký tự hoặc trùng mật khẩu cũ', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />)

      fireEvent.change(screen.getByTestId('input-old-password'), { target: { value: 'CurrentPass@123' } })
      fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'short' } })
      fireEvent.change(screen.getByTestId('input-confirm-password'), { target: { value: 'short' } })
      fireEvent.click(screen.getByTestId('btn-submit-change-password'))

      await waitFor(() => {
        expect(screen.getByText('Mật khẩu mới phải có tối thiểu 8 ký tự.')).toBeDefined()
      })

      // Trường hợp trùng mật khẩu cũ
      fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'CurrentPass@123' } })
      fireEvent.change(screen.getByTestId('input-confirm-password'), { target: { value: 'CurrentPass@123' } })
      fireEvent.click(screen.getByTestId('btn-submit-change-password'))

      await waitFor(() => {
        expect(screen.getByText('Mật khẩu mới không được trùng với mật khẩu hiện tại.')).toBeDefined()
      })
    })

    it('báo lỗi khi xác nhận mật khẩu không khớp', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />)

      fireEvent.change(screen.getByTestId('input-old-password'), { target: { value: 'OldPass@123' } })
      fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'NewPass@456' } })
      fireEvent.change(screen.getByTestId('input-confirm-password'), { target: { value: 'NewPass@999' } })
      fireEvent.click(screen.getByTestId('btn-submit-change-password'))

      await waitFor(() => {
        expect(screen.getByText('Xác nhận mật khẩu mới không khớp.')).toBeDefined()
      })
    })

    it('gọi credentialService.changePassword và hiển thị thông báo thành công', async () => {
      const changePasswordSpy = vi.spyOn(credentialService, 'changePassword').mockResolvedValueOnce({
        message: 'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi.',
        sessionsRevoked: true,
      })

      const onSuccess = vi.fn()
      render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />)

      fireEvent.change(screen.getByTestId('input-old-password'), { target: { value: 'OldPass@123' } })
      fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'NewPass@456' } })
      fireEvent.change(screen.getByTestId('input-confirm-password'), { target: { value: 'NewPass@456' } })
      fireEvent.click(screen.getByTestId('btn-submit-change-password'))

      await waitFor(() => {
        expect(changePasswordSpy).toHaveBeenCalledWith({
          oldPassword: 'OldPass@123',
          newPassword: 'NewPass@456',
        })
        expect(screen.getByTestId('change-password-success')).toBeDefined()
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('cho phép hủy và đóng hộp thoại bất kỳ lúc nào (không chặn điều hướng - DD-WEB-018)', () => {
      const onClose = vi.fn()
      render(<ChangePasswordModal isOpen={true} onClose={onClose} />)

      const cancelBtn = screen.getByTestId('btn-cancel-change-password')
      fireEvent.click(cancelBtn)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 3. EmployeeDrawer (UXD-WEB-006, SOL-WEB-006)
  // ────────────────────────────────────────────────────────────────────────────
  describe('3. EmployeeDrawer (Khung Nhập liệu Tạo & Sửa Nhân sự)', () => {
    it('hiển thị form tạo mới và kiểm tra validation các trường bắt buộc', async () => {
      render(
        <EmployeeDrawer
          isOpen={true}
          mode="create"
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      )

      expect(screen.getByTestId('employee-drawer')).toBeDefined()
      expect(screen.getByText('Tạo mới hồ sơ nhân sự')).toBeDefined()

      // Xóa mã nhân viên đã được hệ thống tự động sinh để kiểm tra validation để trống
      fireEvent.change(screen.getByTestId('drawer-employee-code'), { target: { value: '' } })

      // Bấm lưu khi form rỗng
      fireEvent.click(screen.getByTestId('drawer-btn-submit'))

      await waitFor(() => {
        expect(screen.getByText('Mã nhân viên không được để trống')).toBeDefined()
        expect(screen.getByText('Họ và tên không được để trống')).toBeDefined()
        expect(screen.getByText('Email không được để trống')).toBeDefined()
      })
    })

    it('gọi adminEmployeeService.createEmployee và trả về temporaryPassword khi thành công', async () => {
      const createSpy = vi.spyOn(adminEmployeeService, 'createEmployee').mockResolvedValueOnce(
        mockCreateEmployeeSuccess.data
      )
      const onSuccess = vi.fn()
      const onClose = vi.fn()

      render(
        <EmployeeDrawer
          isOpen={true}
          mode="create"
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      fireEvent.change(screen.getByTestId('drawer-employee-code'), { target: { value: 'NV-1045' } })
      fireEvent.change(screen.getByTestId('drawer-full-name'), { target: { value: 'Hoàng Minh Tuấn' } })
      fireEvent.change(screen.getByTestId('drawer-email'), { target: { value: 'tuan.hm@company.com' } })
      fireEvent.change(screen.getByTestId('drawer-department'), { target: { value: 'Phòng Kỹ thuật' } })
      fireEvent.change(screen.getByTestId('drawer-role'), { target: { value: 'EMPLOYEE' } })

      fireEvent.click(screen.getByTestId('drawer-btn-submit'))

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({
          employeeCode: 'NV-1045',
          fullName: 'Hoàng Minh Tuấn',
          email: 'tuan.hm@company.com',
          department: 'Phòng Kỹ thuật',
          role: 'EMPLOYEE',
        })
        expect(onSuccess).toHaveBeenCalledWith({
          employee: mockCreateEmployeeSuccess.data.employee,
          temporaryPassword: 'TempPassword@123',
        })
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('hiển thị form chỉnh sửa với dữ liệu khởi tạo', async () => {
      const updateSpy = vi.spyOn(adminEmployeeService, 'updateEmployee').mockResolvedValueOnce({
        ...mockEmployeeList[0],
        fullName: 'Ngô Văn Dũng (Updated)',
      })

      const onSuccess = vi.fn()
      render(
        <EmployeeDrawer
          isOpen={true}
          mode="edit"
          initialData={mockEmployeeList[0]}
          onClose={vi.fn()}
          onSuccess={onSuccess}
        />
      )

      expect(screen.getByText('Chỉnh sửa hồ sơ nhân sự')).toBeDefined()
      const codeInput = screen.getByTestId('drawer-employee-code') as HTMLInputElement
      expect(codeInput.value).toBe('NV-1042')
      expect(codeInput.disabled).toBe(true)

      const nameInput = screen.getByTestId('drawer-full-name') as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'Ngô Văn Dũng (Updated)' } })
      fireEvent.click(screen.getByTestId('drawer-btn-submit'))

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(1, {
          fullName: 'Ngô Văn Dũng (Updated)',
          department: 'Phòng Kỹ thuật',
          role: 'EMPLOYEE',
        })
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('vô hiệu hóa đổi vai trò và hiển thị huy hiệu khi là ADMIN duy nhất (isLastActiveAdmin)', () => {
      const adminEmployee: EmployeeItem = {
        ...mockEmployeeList[0],
        role: 'ADMIN',
      }

      render(
        <EmployeeDrawer
          isOpen={true}
          mode="edit"
          initialData={adminEmployee}
          isLastActiveAdmin={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      )

      expect(screen.getByText('ADMIN duy nhất')).toBeDefined()
      expect(
        screen.getByText('Hệ thống yêu cầu duy trì ít nhất 1 Quản trị viên (ADMIN) đang hoạt động. Không thể chuyển sang vai trò khác.')
      ).toBeDefined()
      const roleSelect = screen.getByTestId('drawer-role') as HTMLSelectElement
      expect(roleSelect.disabled).toBe(true)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 4. EmployeeManagementView (Bảng Hồ sơ Nhân sự & Tác vụ)
  // ────────────────────────────────────────────────────────────────────────────
  describe('4. EmployeeManagementView (Màn hình Quản lý Danh mục & Vòng đời)', () => {
    it('tải danh sách nhân sự và hiển thị các hàng trong bảng', async () => {
      vi.spyOn(adminEmployeeService, 'getEmployees').mockResolvedValueOnce(mockPaginatedEmployees)

      render(<EmployeeManagementView />)

      expect(screen.getByText('Đang tải danh sách nhân sự...')).toBeDefined()

      await waitFor(() => {
        expect(screen.getByTestId('employee-table')).toBeDefined()
        expect(screen.getByText('NV-1042')).toBeDefined()
        expect(screen.getByText('Ngô Văn Dũng')).toBeDefined()
        expect(screen.getByText('NV-HR-001')).toBeDefined()
      })
    })

    it('tìm kiếm và lọc danh sách nhân sự theo từ khóa, phòng ban, vai trò', async () => {
      const getSpy = vi.spyOn(adminEmployeeService, 'getEmployees').mockResolvedValue(mockPaginatedEmployees)

      render(<EmployeeManagementView />)

      await waitFor(() => {
        expect(screen.getByTestId('employee-table')).toBeDefined()
      })

      // Gõ từ khóa tìm kiếm
      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'Dũng' } })

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            keyword: 'Dũng',
          })
        )
      })

      // Chọn lọc phòng ban
      const deptFilter = screen.getByTestId('filter-department')
      fireEvent.change(deptFilter, { target: { value: 'Phòng Kỹ thuật' } })

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            department: 'Phòng Kỹ thuật',
          })
        )
      })
    })

    it('bấm Cấp lại mật khẩu gọi resetCredentials và mở TemporaryPasswordModal', async () => {
      vi.spyOn(adminEmployeeService, 'getEmployees').mockResolvedValue(mockPaginatedEmployees)
      const resetSpy = vi.spyOn(adminEmployeeService, 'resetCredentials').mockResolvedValueOnce(
        mockResetCredentialsSuccess.data
      )
      window.confirm = vi.fn().mockReturnValue(true)

      render(<EmployeeManagementView />)

      await waitFor(() => {
        expect(screen.getByTestId('employee-row-1')).toBeDefined()
      })

      // Nút cấp lại mật khẩu cho nhân sự đầu tiên
      const resetBtn = screen.getByLabelText('Cấp lại mật khẩu cho Ngô Văn Dũng')
      fireEvent.click(resetBtn)

      // Xác nhận cấp lại mật khẩu trong Modal
      const confirmResetBtn = screen.getByTestId('btn-confirm-action')
      fireEvent.click(confirmResetBtn)

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledWith(1)
        expect(screen.getByTestId('temporary-password-modal')).toBeDefined()
        expect(screen.getByText('ResetTempPass#456')).toBeDefined()
      })
    })

    it('bấm Vô hiệu hóa/Kích hoạt gọi updateEmployeeStatus', async () => {
      vi.spyOn(adminEmployeeService, 'getEmployees').mockResolvedValue(mockPaginatedEmployees)
      const statusSpy = vi.spyOn(adminEmployeeService, 'updateEmployeeStatus').mockResolvedValueOnce({
        ...mockEmployeeList[0],
        status: 'INACTIVE',
      })
      window.confirm = vi.fn().mockReturnValue(true)

      render(<EmployeeManagementView />)

      await waitFor(() => {
        expect(screen.getByTestId('employee-row-1')).toBeDefined()
      })

      const toggleBtn = screen.getByLabelText('Vô hiệu hóa Ngô Văn Dũng')
      fireEvent.click(toggleBtn)

      // Xác nhận vô hiệu hóa trong Modal
      const confirmToggleBtn = screen.getByTestId('btn-confirm-action')
      fireEvent.click(confirmToggleBtn)

      await waitFor(() => {
        expect(statusSpy).toHaveBeenCalledWith(1, 'INACTIVE')
      })
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 5. LogoutService & Multi-Tab Synchronization (SOL-WEB-010, DD-WEB-004)
  // ────────────────────────────────────────────────────────────────────────────
  describe('5. LogoutService & Multi-Tab Synchronization (Thu hồi Phiên & Đa tab)', () => {
    it('logout gọi POST /api/v1/auth/logout kèm refreshToken và xóa sạch storage', async () => {
      setupAuthUser('HR_MANAGER')
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ status: 204 })

      await logoutService.logout()

      expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/logout', {
        refreshToken: 'mock-refresh-token',
      })

      // Storage và AuthStore đã được dọn sạch
      expect(safeLocalStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
      expect(safeSessionStorage.getItem(STORAGE_KEYS.CONSENT_SESSION)).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().session).toBeNull()
    })

    it('logout vẫn xóa sạch storage kể cả khi backend lỗi mạng hoặc trả HTTP error', async () => {
      setupAuthUser('EMPLOYEE')
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network Error'))

      await logoutService.logout()

      expect(safeLocalStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('setupMultiTabAuthSync tự động đăng xuất khi nhận sự kiện storage xóa session từ tab khác', () => {
      setupAuthUser('ADMIN')
      const cleanupSync = setupMultiTabAuthSync()

      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Giả lập sự kiện storage từ một tab trình duyệt khác gửi tới (newValue = null)
      const storageEvent = new StorageEvent('storage', {
        key: safeLocalStorage.formatKey(AUTH_STORAGE_KEY),
        newValue: null,
        oldValue: JSON.stringify({ accessToken: 'old-token' }),
      })
      window.dispatchEvent(storageEvent)

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().session).toBeNull()

      cleanupSync()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 6. Tích hợp TopHeader & Sidebar
  // ────────────────────────────────────────────────────────────────────────────
  describe('6. Tích hợp Đổi Mật khẩu & Đăng xuất trong TopHeader và Sidebar', () => {
    it('TopHeader mở ChangePasswordModal khi chọn Đổi mật khẩu trong dropdown', async () => {
      setupAuthUser('HR_MANAGER')

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <TopHeader sidebarWidth={260} />
        </MemoryRouter>
      )

      // Mở dropdown avatar
      const avatarBtn = screen.getByRole('button', { name: /Nguyễn Quản Trị Nhân Sự/i })
      fireEvent.click(avatarBtn)

      // Nút Đổi mật khẩu
      const changePwdBtn = screen.getByRole('menuitem', { name: /Đổi mật khẩu/i })
      fireEvent.click(changePwdBtn)

      await waitFor(() => {
        expect(screen.getByTestId('change-password-modal')).toBeDefined()
      })
    })

    it('TopHeader gọi logoutService.logout khi nhấn Đăng xuất', async () => {
      setupAuthUser('HR_MANAGER')
      const logoutSpy = vi.spyOn(logoutService, 'logout').mockResolvedValueOnce(undefined)

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <TopHeader sidebarWidth={260} />
        </MemoryRouter>
      )

      const avatarBtn = screen.getByRole('button', { name: /Nguyễn Quản Trị Nhân Sự/i })
      fireEvent.click(avatarBtn)

      const logoutBtn = screen.getByRole('menuitem', { name: /Đăng xuất/i })
      fireEvent.click(logoutBtn)

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalledTimes(1)
      })
    })

    it('Sidebar gọi logoutService.logout khi nhấn Đăng xuất', async () => {
      setupAuthUser('HR_MANAGER')
      const logoutSpy = vi.spyOn(logoutService, 'logout').mockResolvedValueOnce(undefined)

      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />
        </MemoryRouter>
      )

      const logoutBtn = screen.getByRole('button', { name: 'Đăng xuất' })
      fireEvent.click(logoutBtn)

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalledTimes(1)
      })
    })
  })
})
