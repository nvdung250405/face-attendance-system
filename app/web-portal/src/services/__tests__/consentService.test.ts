/**
 * Unit Tests cho ConsentService
 * (DATA-WEB-003, API-WEB-003, DD-WEB-005, BLD-WEB-013, TASK-WEB-017, TST-WEB-014).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { consentService, CONSENT_ENDPOINT } from '../consentService'
import { apiClient } from '../apiClient'
import { safeSessionStorage, STORAGE_KEYS } from '../storage'
import type { ConsentResult } from '@/types'

describe('ConsentService (TASK-WEB-017)', () => {
  const mockConsentResult: ConsentResult = {
    otp: '839201',
    qrCodeData: 'otp:839201;emp:NV-1042;exp:2026-10-14T08:32:15.000+07:00',
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    consentSignedAt: '2026-10-12T08:32:15.000+07:00',
    kioskLocations: ['Sảnh Lễ tân Tầng 1 - KIOSK-HN-01'],
  }

  beforeEach(() => {
    safeSessionStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    safeSessionStorage.clear()
  })

  describe('1. submitConsent (POST /api/v1/employee/consent)', () => {
    it('gửi yêu cầu ký cam kết thành công và tự động lưu phiên tạm vào SessionStorage (DD-WEB-005)', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          code: 'CONSENT_ACCEPTED',
          message: 'Tiếp nhận cam kết thành công',
          data: mockConsentResult,
        },
      } as never)

      const result = await consentService.submitConsent({ agreed: true })

      expect(postSpy).toHaveBeenCalledWith(
        CONSENT_ENDPOINT,
        expect.objectContaining({
          agreed: true,
          accepted: true,
          consentVersion: 'v1.0',
        })
      )

      expect(result).toEqual(mockConsentResult)

      // Kiểm tra lưu phiên tạm trong SessionStorage (fas_consent_session)
      const stored = consentService.getStoredConsentSession()
      expect(stored).not.toBeNull()
      expect(stored?.otp).toBe('839201')
      expect(stored?.consentSigned).toBe(true)
      expect(stored?.kioskTargetHint).toBe('Sảnh Lễ tân Tầng 1 - KIOSK-HN-01')
    })

    it('ném ngoại lệ rõ ràng khi phản hồi từ máy chủ thiếu mã OTP', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: null,
        },
      } as never)

      await expect(consentService.submitConsent({ agreed: true })).rejects.toThrow(
        'Phản hồi ký cam kết không chứa mã OTP hợp lệ'
      )
    })
  })

  describe('2. Quản lý Phiên Tạm trong SessionStorage (fas_consent_session)', () => {
    it('lấy đúng phiên ký cam kết nếu còn thời hạn hiệu lực', () => {
      const validFutureDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      consentService.storeConsentSession({
        consentSigned: true,
        otp: '123456',
        qrCodeData: 'otp:123456',
        expiresAt: validFutureDate,
      })

      const session = consentService.getStoredConsentSession()
      expect(session).not.toBeNull()
      expect(session?.otp).toBe('123456')
    })

    it('tự động dọn dẹp và trả về null khi phiên đã hết hạn', () => {
      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString() // Đã hết hạn 1 tiếng trước
      consentService.storeConsentSession({
        consentSigned: true,
        otp: '999999',
        qrCodeData: 'otp:999999',
        expiresAt: pastDate,
      })

      const session = consentService.getStoredConsentSession()
      expect(session).toBeNull()

      // Khóa trong storage cũng bị xóa sạch
      expect(safeSessionStorage.getItem(STORAGE_KEYS.CONSENT_SESSION)).toBeNull()
    })

    it('clearConsentSession xóa sạch dữ liệu khỏi SessionStorage', () => {
      consentService.storeConsentSession({
        consentSigned: true,
        otp: '654321',
        qrCodeData: 'otp:654321',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      })

      consentService.clearConsentSession()
      expect(consentService.getStoredConsentSession()).toBeNull()
    })
  })
})
