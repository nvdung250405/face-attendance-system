/**
 * Dịch vụ Thông báo Trong Ứng dụng (NotificationService - APD-WEB-010, API-WEB-016, DD-WEB-020).
 *
 * Lấy danh sách thông báo của người dùng hiện tại và đánh dấu đã đọc.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type { ApiResponse, NotificationResponse } from '@/types'

export class NotificationService {
  /**
   * Lấy danh sách thông báo của người dùng đang đăng nhập (GET /api/v1/notifications)
   */
  async getNotifications(): Promise<NotificationResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<NotificationResponse[]>>(
        '/api/v1/notifications'
      )
      return response.data.data || []
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Đánh dấu một thông báo cụ thể là đã đọc (PATCH /api/v1/notifications/{id}/read)
   */
  async markAsRead(id: number): Promise<NotificationResponse> {
    try {
      const response = await apiClient.patch<ApiResponse<NotificationResponse>>(
        `/api/v1/notifications/${id}/read`
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Đánh dấu toàn bộ thông báo là đã đọc (PATCH /api/v1/notifications/read-all)
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch('/api/v1/notifications/read-all')
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const notificationService = new NotificationService()
