/**
 * Bộ Kiểm thử Toàn diện: Màn hình Đổi mật khẩu Bắt buộc, Consent & Tuân thủ
 * (TASK-WEB-029, BLD-WEB-024, UI-WEB-008, APD-WEB-006, SOL-WEB-001, UXD-WEB-008).
 *
 * Kiểm thử:
 * 1. Cơ chế Blocking Route Guard khi mustChangePassword === true.
 * 2. Màn hình ForceChangePasswordView: Thanh đo độ mạnh mật khẩu, validation, cập nhật credentialService, xóa cờ mustChangePassword.
 * 3. Hộp thoại PinManagementModal: Bàn phím số ảo (Virtual Numeric Keypad) 3x4, quy trình 2 bước, setup & reset PIN.
 * 4. Tích hợp TopHeader & EmployeeConsentView mở PinManagementModal.
 * 5. Tuân thủ bảo mật: Secret Token chỉ hiển thị 1 lần trong RAM Kiosk, Role DPO chỉ đọc.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ChangePasswordModal } from '@/components/account/ChangePasswordModal'
import { PinManagementModal } from '@/components/account/PinManagementModal'
import { TopHeader } from '@/components/layout/TopHeader'
import { EmployeeConsentView } from '@/views/employee/EmployeeConsentView'
import { AdminKioskManagementView } from '@/views/admin/AdminKioskManagementView'
import { AdminAuditLogView } from '@/views/admin/AdminAuditLogView'
import { useAuthStore } from '@/store/authStore'
import { useKioskRegistryStore } from '@/store/kioskRegistryStore'
import { credentialService } from '@/services/credentialService'
import { complianceAdminService } from '@/services/complianceAdminService'
import type { UserProfile, KioskItemResponse } from '@/types'

// Mock STOMP Connection store cho TopHeader
vi.mock('@/store/stompConnectionStore', () => ({
  useStompConnectionStore: () => ({ status: 'CONNECTED', setStatus: vi.fn() }),
}))

// Mock notification service
vi.mock('@/services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue([]),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
  },
}))

describe('TASK-WEB-029: Force Change Password, PIN Management & Compliance', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    window.confirm = vi.fn().mockReturnValue(true)
    window.alert = vi.fn()
    useKioskRegistryStore.getState().clearStore()
  })

  afterEach(() => {
    cleanup()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN 1: ROUTE GUARD THEO DD-WEB-018 & FR-WEB-009 (KHÔNG CHẶN ĐIỀU HƯỚNG)
  // ────────────────────────────────────────────────────────────────────────────
  describe('1. Không chặn điều hướng với mustChangePassword (DD-WEB-018, FR-WEB-009)', () => {
    it('Cho phép truy cập bình thường vào dashboard nhân viên ngay cả khi user.mustChangePassword === true', () => {
      const mockUser: UserProfile = {
        id: 10,
        employeeCode: 'NV-NEW-001',
        fullName: 'Nguyễn Văn Mới',
        email: 'new.emp@company.com',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        department: 'Khối Sản xuất',
        mustChangePassword: true,
      }

      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
      })

      render(
        <MemoryRouter initialEntries={['/employee/dashboard']}>
          <Routes>
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <div data-testid="employee-dashboard-content">Bảng điều khiển nhân viên</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByTestId('employee-dashboard-content')).toBeTruthy()
    })

    it('Cho phép truy cập bình thường khi user.mustChangePassword không bật hoặc false', () => {
      const mockUser: UserProfile = {
        id: 11,
        employeeCode: 'NV-OLD-002',
        fullName: 'Trần Văn Cũ',
        email: 'old.emp@company.com',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        department: 'Khối Kinh doanh',
        mustChangePassword: false,
      }

      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
      })

      render(
        <MemoryRouter initialEntries={['/employee/dashboard']}>
          <Routes>
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <div data-testid="employee-dashboard-content">Bảng điều khiển nhân viên</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByTestId('employee-dashboard-content')).toBeTruthy()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN 2: HỘP THOẠI ĐỔI MẬT KHẨU TỰ NGUYỆN (MOD-WEB-01, ChangePasswordModal.tsx)
  // ────────────────────────────────────────────────────────────────────────────
  describe('2. Hộp thoại Đổi mật khẩu tự nguyện ChangePasswordModal (UXD-WEB-008, MOD-WEB-01)', () => {
    it('Render giao diện dialog, có nút Đóng (X), hiển thị cảnh báo thu hồi phiên', () => {
      render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByTestId('change-password-modal')).toBeTruthy()
      expect(screen.getByText('Đổi mật khẩu tài khoản')).toBeTruthy()
      expect(screen.getByText(/Lưu ý thu hồi phiên/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /đóng/i })).toBeTruthy()
      expect(screen.getByTestId('btn-submit-change-password')).toBeTruthy()
    })

    it('Xác thực validation lỗi: mật khẩu cũ trống, độ dài ngắn, trùng mật khẩu cũ, xác nhận không khớp', async () => {
      const { container } = render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />)
      const form = container.querySelector('form')!

      // 1. Trống mật khẩu cũ
      fireEvent.submit(form)
      expect(screen.getByTestId('change-password-error').textContent).toContain(
        'Vui lòng nhập mật khẩu hiện tại.'
      )

      // 2. Mật khẩu mới quá ngắn (< 8 ký tự)
      fireEvent.change(screen.getByTestId('input-old-password'), {
        target: { value: 'Temp123456!' },
      })
      fireEvent.change(screen.getByTestId('input-new-password'), {
        target: { value: '123' },
      })
      fireEvent.submit(form)
      expect(screen.getByTestId('change-password-error').textContent).toContain(
        'Mật khẩu mới phải có tối thiểu 8 ký tự.'
      )

      // 3. Trùng mật khẩu cũ
      fireEvent.change(screen.getByTestId('input-new-password'), {
        target: { value: 'Temp123456!' },
      })
      fireEvent.change(screen.getByTestId('input-confirm-password'), {
        target: { value: 'Temp123456!' },
      })
      fireEvent.submit(form)
      expect(screen.getByTestId('change-password-error').textContent).toContain(
        'Mật khẩu mới không được trùng với mật khẩu hiện tại.'
      )

      // 4. Mật khẩu xác nhận không khớp
      fireEvent.change(screen.getByTestId('input-new-password'), {
        target: { value: 'NewSecurePass@2026' },
      })
      fireEvent.change(screen.getByTestId('input-confirm-password'), {
        target: { value: 'DifferentPass@2026' },
      })
      fireEvent.submit(form)
      expect(screen.getByTestId('change-password-error').textContent).toContain(
        'Xác nhận mật khẩu mới không khớp.'
      )
    })

    it('Đổi mật khẩu thành công: gọi credentialService.changePassword và hiển thị thông báo thành công', async () => {
      const mockChangePassword = vi
        .spyOn(credentialService, 'changePassword')
        .mockResolvedValueOnce({
          message: 'Đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được thu hồi.',
          sessionsRevoked: true,
        })
      const onSuccessMock = vi.fn()

      render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccessMock} />)

      fireEvent.change(screen.getByTestId('input-old-password'), {
        target: { value: 'TempOldSecret#123' },
      })
      fireEvent.change(screen.getByTestId('input-new-password'), {
        target: { value: 'NewSuperPass#2026' },
      })
      fireEvent.change(screen.getByTestId('input-confirm-password'), {
        target: { value: 'NewSuperPass#2026' },
      })

      fireEvent.click(screen.getByTestId('btn-submit-change-password'))

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          oldPassword: 'TempOldSecret#123',
          newPassword: 'NewSuperPass#2026',
        })
      })

      expect(screen.getByTestId('change-password-success')).toBeTruthy()
      expect(onSuccessMock).toHaveBeenCalledTimes(1)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN 3: HỘP THOẠI PIN MANAGEMENT VỚI VIRTUAL NUMERIC KEYPAD (UI-WEB-008, APD-WEB-006)
  // ────────────────────────────────────────────────────────────────────────────
  describe('3. Bàn phím số ảo PinManagementModal (UI-WEB-008, APD-WEB-006)', () => {
    it('Thiết lập PIN lần đầu: Nhập 6 số qua bàn phím ảo, tự động chuyển sang xác nhận, submit gọi credentialService.setupPin', async () => {
      const mockSetupPin = vi.spyOn(credentialService, 'setupPin').mockResolvedValueOnce({
        message: 'Thiết lập mã PIN thành công',
        hasPin: true,
      })

      const handleSuccess = vi.fn()
      const handleClose = vi.fn()

      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 14,
          employeeCode: 'NV-PIN-001',
          fullName: 'Người Dùng Chưa Có PIN',
          email: 'nopin@company.com',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          department: 'Phòng Kỹ thuật',
          hasPin: false,
        },
      })

      render(
        <PinManagementModal
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )

      expect(screen.getByTestId('pin-management-modal')).toBeTruthy()
      expect(screen.getByText('Bước 1: Nhập 6 số PIN mới')).toBeTruthy()
      expect(screen.getByTestId('virtual-numeric-keypad')).toBeTruthy()

      // Bấm lần lượt 1, 2, 3, 4, 5, 6
      const digits = ['1', '2', '3', '4', '5', '6']
      digits.forEach((d) => {
        fireEvent.click(screen.getByTestId(`keypad-btn-${d}`))
      })

      // Chờ tự động chuyển sang bước 2 (confirm_pin)
      await waitFor(() => {
        expect(screen.getByText('Bước 2: Xác nhận lại 6 số PIN')).toBeTruthy()
      })

      // Nhập lại 1, 2, 3, 4, 5, 6
      digits.forEach((d) => {
        fireEvent.click(screen.getByTestId(`keypad-btn-${d}`))
      })

      // Bấm nút "Xác Nhận PIN"
      const confirmSubmitBtn = screen.getByTestId('submit-pin-confirm-btn')
      expect((confirmSubmitBtn as HTMLButtonElement).disabled).toBe(false)
      fireEvent.click(confirmSubmitBtn)

      await waitFor(() => {
        expect(mockSetupPin).toHaveBeenCalledWith({ pin: '123456' })
      })

      expect(screen.getByTestId('pin-modal-success')).toBeTruthy()
      expect(useAuthStore.getState().user?.hasPin).toBe(true)
      expect(handleSuccess).toHaveBeenCalledTimes(1)
    })

    it('Đặt lại PIN khi đã có PIN: yêu cầu xác thực mật khẩu tài khoản trước khi vào bàn phím ảo', async () => {
      const mockResetPin = vi.spyOn(credentialService, 'resetPin').mockResolvedValueOnce({
        message: 'Đặt lại mã PIN thành công',
        hasPin: true,
      })

      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 15,
          employeeCode: 'NV-PIN-HAS',
          fullName: 'Người Dùng Đã Có PIN',
          email: 'haspin@company.com',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          department: 'Phòng Kỹ thuật',
          hasPin: true,
        },
      })

      render(
        <PinManagementModal
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText('Đặt Lại Mã PIN Dự Phòng')).toBeTruthy()
      // Bước xác thực mật khẩu
      expect(screen.getByTestId('pin-verify-password-input')).toBeTruthy()

      // Nhập mật khẩu tài khoản và tiếp tục
      fireEvent.change(screen.getByTestId('pin-verify-password-input'), {
        target: { value: 'CurrentPassword@123' },
      })
      fireEvent.click(screen.getByTestId('submit-verify-password-btn'))

      // Chuyển sang bàn phím ảo
      expect(screen.getByTestId('virtual-numeric-keypad')).toBeTruthy()

      // Nhập mã PIN mới 654321
      ;['6', '5', '4', '3', '2', '1'].forEach((d) => {
        fireEvent.click(screen.getByTestId(`keypad-btn-${d}`))
      })

      await waitFor(() => {
        expect(screen.getByText('Bước 2: Xác nhận lại 6 số PIN')).toBeTruthy()
      })

      // Nhập lại mã PIN xác nhận 654321
      ;['6', '5', '4', '3', '2', '1'].forEach((d) => {
        fireEvent.click(screen.getByTestId(`keypad-btn-${d}`))
      })

      fireEvent.click(screen.getByTestId('submit-pin-confirm-btn'))

      await waitFor(() => {
        expect(mockResetPin).toHaveBeenCalledWith({
          currentPassword: 'CurrentPassword@123',
          newPin: '654321',
        })
      })

      expect(screen.getByTestId('pin-modal-success')).toBeTruthy()
    })

    it('Thao tác Backspace và Clear trên bàn phím ảo xóa số đúng cách', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 16,
          employeeCode: 'NV-KEYPAD-TEST',
          fullName: 'Keypad Tester',
          email: 'keypad@company.com',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          department: 'Phòng Kỹ thuật',
          hasPin: false,
        },
      })

      render(<PinManagementModal isOpen={true} onClose={vi.fn()} />)

      // Bấm số 7, 8, 9
      fireEvent.click(screen.getByTestId('keypad-btn-7'))
      fireEvent.click(screen.getByTestId('keypad-btn-8'))
      fireEvent.click(screen.getByTestId('keypad-btn-9'))

      // Bấm Backspace (xóa 9 còn 7, 8)
      fireEvent.click(screen.getByTestId('keypad-btn-backspace'))

      // Bấm Clear (xóa hết)
      fireEvent.click(screen.getByTestId('keypad-btn-clear'))

      // Vẫn ở bước 1 vì chưa đủ 6 số
      expect(screen.getByText('Bước 1: Nhập 6 số PIN mới')).toBeTruthy()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN 4: TÍCH HỢP ĐỔI PIN VÀO TOPHEADER & EMPLOYEE CONSENT VIEW
  // ────────────────────────────────────────────────────────────────────────────
  describe('4. Tích hợp quản lý PIN trong TopHeader & EmployeeConsentView', () => {
    it('TopHeader: Chọn "Thiết lập mã PIN" từ dropdown menu mở PinManagementModal', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 17,
          employeeCode: 'NV-HEADER-01',
          fullName: 'Header User',
          email: 'header@company.com',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          department: 'Phòng Kỹ thuật',
          hasPin: false,
        },
      })

      render(
        <MemoryRouter>
          <TopHeader sidebarWidth={240} />
        </MemoryRouter>
      )

      // Mở avatar dropdown
      fireEvent.click(screen.getByRole('button', { name: /Header User/i }))

      // Bấm menu item Thiết lập mã PIN
      const pinMenuItem = screen.getByTestId('header-manage-pin')
      expect(pinMenuItem.textContent).toContain('Thiết lập mã PIN')
      fireEvent.click(pinMenuItem)

      // Hộp thoại PinManagementModal xuất hiện
      expect(screen.getByTestId('pin-management-modal')).toBeTruthy()
    })

    it('EmployeeConsentView: Bấm nút "Thiết lập mã PIN" mở PinManagementModal', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 18,
          employeeCode: 'NV-CONSENT-PIN',
          fullName: 'Consent User',
          email: 'consent@company.com',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          department: 'Phòng Kỹ thuật',
          hasBiometric: true,
          hasPin: false,
        },
      })

      render(
        <MemoryRouter>
          <EmployeeConsentView />
        </MemoryRouter>
      )

      const openPinBtn = screen.getByTestId('open-pin-management-modal-btn')
      expect(openPinBtn.textContent).toContain('Thiết lập mã PIN')

      fireEvent.click(openPinBtn)
      expect(screen.getByTestId('pin-management-modal')).toBeTruthy()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // PHẦN 5: TUÂN THỦ DPO & BẢO MẬT TOKEN RAM KIOSK (BLD-WEB-024)
  // ────────────────────────────────────────────────────────────────────────────
  describe('5. Tuân thủ DPO & Bảo mật Token RAM Kiosk (BLD-WEB-024, DD-WEB-019)', () => {
    it('AdminKioskManagementView: Cấp lại Secret Token chỉ hiển thị 1 lần trong RAM và xóa khi đóng modal', async () => {
      const mockKiosks: KioskItemResponse[] = [
        {
          id: 101,
          kioskId: 'KSK-GATE-01',
          name: 'Kiosk Cổng 1',
          location: 'Cổng chính',
          ipAddress: '192.168.1.50',
          status: 'ONLINE',
          lastPingAt: new Date().toISOString(),
          appVersion: 'v2.0.0',
        },
      ]

      vi.spyOn(complianceAdminService, 'getKiosks').mockResolvedValue(mockKiosks)
      const mockUpdate = vi.spyOn(complianceAdminService, 'updateKiosk').mockResolvedValue({
        id: 101,
        kioskId: 'KSK-GATE-01',
        name: 'Kiosk Cổng 1',
        location: 'Cổng chính',
        status: 'ONLINE',
        secretToken: 'RAM_ONLY_SECRET_TOKEN_XYZ999',
      })

      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 1,
          employeeCode: 'ADM-01',
          fullName: 'System Administrator',
          email: 'admin@company.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          department: 'Phòng Quản trị Hệ thống',
        },
      })

      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('kiosk-row-KSK-GATE-01')).toBeTruthy()
      })

      // Bấm nút cấp lại token
      fireEvent.click(screen.getByTestId('reissue-token-btn-KSK-GATE-01'))

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(101, { resetSecretToken: true })
      })

      // Giá trị token hiển thị trong RAM dialog
      expect(screen.getByTestId('reissued-token-value').textContent).toContain(
        'RAM_ONLY_SECRET_TOKEN_XYZ999'
      )
      // Token tồn tại trong RAM store
      expect(useKioskRegistryStore.getState().secretTokens['KSK-GATE-01']).toBe(
        'RAM_ONLY_SECRET_TOKEN_XYZ999'
      )

      // Bấm đóng modal xác nhận an toàn
      fireEvent.click(screen.getByTestId('close-reissued-token-modal-btn'))

      // Kiểm tra token đã bị xóa sạch khỏi RAM store
      expect(useKioskRegistryStore.getState().secretTokens['KSK-GATE-01']).toBeUndefined()
    })

    it('AdminAuditLogView: Role DPO ở chế độ chỉ đọc, nhật ký bất biến', async () => {
      vi.spyOn(complianceAdminService, 'getAuditLogs').mockResolvedValue({
        content: [
          {
            id: 1001,
            actorId: 1,
            action: 'KIOSK_SECRET_REISSUED',
            actorEmail: 'admin@company.com',
            targetResource: 'KIOSK:KSK-GATE-01',
            ipAddress: '127.0.0.1',
            createdAt: new Date().toISOString(),
          },
        ],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 10,
        first: true,
        last: true,
      })

      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      // Kiểm tra banner chỉ đọc
      expect(screen.getByTestId('read-only-compliance-banner')).toBeTruthy()
      expect(screen.getByText('CHỈ ĐỌC')).toBeTruthy()

      await waitFor(() => {
        expect(screen.getByTestId('audit-row-1001')).toBeTruthy()
      })

      // Không có bất kỳ nút chỉnh sửa / xóa bản ghi kiểm toán nào
      expect(screen.queryByRole('button', { name: /xóa|chỉnh sửa|cập nhật log/i })).toBeNull()
    })
  })
})
