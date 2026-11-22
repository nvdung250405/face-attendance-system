/**
 * Integration Tests cho Phân Hệ Đơn Giải Trình Công (Excuse Requests)
 * (FR-BE-014, FR-BE-015, API-BE-026, API-BE-027, API-BE-028, API-BE-029).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmployeeExcuseHistoryView } from '@/views/employee/EmployeeExcuseHistoryView'
import { AdminExcuseManagementView } from '@/views/admin/AdminExcuseManagementView'
import { SubmitExcuseModal } from '@/components/excuse/SubmitExcuseModal'
import { excuseService } from '@/services/excuseService'
import type { ExcuseRequestItem } from '@/types'

const mockExcuseItem: ExcuseRequestItem = {
  id: 101,
  userId: 1042,
  employeeCode: 'NV-1042',
  fullName: 'Ngô Văn Dũng',
  attendanceLogId: 98231,
  originalPunchTimestamp: '2026-10-18T08:35:00Z',
  requestedPunchTimestamp: '2026-10-18T08:00:00Z',
  reason: 'Sự cố tắc đường nghiêm trọng tại nút giao thông',
  status: 'PENDING',
  decidedById: null,
  decidedByName: null,
  decidedAt: null,
  rejectionReason: null,
  createdAt: '2026-10-18T09:00:00Z',
  updatedAt: '2026-10-18T09:00:00Z',
}

describe('Phân Hệ Giải Trình Công (UI & Consumer Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. EmployeeExcuseHistoryView (API-BE-027)', () => {
    it('hiển thị danh sách đơn giải trình và trạng thái badge', async () => {
      vi.spyOn(excuseService, 'getMyExcuseRequests').mockResolvedValueOnce({
        content: [mockExcuseItem],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        page: 0,
        first: true,
        last: true,
      })

      render(
        <MemoryRouter>
          <EmployeeExcuseHistoryView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Đơn Giải Trình Công Của Tôi')).toBeTruthy()
        expect(screen.getByText('#101')).toBeTruthy()
        expect(screen.getByText('Chờ duyệt')).toBeTruthy()
        expect(screen.getByText(/Sự cố tắc đường/)).toBeTruthy()
      })
    })

    it('nút nộp đơn mới mở SubmitExcuseModal', async () => {
      vi.spyOn(excuseService, 'getMyExcuseRequests').mockResolvedValueOnce({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        page: 0,
        first: true,
        last: true,
      })

      render(
        <MemoryRouter>
          <EmployeeExcuseHistoryView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('create-excuse-btn')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('create-excuse-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('excuse-reason-input')).toBeTruthy()
      })
    })
  })

  describe('2. SubmitExcuseModal (API-BE-026)', () => {
    it('gửi đơn giải trình gọi excuseService.submitExcuseRequest thành công', async () => {
      const submitSpy = vi.spyOn(excuseService, 'submitExcuseRequest').mockResolvedValueOnce({
        ...mockExcuseItem,
      })

      const onClose = vi.fn()
      const onSuccess = vi.fn()

      render(
        <SubmitExcuseModal
          isOpen={true}
          onClose={onClose}
          attendanceLogId={98231}
          attendanceDate="2026-10-18"
          currentPunchTime="08:35:00"
          onSuccess={onSuccess}
        />
      )

      expect(screen.getByText('Nộp Đơn Giải Trình Công')).toBeTruthy()

      const reasonInput = screen.getByTestId('excuse-reason-input')
      fireEvent.change(reasonInput, { target: { value: 'Sự cố kẹt xe đường Nguyễn Trãi' } })

      const submitBtn = screen.getByTestId('submit-excuse-btn')
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            attendanceLogId: 98231,
            reason: 'Sự cố kẹt xe đường Nguyễn Trãi',
          })
        )
        expect(screen.getByText('Nộp đơn thành công!')).toBeTruthy()
      })
    })

    it('vô hiệu hóa nút gửi và KHÔNG gọi API khi thiếu attendanceLogId', async () => {
      const submitSpy = vi.spyOn(excuseService, 'submitExcuseRequest')

      render(
        <SubmitExcuseModal
          isOpen={true}
          onClose={vi.fn()}
          attendanceDate="2026-10-18"
          currentPunchTime="08:35:00"
        />
      )

      const submitBtn = screen.getByTestId('submit-excuse-btn') as HTMLButtonElement
      expect(submitBtn.disabled).toBe(true)
      expect(screen.getByTestId('excuse-missing-log-id-notice')).toBeTruthy()

      fireEvent.change(screen.getByTestId('excuse-reason-input'), {
        target: { value: 'Lý do hợp lệ' },
      })
      fireEvent.click(submitBtn)

      expect(submitSpy).not.toHaveBeenCalled()
    })
  })

  describe('3. AdminExcuseManagementView (API-BE-028, API-BE-029)', () => {
    it('hiển thị danh sách đơn chờ duyệt và các tab lọc', async () => {
      vi.spyOn(excuseService, 'getAdminExcuseRequests').mockResolvedValueOnce({
        content: [mockExcuseItem],
        totalElements: 1,
        totalPages: 1,
        size: 15,
        page: 0,
        first: true,
        last: true,
      })

      render(
        <MemoryRouter>
          <AdminExcuseManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Quản Lý & Duyệt Đơn Giải Trình Công')).toBeTruthy()
        expect(screen.getByTestId('tab-pending')).toBeTruthy()
        expect(screen.getByTestId('tab-approved')).toBeTruthy()
        expect(screen.getByTestId('tab-rejected')).toBeTruthy()
        expect(screen.getByText('#101')).toBeTruthy()
        expect(screen.getByText('Ngô Văn Dũng')).toBeTruthy()
      })
    })

    it('HR phê duyệt đơn giải trình gọi excuseService.approveExcuseRequest', async () => {
      vi.spyOn(excuseService, 'getAdminExcuseRequests').mockResolvedValue({
        content: [mockExcuseItem],
        totalElements: 1,
        totalPages: 1,
        size: 15,
        page: 0,
        first: true,
        last: true,
      })

      const approveSpy = vi.spyOn(excuseService, 'approveExcuseRequest').mockResolvedValueOnce({
        ...mockExcuseItem,
        status: 'APPROVED',
      })

      render(
        <MemoryRouter>
          <AdminExcuseManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('approve-btn-101')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('approve-btn-101'))

      await waitFor(() => {
        expect(screen.getByTestId('approve-note-input')).toBeTruthy()
      })

      fireEvent.change(screen.getByTestId('approve-note-input'), {
        target: { value: 'Đồng ý điều chỉnh giờ vào 08:00' },
      })

      fireEvent.click(screen.getByTestId('confirm-approve-btn'))

      await waitFor(() => {
        expect(approveSpy).toHaveBeenCalledWith(101, 'Đồng ý điều chỉnh giờ vào 08:00')
      })
    })

    it('HR từ chối đơn giải trình bắt buộc nhập lý do và gọi excuseService.rejectExcuseRequest', async () => {
      vi.spyOn(excuseService, 'getAdminExcuseRequests').mockResolvedValue({
        content: [mockExcuseItem],
        totalElements: 1,
        totalPages: 1,
        size: 15,
        page: 0,
        first: true,
        last: true,
      })

      const rejectSpy = vi.spyOn(excuseService, 'rejectExcuseRequest').mockResolvedValueOnce({
        ...mockExcuseItem,
        status: 'REJECTED',
        rejectionReason: 'Không có minh chứng hợp lệ',
      })

      render(
        <MemoryRouter>
          <AdminExcuseManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('reject-btn-101')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('reject-btn-101'))

      await waitFor(() => {
        expect(screen.getByTestId('reject-reason-input')).toBeTruthy()
      })

      fireEvent.change(screen.getByTestId('reject-reason-input'), {
        target: { value: 'Không có minh chứng hợp lệ' },
      })

      fireEvent.click(screen.getByTestId('confirm-reject-btn'))

      await waitFor(() => {
        expect(rejectSpy).toHaveBeenCalledWith(101, 'Không có minh chứng hợp lệ')
      })
    })
  })
})
