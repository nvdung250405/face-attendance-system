/**
 * Chuẩn Fixtures Phản Hồi Xác Thực (Authentication Fixtures - TASK-WEB-032, API-WEB-001, API-WEB-002).
 */

import type { ApiResponse, LoginResponse, TokenResponse, UserProfile } from '@/types'

export const mockHrUser: UserProfile = {
  id: 101,
  employeeCode: 'NV-HR-001',
  fullName: 'Nguyễn Quản Trị Nhân Sự',
  email: 'hr.manager@company.com',
  role: 'HR_MANAGER',
  status: 'ACTIVE',
  department: 'Phòng Nhân sự',
  hasBiometric: true,
  hasPin: true,
  createdAt: '2026-01-15T08:00:00+07:00',
}

export const mockEmployeeUser: UserProfile = {
  id: 1042,
  employeeCode: 'NV-1042',
  fullName: 'Ngô Văn Dũng',
  email: 'dung.nv@company.com',
  role: 'EMPLOYEE',
  status: 'PENDING_CONSENT',
  department: 'Phòng Kỹ thuật',
  hasBiometric: false,
  hasPin: false,
  createdAt: '2026-10-01T08:30:00+07:00',
}

export const mockLoginSuccessHr: ApiResponse<LoginResponse> = {
  success: true,
  code: 'AUTH_SUCCESS',
  message: 'Đăng nhập thành công',
  data: {
    accessToken: 'mock-access-token-hr-jwt-header.payload.signature',
    refreshToken: 'mock-refresh-token-hr-uuid-1111',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: mockHrUser,
  },
  timestamp: '2026-10-13T08:00:00.000+07:00',
}

export const mockLoginSuccessEmployee: ApiResponse<LoginResponse> = {
  success: true,
  code: 'AUTH_SUCCESS',
  message: 'Đăng nhập thành công',
  data: {
    accessToken: 'mock-access-token-emp-jwt-header.payload.signature',
    refreshToken: 'mock-refresh-token-emp-uuid-2222',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: mockEmployeeUser,
  },
  timestamp: '2026-10-13T08:00:00.000+07:00',
}

export const mockTokenRefreshSuccess: ApiResponse<TokenResponse> = {
  success: true,
  code: 'TOKEN_REFRESHED',
  message: 'Làm mới Access Token thành công',
  data: {
    accessToken: 'mock-new-access-token-jwt-refreshed',
    refreshToken: 'mock-new-refresh-token-uuid-3333',
    tokenType: 'Bearer',
    expiresIn: 3600,
  },
  timestamp: '2026-10-13T09:00:00.000+07:00',
}

export const mockLoginInvalidCredentials = {
  success: false,
  code: 'AUTH_INVALID_CREDENTIALS',
  message: 'Email hoặc mật khẩu không chính xác',
  timestamp: '2026-10-13T08:00:01.000+07:00',
}

export const mockTokenRefreshExpired = {
  success: false,
  code: 'REFRESH_TOKEN_EXPIRED',
  message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
  timestamp: '2026-10-13T09:00:01.000+07:00',
}
