/**
 * Hợp đồng dữ liệu Thông tin Xác thực & Quản lý PIN (API-WEB-012, APD-WEB-006, DD-WEB-018).
 */

// ChangePasswordRequest được định nghĩa và xuất khẩu tại types/auth.ts

export interface ChangePasswordResponse {
  readonly message: string
  readonly sessionsRevoked: boolean
}

export interface SetupPinRequest {
  pin: string
  confirmPin?: string
}

export interface ResetPinRequest {
  currentPassword: string
  newPin: string
  confirmPin?: string
}

export interface PinStatusResponse {
  readonly hasPin: boolean
  readonly message?: string
}
