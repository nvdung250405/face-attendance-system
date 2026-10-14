/**
 * Bộ Khung Mock Client Interceptor & API Contract Harness (TASK-WEB-032, FND-WEB-007).
 *
 * Cung cấp trình giả lập phản hồi HTTP Axios để phục vụ kiểm thử đơn vị, kiểm thử tích hợp
 * và kiểm thử các kịch bản ngoại lệ (Network Error, Timeout, Refresh Token Mutex Queue, Conflict 409).
 */

import MockAdapter from 'axios-mock-adapter'
import type { AxiosInstance } from 'axios'
import { apiClient } from '@/services/apiClient'
import {
  mockLoginSuccessHr,
  mockLoginSuccessEmployee,
  mockLoginInvalidCredentials,
  mockTokenRefreshSuccess,
  mockAdminAttendancePageResponse,
  mockEmployeeMonthlyTimesheet,
  mockConsentSubmitSuccess,
  mockWithdrawConsentSuccess,
  mockDataSubjectRequests,
  mockCreatedDataSubjectRequest,
  mockNotificationResponses,
  mockMarkAsReadResponse,
  mockPaginatedEmployees,
  mockCreateEmployeeSuccess,
  mockResetCredentialsSuccess,
  mockChangePasswordSuccess,
  mockKioskList,
  mockRegisterKioskSuccess,
  mockAuditLogsPaginatedResponse,
  mockDpoConsentList,
  mockRetentionScheduleList,
} from './fixtures'

export interface MockServerOptions {
  delayResponse?: number
  onNoMatch?: 'passthrough' | 'throwException'
}

/**
 * Khởi tạo MockAdapter bọc quanh Axios Client
 */
export function createMockServer(
  client: AxiosInstance = apiClient,
  options: MockServerOptions = { delayResponse: 0, onNoMatch: 'passthrough' }
): MockAdapter {
  return new MockAdapter(client, {
    delayResponse: options.delayResponse ?? 0,
    onNoMatch: options.onNoMatch ?? 'passthrough',
  })
}

/**
 * Thiết lập bộ mock handlers mặc định tuân thủ đầy đủ hợp đồng API Backend
 */
export function setupDefaultMockHandlers(mock: MockAdapter): MockAdapter {
  // 1. POST /api/v1/auth/login
  mock.onPost(/\/api\/v1\/auth\/login/).reply((config) => {
    try {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
      const email = body?.email || body?.username

      if (body?.password === 'WrongPassword' || body?.password === 'invalid') {
        return [401, mockLoginInvalidCredentials]
      }

      if (email?.includes('hr') || email?.includes('admin')) {
        return [200, mockLoginSuccessHr]
      }

      return [200, mockLoginSuccessEmployee]
    } catch {
      return [400, { success: false, code: 'BAD_REQUEST', message: 'Payload không hợp lệ' }]
    }
  })

  // 2. POST /api/v1/auth/refresh
  mock.onPost(/\/api\/v1\/auth\/refresh/).reply((config) => {
    try {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
      if (!body?.refreshToken || body?.refreshToken === 'expired-token') {
        return [401, { success: false, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token không hợp lệ' }]
      }
      return [200, mockTokenRefreshSuccess]
    } catch {
      return [401, { success: false, code: 'UNAUTHORIZED', message: 'Yêu cầu làm mới không hợp lệ' }]
    }
  })

  // 3. POST /api/v1/auth/logout
  mock.onPost(/\/api\/v1\/auth\/logout/).reply(204)

  // 4. POST /api/v1/employee/consent
  mock.onPost(/\/api\/v1\/employee\/consent(\/.*)?/).reply((config) => {
    if (config.url?.endsWith('/withdraw')) {
      return [200, mockWithdrawConsentSuccess]
    }
    return [200, mockConsentSubmitSuccess]
  })

  // 5. GET /api/v1/admin/attendance
  mock.onGet(/\/api\/v1\/admin\/attendance/).reply(200, mockAdminAttendancePageResponse)

  // 6. GET /api/v1/employee/attendance
  mock.onGet(/\/api\/v1\/employee\/attendance/).reply(200, mockEmployeeMonthlyTimesheet)

  // 7. Notifications (/api/v1/notifications)
  mock.onGet(/\/api\/v1\/notifications/).reply(200, {
    success: true,
    code: 'OK',
    message: 'Thành công',
    data: mockNotificationResponses,
    timestamp: new Date().toISOString(),
  })
  mock.onPatch(/\/api\/v1\/notifications\/read-all/).reply(200, {
    success: true,
    code: 'OK',
    message: 'Đã đánh dấu tất cả thông báo là đã đọc',
    data: null,
  })
  mock.onPatch(/\/api\/v1\/notifications\/\d+\/read/).reply(200, mockMarkAsReadResponse)

  // 8. Data Subject Requests (/api/v1/employee/data-requests)
  mock.onGet(/\/api\/v1\/employee\/data-requests/).reply(200, {
    success: true,
    code: 'OK',
    message: 'Thành công',
    data: mockDataSubjectRequests,
    timestamp: new Date().toISOString(),
  })
  mock.onPost(/\/api\/v1\/employee\/data-requests/).reply(200, {
    success: true,
    code: 'CREATED',
    message: 'Đã tiếp nhận yêu cầu dữ liệu cá nhân',
    data: mockCreatedDataSubjectRequest,
    timestamp: new Date().toISOString(),
  })

  // 8. POST /api/v1/auth/change-password
  mock.onPost(/\/api\/v1\/auth\/change-password/).reply(200, mockChangePasswordSuccess)

  // 9. Employee lifecycle (/api/v1/admin/employees)
  mock.onGet(/\/api\/v1\/admin\/employees\/\d+/).reply((config) => {
    const idMatch = config.url?.match(/\/api\/v1\/admin\/employees\/(\d+)/)
    const id = idMatch ? Number(idMatch[1]) : 1
    const emp = mockPaginatedEmployees.content.find((e) => e.id === id) || mockPaginatedEmployees.content[0]
    return [200, { success: true, data: emp }]
  })
  mock.onGet(/\/api\/v1\/admin\/employees/).reply(200, {
    success: true,
    data: mockPaginatedEmployees,
  })
  mock.onPost(/\/api\/v1\/admin\/employees\/\d+\/credentials\/reset/).reply(200, mockResetCredentialsSuccess)
  mock.onPatch(/\/api\/v1\/admin\/employees\/\d+\/status/).reply((config) => {
    try {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
      const updated = { ...mockPaginatedEmployees.content[0], status: body?.status || 'ACTIVE' }
      return [200, { success: true, data: updated }]
    } catch {
      return [200, { success: true, data: mockPaginatedEmployees.content[0] }]
    }
  })
  mock.onPatch(/\/api\/v1\/admin\/employees\/\d+/).reply((config) => {
    try {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
      const updated = { ...mockPaginatedEmployees.content[0], ...body }
      return [200, { success: true, data: updated }]
    } catch {
      return [200, { success: true, data: mockPaginatedEmployees.content[0] }]
    }
  })
  mock.onPost(/\/api\/v1\/admin\/employees/).reply(200, mockCreateEmployeeSuccess)

  // 10. Kiosk management (/api/v1/admin/kiosks)
  mock.onGet(/\/api\/v1\/admin\/kiosks\/\w+\/health/).reply((config) => {
    const id = config.url?.split('/').slice(-2)[0] || 'KIOSK-HN-01'
    return [200, { success: true, data: { kioskId: id, status: 'ONLINE', isStale: false } }]
  })
  mock.onPatch(/\/api\/v1\/admin\/kiosks\/.+/).reply(200, {
    success: true,
    data: { ...mockKioskList[0], secretToken: 'reissued-secret-token-12345' },
  })
  mock.onGet(/\/api\/v1\/admin\/kiosks/).reply(200, {
    success: true,
    data: mockKioskList,
  })
  mock.onPost(/\/api\/v1\/admin\/kiosks/).reply(200, mockRegisterKioskSuccess)

  // 11. Compliance & Audit logs (/api/v1/admin/audit-logs, /api/v1/dpo/**)
  mock.onGet(/\/api\/v1\/admin\/audit-logs/).reply(200, {
    success: true,
    data: mockAuditLogsPaginatedResponse,
  })
  mock.onGet(/\/api\/v1\/dpo\/consents/).reply(200, {
    success: true,
    data: mockDpoConsentList,
  })
  mock.onGet(/\/api\/v1\/dpo\/retention-schedule/).reply(200, {
    success: true,
    data: mockRetentionScheduleList,
  })

  return mock
}

/**
 * Helper mô phỏng lỗi mất mạng (Network Error)
 */
export function mockNetworkError(
  mock: MockAdapter,
  matcher: string | RegExp = /.*/,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get'
): void {
  switch (method) {
    case 'post':
      mock.onPost(matcher).networkError()
      break
    case 'put':
      mock.onPut(matcher).networkError()
      break
    case 'patch':
      mock.onPatch(matcher).networkError()
      break
    case 'delete':
      mock.onDelete(matcher).networkError()
      break
    default:
      mock.onGet(matcher).networkError()
  }
}

/**
 * Helper mô phỏng lỗi quá thời gian chờ (Timeout ECONNABORTED)
 */
export function mockTimeout(
  mock: MockAdapter,
  matcher: string | RegExp = /.*/,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get'
): void {
  switch (method) {
    case 'post':
      mock.onPost(matcher).timeout()
      break
    case 'put':
      mock.onPut(matcher).timeout()
      break
    case 'patch':
      mock.onPatch(matcher).timeout()
      break
    case 'delete':
      mock.onDelete(matcher).timeout()
      break
    default:
      mock.onGet(matcher).timeout()
  }
}

/**
 * Helper mô phỏng lỗi máy chủ (500 Internal Server Error / 503 Service Unavailable)
 */
export function mockServerError(
  mock: MockAdapter,
  matcher: string | RegExp = /.*/,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get',
  statusCode: number = 500,
  message: string = 'Máy chủ nội bộ gặp sự cố'
): void {
  const payload = {
    success: false,
    code: `HTTP_${statusCode}`,
    message,
    timestamp: new Date().toISOString(),
  }

  switch (method) {
    case 'post':
      mock.onPost(matcher).reply(statusCode, payload)
      break
    case 'put':
      mock.onPut(matcher).reply(statusCode, payload)
      break
    case 'patch':
      mock.onPatch(matcher).reply(statusCode, payload)
      break
    case 'delete':
      mock.onDelete(matcher).reply(statusCode, payload)
      break
    default:
      mock.onGet(matcher).reply(statusCode, payload)
  }
}

/**
 * Helper mô phỏng lỗi xung đột dữ liệu (HTTP 409 Conflict)
 */
export function mockConflictError(
  mock: MockAdapter,
  matcher: string | RegExp = /.*/,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'post',
  conflictData: {
    code?: string
    message?: string
    details?: Record<string, string>
    suggestedStartDate?: string
    suggestedEndDate?: string
  } = {}
): void {
  const payload = {
    success: false,
    code: conflictData.code || 'DATA_CONFLICT',
    message: conflictData.message || 'Xung đột dữ liệu',
    details: conflictData.details,
    suggestedStartDate: conflictData.suggestedStartDate,
    suggestedEndDate: conflictData.suggestedEndDate,
    timestamp: new Date().toISOString(),
  }

  switch (method) {
    case 'post':
      mock.onPost(matcher).reply(409, payload)
      break
    case 'put':
      mock.onPut(matcher).reply(409, payload)
      break
    case 'patch':
      mock.onPatch(matcher).reply(409, payload)
      break
    case 'delete':
      mock.onDelete(matcher).reply(409, payload)
      break
    default:
      mock.onGet(matcher).reply(409, payload)
  }
}

/**
 * Dọn sạch toàn bộ mock handlers nhưng vẫn duy trì adapter
 */
export function resetMockServer(mock: MockAdapter): void {
  mock.reset()
}

/**
 * Khôi phục Axios Client về trạng thái ban đầu (gỡ bỏ adapter)
 */
export function restoreMockServer(mock: MockAdapter): void {
  mock.restore()
}
