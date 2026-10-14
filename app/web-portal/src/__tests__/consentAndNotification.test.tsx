/**
 * Integration & Unit Tests cho Module Rút Consent & Trung tâm Thông báo
 * (SOL-WEB-009, SOL-WEB-011, UXD-WEB-007, DD-WEB-015, DD-WEB-020, BLD-WEB-020, TASK-WEB-026).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ConsentWithdrawalModal } from '@/components/consent/ConsentWithdrawalModal'
import { EmployeeConsentView } from '@/views/employee/EmployeeConsentView'
import { EmployeeDataRequestsView } from '@/views/employee/EmployeeDataRequestsView'
import { NotificationDrawer } from '@/components/notification/NotificationDrawer'
import { TopHeader } from '@/components/layout/TopHeader'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { dataSubjectService } from '@/services/dataSubjectService'
import { notificationService } from '@/services/notificationService'
import type { UserProfile, NotificationItem, DataSubjectRequestItem } from '@/types'

const mockEmployeeUser: UserProfile = {
  id: 1042,
  employeeCode: 'EMP-1042',
  fullName: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Khối Công nghệ',
}

describe('Module Rút Consent & Trung tâm Thông báo (TASK-WEB-026)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useNotificationStore.getState().clearStore()
    useAuthStore.setState({
      session: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: { ...mockEmployeeUser },
      },
      user: { ...mockEmployeeUser },
      isAuthenticated: true,
      isInitialized: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 1. ConsentWithdrawalModal Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('1. ConsentWithdrawalModal (Rút Informed Consent 2 Bước - DD-WEB-015)', () => {
    it('không hiển thị khi isOpen = false', () => {
      const { container } = render(
        <ConsentWithdrawalModal isOpen={false} onClose={vi.fn()} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('hiển thị đầy đủ 3 hệ quả pháp lý & vận hành tại Bước 1 (Cảnh báo)', () => {
      render(<ConsentWithdrawalModal isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByText('Rút Lại Cam Kết Sinh Trắc Học')).toBeTruthy()
      expect(screen.getByText(/Bước 1\/2: Cảnh báo hệ quả pháp lý & vận hành/i)).toBeTruthy()

      // 3 hệ quả
      expect(screen.getByText(/Ngừng quét mặt Kiosk:/i)).toBeTruthy()
      expect(screen.getByText(/Chuyển sang PIN dự phòng:/i)).toBeTruthy()
      expect(screen.getByText(/Tiêu hủy trong 7 ngày:/i)).toBeTruthy()
      expect(screen.getByText(/Nghị định 13\/2023\/NĐ-CP/i)).toBeTruthy()

      // Ô nhập lý do tùy chọn
      expect(screen.getByTestId('withdrawal-reason-input')).toBeTruthy()
      expect(screen.getByTestId('withdrawal-next-step-btn')).toBeTruthy()
    })

    it('nút Hủy bỏ gọi callback onClose', () => {
      const handleClose = vi.fn()
      render(<ConsentWithdrawalModal isOpen={true} onClose={handleClose} />)

      fireEvent.click(screen.getByTestId('withdrawal-cancel-btn'))
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('chuyển sang Bước 2 và yêu cầu tích checkbox trước khi bấm Xác nhận', async () => {
      render(<ConsentWithdrawalModal isOpen={true} onClose={vi.fn()} />)

      // Nhập lý do tùy chọn
      fireEvent.change(screen.getByTestId('withdrawal-reason-input'), {
        target: { value: 'Chuyển sang dùng mã PIN' },
      })

      // Bấm Tiếp tục sang Bước 2
      fireEvent.click(screen.getByTestId('withdrawal-next-step-btn'))
      expect(screen.getByText(/Bước 2\/2: Xác nhận hủy dữ liệu nhận diện/i)).toBeTruthy()

      // Nút xác nhận bị disabled nếu chưa tick checkbox
      const submitBtn = screen.getByTestId('confirm-withdraw-submit-btn') as HTMLButtonElement
      expect(submitBtn.disabled).toBe(true)

      // Tick checkbox
      const checkbox = screen.getByTestId('confirm-withdrawal-checkbox') as HTMLInputElement
      fireEvent.click(checkbox)
      expect(checkbox.checked).toBe(true)
      expect(submitBtn.disabled).toBe(false)

      // Nút Quay lại chuyển về Bước 1
      fireEvent.click(screen.getByTestId('withdrawal-back-btn'))
      expect(screen.getByText(/Bước 1\/2: Cảnh báo hệ quả pháp lý & vận hành/i)).toBeTruthy()
    })

    it('gọi dataSubjectService.withdrawConsent, cập nhật hasBiometric=false và hiển thị hạn 7 ngày tại Bước 3', async () => {
      const mockResult = {
        withdrawnAt: '2026-10-14T10:00:00.000+07:00',
        retentionDeadline: '2026-10-21T10:00:00.000+07:00',
        message: 'Rút cam kết sinh trắc học thành công.',
      }
      vi.spyOn(dataSubjectService, 'withdrawConsent').mockResolvedValueOnce(mockResult)
      const handleSuccess = vi.fn()

      render(
        <ConsentWithdrawalModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={handleSuccess}
        />
      )

      // Sang Bước 2
      fireEvent.click(screen.getByTestId('withdrawal-next-step-btn'))
      fireEvent.click(screen.getByTestId('confirm-withdrawal-checkbox'))

      // Thực thi rút cam kết
      fireEvent.click(screen.getByTestId('confirm-withdraw-submit-btn'))

      await waitFor(() => {
        expect(dataSubjectService.withdrawConsent).toHaveBeenCalledTimes(1)
      })

      // Bước 3: Thông báo thành công & hạn tiêu hủy
      await waitFor(() => {
        expect(screen.getByText('Rút Cam Kết Thành Công')).toBeTruthy()
        expect(screen.getByText(/Thời hạn tiêu hủy dữ liệu sinh trắc học \(7 ngày\):/i)).toBeTruthy()
      })

      // Xác nhận useAuthStore đã cập nhật hasBiometric = false
      expect(useAuthStore.getState().user?.hasBiometric).toBe(false)
      expect(handleSuccess).toHaveBeenCalledWith(mockResult)
    })

    it('hiển thị thông báo lỗi khi API máy chủ gặp sự cố', async () => {
      vi.spyOn(dataSubjectService, 'withdrawConsent').mockRejectedValueOnce(
        new Error('Hệ thống đang bảo trì, vui lòng thử lại sau.')
      )

      render(<ConsentWithdrawalModal isOpen={true} onClose={vi.fn()} />)

      fireEvent.click(screen.getByTestId('withdrawal-next-step-btn'))
      fireEvent.click(screen.getByTestId('confirm-withdrawal-checkbox'))
      fireEvent.click(screen.getByTestId('confirm-withdraw-submit-btn'))

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert.textContent).toContain('Hệ thống đang bảo trì, vui lòng thử lại sau.')
      })
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 2. EmployeeConsentView Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('2. EmployeeConsentView (Màn hình Cam kết & Rút cam kết)', () => {
    it('hiển thị trạng thái ĐÃ KÍCH HOẠT và nút Rút cam kết khi user đã có sinh trắc', () => {
      render(
        <MemoryRouter>
          <EmployeeConsentView />
        </MemoryRouter>
      )

      expect(screen.getByTestId('biometric-status-active').textContent).toContain('ĐÃ KÍCH HOẠT')
      expect(screen.getByTestId('open-withdraw-modal-btn')).toBeTruthy()
    })

    it('hiển thị trạng thái CHƯA KÍCH HOẠT và nút Ký cam kết ngay khi user chưa có sinh trắc', () => {
      useAuthStore.setState({
        user: { ...mockEmployeeUser, hasBiometric: false },
      })

      render(
        <MemoryRouter>
          <EmployeeConsentView />
        </MemoryRouter>
      )

      expect(screen.getByTestId('biometric-status-inactive').textContent).toContain('CHƯA KÍCH HOẠT')
      expect(screen.getByTestId('open-consent-modal-btn')).toBeTruthy()
    })

    it('click nút Rút cam kết mở hộp thoại ConsentWithdrawalModal', () => {
      render(
        <MemoryRouter>
          <EmployeeConsentView />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByTestId('open-withdraw-modal-btn'))
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText('Rút Lại Cam Kết Sinh Trắc Học')).toBeTruthy()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 3. EmployeeDataRequestsView Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('3. EmployeeDataRequestsView (Quyền Chủ thể Dữ liệu theo NĐ 13/2023)', () => {
    const mockList: DataSubjectRequestItem[] = [
      {
        id: 1,
        employeeId: 1042,
        requestType: 'ACCESS',
        details: 'Yêu cầu trích xuất dữ liệu điểm danh tháng 9',
        status: 'COMPLETED',
        submittedAt: '2026-10-01T08:00:00.000+07:00',
        handledAt: '2026-10-02T10:00:00.000+07:00',
        handledBy: 'DPO Officer',
        adminNote: 'Đã gửi file trích xuất',
      },
      {
        id: 2,
        employeeId: 1042,
        requestType: 'ERASURE',
        details: 'Yêu cầu xóa dữ liệu cũ',
        status: 'PENDING',
        submittedAt: '2026-10-10T09:00:00.000+07:00',
        handledAt: null,
        handledBy: null,
        adminNote: null,
      },
    ]

    it('tải và hiển thị danh sách yêu cầu dữ liệu cá nhân với các badge tương ứng', async () => {
      vi.spyOn(dataSubjectService, 'getEmployeeDataRequests').mockResolvedValueOnce(mockList)

      render(
        <MemoryRouter>
          <EmployeeDataRequestsView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('data-request-row-1')).toBeTruthy()
        expect(screen.getByTestId('data-request-row-2')).toBeTruthy()
      })

      expect(screen.getByText('Đã hoàn tất')).toBeTruthy()
      expect(screen.getByText('Chờ tiếp nhận')).toBeTruthy()
      expect(screen.getByText('Đã gửi file trích xuất')).toBeTruthy()
    })

    it('gửi yêu cầu dữ liệu mới thành công và chèn vào đầu bảng', async () => {
      vi.spyOn(dataSubjectService, 'getEmployeeDataRequests').mockResolvedValueOnce([])
      const newRequest: DataSubjectRequestItem = {
        id: 99,
        employeeId: 1042,
        requestType: 'RECTIFICATION',
        details: 'Đính chính số điện thoại liên hệ',
        status: 'PENDING',
        submittedAt: '2026-10-14T11:00:00.000+07:00',
      }
      vi.spyOn(dataSubjectService, 'createEmployeeDataRequest').mockResolvedValueOnce(newRequest)

      render(
        <MemoryRouter>
          <EmployeeDataRequestsView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Bạn chưa gửi yêu cầu dữ liệu cá nhân nào')).toBeTruthy()
      })

      // Chọn loại yêu cầu
      fireEvent.change(screen.getByTestId('request-type-select'), {
        target: { value: 'RECTIFICATION' },
      })

      // Nhập nội dung
      const detailsInput = screen.getByTestId('request-details-input') as HTMLTextAreaElement
      fireEvent.change(detailsInput, {
        target: { value: 'Đính chính số điện thoại liên hệ' },
      })

      // Bấm submit
      fireEvent.click(screen.getByTestId('submit-data-request-btn'))

      await waitFor(() => {
        expect(dataSubjectService.createEmployeeDataRequest).toHaveBeenCalledWith({
          requestType: 'RECTIFICATION',
          details: 'Đính chính số điện thoại liên hệ',
        })
      })

      // Thông báo thành công và hàng mới xuất hiện trong bảng
      await waitFor(() => {
        expect(screen.getByText(/Yêu cầu dữ liệu cá nhân của bạn đã được gửi tới DPO thành công/i)).toBeTruthy()
        expect(screen.getByTestId('data-request-row-99')).toBeTruthy()
      })

      // Ô nhập nội dung được làm sạch
      expect(detailsInput.value).toBe('')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 4. NotificationDrawer & TopHeader Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('4. NotificationDrawer & TopHeader (Trung tâm Thông báo - SOL-WEB-011, DD-WEB-020)', () => {
    const mockItems: NotificationItem[] = [
      {
        id: 201,
        userId: 1042,
        eventType: 'ATTENDANCE_PUNCH',
        title: 'Điểm danh thành công',
        message: 'Bạn đã chấm công vào lúc 08:30:00',
        isRead: false,
        createdAt: '2026-10-14T08:30:00.000+07:00',
      },
      {
        id: 202,
        userId: 1042,
        eventType: 'SHIFT_ASSIGNED',
        title: 'Phân ca làm việc mới',
        message: 'Bạn đã được phân công ca Ca Hành Chính',
        isRead: false,
        createdAt: '2026-10-14T09:00:00.000+07:00',
      },
      {
        id: 203,
        userId: 1042,
        eventType: 'CONSENT_SIGNED',
        title: 'Cam kết dữ liệu',
        message: 'Informed Consent đã ký thành công',
        isRead: true,
        createdAt: '2026-10-14T07:00:00.000+07:00',
      },
    ]

    it('TopHeader hiển thị badge số lượng chưa đọc khi có thông báo', async () => {
      vi.spyOn(notificationService, 'getNotifications').mockResolvedValueOnce([
        {
          id: 201,
          userId: 1042,
          eventType: 'ATTENDANCE_PUNCH',
          title: 'Điểm danh thành công',
          body: 'Bạn đã chấm công vào lúc 08:30:00',
          readAt: null,
          createdAt: '2026-10-14T08:30:00.000+07:00',
        },
      ])

      render(
        <MemoryRouter>
          <TopHeader sidebarWidth={260} />
        </MemoryRouter>
      )

      await waitFor(() => {
        const badge = screen.getByTestId('notification-unread-badge')
        expect(badge).toBeTruthy()
        expect(badge.textContent?.trim()).toBe('1')
      })
    })

    it('click chuông thông báo mở và đóng NotificationDrawer', async () => {
      render(
        <MemoryRouter>
          <TopHeader sidebarWidth={260} />
        </MemoryRouter>
      )

      const bellBtn = screen.getByTestId('header-notifications')
      fireEvent.click(bellBtn)

      expect(screen.getByTestId('notification-drawer')).toBeTruthy()
      expect(screen.getByText('Trung tâm thông báo')).toBeTruthy()

      // Đóng qua nút X
      fireEvent.click(screen.getByTestId('close-notification-drawer-btn'))
      expect(screen.queryByTestId('notification-drawer')).toBeNull()
    })

    it('NotificationDrawer: click thông báo chưa đọc thực hiện cập nhật lạc quan (Optimistic Update) và gọi API', async () => {
      vi.spyOn(notificationService, 'markAsRead').mockResolvedValueOnce({
        id: 201,
        userId: 1042,
        eventType: 'ATTENDANCE_PUNCH',
        title: 'Điểm danh thành công',
        body: 'Bạn đã chấm công vào lúc 08:30:00',
        readAt: '2026-10-14T09:00:00.000+07:00',
        createdAt: '2026-10-14T08:30:00.000+07:00',
      })

      const store = useNotificationStore.getState()
      store.initUser(1042)
      store.setNotifications(mockItems)
      store.setIsOpen(true)

      render(<NotificationDrawer />)

      // Kiểm tra dot chưa đọc của thông báo 201
      expect(screen.getByTestId('unread-dot-201')).toBeTruthy()
      expect(useNotificationStore.getState().unreadCount).toBe(2)

      // Click vào thông báo 201
      fireEvent.click(screen.getByTestId('notification-item-201'))

      // Optimistic update: dot biến mất và unreadCount giảm ngay lập tức
      expect(screen.queryByTestId('unread-dot-201')).toBeNull()
      expect(useNotificationStore.getState().unreadCount).toBe(1)
      expect(notificationService.markAsRead).toHaveBeenCalledWith(201)
    })

    it('NotificationDrawer: nút Đọc tất cả cập nhật toàn bộ thông báo thành đã đọc', async () => {
      vi.spyOn(notificationService, 'markAllAsRead').mockResolvedValueOnce()

      const store = useNotificationStore.getState()
      store.initUser(1042)
      store.setNotifications(mockItems)
      store.setIsOpen(true)

      render(<NotificationDrawer />)

      expect(screen.getByTestId('drawer-unread-count-badge').textContent).toContain('2 mới')

      fireEvent.click(screen.getByTestId('mark-all-read-btn'))

      expect(useNotificationStore.getState().unreadCount).toBe(0)
      expect(screen.queryByTestId('drawer-unread-count-badge')).toBeNull()
      expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1)
    })
  })
})
