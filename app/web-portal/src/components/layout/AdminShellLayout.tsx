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

import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { useStompClient } from '@/services/hooks'

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72
const TOP_HEADER_HEIGHT = 64

export const AdminShellLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  // Khởi động kết nối STOMP singleton và đồng bộ trạng thái vào stompConnectionStore
  // để TopHeader hiển thị chỉ báo kết nối Kiosk Live (TASK-WEB-018)
  useStompClient({ autoConnect: true })

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <div className="min-h-screen bg-bg-app" data-testid="admin-shell-layout">
      {/* ── Sidebar ── */}
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />

      {/* ── Phần nội dung phải (dịch theo sidebar) ── */}
      <div
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 200ms ease-in-out',
        }}
      >
        {/* ── Top Header ── */}
        <TopHeader sidebarWidth={sidebarWidth} />

        {/* ── Main Viewport ── */}
        <main
          data-testid="main-viewport"
          style={{ paddingTop: TOP_HEADER_HEIGHT }}
          className="min-h-screen"
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Overlay (< 768px): đóng sidebar khi click ngoài ── */}
      {!collapsed && (
        <div
          data-testid="mobile-overlay"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
