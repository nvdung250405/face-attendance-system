/**
 * Màn hình Cổng Nhân Viên Tự Phục Vụ (UI-WEB-001, UI-WEB-002, UI-WEB-005, TASK-WEB-017).
 */

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Sparkles, KeyRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ConsentModal } from '@/components/consent'
import { PersonalAttendanceCalendar } from '@/components/calendar'
import { consentService } from '@/services/consentService'
import { apiClient } from '@/services/apiClient'
import type { ApiResponse, UserProfile } from '@/types'

export const EmployeeDashboardView: React.FC = () => {
  const { user, clearSession } = useAuthStore()
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(() => {
    const session = consentService.getStoredConsentSession()
    return Boolean(session?.otp || user?.status === 'PENDING_CONSENT')
  })

  useEffect(() => {
    let ignore = false
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get<ApiResponse<UserProfile>>('/api/v1/auth/me')
        if (!ignore && res.data?.data) {
          useAuthStore.getState().updateUser(res.data.data)
        }
      } catch {
        // im lặng
      }
    }
    fetchProfile()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div data-testid="employee-dashboard-view" className="min-h-screen bg-bg-app text-text-primary p-6 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm">
        <div>
          <div className="inline-block px-2.5 py-1 bg-emerald-50 text-status-success text-xs font-semibold rounded-md mb-2">
            Cổng Thông Tin Nhân Viên
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Xin chào, {user?.fullName || 'Nhân Viên'} ({user?.employeeCode})
          </h1>
          <p className="text-sm text-text-secondary">
            Phòng ban: {user?.department || 'Chung'} • Trạng thái:{' '}
            <span
              className={`font-semibold ${
                user?.status === 'ACTIVE'
                  ? 'text-status-success'
                  : user?.status === 'PENDING_CONSENT'
                    ? 'text-amber-600'
                    : 'text-text-tertiary'
              }`}
            >
              {user?.status}
            </span>
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

      {/* Banner cảnh báo ký cam kết nếu chưa kích hoạt */}
      {!user?.hasBiometric && (
        <div className="p-6 rounded-2xl bg-linear-to-r from-brand-50 to-indigo-50 border border-brand-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-brand-600 text-white shrink-0 mt-0.5 shadow-md shadow-brand-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span>Ký Cam kết & Kích hoạt Điểm danh Khuôn mặt</span>
                <span className="px-2 py-0.5 text-xs bg-brand-100 text-brand-700 font-semibold rounded-full">
                  Nghị định 13/2023
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
                Bạn chưa kích hoạt dữ liệu nhận diện khuôn mặt. Vui lòng ký bản cam kết bảo vệ dữ liệu
                để nhận mã OTP và mã QR nạp khuôn mặt tại trạm Kiosk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsConsentModalOpen(true)}
            data-testid="open-consent-modal-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ký cam kết ngay</span>
          </button>
        </div>
      )}

      {/* Summary card */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Trạng thái Nhận diện & Điểm danh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dữ liệu khuôn mặt
              </span>
              <KeyRound className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-sm font-bold text-slate-900">
              {user?.hasBiometric ? (
                <span className="text-status-success flex items-center gap-1.5">
                  ✓ Đã kích hoạt trên Kiosk
                </span>
              ) : (
                <span className="text-amber-700">Chưa nạp khuôn mặt</span>
              )}
            </div>
            {!user?.hasBiometric && (
              <button
                type="button"
                onClick={() => setIsConsentModalOpen(true)}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium underline inline-block pt-1"
              >
                Mở lại mã OTP kích hoạt
              </button>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mã PIN dự phòng
              </span>
              <KeyRound className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-sm font-bold text-slate-900">
              {user?.hasPin ? (
                <span className="text-status-success">Đã thiết lập</span>
              ) : (
                <span className="text-slate-500">Chưa tạo mã PIN</span>
              )}
            </div>
            <p className="text-xs text-text-tertiary">
              Dùng để chấm công khi không thể nhận diện khuôn mặt
            </p>
          </div>
        </div>
      </div>

      {/* Lịch chấm công cá nhân 7 cột & xuất báo cáo (TASK-WEB-012, BLD-WEB-008) */}
      <PersonalAttendanceCalendar />

      {/* Modal Ký cam kết Informed Consent */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onSuccess={() => {
          // Callback sau khi kích hoạt thành công
        }}
      />
    </div>
  )
}
