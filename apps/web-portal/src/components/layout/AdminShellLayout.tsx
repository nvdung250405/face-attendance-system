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
    </div>
  )
}
