/**
 * Unit Tests cho NotificationStateStore
 * (DTD-WEB-004, DATA-WEB-005, DD-WEB-020, BLD-WEB-025, TASK-WEB-022).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationStore } from '../notificationStore'
import { safeLocalStorage, safeSessionStorage } from '@/services/storage'
import type { NotificationItem } from '@/types'

const mockNotification1: NotificationItem = {
  id: 101,
  userId: 1,
  eventType: 'ATTENDANCE_PUNCH',
  title: 'Điểm danh thành công',
  message: 'Bạn đã chấm công vào lúc 08:30:00',
  isRead: false,
  createdAt: '2026-10-12T08:30:00.000+07:00',
}

const mockNotification2: NotificationItem = {
  id: 102,
  userId: 1,
  eventType: 'PAYROLL_LOCKED',
  title: 'Chốt kỳ công',
  message: 'Kỳ công tháng 10/2026 đã được chốt',
  isRead: false,
  createdAt: '2026-10-12T09:00:00.000+07:00',
}

const mockNotification3: NotificationItem = {
  id: 103,
  userId: 1,
  eventType: 'SECURITY_ALERT',
  title: 'Cảnh báo bảo mật',
  message: 'Đăng nhập từ thiết bị mới',
  isRead: true,
  createdAt: '2026-10-12T07:00:00.000+07:00',
}

describe('NotificationStateStore (TASK-WEB-022)', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearStore()
    safeLocalStorage.clear()
    safeSessionStorage.clear()
  })

  describe('1. Phân tách Dữ liệu theo Người dùng (DD-WEB-020)', () => {
    it('tự động dọn sạch thông báo của người dùng cũ khi chuyển đổi sang người dùng mới', () => {
      const store = useNotificationStore.getState()

      // Người dùng 1 đăng nhập và nạp thông báo
      store.initUser(1)
      store.setNotifications([mockNotification1, mockNotification2])
      expect(useNotificationStore.getState().userId).toBe(1)
      expect(useNotificationStore.getState().notifications).toHaveLength(2)
      expect(useNotificationStore.getState().unreadCount).toBe(2)

      // Chuyển sang Người dùng 2 (hoặc Logout: null)
      store.initUser(2)
      const stateUser2 = useNotificationStore.getState()
      expect(stateUser2.userId).toBe(2)
      expect(stateUser2.notifications).toHaveLength(0)
      expect(stateUser2.unreadCount).toBe(0)
    })

    it('giữ nguyên dữ liệu nếu gọi initUser với cùng một userId', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1])

      store.initUser(1)
      expect(useNotificationStore.getState().notifications).toHaveLength(1)
    })
  })

  describe('2. Quản lý Danh sách & Cập nhật Lạc quan (Optimistic Update)', () => {
    it('setNotifications tính toán chính xác số lượng chưa đọc nếu không truyền thủ công', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1, mockNotification2, mockNotification3])

      expect(useNotificationStore.getState().notifications).toHaveLength(3)
      // 2 chưa đọc (mockNotification1, mockNotification2)
      expect(useNotificationStore.getState().unreadCount).toBe(2)
    })

    it('addNotification chèn thông báo mới lên đầu và tăng unreadCount', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1])
      expect(useNotificationStore.getState().unreadCount).toBe(1)

      store.addNotification(mockNotification2)
      const state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(2)
      expect(state.notifications[0].id).toBe(102) // Prepend đầu danh sách
      expect(state.unreadCount).toBe(2)
    })

    it('addNotification bỏ qua thông báo bị trùng ID', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1])

      store.addNotification(mockNotification1) // Trùng ID 101
      expect(useNotificationStore.getState().notifications).toHaveLength(1)
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })

    it('markAsRead cập nhật lạc quan isRead = true và giảm unreadCount tức thời (DD-WEB-020)', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1, mockNotification2])
      expect(useNotificationStore.getState().unreadCount).toBe(2)

      store.markAsRead(101)
      const state = useNotificationStore.getState()
      const target = state.notifications.find((n) => n.id === 101)
      expect(target?.isRead).toBe(true)
      expect(state.unreadCount).toBe(1)

      // Bấm đọc lại thông báo đã đọc không bị giảm âm số unreadCount
      store.markAsRead(101)
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })

    it('markAllAsRead đánh dấu toàn bộ đã đọc và reset unreadCount về 0', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1, mockNotification2])

      store.markAllAsRead()
      const state = useNotificationStore.getState()
      expect(state.notifications.every((n) => n.isRead)).toBe(true)
      expect(state.unreadCount).toBe(0)
    })
  })

  describe('3. Đóng Mở Drawer & Xóa Sạch khi Đăng xuất', () => {
    it('setIsOpen cập nhật trạng thái mở panel thông báo', () => {
      const store = useNotificationStore.getState()
      expect(store.isOpen).toBe(false)

      store.setIsOpen(true)
      expect(useNotificationStore.getState().isOpen).toBe(true)
    })

    it('clearStore xóa sạch toàn bộ trạng thái trong RAM khi đăng xuất', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1])
      store.setIsOpen(true)

      store.clearStore()
      const state = useNotificationStore.getState()
      expect(state.userId).toBeNull()
      expect(state.notifications).toEqual([])
      expect(state.unreadCount).toBe(0)
      expect(state.isOpen).toBe(false)
    })

    it('không lưu trữ dữ liệu thông báo vào LocalStorage hoặc SessionStorage', () => {
      const store = useNotificationStore.getState()
      store.initUser(1)
      store.setNotifications([mockNotification1, mockNotification2])

      // Kiểm tra LocalStorage và SessionStorage không chứa thông báo
      expect(safeLocalStorage.getItem('notifications')).toBeNull()
      expect(safeLocalStorage.getItem('fas_notifications')).toBeNull()
      expect(safeSessionStorage.getItem('fas_notifications')).toBeNull()
    })
  })
})
