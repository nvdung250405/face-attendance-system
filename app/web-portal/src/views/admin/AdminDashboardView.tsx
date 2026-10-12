/**
 * Màn hình Bảng điều khiển Quản trị HR / ADMIN (UI-WEB-001, UI-WEB-003).
 */

import React from 'react'
import { useAuthStore } from '@/store/authStore'

export const AdminDashboardView: React.FC = () => {
  const { user, clearSession } = useAuthStore()

  return (
    <div className="min-h-screen bg-bg-app text-text-primary p-6 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm">
        <div>
          <div className="inline-block px-2.5 py-1 bg-brand-light text-brand-primary text-xs font-semibold rounded-md mb-2">
            Không gian Quản trị HR & Vận hành
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Chào mừng, {user?.fullName || 'Quản Trị Viên'}
          </h1>
          <p className="text-sm text-text-secondary">
            Phòng ban: {user?.department || 'Quản lý'} • Vai trò: {user?.role}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={clearSession}
            className="px-4 py-2 border border-border-subtle hover:bg-rose-50 hover:text-status-danger text-sm font-medium rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* KPI Cards placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-text-secondary uppercase">Tổng nhân sự</div>
          <div className="text-2xl font-bold text-text-primary">128</div>
        </div>
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-status-success uppercase">Đã có mặt</div>
          <div className="text-2xl font-bold text-status-success">115</div>
        </div>
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-status-warning uppercase">Đi muộn</div>
          <div className="text-2xl font-bold text-status-warning">7</div>
        </div>
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-status-danger uppercase">Chưa đến</div>
          <div className="text-2xl font-bold text-status-danger">6</div>
        </div>
      </div>
    </div>
  )
}
