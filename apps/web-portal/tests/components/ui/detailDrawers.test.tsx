import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { AttendanceDetailDrawer, type AttendanceRecordDetail } from '@/components/attendance/AttendanceDetailDrawer'
import { ExcuseDetailDrawer, type ExcuseRequestDetail } from '@/components/excuse/ExcuseDetailDrawer'
import { KioskDetailDrawer } from '@/components/kiosk/KioskDetailDrawer'
import { complianceAdminService } from '@/services/complianceAdminService'
import type { AttendanceRecord, ExcuseRequestItem, KioskItemResponse } from '@/types'

describe('Master-Detail Slide-over Detail Drawers', () => {
  describe('1. DetailDrawer Base Primitive', () => {
    it('không hiển thị khi isOpen = false', () => {
      render(
        <DetailDrawer isOpen={false} onClose={vi.fn()} title="Test Drawer">
          <div>Nội dung drawer</div>
        </DetailDrawer>
      )
      expect(screen.queryByTestId('detail-drawer')).toBeNull()
    })

    it('hiển thị tiêu đề, mô tả, badge và nội dung khi isOpen = true', () => {
      render(
        <DetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          title="Chi tiết thực thể"
          description="Mô tả bổ sung của drawer"
          badge={<span data-testid="test-badge">ACTIVE</span>}
          footer={<button type="button">Xác nhận</button>}
        >
          <div data-testid="drawer-body">Dữ liệu chi tiết</div>
        </DetailDrawer>
      )

      expect(screen.getByTestId('detail-drawer')).toBeDefined()
      expect(screen.getByText('Chi tiết thực thể')).toBeDefined()
      expect(screen.getByText('Mô tả bổ sung của drawer')).toBeDefined()
      expect(screen.getByTestId('test-badge')).toBeDefined()
      expect(screen.getByTestId('drawer-body')).toBeDefined()
      expect(screen.getByText('Xác nhận')).toBeDefined()
    })

    it('gọi onClose khi nhấn nút đóng', () => {
      const handleClose = vi.fn()
      render(
        <DetailDrawer
          isOpen={true}
          onClose={handleClose}
          title="Test Close"
          closeButtonAriaLabel="Đóng ngăn thử nghiệm"
        >
          <div>Nội dung</div>
        </DetailDrawer>
      )

      const closeBtn = screen.getByRole('button', { name: 'Đóng ngăn thử nghiệm' })
      fireEvent.click(closeBtn)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('2. AttendanceDetailDrawer', () => {
    const mockRecord: AttendanceRecordDetail = {
      recordId: 101,
      employeeId: 42,
      employeeCode: 'EMP-0042',
      fullName: 'Nguyễn Văn An',
      department: 'Phòng Kỹ thuật',
      punchTimestamp: '2026-11-24T08:15:00+07:00',
      punchType: 'CHECK_IN',
      verificationMethod: 'ARCFACE_512D',
      status: 'LATE',
      lateMinutes: 15,
      kioskId: 'KIOSK-GATE-01',
      confidenceScore: 0.942,
      overtimeMinutes: 45,
      offlineSynced: true,
      adjustedBy: 'hr_manager',
      adjustedAt: '2026-11-24T09:00:00+07:00',
      adjustmentNote: 'Hiệu chỉnh do lỗi mạng Kiosk',
      previousStatus: 'ANOMALOUS',
      previousTimestamp: '2026-11-24T08:00:00+07:00',
    }

    it('hiển thị thông báo khi record = null', () => {
      render(
        <AttendanceDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          record={null}
        />
      )
      expect(screen.getByText('Không có dữ liệu bản ghi được chọn.')).toBeDefined()
    })

    it('hiển thị đầy đủ thông tin nhân sự, Kiosk, ArcFace và đối soát thời gian', () => {
      const handleAdjust = vi.fn()
      const handlePrev = vi.fn()
      const handleNext = vi.fn()

      render(
        <AttendanceDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          record={mockRecord}
          onAdjust={handleAdjust}
          onNavigatePrev={handlePrev}
          onNavigateNext={handleNext}
          hasPrev={true}
          hasNext={true}
        />
      )

      expect(screen.getByTestId('attendance-detail-drawer')).toBeDefined()
      expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThan(0)
      expect(screen.getAllByText('EMP-0042').length).toBeGreaterThan(0)
      expect(screen.getByText('KIOSK-GATE-01')).toBeDefined()
      expect(screen.getByText('Nhận diện khuôn mặt (ArcFace 512D)')).toBeDefined()
      expect(screen.getByText('PASS >= 0.80')).toBeDefined()
      expect(screen.getByText('94.2%')).toBeDefined()
      expect(screen.getByText('+45 phút')).toBeDefined()
      expect(screen.getByText('15 phút')).toBeDefined()
      expect(screen.getByText(/Bản ghi được đồng bộ từ hàng đợi ngoại tuyến SQLite/)).toBeDefined()

      // Audit trail
      expect(screen.getByText(/Hiệu chỉnh bởi: hr_manager/)).toBeDefined()
      expect(screen.getByText(/"Hiệu chỉnh do lỗi mạng Kiosk"/)).toBeDefined()

      // Adjust button
      const adjustBtn = screen.getByTestId('drawer-adjust-btn')
      fireEvent.click(adjustBtn)
      expect(handleAdjust).toHaveBeenCalledWith(mockRecord)

      // Navigation
      const prevBtn = screen.getByTestId('drawer-nav-prev')
      fireEvent.click(prevBtn)
      expect(handlePrev).toHaveBeenCalled()

      const nextBtn = screen.getByTestId('drawer-nav-next')
      fireEvent.click(nextBtn)
      expect(handleNext).toHaveBeenCalled()
    })

    it('hiển thị trạng thái nguyên bản khi không có điều chỉnh', () => {
      const pristineRecord: AttendanceRecord = {
        recordId: 102,
        employeeId: 43,
        employeeCode: 'EMP-0043',
        fullName: 'Trần Thị Bình',
        department: 'Phòng Nhân sự',
        punchTimestamp: '2026-11-24T08:00:00+07:00',
        punchType: 'CHECK_IN',
        verificationMethod: 'VERIFICATION_PIN',
        status: 'ON_TIME',
        lateMinutes: 0,
        kioskId: 'KIOSK-GATE-02',
      }

      render(
        <AttendanceDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          record={pristineRecord}
        />
      )

      expect(screen.getByText('Mã PIN dự phòng')).toBeDefined()
      expect(
        screen.getByText(
          'Bản ghi nguyên bản từ Kiosk. Chưa qua điều chỉnh thủ công nào.'
        )
      ).toBeDefined()
    })
  })

  describe('3. ExcuseDetailDrawer', () => {
    const mockPendingExcuse: ExcuseRequestDetail = {
      id: 501,
      userId: 10,
      employeeCode: 'EMP-0010',
      fullName: 'Lê Hoàng Nam',
      attendanceLogId: 205,
      originalPunchTimestamp: '2026-11-24T08:45:00+07:00',
      requestedPunchTimestamp: '2026-11-24T08:00:00+07:00',
      reason: 'Bị tắc đường do mưa lớn kèm tai nạn giao thông.',
      status: 'PENDING',
      decidedById: null,
      decidedByName: null,
      decidedAt: null,
      rejectionReason: null,
      createdAt: '2026-11-24T09:10:00+07:00',
      updatedAt: '2026-11-24T09:10:00+07:00',
      shiftName: 'Ca Sáng Hành Chính',
      proofUrl: 'https://example.com/proof-img.png',
      proofFileName: 'giay_xac_nhan.png',
    }

    it('hiển thị thông báo khi request = null', () => {
      render(
        <ExcuseDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          request={null}
        />
      )
      expect(screen.getByText('Không có dữ liệu đơn giải trình được chọn.')).toBeDefined()
    })

    it('hiển thị đầy đủ thông tin đối soát ca, lý do giải trình, minh chứng và nút duyệt/từ chối', () => {
      const handleApprove = vi.fn()
      const handleReject = vi.fn()

      render(
        <ExcuseDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          request={mockPendingExcuse}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )

      expect(screen.getByTestId('excuse-detail-drawer')).toBeDefined()
      expect(screen.getByText('Đơn giải trình #501')).toBeDefined()
      expect(screen.getByText('Ca Sáng Hành Chính')).toBeDefined()
      expect(screen.getByText(/Bị tắc đường do mưa lớn kèm tai nạn giao thông/)).toBeDefined()
      expect(screen.getByText('giay_xac_nhan.png')).toBeDefined()
      expect(screen.getByText('Chờ duyệt')).toBeDefined()

      // Approve CTA
      const approveBtn = screen.getByTestId('drawer-approve-btn')
      fireEvent.click(approveBtn)
      expect(handleApprove).toHaveBeenCalledWith(mockPendingExcuse)

      // Reject CTA
      const rejectBtn = screen.getByTestId('drawer-reject-btn')
      fireEvent.click(rejectBtn)
      expect(handleReject).toHaveBeenCalledWith(mockPendingExcuse)
    })

    it('hiển thị trạng thái đã phê duyệt kèm kiểm toán', () => {
      const approvedExcuse: ExcuseRequestItem = {
        ...mockPendingExcuse,
        status: 'APPROVED',
        decidedByName: 'Trần Quản Lý',
        decidedAt: '2026-11-24T10:00:00+07:00',
        rejectionReason: 'Đã xác nhận sự cố giao thông.',
      }

      render(
        <ExcuseDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          request={approvedExcuse}
        />
      )

      expect(screen.getByText('Đã duyệt')).toBeDefined()
      expect(screen.getByText(/Đã phê duyệt bởi: Trần Quản Lý/)).toBeDefined()
      expect(screen.queryByTestId('drawer-approve-btn')).toBeNull()
      expect(screen.queryByTestId('drawer-reject-btn')).toBeNull()
    })

    it('hiển thị trạng thái đã từ chối kèm lý do từ chối', () => {
      const rejectedExcuse: ExcuseRequestItem = {
        ...mockPendingExcuse,
        status: 'REJECTED',
        decidedByName: 'Trần Quản Lý',
        decidedAt: '2026-11-24T10:00:00+07:00',
        rejectionReason: 'Không có minh chứng hợp lệ đi kèm.',
      }

      render(
        <ExcuseDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          request={rejectedExcuse}
        />
      )

      expect(screen.getByText('Từ chối')).toBeDefined()
      expect(screen.getByText(/Đã từ chối bởi: Trần Quản Lý/)).toBeDefined()
      expect(screen.getByText(/Không có minh chứng hợp lệ đi kèm/)).toBeDefined()
    })

    it('không render thẻ <a> hoặc <img> khi proofUrl chứa scheme độc hại như javascript: (F-SPEC-13)', () => {
      const maliciousExcuse: ExcuseRequestDetail = {
        ...mockPendingExcuse,
        proofUrl: 'javascript:alert(1)',
      }

      render(
        <ExcuseDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          request={maliciousExcuse}
        />
      )

      expect(screen.queryByText('Mở toàn màn hình')).toBeNull()
      expect(screen.queryByAltText('Minh chứng giải trình')).toBeNull()
      expect(screen.getByText('Không có tệp minh chứng đính kèm.')).toBeDefined()
    })
  })

  describe('4. KioskDetailDrawer', () => {
    const mockKiosk: KioskItemResponse = {
      id: 1,
      kioskId: 'KSK-HQ-LOBBY-01',
      name: 'Kiosk Sảnh Chính Tòa A',
      location: 'Tầng 1 - Sảnh chính HQ',
      ipAddress: '192.168.10.101',
      status: 'ONLINE',
      lastPingAt: '2026-11-24T09:30:00Z',
      appVersion: 'v2.4.0',
    }

    it('hiển thị thông báo khi kiosk = null', () => {
      render(
        <KioskDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          kiosk={null}
        />
      )
      expect(screen.getByText('Chưa chọn trạm Kiosk nào để kiểm tra viễn trắc.')).toBeDefined()
    })

    it('hiển thị đầy đủ thông số phần cứng, firmware, vector cache và lịch sử nhịp tim', async () => {
      vi.spyOn(complianceAdminService, 'getKioskHealth').mockResolvedValue({
        kioskId: 'KSK-HQ-LOBBY-01',
        status: 'ONLINE',
        isStale: false,
        lastPingAt: '2026-11-24T09:30:00Z',
        macAddress: '00:1B:44:11:3A:B7',
        ipAddress: '192.168.10.101',
        firmwareVersion: 'v1.4.2 (Linux Edge OS)',
        appVersion: 'v2.4.0',
        cachedGalleryCount: 1248,
        heartbeatHistory: [
          { timestamp: '2026-11-24T09:29:45Z', latencyMs: 14, status: 'SUCCESS' },
        ],
        diagnosticLogs: [
          { timestamp: '2026-11-24T09:29:30Z', level: 'INFO', message: 'Camera feed healthy' },
        ],
      })

      const handleReissue = vi.fn()

      render(
        <KioskDetailDrawer
          isOpen={true}
          onClose={vi.fn()}
          kiosk={mockKiosk}
          onReissueToken={handleReissue}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('kiosk-detail-drawer')).toBeDefined()
      })
      expect(screen.getAllByText('Kiosk Sảnh Chính Tòa A').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByTestId('kiosk-mac-address')).toBeDefined()
      expect(screen.getByTestId('kiosk-ip-address')).toBeDefined()
      expect(screen.getByTestId('kiosk-firmware-version')).toBeDefined()
      expect(screen.getByTestId('kiosk-cached-vectors')).toBeDefined()
      expect(screen.getByTestId('kiosk-heartbeat-history')).toBeDefined()
      expect(screen.getByTestId('kiosk-diagnostic-logs')).toBeDefined()

      // Nút Cấp lại Token
      const reissueBtn = screen.getByTestId('drawer-reissue-token-btn-KSK-HQ-LOBBY-01')
      fireEvent.click(reissueBtn)
      expect(handleReissue).toHaveBeenCalledWith(mockKiosk)
    })
  })
})
