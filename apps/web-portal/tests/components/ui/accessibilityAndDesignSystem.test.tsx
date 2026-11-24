/**
 * Test Suite: Web Portal Accessibility & Design System Standards
 * (FINDING-A11Y-001, FINDING-A11Y-002, FINDING-A11Y-003, FINDING-A11Y-004,
 *  FINDING-A11Y-005, FINDING-A11Y-006, FINDING-A11Y-008, FINDING-A11Y-009)
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ToastCard } from '@/components/ui/toast'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { LoginView } from '@/views/auth/LoginView'
import { PinManagementModal } from '@/components/account/PinManagementModal'
import { apiClient } from '@/services/apiClient'
import { useAuthStore } from '@/store/authStore'
import type { ToastItem } from '@/store/toastStore'

describe('Web Portal Accessibility & Design System Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      session: null,
      user: null,
      isAuthenticated: false,
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('1. FINDING-A11Y-001 & FINDING-A11Y-004 (Modal Focus Trapping & Dialog Titles)', () => {
    it('DialogContent gắn vào Portal body mà không dùng usePortal={false}', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent data-testid="a11y-dialog-content">
            <DialogHeader>
              <DialogTitle>Tiêu đề hộp thoại mẫu</DialogTitle>
              <DialogDescription>Mô tả chi tiết nội dung hộp thoại</DialogDescription>
            </DialogHeader>
            <div>Nội dung bên trong dialog</div>
          </DialogContent>
        </Dialog>
      )

      // Đối tượng được render trong Radix Portal container trên body
      const dialogEl = screen.getByTestId('a11y-dialog-content')
      expect(dialogEl).toBeTruthy()
      expect(document.body.contains(dialogEl)).toBe(true)

      // Tiêu đề và mô tả có mặt đáp ứng yêu cầu trợ năng Radix Dialog
      expect(screen.getByText('Tiêu đề hộp thoại mẫu')).toBeTruthy()
      expect(screen.getByText('Mô tả chi tiết nội dung hộp thoại')).toBeTruthy()
    })

    it('nút đóng Dialog có kích thước tối thiểu 44x44px và lớp focus visible ring (A11Y-002 & A11Y-003)', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Hộp thoại kiểm tra nút đóng</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const closeBtn = screen.getByRole('button', { name: 'Đóng' })
      expect(closeBtn.className).toContain('min-w-[44px]')
      expect(closeBtn.className).toContain('min-h-[44px]')
      expect(closeBtn.className).toContain('focus-visible:ring-2')
      expect(closeBtn.className).toContain('focus-visible:ring-indigo-600')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('2. FINDING-A11Y-003 & FINDING-A11Y-002 (Touch Targets & Focus Rings)', () => {
    it('nút đóng Toast đáp ứng kích thước tối thiểu 44x44px và focus-visible ring', () => {
      const mockToast: ToastItem = {
        id: 'toast-1',
        type: 'info',
        message: 'Thông báo kiểm tra kích thước touch target',
        durationMs: 5000,
      }

      render(<ToastCard toast={mockToast} />)

      const closeBtn = screen.getByRole('button', { name: 'Đóng thông báo' })
      expect(closeBtn.className).toContain('min-w-[44px]')
      expect(closeBtn.className).toContain('min-h-[44px]')
      expect(closeBtn.className).toContain('focus-visible:ring-2')
      expect(closeBtn.className).toContain('focus-visible:ring-indigo-600')
    })

    it('các nút điều hướng phân trang và dropdown kích thước trang đáp ứng >= 44px và focus visible', () => {
      render(
        <PaginationBar
          page={1}
          totalPages={5}
          pageSize={10}
          totalElements={50}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
        />
      )

      const prevBtn = screen.getByTestId('prev-page-btn')
      const nextBtn = screen.getByTestId('next-page-btn')
      const sizeSelect = screen.getByTestId('page-size-select')

      // Touch target >= 44x44px
      expect(prevBtn.className).toContain('min-h-[44px]')
      expect(prevBtn.className).toContain('min-w-[44px]')
      expect(nextBtn.className).toContain('min-h-[44px]')
      expect(nextBtn.className).toContain('min-w-[44px]')
      expect(sizeSelect.className).toContain('min-h-[44px]')

      // Visible focus rings
      expect(prevBtn.className).toContain('focus-visible:ring-2')
      expect(nextBtn.className).toContain('focus-visible:ring-2')
      expect(sizeSelect.className).toContain('focus-visible:ring-2')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('3. FINDING-A11Y-006 (Assertive Error Roles & Polite Status)', () => {
    it('Toast loại "error" sử dụng role="alert" và aria-live="assertive"', () => {
      const errorToast: ToastItem = {
        id: 'toast-err',
        type: 'error',
        message: 'Lỗi xác thực hệ thống nghiêm trọng',
        durationMs: 5000,
      }

      render(<ToastCard toast={errorToast} />)

      const toastEl = screen.getByTestId('toast-error')
      expect(toastEl.getAttribute('role')).toBe('alert')
      expect(toastEl.getAttribute('aria-live')).toBe('assertive')
    })

    it('Toast loại "success" và "info" sử dụng role="status" và aria-live="polite"', () => {
      const successToast: ToastItem = {
        id: 'toast-suc',
        type: 'success',
        message: 'Thao tác hoàn thành xuất sắc',
        durationMs: 5000,
      }

      render(<ToastCard toast={successToast} />)

      const toastEl = screen.getByTestId('toast-success')
      expect(toastEl.getAttribute('role')).toBe('status')
      expect(toastEl.getAttribute('aria-live')).toBe('polite')
    })

    it('LoginView hiển thị banner thông báo lỗi với role="alert" và aria-live="assertive"', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Tài khoản hoặc mật khẩu không chính xác' },
        },
      })

      render(
        <MemoryRouter>
          <LoginView />
        </MemoryRouter>
      )

      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'wrong@company.com' },
      })
      fireEvent.change(screen.getByLabelText(/Mật khẩu/i), {
        target: { value: 'wrongpass' },
      })
      fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }))

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeTruthy()
        expect(errorAlert.getAttribute('aria-live')).toBe('assertive')
        expect(errorAlert.textContent).toContain('Tài khoản hoặc mật khẩu không chính xác')
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('4. FINDING-A11Y-008 (PIN Keypad Accessibility)', () => {
    it('vùng hiển thị chấm PIN có role="status", aria-live="polite" và aria-label thông tin số lượng', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 1,
          employeeCode: 'NV-001',
          fullName: 'Test User',
          email: 'test@fas.vn',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasPin: false,
        },
      })

      render(<PinManagementModal isOpen={true} onClose={vi.fn()} />)

      const dotsContainer = screen.getByTestId('pin-dots-display')
      expect(dotsContainer.getAttribute('role')).toBe('status')
      expect(dotsContainer.getAttribute('aria-live')).toBe('polite')
      expect(dotsContainer.getAttribute('aria-label')).toContain('đã nhập 0 trên 6 số')
    })

    it('các nút bàn phím số ảo và nút xóa có aria-label rõ ràng cho trình đọc màn hình', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 1,
          employeeCode: 'NV-001',
          fullName: 'Test User',
          email: 'test@fas.vn',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          hasPin: false,
        },
      })

      render(<PinManagementModal isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByTestId('keypad-btn-1').getAttribute('aria-label')).toBe('Số 1')
      expect(screen.getByTestId('keypad-btn-0').getAttribute('aria-label')).toBe('Số 0')
      expect(screen.getByTestId('keypad-btn-clear').getAttribute('aria-label')).toBe('Xóa toàn bộ mã PIN')
      expect(screen.getByTestId('keypad-btn-backspace').getAttribute('aria-label')).toBe('Xóa lùi một số')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  describe('5. FINDING-A11Y-009 (Login Autofill & Invalid State)', () => {
    it('các ô nhập Email và Password cấu hình đúng thuộc tính autoComplete', () => {
      render(
        <MemoryRouter>
          <LoginView />
        </MemoryRouter>
      )

      const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/Mật khẩu/i) as HTMLInputElement

      expect(emailInput.getAttribute('autocomplete')).toBe('username')
      expect(passwordInput.getAttribute('autocomplete')).toBe('current-password')
    })

    it('gán cờ aria-invalid="true" khi phát hiện lỗi đăng nhập', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Tài khoản không tồn tại' },
        },
      })

      render(
        <MemoryRouter>
          <LoginView />
        </MemoryRouter>
      )

      const emailInput = screen.getByLabelText(/Email/i)
      const passwordInput = screen.getByLabelText(/Mật khẩu/i)

      expect(emailInput.getAttribute('aria-invalid')).toBe('false')
      expect(passwordInput.getAttribute('aria-invalid')).toBe('false')

      fireEvent.change(emailInput, { target: { value: 'notfound@company.com' } })
      fireEvent.change(passwordInput, { target: { value: 'secret' } })
      fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }))

      await waitFor(() => {
        expect(emailInput.getAttribute('aria-invalid')).toBe('true')
        expect(passwordInput.getAttribute('aria-invalid')).toBe('true')
      })
    })
  })
})
