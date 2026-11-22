import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  Button,
  Badge,
  Input,
  Modal,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  FilterToolbar,
  PaginationBar,
  ConfettiEffect,
} from '@/components/ui'
import { AttendanceStatusBadge } from '@/components/attendance'
import { cn } from '@/utils/cn'

describe('UI Primitives (Generic Subdomain UI Library)', () => {
  describe('cn utility', () => {
    it('kết hợp class và merge xung đột tailwind chính xác', () => {
      const isHidden = false
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
      expect(cn('text-red-500', isHidden && 'text-blue-500', 'font-bold')).toBe('text-red-500 font-bold')
    })
  })

  describe('Button component (4 Trạng thái: Default, Loading, Error, Disabled)', () => {
    it('áp dụng cursor-pointer để con trỏ chuột đổi thành bàn tay khi tương tác', () => {
      render(<Button variant="primary">Kiểm tra con trỏ</Button>)
      const btn = screen.getByRole('button', { name: /Kiểm tra con trỏ/i })
      expect(btn.className).toContain('cursor-pointer')
    })

    it('nút secondary và outline có đường viền border-slate-300 và shadow-xs rõ ràng', () => {
      render(
        <div>
          <Button variant="secondary" data-testid="btn-sec">
            Nút Secondary
          </Button>
          <Button variant="outline" data-testid="btn-out">
            Nút Outline
          </Button>
        </div>
      )
      const sec = screen.getByTestId('btn-sec')
      const out = screen.getByTestId('btn-out')
      expect(sec.className).toContain('border-slate-300')
      expect(sec.className).toContain('shadow-xs')
      expect(out.className).toContain('border-slate-300')
      expect(out.className).toContain('shadow-xs')
    })

    it('1. Trạng thái Default: render nút bấm đúng variant và text, kích hoạt onClick', () => {
      const handleClick = vi.fn()
      render(
        <Button variant="primary" onClick={handleClick}>
          Xác nhận
        </Button>
      )
      const btn = screen.getByRole('button', { name: /Xác nhận/i })
      expect(btn).toBeDefined()
      expect(btn.className).toContain('bg-brand-primary')
      fireEvent.click(btn)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('2. Trạng thái Loading: hiển thị spinner xoay, aria-busy và tự động disable nút', () => {
      render(
        <Button isLoading loadingText="Đang xử lý..." variant="primary">
          Đang tải
        </Button>
      )
      const btn = screen.getByRole('button') as HTMLButtonElement
      expect(btn.disabled).toBe(true)
      expect(btn.getAttribute('aria-busy')).toBe('true')
      expect(btn.querySelector('.animate-spin')).toBeDefined()
      expect(screen.getByText('Đang xử lý...')).toBeDefined()
    })

    it('3. Trạng thái Error: hiển thị viền/nền cảnh báo lỗi ngữ nghĩa và aria-invalid', () => {
      render(
        <Button isError variant="primary">
          Thất bại
        </Button>
      )
      const btn = screen.getByRole('button', { name: /Thất bại/i })
      expect(btn.getAttribute('aria-invalid')).toBe('true')
      expect(btn.className).toContain('border-status-danger')
      expect(btn.className).toContain('text-status-danger')
    })

    it('4. Trạng thái Disabled: vô hiệu hóa tương tác và có aria-disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Bị vô hiệu
        </Button>
      )
      const btn = screen.getByRole('button', { name: /Bị vô hiệu/i }) as HTMLButtonElement
      expect(btn.disabled).toBe(true)
      expect(btn.getAttribute('aria-disabled')).toBe('true')
      fireEvent.click(btn)
      expect(handleClick).not.toHaveBeenCalled()
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

  describe('Input component (4 Trạng thái: Default, Loading, Error, Disabled)', () => {
    it('1. Trạng thái Default: render nhãn label và hỗ trợ nhập liệu', () => {
      render(<Input label="Họ và tên" placeholder="Nhập tên của bạn" />)
      expect(screen.getByLabelText('Họ và tên')).toBeDefined()
      const input = screen.getByPlaceholderText('Nhập tên của bạn') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Nguyễn Văn A' } })
      expect(input.value).toBe('Nguyễn Văn A')
    })

    it('2. Trạng thái Loading: hiển thị spinner xoay ở góc phải, cursor wait và vô hiệu hóa nhập', () => {
      render(<Input label="Mã nhân viên" isLoading defaultValue="NV001" />)
      const input = screen.getByLabelText('Mã nhân viên') as HTMLInputElement
      expect(input.disabled).toBe(true)
      expect(input.getAttribute('aria-busy')).toBe('true')
      expect(screen.getByTestId('input-loading-spinner')).toBeDefined()
    })

    it('3. Trạng thái Error: hiển thị thông báo lỗi, viền status-danger và aria-invalid', () => {
      render(<Input label="Email" error="Trường này là bắt buộc" />)
      const input = screen.getByLabelText('Email') as HTMLInputElement
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.className).toContain('border-status-danger')
      expect(screen.getByText('Trường này là bắt buộc')).toBeDefined()
    })

    it('4. Trạng thái Disabled: vô hiệu hóa input, làm mờ label và có aria-disabled', () => {
      render(<Input label="Tên tài khoản" disabled defaultValue="admin" />)
      const input = screen.getByLabelText('Tên tài khoản') as HTMLInputElement
      expect(input.disabled).toBe(true)
      expect(input.getAttribute('aria-disabled')).toBe('true')
      expect(input.className).toContain('disabled:cursor-not-allowed')
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

  describe('Card component (4 Trạng thái: Default, Loading, Error, Disabled)', () => {
    it('1. Trạng thái Default: render cấu trúc card đầy đủ', () => {
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

    it('2. Trạng thái Loading: hiển thị overlay đang tải với spinner và aria-busy', () => {
      render(
        <Card isLoading loadingMessage="Đang tổng hợp ca làm việc...">
          <CardContent>
            <p>Nội dung ẩn dưới overlay</p>
          </CardContent>
        </Card>
      )
      const overlay = screen.getByTestId('card-loading-overlay')
      expect(overlay).toBeDefined()
      expect(screen.getByText('Đang tổng hợp ca làm việc...')).toBeDefined()
      const card = overlay.parentElement as HTMLElement
      expect(card.getAttribute('aria-busy')).toBe('true')
    })

    it('3. Trạng thái Error: hiển thị banner báo lỗi với role alert và nút Thử lại', () => {
      const handleRetry = vi.fn()
      render(
        <Card error="Mất kết nối máy chủ dữ liệu ca" onRetry={handleRetry}>
          <CardContent>
            <p>Nội dung thẻ</p>
          </CardContent>
        </Card>
      )
      const banner = screen.getByTestId('card-error-banner')
      expect(banner).toBeDefined()
      expect(screen.getByText('Mất kết nối máy chủ dữ liệu ca')).toBeDefined()
      const retryBtn = screen.getByRole('button', { name: /Thử lại/i })
      fireEvent.click(retryBtn)
      expect(handleRetry).toHaveBeenCalledTimes(1)
    })

    it('4. Trạng thái Disabled: vô hiệu hóa tương tác, mờ thẻ và có aria-disabled', () => {
      render(
        <Card disabled data-testid="disabled-card">
          <CardContent>
            <p>Thẻ đã vô hiệu hóa</p>
          </CardContent>
        </Card>
      )
      const card = screen.getByTestId('disabled-card')
      expect(card.getAttribute('aria-disabled')).toBe('true')
      expect(card.className).toContain('opacity-60')
      expect(card.className).toContain('pointer-events-none')
    })
  })

  describe('FilterToolbar Compound Primitive (ACT-04)', () => {
    it('render đầy đủ subcomponents: Search, Select, DateRange, ActiveCount, Reset', () => {
      const handleSearch = vi.fn()
      const handleSelect = vi.fn()
      const handleReset = vi.fn()

      render(
        <FilterToolbar>
          <FilterToolbar.Search
            value="Nguyễn"
            onChange={handleSearch}
            placeholder="Tìm theo tên..."
            maxLength={100}
          />
          <FilterToolbar.Select
            value="IT"
            onChange={handleSelect}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'IT', label: 'Công nghệ thông tin' },
            ]}
          />
          <FilterToolbar.DateRange from="2026-11-01" to="2026-11-30" />
          <FilterToolbar.ActiveCount count={2} />
          <FilterToolbar.Reset onClick={handleReset} visible={true} />
        </FilterToolbar>
      )

      expect(screen.getByRole('search')).toBeDefined()
      expect(screen.getByPlaceholderText('Tìm theo tên...')).toBeDefined()
      expect(screen.getByText('2')).toBeDefined()
      expect(screen.getByText('bộ lọc đang áp dụng')).toBeDefined()

      const resetBtn = screen.getByTestId('filter-reset-btn')
      expect(resetBtn).toBeDefined()
      fireEvent.click(resetBtn)
      expect(handleReset).toHaveBeenCalledTimes(1)
    })

    it('Search hỗ trợ nút X để xóa từ khóa và giới hạn maxLength', () => {
      const handleSearch = vi.fn()
      render(
        <FilterToolbar.Search
          value="Từ khóa test"
          onChange={handleSearch}
          maxLength={100}
        />
      )

      const clearBtn = screen.getByTestId('filter-toolbar-search-clear')
      expect(clearBtn).toBeDefined()
      fireEvent.click(clearBtn)
      expect(handleSearch).toHaveBeenCalledWith('')
    })

    it('Search gọi onDebouncedChange sau debounceMs', async () => {
      const handleDebounced = vi.fn()
      render(
        <FilterToolbar.Search
          defaultValue=""
          onDebouncedChange={handleDebounced}
          debounceMs={50}
        />
      )

      const input = screen.getByTestId('filter-toolbar-search')
      fireEvent.change(input, { target: { value: 'test' } })

      await waitFor(() => {
        expect(handleDebounced).toHaveBeenCalledWith('test')
      })
    })

    it('Reset button ẩn khi visible=false', () => {
      render(<FilterToolbar.Reset onClick={() => {}} visible={false} />)
      expect(screen.queryByTestId('filter-reset-btn')).toBeNull()
    })
  })

  describe('PaginationBar Primitive (ACT-04)', () => {
    it('render thông tin hiển thị và các nút điều hướng phân trang chính xác', () => {
      const handlePageChange = vi.fn()
      const handlePageSizeChange = vi.fn()

      render(
        <PaginationBar
          page={0}
          pageSize={20}
          totalElements={55}
          totalPages={3}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemLabel="lượt điểm danh"
        />
      )

      expect(screen.getByText('1 - 20')).toBeDefined()
      expect(screen.getByText('55')).toBeDefined()
      expect(screen.getByText(/lượt điểm danh/i)).toBeDefined()
      expect(screen.getByText('Trang 1 / 3')).toBeDefined()

      const prevBtn = screen.getByTestId('prev-page-btn') as HTMLButtonElement
      const nextBtn = screen.getByTestId('next-page-btn') as HTMLButtonElement

      // Ở trang 0, nút trước bị vô hiệu hóa
      expect(prevBtn.disabled).toBe(true)
      expect(nextBtn.disabled).toBe(false)

      fireEvent.click(nextBtn)
      expect(handlePageChange).toHaveBeenCalledWith(1)

      const select = screen.getByTestId('page-size-select') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '50' } })
      expect(handlePageSizeChange).toHaveBeenCalledWith(50)
    })

    it('xử lý khi totalElements = 0', () => {
      render(
        <PaginationBar
          page={0}
          pageSize={10}
          totalElements={0}
          totalPages={0}
          onPageChange={() => {}}
        />
      )

      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
      const nextBtn = screen.getByTestId('next-page-btn') as HTMLButtonElement
      expect(nextBtn.disabled).toBe(true)
    })
  })

  describe('AttendanceStatusBadge & ConfettiEffect', () => {
    it('AttendanceStatusBadge render đúng trạng thái và nhãn tiếng Việt', () => {
      render(<AttendanceStatusBadge status="ON_TIME" showIcon />)
      expect(screen.getByText('Đúng giờ')).toBeDefined()
    })

    it('ConfettiEffect render đúng cấu trúc canvas/effect', () => {
      render(<ConfettiEffect />)
      expect(screen.getByTestId('confetti-effect')).toBeDefined()
    })
  })
})
