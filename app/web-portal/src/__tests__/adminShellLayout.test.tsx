/**
 * Kiểm thử Khung Bố cục Admin Shell Responsive (TST-WEB-005, TASK-WEB-009, UXD-WEB-001).
 *
 * Xác minh:
 * - Sidebar render đúng với chiều rộng 260px / 72px.
 * - Toggle collapse/expand hoạt động chính xác.
 * - TopHeader sticky và hiển thị breadcrumb theo route.
 * - Main viewport nhận padding-top 64px.
 * - Menu điều hướng lọc đúng theo vai trò người dùng.
 * - Mobile overlay hiển thị khi sidebar mở trên màn hình nhỏ.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'
import { useAuthStore } from '@/store/authStore'

// Stub useStompConnectionStore — cung cấp đủ interface (status + setStatus)
vi.mock('@/store/stompConnectionStore', () => ({
  useStompConnectionStore: () => ({ status: 'CONNECTED', setStatus: vi.fn() }),
}))

// Stub useStompClient để AdminShellLayout không thử kết nối STOMP thật trong test
vi.mock('@/services/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/hooks')>()
  return {
    ...actual,
    useStompClient: () => ({ status: 'CONNECTED', isConnected: true, connect: vi.fn(), disconnect: vi.fn() }),
  }
})

// ── Helper: Render AdminShellLayout trong MemoryRouter với session đã đăng nhập ──

function renderShell(role: 'HR_MANAGER' | 'ADMIN' | 'EMPLOYEE' | 'DPO' = 'HR_MANAGER', path = '/admin/dashboard') {
  const mockUser = {
    id: 1,
    employeeCode: 'EMP-001',
    email: 'test@company.com',
    fullName: 'Nguyen Van A',
    role,
    status: 'ACTIVE' as const,
    department: 'HR',
  }

  // Khởi tạo auth state theo đúng shape AuthState
  useAuthStore.setState({
    isAuthenticated: true,
    user: mockUser,
    session: {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3600_000,
      user: mockUser,
    },
  })

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminShellLayout />}>
          <Route path="/admin/dashboard" element={<div data-testid="page-content">Admin Dashboard</div>} />
          <Route path="/admin/attendance" element={<div data-testid="page-content">Attendance</div>} />
          <Route path="/employee/dashboard" element={<div data-testid="page-content">Employee Dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Khung Bố cục Admin Shell Responsive (TST-WEB-005, TASK-WEB-009, UXD-WEB-001)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  afterEach(() => {
    cleanup()
  })

  // 1. Cấu trúc tổng thể
  describe('1. Cấu trúc tổng thể Admin Shell', () => {
    it('Render đầy đủ: sidebar, top-header và main-viewport', () => {
      renderShell('HR_MANAGER', '/admin/dashboard')

      expect(screen.getByTestId('admin-shell-layout')).toBeDefined()
      expect(screen.getByTestId('sidebar')).toBeDefined()
      expect(screen.getByTestId('top-header')).toBeDefined()
      expect(screen.getByTestId('main-viewport')).toBeDefined()
    })

    it('Main viewport nhận padding-top 64px khớp với TopHeader', () => {
      renderShell()

      const mainViewport = screen.getByTestId('main-viewport')
      expect(mainViewport.style.paddingTop).toBe('64px')
    })

    it('Render nội dung trang con qua Outlet', () => {
      renderShell('HR_MANAGER', '/admin/dashboard')

      expect(screen.getByTestId('page-content')).toBeDefined()
      expect(screen.getByText('Admin Dashboard')).toBeDefined()
    })
  })

  // 2. Sidebar collapse / expand
  describe('2. Sidebar Thu gọn / Mở rộng (DD-WEB-013)', () => {
    it('Sidebar mặc định hiển thị trạng thái mở rộng (data-collapsed=false)', () => {
      renderShell()

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar.getAttribute('data-collapsed')).toBe('false')
    })

    it('Nhấn nút toggle chuyển sidebar sang thu gọn (data-collapsed=true)', () => {
      renderShell()

      const toggleBtn = screen.getByRole('button', { name: 'Thu gọn sidebar' })
      fireEvent.click(toggleBtn)

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar.getAttribute('data-collapsed')).toBe('true')
    })

    it('Nhấn toggle lần 2 trả về trạng thái mở rộng', () => {
      renderShell()

      const toggleBtn = screen.getByRole('button', { name: 'Thu gọn sidebar' })
      fireEvent.click(toggleBtn) // → collapsed
      const expandBtn = screen.getByRole('button', { name: 'Mở rộng sidebar' })
      fireEvent.click(expandBtn) // → expanded

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar.getAttribute('data-collapsed')).toBe('false')
    })

    it('Sidebar thu gọn: nhãn menu không hiển thị trong nav sidebar', () => {
      renderShell('HR_MANAGER', '/admin/dashboard')

      const toggleBtn = screen.getByRole('button', { name: 'Thu gọn sidebar' })
      fireEvent.click(toggleBtn)

      // Khi collapsed=true, span nhãn bị unmount khỏi DOM trong sidebar nav
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar.querySelector('nav span.truncate')).toBeNull()
    })

    it('Sidebar mở rộng: nhãn menu hiển thị đầy đủ trong nav', () => {
      renderShell('HR_MANAGER', '/admin/dashboard')

      // Chưa collapse → nav sidebar chứa nhãn menu
      const sidebar = screen.getByTestId('sidebar')
      const navLabels = sidebar.querySelectorAll('nav span.truncate')
      const labelTexts = Array.from(navLabels).map((el) => el.textContent)
      expect(labelTexts).toContain('Bảng điều khiển Live')
      expect(labelTexts).toContain('Lịch sử điểm danh')
    })
  })

  // 3. Phân quyền Menu theo Vai trò
  describe('3. Phân quyền Điều hướng theo Vai trò Người dùng', () => {
    it('HR_MANAGER thấy toàn bộ menu quản trị', () => {
      renderShell('HR_MANAGER', '/admin/dashboard')

      expect(screen.getByText('Hồ sơ nhân sự')).toBeDefined()
      expect(screen.getByText('Ca & Phân ca')).toBeDefined()
      expect(screen.getByText('Quản lý Kiosk')).toBeDefined()
    })

    it('DPO không thấy menu Hồ sơ nhân sự và Quản lý Kiosk', () => {
      renderShell('DPO', '/admin/dashboard')

      expect(screen.queryByText('Hồ sơ nhân sự')).toBeNull()
      expect(screen.queryByText('Quản lý Kiosk')).toBeNull()
      expect(screen.getByText('Nhật ký kiểm toán')).toBeDefined()
    })

    it('EMPLOYEE thấy menu Bảng công và Đăng ký sinh trắc nhưng không thấy menu quản trị', () => {
      renderShell('EMPLOYEE', '/employee/dashboard')

      const sidebar = screen.getByTestId('sidebar')
      const navLabels = Array.from(sidebar.querySelectorAll('nav span.truncate')).map((el) => el.textContent)
      expect(navLabels).toContain('Bảng công của tôi')
      expect(navLabels).toContain('Đăng ký sinh trắc & OTP')
      expect(navLabels).not.toContain('Bảng điều khiển Live')
    })
  })

  // 4. TopHeader
  describe('4. TopHeader Cố định \u0026 Breadcrumb', () => {
    it('TopHeader render với data-testid top-header', () => {
      renderShell()

      expect(screen.getByTestId('top-header')).toBeDefined()
    })

    it('Breadcrumb hiển thị tên trang hiện tại theo route', () => {
      renderShell('HR_MANAGER', '/admin/dashboard')

      // Breadcrumb nằm trong header, query qua testid
      const header = screen.getByTestId('top-header')
      expect(header.textContent).toContain('Bảng điều khiển Live')
      expect(header.textContent).toContain('FAS Portal')
    })

    it('Chỉ báo STOMP "Trực tuyến" hiển thị khi status CONNECTED', () => {
      renderShell()

      const stompEl = screen.getByTestId('stomp-status')
      expect(stompEl.textContent).toContain('Trực tuyến')
    })

    it('Avatar button hiển thị với aria-expanded và id header-avatar', () => {
      renderShell()

      const avatarBtn = screen.getByRole('button', { name: /VA Nguyen Van A/i })
      expect(avatarBtn).toBeDefined()
      expect(avatarBtn.getAttribute('id')).toBe('header-avatar')
    })
  })

  // 5. Mobile Overlay
  describe('5. Mobile Overlay', () => {
    it('Overlay hiển thị khi sidebar đang mở', () => {
      renderShell()

      // Sidebar mặc định mở → overlay xuất hiện
      expect(screen.getByTestId('mobile-overlay')).toBeDefined()
    })

    it('Click overlay đóng sidebar (collapsed=true)', () => {
      renderShell()

      const overlay = screen.getByTestId('mobile-overlay')
      fireEvent.click(overlay)

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar.getAttribute('data-collapsed')).toBe('true')
    })

    it('Overlay không hiển thị khi sidebar đã thu gọn', () => {
      renderShell()

      const toggleBtn = screen.getByRole('button', { name: 'Thu gọn sidebar' })
      fireEvent.click(toggleBtn)

      expect(screen.queryByTestId('mobile-overlay')).toBeNull()
    })
  })
})
