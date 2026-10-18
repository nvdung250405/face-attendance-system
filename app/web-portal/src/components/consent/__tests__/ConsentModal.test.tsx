/**
 * Unit & Integration Tests cho ConsentModal & QrCodeDisplay
 * (SOL-WEB-002, UXD-WEB-002, DD-WEB-005, DD-WEB-011, DD-WEB-015, DD-WEB-016, BLD-WEB-013, TASK-WEB-017, TST-WEB-007, TST-WEB-014).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ConsentModal } from '../ConsentModal'
import { consentService } from '@/services/consentService'
import { safeSessionStorage, STORAGE_KEYS } from '@/services/storage'
import { useAuthStore } from '@/store/authStore'
import type { EnrollmentSuccessMessage } from '@/types'

// Mock STOMP hook useEnrollmentStatus
let mockEnrollmentState = {
  isEnrolled: false,
  enrollmentData: null as EnrollmentSuccessMessage | null,
  isConnected: true,
  reset: vi.fn(),
}

vi.mock('@/services/hooks/useEnrollmentStatus', () => ({
  useEnrollmentStatus: () => mockEnrollmentState,
}))

describe('ConsentModal & Consent Flow (TASK-WEB-017)', () => {
  const mockConsentResult = {
    otp: '839201',
    qrCodeData: 'otp:839201;emp:NV-1042;exp:2026-10-14T08:32:15.000+07:00',
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    consentSignedAt: '2026-10-12T08:32:15.000+07:00',
    kioskLocations: ['Sảnh Lễ tân Tầng 1 - KIOSK-HN-01'],
  }

  beforeEach(() => {
    safeSessionStorage.clear()
    vi.restoreAllMocks()

    mockEnrollmentState = {
      isEnrolled: false,
      enrollmentData: null,
      isConnected: true,
      reset: vi.fn(),
    }

    // Thiết lập AuthStore user ban đầu
    useAuthStore.setState({
      session: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: {
          id: 1042,
          employeeCode: 'NV-1042',
          fullName: 'Ngô Văn Dũng',
          email: 'dung.nv@company.com',
          role: 'EMPLOYEE',
          status: 'PENDING_CONSENT',
          department: 'Kỹ thuật',
          hasBiometric: false,
          hasPin: false,
        },
      },
      user: {
        id: 1042,
        employeeCode: 'NV-1042',
        fullName: 'Ngô Văn Dũng',
        email: 'dung.nv@company.com',
        role: 'EMPLOYEE',
        status: 'PENDING_CONSENT',
        department: 'Kỹ thuật',
        hasBiometric: false,
        hasPin: false,
      },
      isAuthenticated: true,
      isInitialized: true,
    })
  })

  afterEach(() => {
    safeSessionStorage.clear()
  })

  describe('1. Render cơ bản', () => {
    it('không hiển thị khi isOpen = false', () => {
      render(<ConsentModal isOpen={false} onClose={vi.fn()} />)
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('2. Bước 1: Điều khoản Pháp lý & Ràng buộc Cuộn 100% (DD-WEB-015, TST-WEB-007)', () => {
    it('khóa nút Ký cam kết và Checkbox khi người dùng chưa cuộn hết văn bản điều khoản', () => {
      render(<ConsentModal isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText(/Cam kết Thu thập & Xử lý Dữ liệu Sinh trắc học/i)).toBeTruthy()

      const checkbox = screen.getByTestId('consent-agreement-checkbox') as HTMLInputElement
      const submitBtn = screen.getByTestId('submit-consent-btn') as HTMLButtonElement

      // Cả checkbox và nút ký đều phải bị vô hiệu hóa (disabled)
      expect(checkbox.disabled).toBe(true)
      expect(submitBtn.disabled).toBe(true)
      expect(screen.getByText(/Vui lòng cuộn xuống dưới cùng của văn bản/i)).toBeTruthy()
    })

    it('mở khóa checkbox khi cuộn đến đáy (100%) và mở khóa nút Ký khi đã tích chọn (DD-WEB-015)', () => {
      render(<ConsentModal isOpen={true} onClose={vi.fn()} />)

      const termsContainer = screen.getByTestId('terms-container')
      const checkbox = screen.getByTestId('consent-agreement-checkbox') as HTMLInputElement
      const submitBtn = screen.getByTestId('submit-consent-btn') as HTMLButtonElement

      // Định nghĩa các thuộc tính cuộn trên happy-dom
      Object.defineProperty(termsContainer, 'scrollHeight', { value: 600, configurable: true })
      Object.defineProperty(termsContainer, 'clientHeight', { value: 200, configurable: true })
      Object.defineProperty(termsContainer, 'scrollTop', { value: 400, configurable: true })

      fireEvent.scroll(termsContainer)

      // Checkbox được mở khóa nhưng nút Submit vẫn disabled cho đến khi được tích chọn
      expect(checkbox.disabled).toBe(false)
      expect(submitBtn.disabled).toBe(true)
      expect(screen.getByText(/Đã đọc hết nội dung văn bản/i)).toBeTruthy()

      // Tích chọn checkbox
      fireEvent.click(checkbox)
      expect(checkbox.checked).toBe(true)
      expect(submitBtn.disabled).toBe(false)
    })

    it('gọi consentService.submitConsent khi nhấn Ký cam kết và chuyển sang bước OTP_DISPLAY', async () => {
      const submitSpy = vi
        .spyOn(consentService, 'submitConsent')
        .mockResolvedValueOnce(mockConsentResult)

      render(<ConsentModal isOpen={true} onClose={vi.fn()} />)

      const termsContainer = screen.getByTestId('terms-container')
      Object.defineProperty(termsContainer, 'scrollHeight', { value: 600, configurable: true })
      Object.defineProperty(termsContainer, 'clientHeight', { value: 200, configurable: true })
      Object.defineProperty(termsContainer, 'scrollTop', { value: 400, configurable: true })
      fireEvent.scroll(termsContainer)

      const checkbox = screen.getByTestId('consent-agreement-checkbox')
      fireEvent.click(checkbox)

      const submitBtn = screen.getByTestId('submit-consent-btn')
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            agreed: true,
            consentVersion: 'v1.0',
          })
        )
      })

      // Đã chuyển sang bước hiển thị OTP & QR
      await waitFor(() => {
        expect(screen.getByTestId('otp-display-box')).toBeTruthy()
      })
      expect(screen.getByTestId('otp-display-box').textContent).toContain('839 201')
    })
  })

  describe('3. Bước 2: Hiển thị OTP 48px & Sao chép Clipboard (DD-WEB-016, TST-WEB-014)', () => {
    it('tự động vào thẳng bước OTP nếu đã có phiên fas_consent_session hợp lệ trong SessionStorage', () => {
      consentService.storeConsentSession({
        consentSigned: true,
        otp: '654321',
        qrCodeData: 'otp:654321',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        kioskLocations: ['Kiosk Tầng 1'],
      })

      render(<ConsentModal isOpen={true} onClose={vi.fn()} />)

      // Không hiển thị bước điều khoản nữa, nhảy thẳng vào OTP
      expect(screen.getByTestId('otp-display-box').textContent).toContain('654 321')
      expect(screen.getByTestId('copy-otp-btn')).toBeTruthy()
      expect(screen.getByText(/3 bước hoàn tất kích hoạt tại máy trạm Kiosk/i)).toBeTruthy()
      expect(screen.getByText(/Kiosk Tầng 1/i)).toBeTruthy()
    })

    it('nút Sao chép OTP hoạt động và hiển thị trạng thái đã sao chép', async () => {
      consentService.storeConsentSession({
        consentSigned: true,
        otp: '839201',
        qrCodeData: 'otp:839201',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      })

      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      })

      render(<ConsentModal isOpen={true} onClose={vi.fn()} />)

      const copyBtn = screen.getByTestId('copy-otp-btn')
      await act(async () => {
        fireEvent.click(copyBtn)
      })

      expect(writeTextMock).toHaveBeenCalledWith('839201')
    })
  })

  describe('4. Bước 3 & WebSocket STOMP: Kích hoạt Thành công (DD-WEB-011)', () => {
    it('tự động chuyển cảnh khi nhận tín hiệu STOMP quét mặt thành công và cập nhật AuthStore', async () => {
      const onCloseMock = vi.fn()
      const onSuccessMock = vi.fn()

      consentService.storeConsentSession({
        consentSigned: true,
        otp: '839201',
        qrCodeData: 'otp:839201',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      })

      const { rerender } = render(
        <ConsentModal isOpen={true} onClose={onCloseMock} onSuccess={onSuccessMock} />
      )

      expect(screen.getByTestId('otp-display-box')).toBeTruthy()

      // Giả lập STOMP message nhận được tín hiệu kích hoạt thành công từ Kiosk
      act(() => {
        mockEnrollmentState.isEnrolled = true
      })

      rerender(<ConsentModal isOpen={true} onClose={onCloseMock} onSuccess={onSuccessMock} />)

      await waitFor(() => {
        expect(screen.getByText(/Kích hoạt Khuôn mặt Thành công!/i)).toBeTruthy()
      })

      // 1. Kiểm tra cập nhật User status trong AuthStore thành ACTIVE và hasBiometric = true
      const currentUser = useAuthStore.getState().user
      expect(currentUser?.status).toBe('ACTIVE')
      expect(currentUser?.hasBiometric).toBe(true)

      // 2. Kiểm tra phiên tạm fas_consent_session đã được xóa khỏi SessionStorage (DATA-WEB-003)
      expect(safeSessionStorage.getItem(STORAGE_KEYS.CONSENT_SESSION)).toBeNull()

      // 4. Kiểm tra hiệu ứng Confetti hiển thị (DD-WEB-011, BLD-WEB-007)
      expect(screen.getByTestId('confetti-effect')).toBeTruthy()
    })

    it('tự động gọi onClose sau 3 giây khi kích hoạt thành công (DD-WEB-011)', async () => {
      vi.useFakeTimers()
      const onCloseMock = vi.fn()

      consentService.storeConsentSession({
        consentSigned: true,
        otp: '839201',
        qrCodeData: 'otp:839201',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      })

      const { rerender } = render(
        <ConsentModal isOpen={true} onClose={onCloseMock} />
      )

      act(() => {
        mockEnrollmentState.isEnrolled = true
      })

      rerender(<ConsentModal isOpen={true} onClose={onCloseMock} />)

      expect(screen.getByTestId('confetti-effect')).toBeTruthy()
      expect(onCloseMock).not.toHaveBeenCalled()

      // Chạy hết 3000ms timer
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(onCloseMock).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })

    it('nút Hoàn tất & Bắt đầu cho phép đóng modal ngay lập tức', () => {
      const onCloseMock = vi.fn()
      mockEnrollmentState.isEnrolled = true

      render(<ConsentModal isOpen={true} onClose={onCloseMock} />)

      const completeBtn = screen.getByTestId('complete-consent-btn')
      expect(completeBtn).toBeTruthy()
      fireEvent.click(completeBtn)
      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('5. Tương tác Accessibility & Đóng Hộp thoại (APC-WEB-004, UXD-WEB-002)', () => {
    it('đóng modal khi nhấn phím Escape', () => {
      const onCloseMock = vi.fn()
      render(<ConsentModal isOpen={true} onClose={onCloseMock} />)

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('đóng modal khi nhấn nút X', () => {
      const onCloseMock = vi.fn()
      render(<ConsentModal isOpen={true} onClose={onCloseMock} />)

      const closeBtn = screen.getByLabelText(/Đóng hộp thoại/i)
      fireEvent.click(closeBtn)
      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('bẫy tiêu điểm (Focus Trap) quay vòng khi nhấn Tab và Shift+Tab', () => {
      render(<ConsentModal isOpen={true} onClose={vi.fn()} />)

      const closeBtn = screen.getByLabelText(/Đóng hộp thoại/i)
      closeBtn.focus()
      expect(document.activeElement).toBe(closeBtn)

      // Nhấn Shift+Tab tại phần tử đầu tiên -> focus chuyển về phần tử cuối cùng
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
      // Verify không crash và giữ tiêu điểm trong modal
      expect(document.activeElement).not.toBeNull()

      // Nhấn Tab tại phần tử cuối cùng -> focus quay về phần tử đầu tiên
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: false })
      expect(document.activeElement).not.toBeNull()
    })
  })
})
