/**
 * NotificationStateStore (DTD-WEB-004, DATA-WEB-005, DD-WEB-020, BLD-WEB-025, TASK-WEB-022).
 *
 * Quản lý trạng thái thông báo trong ứng dụng phía Client:
 * - Lưu trữ in-memory, phân tách hoàn toàn theo `userId` (loại bỏ nguy cơ rò rỉ thông báo của user trước).
 * - Cập nhật lạc quan (Optimistic Update) số lượng chưa đọc khi người dùng click xem.
 * - Tự động xóa sạch toàn bộ danh sách và badge khi người dùng đăng xuất.
 */

import { create } from 'zustand'
import type { NotificationItem } from '@/types'

export interface NotificationState {
  userId: number | null
  notifications: NotificationItem[]
  unreadCount: number
  isOpen: boolean

  // Actions
  initUser: (userId: number | null) => void
  setNotifications: (items: NotificationItem[], unreadCount?: number) => void
  addNotification: (item: NotificationItem) => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  setIsOpen: (isOpen: boolean) => void
  clearStore: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  userId: null,
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  /**
   * Khởi tạo hoặc chuyển đổi định danh người dùng.
   * Nếu đổi sang user khác hoặc logout (null), xóa sạch toàn bộ danh sách để đảm bảo tính riêng tư (DD-WEB-020).
   */
  initUser: (userId: number | null) => {
    const currentUserId = get().userId
    if (currentUserId !== userId) {
      set({
        userId,
        notifications: [],
        unreadCount: 0,
        isOpen: false,
      })
    }
  },

  /**
   * Nạp danh sách thông báo từ API máy chủ
   */
  setNotifications: (items: NotificationItem[], explicitUnreadCount?: number) => {
    const calculatedUnread =
      explicitUnreadCount !== undefined
        ? explicitUnreadCount
        : items.filter((n) => !n.isRead).length

    set({
      notifications: items,
      unreadCount: Math.max(0, calculatedUnread),
    })
  },

  /**
   * Tiếp nhận thông báo mới thời gian thực từ STOMP WebSocket
   */
  addNotification: (item: NotificationItem) => {
    set((state) => {
      // Tránh trùng lặp id nếu tin nhắn bị gửi lại
      const exists = state.notifications.some((n) => n.id === item.id)
      if (exists) {
        return state
      }

      const updated = [item, ...state.notifications]
      const increment = item.isRead ? 0 : 1

      return {
        notifications: updated,
        unreadCount: state.unreadCount + increment,
      }
    })
  },

  /**
   * Cập nhật lạc quan (Optimistic Update) trạng thái đã đọc của một thông báo
   */
  markAsRead: (id: number) => {
    set((state) => {
      const target = state.notifications.find((n) => n.id === id)
      if (!target || target.isRead) {
        return state
      }

      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )

      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    })
  },

  /**
   * Đánh dấu toàn bộ thông báo hiện tại là đã đọc
   */
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
  },

  /**
   * Bật/tắt thanh Drawer/Popover trung tâm thông báo
   */
  setIsOpen: (isOpen: boolean) => {
    set({ isOpen })
  },

  /**
   * Xóa sạch toàn bộ dữ liệu thông báo khỏi RAM (gọi khi Logout)
   */
  clearStore: () => {
    set({
      userId: null,
      notifications: [],
      unreadCount: 0,
      isOpen: false,
    })
  },
}))
