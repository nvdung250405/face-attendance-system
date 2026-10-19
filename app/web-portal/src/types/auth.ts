/**
 * Hợp đồng dữ liệu Xác thực, Vai trò & Hồ sơ Người dùng (DATA-WEB-001, API-WEB-001, API-WEB-002).
 */

export type UserRole = 'HR_MANAGER' | 'EMPLOYEE' | 'ADMIN' | 'DPO'
export type UserStatus = 'PENDING_CONSENT' | 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'SUSPENDED'

export interface UserProfile {
  readonly id: number
  readonly employeeCode: string
  readonly fullName: string
  readonly email: string
  readonly role: UserRole
  readonly status: UserStatus
  readonly department: string
  readonly hasBiometric?: boolean
  readonly hasPin?: boolean
  readonly mustChangePassword?: boolean
  readonly createdAt?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresAt: number // Unix timestamp (milliseconds)
  user: UserProfile
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number // seconds
  user: UserProfile
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number // seconds
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}
