/**
 * Bộ Chuẩn Hóa Lỗi API (API Error Normalizer - APD-WEB-004..012, DD-WEB-001, DD-WEB-018, BLD-WEB-022).
 *
 * Chuyển đổi các mã lỗi HTTP 400, 401, 403, 404, 409, 422, 500 thành thông điệp tiếng Việt thân thiện,
 * phân tách chi tiết lỗi từng trường (fieldErrors) và trích xuất gợi ý khoảng trống khi trùng ca (overlapConflict).
 */

import axios, { type AxiosError } from 'axios'
import type { OverlapConflictInfo } from '@/types'

export interface NormalizedApiError {
  statusCode: number
  code: string
  message: string
  fieldErrors: Record<string, string>
  overlapConflict?: OverlapConflictInfo
  isNetworkError: boolean
  originalError: unknown
}

interface BackendErrorPayload {
  success?: boolean
  code?: string
  message?: string
  details?: Record<string, string>
  errors?: Record<string, string> | Array<{ field?: string; message?: string }>
  overlapInfo?: OverlapConflictInfo
  suggestedStartDate?: string
  suggestedEndDate?: string
}

/**
 * Chuẩn hóa lỗi từ API Axios hoặc đối tượng lỗi thông thường
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  // 1. Trường hợp lỗi Axios
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<BackendErrorPayload>

    // Lỗi mạng hoặc timeout
    if (!axiosErr.response) {
      const isTimeout = axiosErr.code === 'ECONNABORTED'
      return {
        statusCode: 0,
        code: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
        message: isTimeout
          ? 'Hết thời gian chờ phản hồi từ máy chủ. Vui lòng kiểm tra lại kết nối.'
          : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.',
        fieldErrors: {},
        isNetworkError: true,
        originalError: error,
      }
    }

    const status = axiosErr.response.status
    const data = axiosErr.response.data || {}
    const backendCode = data.code || `HTTP_${status}`
    const backendMessage = data.message || ''

    // Trích xuất lỗi từng trường nếu có
    const fieldErrors: Record<string, string> = {}
    if (data.details && typeof data.details === 'object') {
      Object.entries(data.details).forEach(([key, val]) => {
        if (typeof val === 'string') fieldErrors[key] = val
      })
    } else if (data.errors) {
      if (Array.isArray(data.errors)) {
        data.errors.forEach((item) => {
          if (item?.field && item?.message) {
            fieldErrors[item.field] = item.message
          }
        })
      } else if (typeof data.errors === 'object') {
        Object.entries(data.errors).forEach(([key, val]) => {
          if (typeof val === 'string') fieldErrors[key] = val
        })
      }
    }

    // Xử lý xung đột chồng lấn ca (overlapConflict)
    let overlapConflict: OverlapConflictInfo | undefined
    if (data.overlapInfo) {
      overlapConflict = data.overlapInfo
    } else if (data.suggestedStartDate || data.suggestedEndDate) {
      overlapConflict = {
        suggestedStartDate: data.suggestedStartDate,
        suggestedEndDate: data.suggestedEndDate,
        message: backendMessage || 'Khoảng ngày phân ca bị chồng lấn với lịch phân ca hiện tại',
      }
    }

    let friendlyMessage = backendMessage

    // Xử lý và chuẩn hóa thông điệp theo từng status code
    switch (status) {
      case 400:
        if (!friendlyMessage) {
          friendlyMessage = 'Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập.'
        }
        break

      case 401:
        if (!friendlyMessage) {
          friendlyMessage = 'Phiên làm việc đã hết hạn hoặc thông tin xác thực không hợp lệ.'
        }
        break

      case 403:
        if (!friendlyMessage) {
          friendlyMessage = 'Bạn không có quyền thực hiện thao tác này trên hệ thống.'
        }
        break

      case 404:
        if (!friendlyMessage) {
          friendlyMessage = 'Không tìm thấy dữ liệu hoặc tài nguyên yêu cầu.'
        }
        break

      case 409:
        // Chuẩn hóa lỗi xung đột dữ liệu (trùng mã/email hoặc chồng lấn ca)
        if (backendCode.includes('EMPLOYEE_CODE_EXISTS') || backendMessage.toLowerCase().includes('mã nhân viên')) {
          fieldErrors.employeeCode = fieldErrors.employeeCode || 'Mã nhân sự đã tồn tại trong hệ thống'
          if (!friendlyMessage) friendlyMessage = 'Mã nhân sự đã tồn tại trong hệ thống'
        } else if (backendCode.includes('EMAIL_EXISTS') || backendMessage.toLowerCase().includes('email')) {
          fieldErrors.email = fieldErrors.email || 'Địa chỉ email đã được sử dụng bởi nhân sự khác'
          if (!friendlyMessage) friendlyMessage = 'Địa chỉ email đã được sử dụng bởi nhân sự khác'
        } else if (backendCode.includes('SHIFT_OVERLAP') || backendMessage.toLowerCase().includes('chồng lấn') || overlapConflict) {
          if (!overlapConflict) {
            overlapConflict = {
              message: backendMessage || 'Lịch phân ca bị chồng lấn với khoảng ngày đã đăng ký trước đó',
            }
          }
          if (!friendlyMessage) friendlyMessage = 'Lịch phân ca bị chồng lấn với khoảng ngày đã đăng ký'
        } else if (backendCode.includes('PERIOD_LOCKED') || backendMessage.toLowerCase().includes('kỳ công')) {
          if (!friendlyMessage) friendlyMessage = 'Kỳ công đã bị khóa, không thể thực hiện thao tác điều chỉnh'
        } else if (!friendlyMessage) {
          friendlyMessage = 'Xung đột dữ liệu: Thao tác không thể hoàn tất do dữ liệu đã tồn tại hoặc đang bị khóa.'
        }
        break

      case 422:
        if (!friendlyMessage) {
          friendlyMessage = 'Dữ liệu không đáp ứng quy chuẩn nghiệp vụ của hệ thống.'
        }
        break

      case 423:
        if (!friendlyMessage) {
          friendlyMessage = 'Tài nguyên hoặc tài khoản đang tạm thời bị khóa.'
        }
        break

      case 500:
      case 502:
      case 503:
      case 504:
        if (!friendlyMessage) {
          friendlyMessage = 'Máy chủ gặp sự cố trong quá trình xử lý. Vui lòng thử lại sau.'
        }
        break

      default:
        if (!friendlyMessage) {
          friendlyMessage = `Đã xảy ra lỗi (${status}). Vui lòng thử lại.`
        }
    }

    return {
      statusCode: status,
      code: backendCode,
      message: friendlyMessage,
      fieldErrors,
      overlapConflict,
      isNetworkError: false,
      originalError: error,
    }
  }

  // 2. Trường hợp Error thông thường của Javascript
  if (error instanceof Error) {
    return {
      statusCode: 0,
      code: 'CLIENT_ERROR',
      message: error.message || 'Đã xảy ra lỗi không xác định tại giao diện.',
      fieldErrors: {},
      isNetworkError: false,
      originalError: error,
    }
  }

  // 3. Trường hợp đối tượng lỗi lạ
  return {
    statusCode: 0,
    code: 'UNKNOWN_ERROR',
    message: typeof error === 'string' ? error : 'Đã xảy ra lỗi không mong muốn.',
    fieldErrors: {},
    isNetworkError: false,
    originalError: error,
  }
}
