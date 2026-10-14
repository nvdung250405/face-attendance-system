/**
 * Thanh Tiêu đề Trên cùng Admin Shell (UXD-WEB-001, BLD-WEB-005, TASK-WEB-009).
 *
 * - Chiều cao 64px, sticky top-0 z-30.
 * - Trái: Breadcrumb đường dẫn.
 * - Giữa: Chỉ báo trạng thái kết nối STOMP.
 * - Phải: Chuông thông báo + Avatar + Dropdown menu tài khoản.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useStompConnectionStore } from '@/store/stompConnectionStore'
import { logoutService } from '@/services/logoutService'
import { ChangePasswordModal } from '@/components/account'

import { useNotificationStore } from '@/store/notificationStore'
import { notificationService } from '@/services/notificationService'
import { NotificationDrawer } from '@/components/notification'

// ── Breadcrumb map ────────────────────────────────────────────────────────────

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin/dashboard': 'Bảng điều khiển Live',
  '/admin/attendance': 'Lịch sử điểm danh',
  '/admin/employees': 'Hồ sơ nhân sự',
  '/admin/shifts': 'Ca & Phân ca',
  '/admin/payroll-periods': 'Chốt kỳ công',
  '/admin/reports': 'Báo cáo tổng hợp',
  '/admin/kiosks': 'Quản lý Kiosk',
  '/admin/audit-logs': 'Nhật ký kiểm toán',
  '/employee/dashboard': 'Bảng công của tôi',
  '/employee/consent': 'Đăng ký sinh trắc & OTP',
  '/employee/data-requests': 'Yêu cầu dữ liệu cá nhân',
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconBell = ({ hasUnread, unreadCount }: { hasUnread: boolean; unreadCount?: number }) => (
  <div className="relative">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
    {hasUnread && (
      <span
        data-testid="notification-unread-badge"
        className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-white"
      >
        {unreadCount && unreadCount > 99 ? '99+' : unreadCount || ''}
      </span>
    )}
  </div>
)

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────────────

export interface TopHeaderProps {
  sidebarWidth: number
}

export const TopHeader: React.FC<TopHeaderProps> = ({ sidebarWidth }) => {
  const { user } = useAuthStore()
  const { status: stompStatus } = useStompConnectionStore()
  const {
    unreadCount,
    isOpen: isNotificationOpen,
    setIsOpen: setIsNotificationOpen,
    initUser,
    setNotifications,
  } = useNotificationStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentPage = BREADCRUMB_MAP[location.pathname] ?? 'Trang không tìm thấy'

  // Đồng bộ thông báo của người dùng đăng nhập
  useEffect(() => {
    if (user?.id) {
      initUser(user.id)
      notificationService
        .getNotifications()
        .then((items) => {
          const mapped = items.map((res) => ({
            id: res.id,
            userId: res.userId,
            eventType: res.eventType,
            title: res.title,
            message: res.body || (res as unknown as { message?: string }).message || '',
            isRead: Boolean(res.readAt),
            createdAt: res.createdAt,
          }))
          setNotifications(mapped)
        })
        .catch(() => {
          // Bỏ qua lỗi nạp thông báo nếu không có kết nối
        })
    }
  }, [user?.id, initUser, setNotifications])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logoutService.logout()
    navigate('/login', { replace: true })
  }

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const stompLabel =
    stompStatus === 'CONNECTED'
      ? 'Kiosk Live'
      : stompStatus === 'CONNECTING'
        ? 'Đang kết nối...'
        : 'Mất kết nối'

  const stompColor =
    stompStatus === 'CONNECTED'
      ? 'text-status-success'
      : stompStatus === 'CONNECTING'
        ? 'text-status-warning'
        : 'text-status-danger'

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase()
    : '??'

  return (
    <header
      data-testid="top-header"
      style={{
        left: sidebarWidth,
        right: 0,
        transition: 'left 200ms ease-in-out',
      }}
      className="fixed top-0 z-30 h-16 bg-surface-card border-b border-border-subtle flex items-center px-6 gap-4"
    >
      {/* ── Breadcrumb ── */}
      <div className="flex-1 min-w-0">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="text-text-muted">FAS Portal</li>
            <li className="text-text-muted">/</li>
            <li className="text-text-primary font-medium truncate">{currentPage}</li>
          </ol>
        </nav>
      </div>

      {/* ── STOMP Indicator ── */}
      <div
        data-testid="stomp-status"
        className={`hidden md:flex items-center gap-1.5 text-xs font-medium ${stompColor}`}
      >
        <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" />
        {stompLabel}
      </div>

      {/* ── Notification Bell ── */}
      <button
        type="button"
        id="header-notifications"
        data-testid="header-notifications"
        aria-label="Thông báo"
        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-app hover:text-text-primary transition-colors relative"
      >
        <IconBell hasUnread={unreadCount > 0} unreadCount={unreadCount} />
      </button>

      {/* ── Avatar + Dropdown ── */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          id="header-avatar"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg-app transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-text-primary leading-tight max-w-32 truncate">
              {user?.fullName ?? 'Người dùng'}
            </div>
            <div className="text-xs text-text-muted leading-tight">{user?.role}</div>
          </div>
          <span className="text-text-muted">
            <IconChevronDown />
          </span>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1.5 w-48 bg-surface-card border border-border-subtle rounded-xl shadow-lg py-1 z-50"
          >
            <div className="px-3 py-2 border-b border-border-subtle">
              <div className="text-sm font-medium text-text-primary truncate">
                {user?.fullName}
              </div>
              <div className="text-xs text-text-muted">{user?.email}</div>
            </div>
            <button
              type="button"
              role="menuitem"
              id="header-change-password"
              onClick={() => {
                setDropdownOpen(false)
                setIsChangePasswordOpen(true)
              }}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-app transition-colors flex items-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Đổi mật khẩu</span>
            </button>
            <button
              type="button"
              role="menuitem"
              id="header-logout"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-status-danger hover:bg-rose-50 transition-colors flex items-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Đổi Mật khẩu Tự nguyện (UXD-WEB-008, DD-WEB-018) ── */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* ── Trung tâm Thông báo Drawer (SOL-WEB-011, TASK-WEB-026) ── */}
      <NotificationDrawer />
    </header>
  )
}
