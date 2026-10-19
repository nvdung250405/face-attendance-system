/**
 * Dịch vụ Đăng xuất & Thu hồi Phiên Làm việc (LogoutService - APD-WEB-009, API-WEB-015, DD-WEB-004).
 *
 * Gửi yêu cầu thu hồi Refresh Token lên Backend (POST /api/v1/auth/logout),
 * dọn dẹp sạch sẽ Storage phía trình duyệt và phát sự kiện đồng bộ đa tab.
 */

import { apiClient, AUTH_STORAGE_KEY } from './apiClient'
import { safeLocalStorage, safeSessionStorage, STORAGE_KEYS } from './storage'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { useKioskRegistryStore } from '@/store/kioskRegistryStore'
import type { AuthSession } from '@/types'

import { stompClientService } from './stompClientService'

export class LogoutService {
  /**
   * Đăng xuất khỏi hệ thống:
   * 1. Lấy refreshToken hiện tại gửi lên Backend để thu hồi.
   * 2. Xóa sạch LocalStorage/SessionStorage và cập nhật AuthStore.
   * 3. Luôn đảm bảo xóa session cục bộ kể cả khi request Backend gặp lỗi mạng.
   */
  async logout(): Promise<void> {
    try {
      const stored = safeLocalStorage.getItem<Partial<AuthSession>>(AUTH_STORAGE_KEY)
      const refreshToken = stored?.refreshToken

      if (refreshToken) {
        await apiClient.post('/api/v1/auth/logout', { refreshToken })
      }
    } catch (error) {
      // Bỏ qua lỗi mạng hoặc token đã hết hạn để luôn đảm bảo client được dọn sạch
      console.warn('Đăng xuất backend có cảnh báo, tiếp tục dọn dẹp local storage:', error)
    } finally {
      this.clearLocalSession()
    }
  }

  /**
   * Dọn sạch toàn bộ phiên lưu trữ cục bộ phía Client và cập nhật Zustand store
   */
  clearLocalSession(): void {
    safeLocalStorage.removeItem(AUTH_STORAGE_KEY)
    safeSessionStorage.removeItem(STORAGE_KEYS.CONSENT_SESSION)
    useAuthStore.getState().clearSession()
    // Dọn sạch dữ liệu RAM của người dùng hiện tại để tránh rò rỉ sang phiên đăng nhập khác
    useNotificationStore.getState().clearStore()
    usePayrollPeriodStore.getState().clearStore()
    useKioskRegistryStore.getState().clearStore()
    void stompClientService.deactivate().catch(() => {})
  }
}

export const logoutService = new LogoutService()
