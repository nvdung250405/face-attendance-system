/**
 * Token Refresh Interceptor & Mutex Promise Queue
 * (APD-WEB-002, BLD-WEB-010, DD-WEB-009, TASK-WEB-014, TST-WEB-010).
 *
 * Xử lý:
 * - Bắt mã phản hồi HTTP 401 Token Expired.
 * - Quản lý Mutex Promise Queue chống giông bão Refresh Token (Race Condition)
 *   khi nhiều request đồng thời nhận 401.
 * - Chỉ phát đúng 1 request POST /api/v1/auth/refresh với Refresh Token.
 * - Giải phóng hàng đợi và retry toàn bộ các request đang treo với Access Token mới.
 * - Tự động đăng xuất (Logout) và xóa phiên khi Refresh Token hết hạn hoặc không hợp lệ.
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, AuthSession, TokenResponse } from '@/types'
import { safeLocalStorage } from './storage'
import { AUTH_STORAGE_KEY } from './apiClient'
import { useAuthStore } from '@/store/authStore'

interface QueueItem {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: QueueItem[] = []

/**
 * Kiểm tra xem hiện tại có đang trong quá trình refresh token hay không
 */
export function isCurrentlyRefreshing(): boolean {
  return isRefreshing
}

/**
 * Lấy số lượng request đang chờ trong Promise Queue
 */
export function getFailedQueueLength(): number {
  return failedQueue.length
}

/**
 * Đặt lại trạng thái hàng đợi và cờ mutex (phục vụ testing & cleanup)
 */
export function resetRefreshState(): void {
  isRefreshing = false
  failedQueue = []
}

/**
 * Giải phóng toàn bộ các request đang chờ trong hàng đợi
 */
export function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

export interface TokenRefreshOptions {
  refreshUrl?: string
  onSessionExpired?: () => void
  customRefreshClient?: AxiosInstance
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/**
 * Cài đặt Response Interceptor tự động làm mới token 401 cho Axios Instance
 */
export function attachTokenRefreshInterceptor(
  instance: AxiosInstance,
  options: TokenRefreshOptions = {}
): number {
  const refreshUrl = options.refreshUrl || '/api/v1/auth/refresh'

  const handleSessionExpired = () => {
    if (options.onSessionExpired) {
      options.onSessionExpired()
    } else {
      safeLocalStorage.removeItem(AUTH_STORAGE_KEY)
      useAuthStore.getState().clearSession()
    }
  }

  return instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as CustomAxiosRequestConfig | undefined

      // Bỏ qua nếu không phải lỗi từ server có config hoặc là request tới auth login / refresh
      if (!originalRequest) {
        return Promise.reject(error)
      }

      const requestUrl = originalRequest.url || ''
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes(refreshUrl)

      // Kiểm tra HTTP 401 và request chưa từng retry
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        // Kịch bản 1: Đang có một request khác thực hiện refresh token (Race Condition Mitigation)
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((newAccessToken) => {
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
              return instance(originalRequest)
            })
            .catch((queueErr) => {
              return Promise.reject(queueErr)
            })
        }

        // Kịch bản 2: Request đầu tiên nhận 401 -> Khóa Mutex và thực thi làm mới token
        originalRequest._retry = true
        isRefreshing = true

        const session = safeLocalStorage.getItem<AuthSession>(AUTH_STORAGE_KEY)
        if (!session || !session.refreshToken) {
          isRefreshing = false
          processQueue(new Error('No refresh token available'), null)
          handleSessionExpired()
          return Promise.reject(error)
        }

        try {
          const refreshClient =
            options.customRefreshClient ||
            axios.create({
              baseURL: instance.defaults.baseURL,
              timeout: 5000,
            })

          const res = await refreshClient.post<ApiResponse<TokenResponse>>(refreshUrl, {
            refreshToken: session.refreshToken,
          })

          const tokenData = res.data?.data
          const newAccessToken = tokenData?.accessToken

          if (!newAccessToken) {
            throw new Error('Refresh response missing access token')
          }

          const updatedSession: AuthSession = {
            ...session,
            accessToken: newAccessToken,
            refreshToken: tokenData.refreshToken || session.refreshToken,
            expiresAt: Date.now() + (tokenData.expiresIn ? tokenData.expiresIn * 1000 : 3600000),
          }

          safeLocalStorage.setItem(AUTH_STORAGE_KEY, updatedSession)
          useAuthStore.getState().setSession(updatedSession)

          // Giải phóng các request đang chờ trong queue
          processQueue(null, newAccessToken)

          // Thử lại request ban đầu với token mới
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return instance(originalRequest)
        } catch (refreshErr) {
          // Khi Refresh Token hết hạn hoặc server từ chối cấp lại
          processQueue(refreshErr, null)
          handleSessionExpired()
          return Promise.reject(refreshErr)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    }
  )
}
