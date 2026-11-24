/**
 * Khung Bố cục Quản trị Admin Shell (UXD-WEB-001, BLD-WEB-005, TASK-WEB-009).
 *
 * Lắp ráp:
 * - Sidebar 260px (thu gọn 72px) cố định bên trái.
 * - TopHeader 64px sticky top-0.
 * - Main Viewport co giãn responsive từ mobile < 768px đến ≥ 1440px.
 * - Chuyển động CSS 200ms ease-in-out cho sidebar.
 * - useStompClient (TASK-WEB-018) kích hoạt kết nối STOMP và đồng bộ trạng thái vào store.
 */

import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { GlobalFooter } from './GlobalFooter'
import { useStompClient } from '@/services/hooks'
import { useAuthStore } from '@/store/authStore'

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72
const TOP_HEADER_HEIGHT = 64

export const AdminShellLayout: React.FC = () => {
  // Khởi tạo trạng thái thu gọn dựa trên kích thước màn hình ban đầu (< 1024px tự động thu gọn cho tablet & mobile)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })

  // Lắng nghe thay đổi kích thước cửa sổ để tự động thu gọn trên tablet/mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed((prev) => (prev ? prev : true))
      }
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Khởi động kết nối STOMP singleton và đồng bộ trạng thái vào stompConnectionStore
  // để TopHeader hiển thị chỉ báo kết nối Kiosk Live (TASK-WEB-018)
  useStompClient({ autoConnect: true })

  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <div className="min-h-screen bg-bg-app" data-testid="admin-shell-layout">
      {/* ── Sidebar ── */}
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />

      {/* ── Phần nội dung phải (dịch theo sidebar trên md+, tràn viền 0 margin trên mobile) ── */}
      <div
        className={`transition-all duration-200 ease-in-out flex flex-col min-h-screen ${
          collapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'
        } ml-0 min-w-0`}
      >
        {/* ── Top Header ── */}
        <TopHeader
          sidebarWidth={sidebarWidth}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
        />

        {/* ── Main Viewport ── */}
        <main
          data-testid="main-viewport"
          style={{ paddingTop: TOP_HEADER_HEIGHT }}
          className="flex-1 min-w-0 flex flex-col"
        >
          <div className="flex-1 p-3 sm:p-6 pb-8 max-sm:pb-12 max-sm:px-3">
            <Outlet />
          </div>
          <GlobalFooter />
        </main>
      </div>

      {/* ── Mobile Overlay (< 768px): đóng sidebar khi click ngoài ── */}
      {!collapsed && (
        <div
          data-testid="mobile-overlay"
          className="fixed inset-0 z-35 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* ── Dev Floating Badge & Quick Role Switcher (Chỉ hiển thị khi import.meta.env.DEV) ── */}
      {import.meta.env.DEV && (
        <aside
          data-testid="dev-badge"
          aria-label="Bảng điều khiển chế độ phát triển"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs font-mono text-slate-200 shadow-lg backdrop-blur-md border border-slate-700/80"
        >
          <span className="font-semibold text-amber-400">
            {import.meta.env.VITE_ENABLE_MOCK === 'true' ? '[DEV MOCK]' : '[DEV MODE]'}
          </span>
          <span className="text-slate-600" aria-hidden="true">
            |
          </span>
          <span className="text-[11px] font-sans text-slate-400">Vai trò:</span>
          <div
            role="group"
            aria-label="Chuyển đổi vai trò người dùng nhanh"
            className="flex items-center rounded bg-slate-800 p-0.5 border border-slate-700 text-xs font-sans"
          >
            <button
              type="button"
              aria-label="Chuyển sang vai trò Admin"
              onClick={() => updateUser({ role: 'ADMIN' })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                user?.role === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              aria-label="Chuyển sang vai trò Nhân viên"
              onClick={() => updateUser({ role: 'EMPLOYEE' })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                user?.role === 'EMPLOYEE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nhân viên
            </button>
            <button
              type="button"
              aria-label="Chuyển sang vai trò DPO"
              onClick={() => updateUser({ role: 'DPO' })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                user?.role === 'DPO'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DPO
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
