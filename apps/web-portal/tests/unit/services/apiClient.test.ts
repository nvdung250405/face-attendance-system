/**
 * Unit Tests cho ApiClient & Request Interceptor (TST-WEB-009, TASK-WEB-013).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios, { type InternalAxiosRequestConfig, AxiosHeaders } from 'axios'
import {
  apiClient,
  createApiClient,
  resolveBaseUrl,
  getStoredAccessToken,
  attachRequestInterceptor,
  AUTH_STORAGE_KEY,
  DEFAULT_TIMEOUT_MS,
} from '@/services/apiClient'
import { useAuthStore } from '@/store/authStore'

describe('ApiClient & Request Interceptor (TASK-WEB-013)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      session: null,
      user: null,
      isAuthenticated: false,
    })
    vi.restoreAllMocks()
  })

  describe('resolveBaseUrl', () => {
    it('sử dụng baseURL được cung cấp trực tiếp nếu hợp lệ', () => {
      expect(resolveBaseUrl('http://localhost:8080/api/v1')).toBe('http://localhost:8080/api/v1')
      expect(resolveBaseUrl('/api/v1')).toBe('/api/v1')
    })

    it('từ chối khởi tạo khi thiếu cấu hình baseURL', () => {
      expect(() => resolveBaseUrl('')).toThrowError(/VITE_API_BASE_URL is missing or empty/)
      expect(() => resolveBaseUrl('   ')).toThrowError(/VITE_API_BASE_URL is missing or empty/)
      // @ts-expect-error testing invalid input
      expect(() => resolveBaseUrl(null)).toThrowError(/VITE_API_BASE_URL is missing or empty/)
    })
  })

  describe('getStoredAccessToken (SEC-02)', () => {
    it('trả về null khi chưa có session trong authStore', () => {
      expect(getStoredAccessToken()).toBeNull()
    })

    it('trích xuất chính xác token từ Zustand RAM khi có session hợp lệ', () => {
      const mockSession = {
        accessToken: 'mock-jwt-token-xyz',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer' as const,
        expiresAt: Date.now() + 3600000,
        user: {
          id: 1,
          employeeCode: 'NV-001',
          fullName: 'Test User',
          email: 'test@company.com',
          department: 'Engineering',
          role: 'ADMIN' as const,
          status: 'ACTIVE' as const,
        },
      }
      useAuthStore.setState({ session: mockSession })
      expect(getStoredAccessToken()).toBe('mock-jwt-token-xyz')
    })

    it('không fallback sang LocalStorage nếu LocalStorage chứa token (SEC-02)', () => {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: 'leaked-token' }))
      useAuthStore.setState({ session: null })
      expect(getStoredAccessToken()).toBeNull()
    })
  })

  describe('attachRequestInterceptor (TST-WEB-009)', () => {
    it('tự động gắn Authorization: Bearer <token> vào request config khi đã đăng nhập', async () => {
      const token = 'valid-token-12345'
      useAuthStore.setState({
        session: {
          accessToken: token,
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
          expiresAt: Date.now() + 3600000,
          user: {
            id: 1,
            employeeCode: 'NV-001',
            fullName: 'Test User',
            email: 'test@company.com',
            department: 'Engineering',
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        },
      })

      const instance = axios.create({ baseURL: '/api/v1' })
      attachRequestInterceptor(instance)

      const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
        url: '/admin/employees',
      }

      // @ts-expect-error inspecting internal interceptor handler
      const interceptorHandler = instance.interceptors.request.handlers[0].fulfilled
      const modifiedConfig = await interceptorHandler(config)

      expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${token}`)
    })

    it('không gắn header Authorization nếu chưa đăng nhập (public request)', async () => {
      const instance = axios.create({ baseURL: '/api/v1' })
      attachRequestInterceptor(instance)

      const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
        url: '/auth/login',
      }

      // @ts-expect-error inspecting internal interceptor handler
      const interceptorHandler = instance.interceptors.request.handlers[0].fulfilled
      const modifiedConfig = await interceptorHandler(config)

      expect(modifiedConfig.headers.Authorization).toBeUndefined()
    })

    it('giữ nguyên header Authorization nếu đã được thiết lập thủ công', async () => {
      useAuthStore.setState({
        session: {
          accessToken: 'storage-token',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
          expiresAt: Date.now() + 3600000,
          user: {
            id: 1,
            employeeCode: 'NV-001',
            fullName: 'Test User',
            email: 'test@company.com',
            department: 'Engineering',
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        },
      })

      const instance = axios.create({ baseURL: '/api/v1' })
      attachRequestInterceptor(instance)

      const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders({ Authorization: 'Bearer custom-explicit-token' }),
        url: '/custom-endpoint',
      }

      // @ts-expect-error inspecting internal interceptor handler
      const interceptorHandler = instance.interceptors.request.handlers[0].fulfilled
      const modifiedConfig = await interceptorHandler(config)

      expect(modifiedConfig.headers.Authorization).toBe('Bearer custom-explicit-token')
    })
  })

  describe('createApiClient & singleton instance', () => {
    it('khởi tạo instance có baseURL và timeout 10 giây mặc định (F-SPEC-09 Accept header)', () => {
      const client = createApiClient('/api/v1')
      expect(client.defaults.baseURL).toBe('/api/v1')
      expect(client.defaults.timeout).toBe(DEFAULT_TIMEOUT_MS)
      expect(client.defaults.headers['Content-Type']).toBe('application/json')
      expect(client.defaults.headers.Accept).toBe('application/json, application/problem+json')
    })

    it('apiClient singleton instance được tạo thành công với cấu hình môi trường', () => {
      expect(apiClient).toBeDefined()
      expect(apiClient.defaults.timeout).toBe(10000)
    })
  })
})
