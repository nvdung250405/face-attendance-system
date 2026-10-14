/**
 * Thanh Điều hướng Bên trái Admin Shell (UXD-WEB-001, BLD-WEB-005, TASK-WEB-009).
 *
 * - Chiều rộng 260px (mở rộng) / 72px (thu gọn).
 * - Danh mục menu phân theo vai trò người dùng.
 * - Đáy sidebar: nút thu gọn/mở rộng và nút đăng xuất.
 * - Chuyển động CSS 200ms ease-in-out.
 */

import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { logoutService } from '@/services/logoutService'
import type { UserRole } from '@/types/auth'

// ── Icon SVG nội tuyến (không phụ thuộc thư viện icon) ───────────────────────

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconReport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const IconKiosk = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const IconAudit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const IconTimesheet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
)

const IconFace = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    <path d="M9 11.5c0 .8.9 1.5 3 1.5s3-.7 3-1.5" />
  </svg>
)

const IconRequest = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

// ── Định nghĩa mục điều hướng ─────────────────────────────────────────────────

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  // Nhóm Quản trị
  { label: 'Bảng điều khiển Live', to: '/admin/dashboard', icon: <IconDashboard />, roles: ['HR_MANAGER', 'ADMIN', 'DPO'] },
  { label: 'Lịch sử điểm danh', to: '/admin/attendance', icon: <IconHistory />, roles: ['HR_MANAGER', 'ADMIN', 'DPO'] },
  { label: 'Hồ sơ nhân sự', to: '/admin/employees', icon: <IconUsers />, roles: ['HR_MANAGER', 'ADMIN'] },
  { label: 'Ca & Phân ca', to: '/admin/shifts', icon: <IconCalendar />, roles: ['HR_MANAGER', 'ADMIN'] },
  { label: 'Chốt kỳ công', to: '/admin/payroll-periods', icon: <IconLock />, roles: ['HR_MANAGER', 'ADMIN'] },
  { label: 'Báo cáo tổng hợp', to: '/admin/reports', icon: <IconReport />, roles: ['HR_MANAGER', 'ADMIN', 'DPO'] },
  { label: 'Quản lý Kiosk', to: '/admin/kiosks', icon: <IconKiosk />, roles: ['HR_MANAGER', 'ADMIN'] },
  { label: 'Nhật ký kiểm toán', to: '/admin/audit-logs', icon: <IconAudit />, roles: ['HR_MANAGER', 'ADMIN', 'DPO'] },
  // Nhóm Nhân viên
  { label: 'Bảng công của tôi', to: '/employee/dashboard', icon: <IconTimesheet />, roles: ['EMPLOYEE'] },
  { label: 'Đăng ký sinh trắc & OTP', to: '/employee/consent', icon: <IconFace />, roles: ['EMPLOYEE'] },
  { label: 'Yêu cầu dữ liệu cá nhân', to: '/employee/data-requests', icon: <IconRequest />, roles: ['EMPLOYEE'] },
]

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role)
  )

  const handleLogout = async () => {
    await logoutService.logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed}
      style={{
        width: collapsed ? 'var(--spacing-sidebar-collapsed)' : 'var(--spacing-sidebar)',
        transition: 'width 200ms ease-in-out',
      }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col bg-[#102D53] overflow-hidden shrink-0"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center font-bold text-white text-sm shrink-0">
          FAS
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">FAS Portal</div>
            <div className="text-[#80B4FF] text-[10px] font-medium whitespace-nowrap">v2.0-Prod</div>
          </div>
        )}
      </div>

      {/* ── Nav Menu ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors duration-150',
                'group relative',
                isActive
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-[#a8c4e0] hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="truncate whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer: Toggle + Logout ── */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3 space-y-1">
        {/* Nút thu gọn / mở rộng */}
        <button
          type="button"
          id="sidebar-toggle"
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[#a8c4e0] hover:bg-white/10 hover:text-white transition-colors duration-150"
        >
          <span className="shrink-0">
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </span>
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">Thu gọn</span>
          )}
        </button>

        {/* Nút đăng xuất */}
        <button
          type="button"
          id="sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? 'Đăng xuất' : undefined}
          className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[#a8c4e0] hover:bg-rose-500/20 hover:text-rose-300 transition-colors duration-150"
        >
          <span className="shrink-0"><IconLogout /></span>
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">Đăng xuất</span>
          )}
        </button>
      </div>
    </aside>
  )
}
