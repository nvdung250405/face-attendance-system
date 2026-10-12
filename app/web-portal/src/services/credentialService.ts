/**
 * Dịch vụ Thông tin Xác thực & Quản lý PIN (CredentialService - APD-WEB-006, API-WEB-012, DD-WEB-018).
 *
 * Xử lý đổi mật khẩu tự nguyện (không chặn điều hướng), thiết lập PIN và đặt lại PIN.
 * Thông báo các phiên cũ đã bị thu hồi sau khi đổi mật khẩu/đặt lại PIN thành công.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  SetupPinRequest,
  ResetPinRequest,
  PinStatusResponse,
} from '@/types'

export class CredentialService {
  /**
   * Đổi mật khẩu tự nguyện (POST /api/v1/auth/change-password)
   * Không chặn điều hướng; sau khi đổi thành công các phiên cũ tự động bị thu hồi.
   */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ChangePasswordResponse>>(
        '/api/v1/auth/change-password',
        data
      )
      return (
        response.data.data || {
          message: response.data.message || 'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi.',
          sessionsRevoked: true,
        }
      )
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Thiết lập mã PIN dự phòng lần đầu cho Kiosk (POST /api/v1/employee/pin)
   */
  async setupPin(data: SetupPinRequest): Promise<PinStatusResponse> {
    try {
      const response = await apiClient.post<ApiResponse<PinStatusResponse>>(
        '/api/v1/employee/pin',
        data
      )
      return (
        response.data.data || {
          hasPin: true,
          message: response.data.message || 'Thiết lập mã PIN dự phòng thành công.',
        }
      )
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Đặt lại mã PIN dự phòng khi quên (POST /api/v1/employee/pin/reset)
   * Yêu cầu cung cấp mật khẩu tài khoản hiện tại để xác thực.
   */
  async resetPin(data: ResetPinRequest): Promise<PinStatusResponse> {
    try {
      const response = await apiClient.post<ApiResponse<PinStatusResponse>>(
        '/api/v1/employee/pin/reset',
        data
      )
      return (
        response.data.data || {
          hasPin: true,
          message: response.data.message || 'Đặt lại mã PIN dự phòng thành công.',
        }
      )
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const credentialService = new CredentialService()
