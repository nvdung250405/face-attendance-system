/**
 * Unit Tests cho Token Refresh Interceptor & Mutex Promise Queue
 * (APD-WEB-002, BLD-WEB-010, DD-WEB-009, TASK-WEB-014, TST-WEB-010).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios, { type AxiosInstance, AxiosError, AxiosHeaders } from 'axios'
import {
  attachTokenRefreshInterceptor,
  resetRefreshState,
} from '../tokenRefreshInterceptor'
import { safeLocalStorage } from '../storage'
import { AUTH_STORAGE_KEY } from '../apiClient'
import { useAuthStore } from '@/store/authStore'
import type { AuthSession, ApiResponse, TokenResponse } from '@/types'

describe('Token Refresh Interceptor & Mutex Queue (TASK-WEB-014, TST-WEB-010)', () => {
  const initialSession: AuthSession = {
    accessToken: 'old-access-token-111',
    refreshToken: 'valid-refresh-token-222',
    tokenType: 'Bearer',
    expiresAt: Date.now() + 1000,
    user: {
      id: 1042,
      employeeCode: 'NV-1042',
      fullName: 'Ngô Văn Dũng',
      email: 'dung.nv@company.com',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      department: 'Phòng Kỹ thuật',
    },
  }

  let client: AxiosInstance
  let refreshClient: AxiosInstance

  beforeEach(() => {
    resetRefreshState()
    safeLocalStorage.clear()
    useAuthStore.setState({
      session: null,
      user: null,
      isAuthenticated: false,
    })
    vi.restoreAllMocks()

    client = axios.create({ baseURL: 'http://localhost:8080' })
    refreshClient = axios.create({ baseURL: 'http://localhost:8080' })
  })

  describe('1. Kịch bản Làm mới Token Trong suốt khi gặp HTTP 401', () => {
    it('bắt HTTP 401, tự động gọi /auth/refresh và retry request ban đầu thành công', async () => {
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, initialSession)
      useAuthStore.setState({
        session: initialSession,
        user: initialSession.user,
        isAuthenticated: true,
      })

      const newAccessToken = 'new-shiny-access-token-999'
      const refreshedResponse: ApiResponse<TokenResponse> = {
        success: true,
        code: 'TOKEN_REFRESHED',
        message: 'Token refreshed',
        data: {
          accessToken: newAccessToken,
          refreshToken: 'rotated-refresh-token-333',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
        timestamp: new Date().toISOString(),
      }

      // Giả lập adapter: lần đầu ném 401, lần retry trả về 200
      let callCount = 0
      client.defaults.adapter = async (config) => {
        callCount++
        if (callCount === 1) {
          throw new AxiosError(
            'Request failed with status code 401',
            'ERR_BAD_REQUEST',
            config,
            null,
            {
              status: 401,
              statusText: 'Unauthorized',
              headers: {},
              config,
              data: { message: 'Token expired' },
            }
          )
        }
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { success: true, message: 'Data fetched successfully' },
        }
      }

      // Giả lập refreshClient trả về token mới
      const refreshSpy = vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({
        data: refreshedResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      })

      attachTokenRefreshInterceptor(client, {
        customRefreshClient: refreshClient,
      })

      // Thực thi request
      const response = await client.get('/api/v1/attendance/history')

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(refreshSpy).toHaveBeenCalledTimes(1)
      expect(refreshSpy).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        refreshToken: 'valid-refresh-token-222',
      })

      // Kiểm tra session trong SafeLocalStorage và AuthStore đã được cập nhật
      const savedSession = safeLocalStorage.getItem<AuthSession>(AUTH_STORAGE_KEY)
      expect(savedSession?.accessToken).toBe(newAccessToken)
      expect(savedSession?.refreshToken).toBe('rotated-refresh-token-333')
      expect(useAuthStore.getState().session?.accessToken).toBe(newAccessToken)
    })
  })

  describe('2. Kiểm thử Mutex Promise Queue chống Race Condition (TST-WEB-010)', () => {
    it('khi 5 request đồng thời nhận 401, chỉ có DUY NHẤT 1 request refresh được gọi và cả 5 đều retry thành công', async () => {
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, initialSession)
      useAuthStore.setState({
        session: initialSession,
        user: initialSession.user,
        isAuthenticated: true,
      })

      const newAccessToken = 'mutex-refreshed-token-888'
      const refreshedResponse: ApiResponse<TokenResponse> = {
        success: true,
        code: 'TOKEN_REFRESHED',
        message: 'Token refreshed',
        data: {
          accessToken: newAccessToken,
          refreshToken: 'new-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
        timestamp: new Date().toISOString(),
      }

      // Theo dõi số lần gọi theo URL
      const requestCounters: Record<string, number> = {}

      client.defaults.adapter = async (config) => {
        const url = config.url || 'req'
        requestCounters[url] = (requestCounters[url] || 0) + 1

        // Lần đầu ném 401, lần sau trả về 200
        if (requestCounters[url] === 1) {
          throw new AxiosError(
            'Request failed with status code 401',
            'ERR_BAD_REQUEST',
            config,
            null,
            {
              status: 401,
              statusText: 'Unauthorized',
              headers: {},
              config,
              data: { message: 'Token expired' },
            }
          )
        }

        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { url, token: config.headers?.Authorization },
        }
      }

      // Giả lập refresh request có độ trễ 20ms
      const refreshSpy = vi.spyOn(refreshClient, 'post').mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 20))
        return {
          data: refreshedResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      })

      attachTokenRefreshInterceptor(client, {
        customRefreshClient: refreshClient,
      })

      // Bắn đồng thời 5 request
      const results = await Promise.all([
        client.get('/api/v1/resource-1'),
        client.get('/api/v1/resource-2'),
        client.get('/api/v1/resource-3'),
        client.get('/api/v1/resource-4'),
        client.get('/api/v1/resource-5'),
      ])

      // 1. Chỉ gọi refresh duy nhất 1 lần (Mutex lock ngăn Race Condition)
      expect(refreshSpy).toHaveBeenCalledTimes(1)

      // 2. Cả 5 request đều retry thành công với token mới
      expect(results).toHaveLength(5)
      results.forEach((res) => {
        expect(res.status).toBe(200)
        expect(res.data.token).toBe(`Bearer ${newAccessToken}`)
      })
    })

    it('đánh dấu _retry cho các request trong hàng đợi trước khi retry (chống loop refresh)', async () => {
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, initialSession)
      useAuthStore.setState({
        session: initialSession,
        user: initialSession.user,
        isAuthenticated: true,
      })

      const newAccessToken = 'queued-retry-token-777'
      const refreshedResponse: ApiResponse<TokenResponse> = {
        success: true,
        code: 'TOKEN_REFRESHED',
        message: 'Token refreshed',
        data: {
          accessToken: newAccessToken,
          refreshToken: 'new-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
        timestamp: new Date().toISOString(),
      }

      const requestCounters: Record<string, number> = {}
      const configsByUrl: Record<string, Array<{ _retry?: boolean }>> = {}

      client.defaults.adapter = async (config) => {
        const url = config.url || 'req'
        requestCounters[url] = (requestCounters[url] || 0) + 1
        if (!configsByUrl[url]) configsByUrl[url] = []
        configsByUrl[url].push({ _retry: (config as { _retry?: boolean })._retry })

        if (requestCounters[url] === 1) {
          throw new AxiosError(
            'Request failed with status code 401',
            'ERR_BAD_REQUEST',
            config,
            null,
            {
              status: 401,
              statusText: 'Unauthorized',
              headers: {},
              config,
              data: { message: 'Token expired' },
            }
          )
        }

        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { url, token: config.headers?.Authorization },
        }
      }

      const refreshSpy = vi.spyOn(refreshClient, 'post').mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 20))
        return {
          data: refreshedResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      })

      attachTokenRefreshInterceptor(client, {
        customRefreshClient: refreshClient,
      })

      await Promise.all([
        client.get('/api/v1/resource-a'),
        client.get('/api/v1/resource-b'),
      ])

      expect(refreshSpy).toHaveBeenCalledTimes(1)

      // Mỗi request đều được retry đúng 1 lần với cờ _retry = true để tránh loop refresh
      for (const url of ['/api/v1/resource-a', '/api/v1/resource-b']) {
        expect(configsByUrl[url]).toHaveLength(2)
        expect(configsByUrl[url][0]._retry).toBeUndefined()
        expect(configsByUrl[url][1]._retry).toBe(true)
      }
    })
  })

  describe('3. Kịch bản Refresh Token Hết hạn hoặc Lỗi (Session Expired & Logout)', () => {
    it('xóa session và gọi onSessionExpired khi server từ chối refresh token', async () => {
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, initialSession)
      useAuthStore.setState({
        session: initialSession,
        user: initialSession.user,
        isAuthenticated: true,
      })

      const onSessionExpired = vi.fn()

      client.defaults.adapter = async (config) => {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { message: 'Token expired' },
        })
      }

      // Giả lập endpoint refresh trả về 401 (Refresh Token hết hạn)
      vi.spyOn(refreshClient, 'post').mockRejectedValueOnce(
        new AxiosError('Refresh token expired', 'ERR_BAD_REQUEST', { headers: new AxiosHeaders() } as never, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { message: 'Refresh token expired' },
        })
      )

      attachTokenRefreshInterceptor(client, {
        customRefreshClient: refreshClient,
        onSessionExpired,
      })

      await expect(client.get('/api/v1/users/me')).rejects.toBeDefined()

      // Xác nhận hàm xử lý hết hạn phiên được gọi
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })

    it('không gọi refresh nếu trong storage không có refresh token và reject ngay lập tức', async () => {
      // Storage không có session
      const onSessionExpired = vi.fn()
      const refreshSpy = vi.spyOn(refreshClient, 'post')

      client.defaults.adapter = async (config) => {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { message: 'Token expired' },
        })
      }

      attachTokenRefreshInterceptor(client, {
        customRefreshClient: refreshClient,
        onSessionExpired,
      })

      await expect(client.get('/api/v1/dashboard')).rejects.toBeDefined()

      // Không phát request refresh vô ích
      expect(refreshSpy).not.toHaveBeenCalled()
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })

    it('bỏ qua interceptor đối với chính các endpoint /auth/login hoặc /auth/refresh', async () => {
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, initialSession)
      const refreshSpy = vi.spyOn(refreshClient, 'post')

      client.defaults.adapter = async (config) => {
        throw new AxiosError('Invalid credentials', 'ERR_BAD_REQUEST', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { message: 'Bad credentials' },
        })
      }

      attachTokenRefreshInterceptor(client, {
        customRefreshClient: refreshClient,
      })

      // Gọi vào /auth/login bị 401 không được phép loop refresh
      await expect(client.post('/api/v1/auth/login')).rejects.toBeDefined()
      expect(refreshSpy).not.toHaveBeenCalled()
    })

    it('không retry lần thứ hai nếu request đã gắn cờ _retry', async () => {
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, initialSession)
      const refreshSpy = vi.spyOn(refreshClient, 'post')

      client.defaults.adapter = async (config) => {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { message: 'Unauthorized' },
        })
      }

      attachTokenRefreshInterceptor(client, {
        customRefreshClient: refreshClient,
      })

      // Gọi với _retry = true
      // @ts-expect-error custom config property _retry
      await expect(client.get('/api/v1/secure-data', { _retry: true })).rejects.toBeDefined()
      expect(refreshSpy).not.toHaveBeenCalled()
    })
  })
})
