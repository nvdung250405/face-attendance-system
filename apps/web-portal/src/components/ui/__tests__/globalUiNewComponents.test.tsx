import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  toast,
  Toaster,
  Checkbox,
  Switch,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui'
import { GlobalErrorBoundary } from '@/components/fallback/GlobalErrorBoundary'
import { LogoutConfirmModal } from '@/components/account/LogoutConfirmModal'
import { useToastStore } from '@/store/toastStore'
import { logoutService } from '@/services/logoutService'

// Component lỗi giả lập để test Error Boundary
const BombComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Cố tình kích hoạt lỗi runtime giả lập!')
  }
  return <div data-testid="bomb-safe">Nội dung an toàn bình thường</div>
}

describe('Kiểm thử Toàn Diện Hệ Thống UI Toàn Cục Mới (Global UI Master Plan)', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts()
    vi.clearAllMocks()
  })

  describe('1. Global Toast System (toast & Toaster)', () => {
    it('hiển thị đầy đủ 4 trạng thái Toast: success, error, warning, info', async () => {
      render(<Toaster />)

      toast.success('Thao tác thành công!')
      toast.error('Có lỗi xảy ra!')
      toast.warning('Cảnh báo hệ thống!')
      toast.info('Thông tin mới nhất!')

      expect(await screen.findByText('Thao tác thành công!')).toBeDefined()
      expect(screen.getByText('Có lỗi xảy ra!')).toBeDefined()
      expect(screen.getByText('Cảnh báo hệ thống!')).toBeDefined()
      expect(screen.getByText('Thông tin mới nhất!')).toBeDefined()
    })

    it('cho phép bấm nút đóng để gỡ bỏ Toast', async () => {
      render(<Toaster />)
      toast.info('Thông báo sẽ được đóng')

      expect(await screen.findByText('Thông báo sẽ được đóng')).toBeDefined()
      const closeBtn = screen.getByRole('button', { name: 'Đóng thông báo' })
      fireEvent.click(closeBtn)

      await waitFor(() => {
        expect(screen.queryByText('Thông báo sẽ được đóng')).toBeNull()
      })
    })
  })

  describe('2. Global Error Boundary (Trang Lỗi 500 Thân Thiện)', () => {
    it('hiển thị màn hình 500 khi component con bị văng lỗi runtime unhandled', () => {
      // Ẩn log console.error của React trong lúc test
      const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <GlobalErrorBoundary>
          <BombComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByTestId('global-error-boundary-screen')).toBeDefined()
      expect(screen.getByText(/Lỗi hệ thống 500/i)).toBeDefined()
      expect(screen.getByText(/Đã xảy ra sự cố ngoài ý muốn/i)).toBeDefined()
      expect(screen.getByRole('button', { name: /Tải lại trang/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Về trang chủ/i })).toBeDefined()

      spyConsole.mockRestore()
    })

    it('hiển thị nội dung bình thường khi không có lỗi', () => {
      render(
        <GlobalErrorBoundary>
          <BombComponent shouldThrow={false} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByTestId('bomb-safe')).toBeDefined()
      expect(screen.queryByTestId('global-error-boundary-screen')).toBeNull()
    })
  })

  describe('3. LogoutConfirmModal (Xác Nhận Đăng Xuất An Toàn)', () => {
    it('mở modal xác nhận và gọi logoutService khi bấm Đăng xuất', async () => {
      const logoutSpy = vi.spyOn(logoutService, 'logout').mockResolvedValueOnce(undefined)
      const onClose = vi.fn()

      render(
        <MemoryRouter>
          <LogoutConfirmModal isOpen={true} onClose={onClose} />
        </MemoryRouter>
      )

      expect(screen.getByTestId('logout-confirm-modal')).toBeDefined()
      expect(screen.getByText('Xác nhận đăng xuất')).toBeDefined()

      const confirmBtn = screen.getByTestId('btn-confirm-logout')
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('cho phép hủy bỏ đóng modal khi bấm Ở lại', () => {
      const onClose = vi.fn()
      render(
        <MemoryRouter>
          <LogoutConfirmModal isOpen={true} onClose={onClose} />
        </MemoryRouter>
      )

      const cancelBtn = screen.getByTestId('btn-cancel-logout')
      fireEvent.click(cancelBtn)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('4. Checkbox & Switch Primitives', () => {
    it('Checkbox render đúng label, description và thay đổi trạng thái checked', () => {
      const onChange = vi.fn()
      render(
        <Checkbox
          label="Đồng ý điều khoản"
          description="Tôi cam kết tuân thủ chính sách"
          onChange={onChange}
        />
      )

      const checkbox = screen.getByRole('checkbox', { name: /Đồng ý điều khoản/i })
      expect(checkbox).toBeDefined()
      fireEvent.click(checkbox)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('Switch render đúng label và phản hồi toggle click', () => {
      const onChange = vi.fn()
      render(<Switch label="Bật thông báo đẩy" onChange={onChange} />)

      const switchInput = screen.getByRole('checkbox', { name: /Bật thông báo đẩy/i })
      expect(switchInput).toBeDefined()
      fireEvent.click(switchInput)
      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('5. Tooltip Primitive', () => {
    it('TooltipProvider và Tooltip render trigger hợp lệ', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button">Hover me</button>
            </TooltipTrigger>
            <TooltipContent>Gợi ý công cụ</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      expect(screen.getByRole('button', { name: 'Hover me' })).toBeDefined()
    })
  })
})
