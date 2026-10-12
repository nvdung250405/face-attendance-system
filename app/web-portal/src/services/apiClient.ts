/**
 * Axios Base HTTP Client & Request Interceptor (APD-WEB-001, BLD-WEB-009, TASK-WEB-013).
 * Tự động gán Bearer Token từ LocalStorage và xác thực baseURL trước khi khởi tạo.
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { AuthSession } from '@/types'

import { safeLocalStorage } from './storage'
import { attachTokenRefreshInterceptor } from './tokenRefreshInterceptor'

export const AUTH_STORAGE_KEY = 'fas_auth_session'
export const DEFAULT_TIMEOUT_MS = 10000 // 10.0 giây theo SLA đặc tả DD-WEB-008

/**
 * Trích xuất an toàn Access Token từ SafeLocalStorage (DTD-WEB-001, DD-WEB-003)
 * Tự động dự phòng qua MemoryStorage khi chạy trong Private Browsing.
 */
export function getStoredAccessToken(): string | null {
  try {
    const session = safeLocalStorage.getItem<Partial<AuthSession>>(AUTH_STORAGE_KEY)
    return session?.accessToken || null
  } catch {
    return null
  }
}

/**
 * Giải quyết và xác thực baseURL hợp lệ.
 * Ném lỗi rõ ràng nếu thiếu cấu hình baseURL (Done when criterion).
 */
export function resolveBaseUrl(explicitUrl?: string): string {
  if (explicitUrl !== undefined) {
    if (typeof explicitUrl !== 'string' || explicitUrl.trim() === '') {
      throw new Error('ApiClient initialization failed: VITE_API_BASE_URL is missing or empty')
    }
    return explicitUrl.trim()
  }

  const envUrl = import.meta.env?.VITE_API_BASE_URL
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    throw new Error('ApiClient initialization failed: VITE_API_BASE_URL is missing or empty')
  }
  return envUrl.trim()
}

/**
 * Cài đặt Request Interceptor tự động tiêm Bearer Token
 */
export function attachRequestInterceptor(instance: AxiosInstance): number {
  return instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getStoredAccessToken()
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )
}

/**
 * Factory tạo Axios Instance có gắn Request Interceptor
 */
export function createApiClient(customBaseUrl?: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): AxiosInstance {
  const baseURL = resolveBaseUrl(customBaseUrl)
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  attachRequestInterceptor(client)
  attachTokenRefreshInterceptor(client)
  return client
}

/**
 * Instance Axios mặc định sử dụng xuyên suốt Cổng Web Portal
 */
export const apiClient: AxiosInstance = createApiClient()
