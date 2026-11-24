import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { normalizeApiError } from '@/services/errorNormalizer'

describe('errorNormalizer - Chuẩn hóa lỗi API (TASK-WEB-023)', () => {
  it('1. Chuẩn hóa lỗi mạng (Network Error / No response)', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    const normalized = normalizeApiError(error)

    expect(normalized.statusCode).toBe(0)
    expect(normalized.code).toBe('NETWORK_ERROR')
    expect(normalized.isNetworkError).toBe(true)
    expect(normalized.message).toContain('Không thể kết nối')
  })

  it('2. Chuẩn hóa lỗi Timeout (ECONNABORTED)', () => {
    const error = new AxiosError('Timeout', 'ECONNABORTED')
    const normalized = normalizeApiError(error)

    expect(normalized.code).toBe('TIMEOUT_ERROR')
    expect(normalized.isNetworkError).toBe(true)
    expect(normalized.message).toContain('Hết thời gian chờ')
  })

  it('3. Chuẩn hóa lỗi HTTP 400 Bad Request kèm chi tiết từng trường', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers,
        config: { headers },
        data: {
          code: 'VALIDATION_FAILED',
          message: 'Dữ liệu không hợp lệ',
          details: {
            employeeCode: 'Mã nhân viên không đúng định dạng NV-xxxx',
            email: 'Email không hợp lệ',
          },
        },
      }
    )

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(400)
    expect(normalized.code).toBe('VALIDATION_FAILED')
    expect(normalized.fieldErrors.employeeCode).toBe('Mã nhân viên không đúng định dạng NV-xxxx')
    expect(normalized.fieldErrors.email).toBe('Email không hợp lệ')
  })

  it('3b. Chuẩn hóa lỗi RFC 7807/9457 invalidParams (field/property -> reason/message)', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers,
        config: { headers },
        data: {
          code: 'INVALID_REQUEST_PARAMETERS',
          message: 'Dữ liệu không hợp lệ theo chuẩn RFC 7807',
          invalidParams: [
            { field: 'employeeCode', reason: 'Mã nhân viên đã tồn tại' },
            { property: 'email', message: 'Email không hợp lệ' },
          ],
        },
      }
    )

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(400)
    expect(normalized.fieldErrors.employeeCode).toBe('Mã nhân viên đã tồn tại')
    expect(normalized.fieldErrors.email).toBe('Email không hợp lệ')
  })

  it('3c. Chuẩn hóa đầy đủ trường RFC 9457 ProblemDetails (detail, title, type, invalidParams với pointer)', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError(
      'Request failed with status code 422',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers,
        config: { headers },
        data: {
          type: 'https://api.fas.vn/errors/unprocessable-entity',
          title: 'Unprocessable Entity',
          detail: 'Dữ liệu không đáp ứng quy chuẩn nghiệp vụ của hệ thống',
          invalidParams: [
            { pointer: '#/reason', reason: 'Lý do giải trình không được để trống' },
            { name: 'attendanceDate', message: 'Ngày chấm công không hợp lệ' },
          ],
        },
      }
    )

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(422)
    expect(normalized.title).toBe('Unprocessable Entity')
    expect(normalized.detail).toBe('Dữ liệu không đáp ứng quy chuẩn nghiệp vụ của hệ thống')
    expect(normalized.type).toBe('https://api.fas.vn/errors/unprocessable-entity')
    expect(normalized.fieldErrors.reason).toBe('Lý do giải trình không được để trống')
    expect(normalized.fieldErrors.attendanceDate).toBe('Ngày chấm công không hợp lệ')
    expect(normalized.message).toBe('Dữ liệu không đáp ứng quy chuẩn nghiệp vụ của hệ thống')
  })

  it('4. Chuẩn hóa lỗi HTTP 401 Unauthorized', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers,
      config: { headers },
      data: {
        code: 'TOKEN_EXPIRED',
        message: 'Token đã hết hạn',
      },
    })

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(401)
    expect(normalized.message).toBe('Token đã hết hạn')
  })

  it('5. Chuẩn hóa lỗi HTTP 403 Forbidden', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers,
      config: { headers },
      data: {},
    })

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(403)
    expect(normalized.message).toBe('Bạn không có quyền thực hiện thao tác này trên hệ thống.')
  })

  it('6. Chuẩn hóa lỗi HTTP 409 Trùng mã nhân sự / Email', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers,
      config: { headers },
      data: {
        code: 'EMPLOYEE_CODE_EXISTS',
        message: 'Mã nhân viên đã tồn tại',
      },
    })

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(409)
    expect(normalized.fieldErrors.employeeCode).toBeDefined()
  })

  it('7. Chuẩn hóa lỗi HTTP 409 Chồng lấn phân ca kèm gợi ý khoảng trống', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers,
      config: { headers },
      data: {
        code: 'SHIFT_OVERLAP_CONFLICT',
        message: 'Trùng lịch phân ca',
        suggestedStartDate: '2026-11-01',
        suggestedEndDate: '2026-11-30',
      },
    })

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(409)
    expect(normalized.overlapConflict).toBeDefined()
    expect(normalized.overlapConflict?.suggestedStartDate).toBe('2026-11-01')
    expect(normalized.overlapConflict?.suggestedEndDate).toBe('2026-11-30')
  })

  it('8. Chuẩn hóa lỗi HTTP 500 Internal Server Error', () => {
    const headers = new AxiosHeaders()
    const error = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers,
      config: { headers },
      data: {},
    })

    const normalized = normalizeApiError(error)
    expect(normalized.statusCode).toBe(500)
    expect(normalized.message).toContain('Máy chủ gặp sự cố')
  })

  it('9. Chuẩn hóa lỗi Javascript Error thông thường', () => {
    const error = new Error('Lỗi logic client')
    const normalized = normalizeApiError(error)

    expect(normalized.statusCode).toBe(0)
    expect(normalized.code).toBe('CLIENT_ERROR')
    expect(normalized.message).toBe('Lỗi logic client')
  })

  it('10. Che giấu chi tiết lỗi cơ sở dữ liệu trên HTTP 500 khi không ở chế độ DEV (F-SPEC-06)', () => {
    const originalDev = import.meta.env.DEV
    try {
      import.meta.env.DEV = false

      const headers = new AxiosHeaders()
      const error = new AxiosError('Internal Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        headers,
        config: { headers },
        data: {
          detail: 'org.postgresql.util.PSQLException: Connection reset by peer',
          message: 'Internal SQL Error',
        },
      })

      const normalized = normalizeApiError(error)
      expect(normalized.statusCode).toBe(500)
      expect(normalized.message).toBe('Máy chủ gặp sự cố trong quá trình xử lý. Vui lòng thử lại sau.')
      expect(normalized.detail).toBe('org.postgresql.util.PSQLException: Connection reset by peer')
    } finally {
      import.meta.env.DEV = originalDev
    }
  })
})
