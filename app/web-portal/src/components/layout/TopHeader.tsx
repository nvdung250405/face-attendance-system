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
import { ChangePasswordModal, PinManagementModal } from '@/components/account'

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

import { Bell, ChevronDown, Lock, Shield, LogOut } from 'lucide-react'

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconBell = ({ hasUnread, unreadCount }: { hasUnread: boolean; unreadCount?: number }) => (
  <div className="relative">
    <Bell size={20} strokeWidth={1.75} />
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
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
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

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase()
    : '??'

  return (
    <>
      <header
        data-testid="top-header"
        style={{
          left: sidebarWidth,
          right: 0,
          transition: 'left 200ms ease-in-out',
        }}
        className="fixed top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 flex items-center px-6 gap-4"
      >
      {/* ── Breadcrumb ── */}
      <div className="flex-1 min-w-0">
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-2 text-xs font-medium">
            <li className="text-slate-400">FAS Portal</li>
            <li className="text-slate-300">/</li>
            <li className="text-slate-800 font-semibold truncate text-sm">{currentPage}</li>
          </ol>
        </nav>
      </div>

      {/* ── STOMP Indicator ── */}
      <div
        data-testid="stomp-status"
        className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          stompStatus === 'CONNECTED'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
            : stompStatus === 'CONNECTING'
              ? 'bg-amber-50 text-amber-700 border-amber-200/70'
              : 'bg-rose-50 text-rose-700 border-rose-200/70'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            stompStatus === 'CONNECTED'
              ? 'bg-emerald-500 animate-pulse'
              : stompStatus === 'CONNECTING'
                ? 'bg-amber-500'
                : 'bg-rose-500'
          }`}
        />
        <span>{stompLabel}</span>
      </div>

      {/* ── Notification Bell ── */}
      <button
        type="button"
        id="header-notifications"
        data-testid="header-notifications"
        aria-label="Thông báo"
        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
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
          className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-slate-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/20 shadow-xs">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-tight max-w-44 truncate">
              {user?.fullName ?? 'Người dùng'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{user?.role}</div>
          </div>
          <span className="text-slate-400">
            <ChevronDown size={14} strokeWidth={2} />
          </span>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-52 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3.5 py-2.5 border-b border-slate-100">
              <div className="text-sm font-bold text-slate-900 truncate">
                {user?.fullName}
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</div>
            </div>
            <div className="p-1 space-y-0.5">
              <button
                type="button"
                role="menuitem"
                id="header-change-password"
                onClick={() => {
                  setDropdownOpen(false)
                  setIsChangePasswordOpen(true)
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2.5 font-medium"
              >
                <Lock size={15} className="text-slate-400" />
                <span>Đổi mật khẩu</span>
              </button>
              <button
                type="button"
                role="menuitem"
                id="header-manage-pin"
                data-testid="header-manage-pin"
                onClick={() => {
                  setDropdownOpen(false)
                  setIsPinModalOpen(true)
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2.5 font-medium"
              >
                <Shield size={15} className="text-slate-400" />
                <span>{user?.hasPin ? 'Đổi mã PIN dự phòng' : 'Thiết lập mã PIN'}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                id="header-logout"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2.5 font-medium"
              >
                <LogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>
      </header>

      {/* ── Modal Đổi Mật khẩu Tự nguyện (UXD-WEB-008, DD-WEB-018) ── */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* ── Modal Thiết lập / Đặt lại Mã PIN Dự phòng (UI-WEB-008, TASK-WEB-029) ── */}
      <PinManagementModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* ── Trung tâm Thông báo Drawer (SOL-WEB-011, TASK-WEB-026) ── */}
      <NotificationDrawer />
    </>
  )
}
