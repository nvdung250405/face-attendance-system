import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { apiClient } from '@/services/apiClient'
import { normalizeApiError } from '@/services/errorNormalizer'
import {
  createMockServer,
  setupDefaultMockHandlers,
  mockNetworkError,
  mockTimeout,
  mockServerError,
  mockConflictError,
  restoreMockServer,
  stompMockHarness,
} from '@/mocks'
import type MockAdapter from 'axios-mock-adapter'

describe('Bộ Khung Kiểm thử Hợp đồng Giao diện & Mock Client (TASK-WEB-032, FND-WEB-007)', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = createMockServer(apiClient)
    setupDefaultMockHandlers(mock)
    stompMockHarness.reset()
  })

  afterEach(() => {
    restoreMockServer(mock)
  })

  // 1. Kiểm thử Hợp đồng Xác thực Đăng nhập (Auth Contract)
  describe('1. Kiểm thử Mock Xác thực Đăng nhập & Làm mới Token', () => {
    it('Đăng nhập HR thành công trả về thông tin quản trị và cặp token', async () => {
      const response = await apiClient.post('/api/v1/auth/login', {
        email: 'hr.manager@company.com',
        password: 'Password@123',
      })

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.user.role).toBe('HR_MANAGER')
      expect(response.data.data.accessToken).toBeDefined()
      expect(response.data.data.refreshToken).toBeDefined()
    })

    it('Đăng nhập Nhân viên thành công trả về vai trò EMPLOYEE', async () => {
      const response = await apiClient.post('/api/v1/auth/login', {
        email: 'dung.nv@company.com',
        password: 'Password@123',
      })

      expect(response.status).toBe(200)
      expect(response.data.data.user.role).toBe('EMPLOYEE')
    })

    it('Đăng nhập sai mật khẩu trả về HTTP 401 chuẩn hóa', async () => {
      try {
        await apiClient.post('/api/v1/auth/login', {
          email: 'dung.nv@company.com',
          password: 'WrongPassword',
        })
        expect.unreachable('Kỳ vọng ném lỗi 401')
      } catch (error) {
        const normalized = normalizeApiError(error)
        expect(normalized.statusCode).toBe(401)
        expect(normalized.code).toBe('AUTH_INVALID_CREDENTIALS')
      }
    })

    it('Làm mới token thành công khi gửi Refresh Token hợp lệ', async () => {
      const response = await apiClient.post('/api/v1/auth/refresh', {
        refreshToken: 'valid-token',
      })

      expect(response.status).toBe(200)
      expect(response.data.data.accessToken).toBe('mock-new-access-token-jwt-refreshed')
    })

    it('Làm mới token trả 401 khi Refresh Token hết hạn', async () => {
      try {
        await apiClient.post('/api/v1/auth/refresh', {
          refreshToken: 'expired-token',
        })
        expect.unreachable('Kỳ vọng ném lỗi 401')
      } catch (error) {
        const normalized = normalizeApiError(error)
        expect(normalized.statusCode).toBe(401)
        expect(normalized.code).toBe('REFRESH_TOKEN_EXPIRED')
      }
    })
  })

  // 2. Kiểm thử Kịch bản Lỗi Mạng & Quá Giờ Chờ (Network Error & Timeout Branches)
  describe('2. Kiểm thử Mô phỏng Lỗi Mạng và Timeout', () => {
    it('Kiểm thử nhánh lỗi mất kết nối mạng (Network Error) được chuẩn hóa chính xác', async () => {
      mockNetworkError(mock, '/api/v1/test-network-error', 'get')

      try {
        await apiClient.get('/api/v1/test-network-error')
        expect.unreachable('Kỳ vọng ném lỗi mạng')
      } catch (error) {
        const normalized = normalizeApiError(error)
        expect(normalized.isNetworkError).toBe(true)
        expect(normalized.code).toBe('NETWORK_ERROR')
        expect(normalized.message).toContain('Không thể kết nối')
      }
    })

    it('Kiểm thử nhánh quá thời gian chờ (Timeout ECONNABORTED) được chuẩn hóa chính xác', async () => {
      mockTimeout(mock, '/api/v1/test-timeout', 'get')

      try {
        await apiClient.get('/api/v1/test-timeout')
        expect.unreachable('Kỳ vọng ném lỗi timeout')
      } catch (error) {
        const normalized = normalizeApiError(error)
        expect(normalized.isNetworkError).toBe(true)
        expect(normalized.code).toBe('TIMEOUT_ERROR')
        expect(normalized.message).toContain('Hết thời gian chờ')
      }
    })

    it('Kiểm thử nhánh lỗi máy chủ nội bộ (500 Server Error)', async () => {
      mockServerError(mock, '/api/v1/custom-endpoint', 'get', 500, 'Lỗi cơ sở dữ liệu')

      try {
        await apiClient.get('/api/v1/custom-endpoint')
        expect.unreachable('Kỳ vọng ném lỗi 500')
      } catch (error) {
        const normalized = normalizeApiError(error)
        expect(normalized.statusCode).toBe(500)
        expect(normalized.message).toBe('Lỗi cơ sở dữ liệu')
      }
    })

    it('Kiểm thử nhánh lỗi xung đột dữ liệu 409 Conflict kèm gợi ý khoảng trống', async () => {
      mockConflictError(mock, '/api/v1/admin/employee-shifts', 'post', {
        code: 'SHIFT_OVERLAP_CONFLICT',
        message: 'Lịch phân ca bị chồng lấn',
        suggestedStartDate: '2026-11-01',
        suggestedEndDate: '2026-11-30',
      })

      try {
        await apiClient.post('/api/v1/admin/employee-shifts', {})
        expect.unreachable('Kỳ vọng ném lỗi 409')
      } catch (error) {
        const normalized = normalizeApiError(error)
        expect(normalized.statusCode).toBe(409)
        expect(normalized.overlapConflict).toBeDefined()
        expect(normalized.overlapConflict?.suggestedStartDate).toBe('2026-11-01')
      }
    })
  })

  // 3. Kiểm thử Hợp đồng Informed Consent & Tra cứu Điểm danh
  describe('3. Kiểm thử Hợp đồng Informed Consent và Bảng công', () => {
    it('Gửi ký cam kết điện tử trả mã OTP 6 số và mã QR hợp lệ', async () => {
      const response = await apiClient.post('/api/v1/employee/consent', {
        agreed: true,
      })

      expect(response.status).toBe(200)
      expect(response.data.data.otp).toBe('839201')
      expect(response.data.data.qrCodeData).toContain('fas-otp:839201')
      expect(response.data.data.kioskLocations.length).toBeGreaterThan(0)
    })

    it('Rút cam kết điện tử trả mốc thời gian tiêu hủy 7 ngày', async () => {
      const response = await apiClient.post('/api/v1/employee/consent/withdraw', {
        reason: 'Không còn nhu cầu',
      })

      expect(response.status).toBe(200)
      expect(response.data.data.retentionDeadline).toBeDefined()
    })

    it('Tra cứu điểm danh Admin trả danh sách có phân trang', async () => {
      const response = await apiClient.get('/api/v1/admin/attendance')

      expect(response.status).toBe(200)
      expect(response.data.data.content.length).toBe(3)
      expect(response.data.data.totalElements).toBe(3)
    })

    it('Tra cứu bảng công cá nhân Employee trả thống kê chi tiết tháng', async () => {
      const response = await apiClient.get('/api/v1/employee/attendance')

      expect(response.status).toBe(200)
      expect(response.data.data.period).toBe('2026-10')
      expect(response.data.data.dailyRecords.length).toBe(2)
    })
  })

  // 4. Kiểm thử Bộ Khung Giả Lập STOMP WebSocket
  describe('4. Kiểm thử StompMockHarness cho sự kiện thời gian thực', () => {
    it('Bắn sự kiện điểm danh trực tiếp qua /topic/live-attendance', () => {
      let receivedRecordId = 0
      const sub = stompMockHarness.subscribe('/topic/live-attendance', (message) => {
        const data = JSON.parse(message.body)
        receivedRecordId = data.recordId
      })

      stompMockHarness.emitLiveAttendance({ recordId: 99999 })
      expect(receivedRecordId).toBe(99999)

      sub.unsubscribe()
      stompMockHarness.emitLiveAttendance({ recordId: 88888 })
      expect(receivedRecordId).toBe(99999) // Không thay đổi sau khi unsubscribe
    })

    it('Bắn sự kiện kích hoạt hoàn tất qua /topic/enrollment/{otp}', () => {
      let enrollmentStatus = ''
      stompMockHarness.subscribe('/topic/enrollment/839201', (message) => {
        const data = JSON.parse(message.body)
        enrollmentStatus = data.status
      })

      stompMockHarness.emitEnrollmentSuccess('839201')
      expect(enrollmentStatus).toBe('ENROLLMENT_SUCCESS')
    })
  })
})
