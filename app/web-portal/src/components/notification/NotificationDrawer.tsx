/**
 * NotificationDrawer: Trung tâm Thông báo Trong Ứng dụng
 * (SOL-WEB-011, DD-WEB-020, UXD-WEB-007, BLD-WEB-020, TASK-WEB-026).
 *
 * Tính năng chính:
 * - Trượt từ cạnh phải (chiều rộng 420px max-w-drawer theo layout tokens).
 * - Cập nhật lạc quan (Optimistic Update) số lượng chưa đọc khi người dùng click vào thông báo.
 * - Nút "Đánh dấu tất cả đã đọc" đồng bộ với máy chủ (PATCH /api/v1/notifications/read-all).
 * - Phân loại biểu tượng theo NotificationEventType (ATTENDANCE_PUNCH, CONSENT_SIGNED, etc.).
 * - Xóa sạch dữ liệu khi logout (DD-WEB-020).
 */

import React from 'react'
import {
  Check,
  FileText,
  UserCheck,
  Calendar,
  Lock,
  AlertTriangle,
  Bell,
  X,
  ChevronRight,
} from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useNotificationStore } from '@/store/notificationStore'
import { notificationService } from '@/services/notificationService'
import type { NotificationEventType } from '@/types'

// ── Icons theo Event Type ──────────────────────────────────────────────────────

const NotificationEventIcon: React.FC<{ type: NotificationEventType | string }> = ({ type }) => {
  switch (type) {
    case 'ATTENDANCE_PUNCH':
      return (
        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-status-success flex items-center justify-center shrink-0">
          <Check size={14} strokeWidth={2.5} />
        </div>
      )
    case 'CONSENT_SIGNED':
      return (
        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center shrink-0">
          <FileText size={14} strokeWidth={2} />
        </div>
      )
    case 'ENROLLMENT_COMPLETED':
      return (
        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <UserCheck size={14} strokeWidth={2} />
        </div>
      )
    case 'SHIFT_ASSIGNED':
      return (
        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <Calendar size={14} strokeWidth={2} />
        </div>
      )
    case 'PAYROLL_LOCKED':
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Lock size={14} strokeWidth={2} />
        </div>
      )
    case 'SECURITY_ALERT':
      return (
        <div className="w-7 h-7 rounded-lg bg-rose-100 text-status-danger flex items-center justify-center shrink-0">
          <AlertTriangle size={14} strokeWidth={2} />
        </div>
      )
    default:
      return (
        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <Bell size={14} strokeWidth={2} />
        </div>
      )
  }
}

// ── Định dạng ngày giờ ────────────────────────────────────────────────────────

function formatNotificationTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return isoString
  }
}

// ── NotificationDrawer Component ──────────────────────────────────────────────

export const NotificationDrawer: React.FC = () => {
  const isOpen = useNotificationStore((s) => s.isOpen)
  const setIsOpen = useNotificationStore((s) => s.setIsOpen)
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)

  if (!isOpen) return null

  const handleMarkAllRead = async () => {
    markAllAsRead()
    try {
      await notificationService.markAllAsRead()
    } catch {
      // Cập nhật lạc quan đã ghi nhận phía client
    }
  }

  const handleItemClick = async (id: number, isRead: boolean) => {
    if (!isRead) {
      // Optimistic update
      markAsRead(id)
      try {
        await notificationService.markAsRead(id)
      } catch {
        // Ignored
      }
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        data-testid="notification-drawer"
        hideCloseButton
        className="w-full max-w-md p-0 flex flex-col sm:max-w-md bg-surface-card border-l border-border-subtle"
      >
        <div className="w-full flex-1 flex flex-col overflow-hidden">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary">Trung tâm thông báo</h2>
              {unreadCount > 0 && (
                <span
                  data-testid="drawer-unread-count-badge"
                  className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand-primary"
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  data-testid="mark-all-read-btn"
                  onClick={handleMarkAllRead}
                  className="text-xs text-brand-primary hover:text-brand-hover font-semibold px-2.5 py-1.5 min-h-[36px] rounded-lg hover:bg-brand-50 transition-colors flex items-center"
                >
                  Đọc tất cả
                </button>
              )}
              <button
                type="button"
                data-testid="close-notification-drawer-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng bảng thông báo"
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Drawer Body: Danh sách thông báo */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Bell size={24} strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold text-text-secondary">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  data-testid={`notification-item-${item.id}`}
                  onClick={() => handleItemClick(item.id, item.isRead)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleItemClick(item.id, item.isRead)
                    }
                  }}
                  className={`group px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors flex items-center gap-3 cursor-pointer ${
                    !item.isRead
                      ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <NotificationEventIcon type={item.eventType} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-xs sm:text-sm truncate ${
                          !item.isRead
                            ? 'font-bold text-text-primary'
                            : 'font-medium text-text-secondary'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] sm:text-[11px] text-text-muted">
                          {formatNotificationTime(item.createdAt)}
                        </span>
                        {!item.isRead && (
                          <span
                            data-testid={`unread-dot-${item.id}`}
                            className="w-2 h-2 rounded-full bg-brand-primary"
                            title="Chưa đọc"
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-2xs sm:text-xs text-text-secondary line-clamp-1 mt-0.5 leading-snug">
                      {item.message}
                    </p>
                  </div>

                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
