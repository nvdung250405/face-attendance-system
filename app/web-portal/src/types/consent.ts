/**
 * Hợp đồng dữ liệu Luồng Ký cam kết Informed Consent (DATA-WEB-003, API-WEB-003, API-WEB-014).
 */

export interface ConsentRequest {
  consentVersion: string
  accepted: boolean
}

export interface ConsentResult {
  readonly otp: string
  readonly qrCodeDataUrl?: string
  readonly expiresAt: string
  readonly consentSignedAt: string
  readonly notice?: string
}

export interface ConsentFlowSession {
  consentSigned: boolean
  otp: string
  qrCodeData: string
  expiresAt: string
  kioskTargetHint?: string
}

export interface ConsentWithdrawalResponse {
  readonly employeeId: number
  readonly withdrawnAt: string
  readonly biometricPurgeDeadline: string
  readonly message: string
}
