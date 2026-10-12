/**
 * Màn hình Cổng Nhân Viên Tự Phục Vụ (UI-WEB-001, UI-WEB-005).
 */

import React from 'react'
import { useAuthStore } from '@/store/authStore'

export const EmployeeDashboardView: React.FC = () => {
  const { user, clearSession } = useAuthStore()

  return (
    <div className="min-h-screen bg-bg-app text-text-primary p-6 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm">
        <div>
          <div className="inline-block px-2.5 py-1 bg-emerald-50 text-status-success text-xs font-semibold rounded-md mb-2">
            Cổng Thông Tin Nhân Viên
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Xin chào, {user?.fullName || 'Nhân Viên'} ({user?.employeeCode})
          </h1>
          <p className="text-sm text-text-secondary">
            Phòng ban: {user?.department || 'Chung'} • Trạng thái: {user?.status}
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

      {/* Summary card */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-bold text-text-primary">Trạng thái Nhận diện & Điểm danh</h2>
        <div className="flex flex-wrap gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-semibold text-slate-700">Dữ liệu khuôn mặt:</span>{' '}
            {user?.hasBiometric ? 'Đã kích hoạt' : 'Chưa đăng ký (cần ký Informed Consent)'}
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-semibold text-slate-700">Mã PIN dự phòng:</span>{' '}
            {user?.hasPin ? 'Đã thiết lập' : 'Chưa tạo'}
          </div>
        </div>
      </div>
    </div>
  )
}
