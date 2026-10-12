/**
 * Dịch vụ Ký Cam kết Informed Consent (DATA-WEB-003, API-WEB-003, DD-WEB-005, BLD-WEB-013, TASK-WEB-017).
 *
 * Quản lý gửi yêu cầu ký cam kết điện tử và cô lập phiên tạm trong SafeSessionStorage ('fas_consent_session').
 */

import { apiClient } from './apiClient'
import { safeSessionStorage, STORAGE_KEYS } from './storage'
import type { ApiResponse, ConsentRequest, ConsentResult, ConsentFlowSession } from '@/types'

export const CONSENT_ENDPOINT = '/api/v1/employee/consent'

export class ConsentService {
  /**
   * Đọc phiên ký cam kết tạm thời từ SessionStorage nếu còn hạn
   */
  getStoredConsentSession(): ConsentFlowSession | null {
    try {
      const session = safeSessionStorage.getItem<ConsentFlowSession>(STORAGE_KEYS.CONSENT_SESSION)
      if (!session || !session.otp) {
        return null
      }

      // Kiểm tra hạn sử dụng nếu có
      if (session.expiresAt) {
        const expiresTime = new Date(session.expiresAt).getTime()
        if (!isNaN(expiresTime) && Date.now() > expiresTime) {
          this.clearConsentSession()
          return null
        }
      }

      return session
    } catch {
      return null
    }
  }

  /**
   * Lưu phiên ký cam kết tạm thời vào SessionStorage
   */
  storeConsentSession(data: ConsentFlowSession): void {
    safeSessionStorage.setItem(STORAGE_KEYS.CONSENT_SESSION, data)
  }

  /**
   * Xóa sạch phiên ký cam kết tạm thời khỏi SessionStorage
   */
  clearConsentSession(): void {
    safeSessionStorage.removeItem(STORAGE_KEYS.CONSENT_SESSION)
  }

  /**
   * Gửi yêu cầu ký cam kết điện tử lên máy chủ (POST /api/v1/employee/consent)
   */
  async submitConsent(request?: Partial<ConsentRequest>): Promise<ConsentResult> {
    const payload: ConsentRequest = {
      agreed: request?.agreed ?? request?.accepted ?? true,
      accepted: request?.accepted ?? request?.agreed ?? true,
      consentVersion: request?.consentVersion ?? 'v1.0',
      consentTimestamp: request?.consentTimestamp ?? new Date().toISOString(),
    }

    const response = await apiClient.post<ApiResponse<ConsentResult>>(CONSENT_ENDPOINT, payload)
    const result = response.data.data

    if (!result || !result.otp) {
      throw new Error('Phản hồi ký cam kết không chứa mã OTP hợp lệ')
    }

    // Tự động lưu phiên tạm vào SessionStorage theo DATA-WEB-003 và DD-WEB-005
    const sessionData: ConsentFlowSession = {
      consentSigned: true,
      otp: result.otp,
      qrCodeData: result.qrCodeData || `otp:${result.otp}`,
      qrCodeDataUrl: result.qrCodeDataUrl,
      expiresAt: result.expiresAt,
      kioskLocations: result.kioskLocations,
      kioskTargetHint: result.kioskLocations?.[0],
    }

    this.storeConsentSession(sessionData)
    return result
  }
}

/**
 * Singleton instance dịch vụ Consent
 */
export const consentService = new ConsentService()
