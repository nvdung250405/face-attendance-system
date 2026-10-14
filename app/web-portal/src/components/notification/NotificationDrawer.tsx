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

import React, { useEffect } from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import { notificationService } from '@/services/notificationService'
import type { NotificationEventType } from '@/types'

// ── Icons theo Event Type ──────────────────────────────────────────────────────

const NotificationEventIcon: React.FC<{ type: NotificationEventType | string }> = ({ type }) => {
  switch (type) {
    case 'ATTENDANCE_PUNCH':
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-status-success flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )
    case 'CONSENT_SIGNED':
      return (
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
      )
    case 'ENROLLMENT_COMPLETED':
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" />
          </svg>
        </div>
      )
    case 'SHIFT_ASSIGNED':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      )
    case 'PAYROLL_LOCKED':
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )
    case 'SECURITY_ALERT':
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-100 text-status-danger flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
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
  const { isOpen, setIsOpen, notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore()

  // Phím Escape để đóng drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trung tâm thông báo"
      data-testid="notification-drawer"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
        style={{ width: 'var(--spacing-drawer)' }}
      >
        <div className="w-full bg-surface-card shadow-2xl border-l border-border-subtle flex flex-col">
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
                  className="text-xs text-brand-primary hover:text-brand-hover font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors"
                >
                  Đọc tất cả
                </button>
              )}
              <button
                type="button"
                data-testid="close-notification-drawer-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng bảng thông báo"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Drawer Body: Danh sách thông báo */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-secondary">Chưa có thông báo nào</p>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Bạn sẽ nhận được thông báo khi có ca làm việc mới, điểm danh, hoặc sự kiện hệ thống.
                  </p>
                </div>
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
                  className={`p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                    !item.isRead
                      ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <NotificationEventIcon type={item.eventType} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm truncate ${
                          !item.isRead
                            ? 'font-bold text-text-primary'
                            : 'font-medium text-text-secondary'
                        }`}
                      >
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span
                          data-testid={`unread-dot-${item.id}`}
                          className="w-2 h-2 rounded-full bg-brand-primary shrink-0"
                          title="Chưa đọc"
                        />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="text-[11px] text-text-muted mt-1.5 flex items-center gap-1">
                      <span>{formatNotificationTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
