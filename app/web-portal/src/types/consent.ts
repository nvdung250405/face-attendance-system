/**
 * Hợp đồng dữ liệu Luồng Ký cam kết Informed Consent (DATA-WEB-003, API-WEB-003, API-WEB-014).
 */

export interface ConsentRequest {
  consentVersion?: string
  accepted?: boolean
  agreed?: boolean
  consentTimestamp?: string
}

export interface ConsentResult {
  readonly otp: string
  readonly qrCodeData?: string
  readonly qrCodeDataUrl?: string
  readonly expiresAt: string
  readonly consentSignedAt?: string
  readonly kioskLocations?: string[]
  readonly notice?: string
}

export interface ConsentFlowSession {
  consentSigned: boolean
  otp: string
  qrCodeData: string
  qrCodeDataUrl?: string
  expiresAt: string
  kioskTargetHint?: string
  kioskLocations?: string[]
}

export interface ConsentWithdrawalResponse {
  readonly employeeId: number
  readonly withdrawnAt: string
  readonly biometricPurgeDeadline: string
  readonly message: string
}

export interface EnrollmentSuccessMessage {
  readonly status: 'ENROLLMENT_SUCCESS'
  readonly otp: string
  readonly employeeId: number
  readonly employeeCode?: string
  readonly fullName?: string
  /** Số lượng template đã đăng ký (1 = legacy FRONTAL, 3 = Guided Multi-Pose). */
  readonly templateCount?: number
  /** Danh sách tư thế đã đăng ký, ví dụ ['FRONTAL', 'LEFT_TILT', 'RIGHT_TILT']. */
  readonly poses?: string[]
  readonly message: string
  readonly activatedAt: string
}

