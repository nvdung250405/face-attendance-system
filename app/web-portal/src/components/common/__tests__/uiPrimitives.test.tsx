import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, Badge, Input, Modal, Card, CardHeader, CardTitle, CardContent, CardFooter, cn } from '../index'

describe('UI Primitives (Generic Subdomain UI Library)', () => {
  describe('cn utility', () => {
    it('kết hợp class và merge xung đột tailwind chính xác', () => {
      const isHidden = false
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
      expect(cn('text-red-500', isHidden && 'text-blue-500', 'font-bold')).toBe('text-red-500 font-bold')
    })
  })

  describe('Button component', () => {
    it('render nút bấm đúng variant và text', () => {
      render(<Button variant="primary">Xác nhận</Button>)
      const btn = screen.getByRole('button', { name: /Xác nhận/i })
      expect(btn).toBeDefined()
      expect(btn.className).toContain('bg-brand-primary')
    })

    it('hiển thị trạng thái loading và tự động disable nút', () => {
      render(
        <Button isLoading variant="primary">
          Đang tải
        </Button>
      )
      const btn = screen.getByRole('button') as HTMLButtonElement
      expect(btn.disabled).toBe(true)
      expect(btn.querySelector('.animate-spin')).toBeDefined()
    })

    it('kích hoạt sự kiện onClick khi được nhấn', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Bấm tôi</Button>)
      const btn = screen.getByRole('button', { name: /Bấm tôi/i })
      fireEvent.click(btn)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Badge component', () => {
    it('render badge đúng variant và hiển thị chấm dot', () => {
      const { container } = render(
        <Badge variant="success" dot>
          Hoạt động
        </Badge>
      )
      expect(screen.getByText('Hoạt động')).toBeDefined()
      expect(container.querySelector('.rounded-full')).toBeDefined()
      expect((container.firstChild as HTMLElement).className).toContain('text-emerald-800')
    })
  })

  describe('Input component', () => {
    it('render nhãn label và hỗ trợ nhập liệu', () => {
      render(<Input label="Họ và tên" placeholder="Nhập tên của bạn" />)
      expect(screen.getByLabelText('Họ và tên')).toBeDefined()
      const input = screen.getByPlaceholderText('Nhập tên của bạn') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Nguyễn Văn A' } })
      expect(input.value).toBe('Nguyễn Văn A')
    })

    it('hiển thị thông báo lỗi khi có prop error', () => {
      render(<Input error="Trường này là bắt buộc" />)
      expect(screen.getByText('Trường này là bắt buộc')).toBeDefined()
    })
  })

  describe('Modal component', () => {
    it('không render khi isOpen là false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Tiêu đề Modal">
          Nội dung modal
        </Modal>
      )
      expect(screen.queryByText('Tiêu đề Modal')).toBeNull()
    })

    it('render đầy đủ tiêu đề, nội dung và đóng khi bấm nút đóng hoặc phím ESC', () => {
      const handleClose = vi.fn()
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Xác nhận cấp lại PIN"
          footer={<Button onClick={handleClose}>Hoàn tất</Button>}
        >
          Bạn có chắc chắn muốn tiếp tục?
        </Modal>
      )

      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByText('Xác nhận cấp lại PIN')).toBeDefined()
      expect(screen.getByText('Bạn có chắc chắn muốn tiếp tục?')).toBeDefined()

      // Bấm nút đóng X
      const closeBtn = screen.getByLabelText('Đóng')
      fireEvent.click(closeBtn)
      expect(handleClose).toHaveBeenCalledTimes(1)

      // Nhấn ESC
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(2)
    })
  })

  describe('Card component', () => {
    it('render cấu trúc card đầy đủ', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Thẻ thống kê</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Dữ liệu chấm công hôm nay</p>
          </CardContent>
          <CardFooter>
            <button>Chi tiết</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Thẻ thống kê')).toBeDefined()
      expect(screen.getByText('Dữ liệu chấm công hôm nay')).toBeDefined()
      expect(screen.getByText('Chi tiết')).toBeDefined()
    })
  })
})
