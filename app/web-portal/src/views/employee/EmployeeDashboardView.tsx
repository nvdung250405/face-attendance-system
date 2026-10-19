/**
 * Màn hình Cổng Nhân Viên Tự Phục Vụ (UI-WEB-001, UI-WEB-002, UI-WEB-005, TASK-WEB-017).
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Sparkles, KeyRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ConsentModal } from '@/components/consent'
import { PersonalAttendanceCalendar } from '@/components/calendar'
import { consentService } from '@/services/consentService'
import { logoutService } from '@/services/logoutService'
import { apiClient } from '@/services/apiClient'
import type { ApiResponse, UserProfile } from '@/types'

export const EmployeeDashboardView: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
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
    <div data-testid="employee-dashboard-view" className="space-y-6">
      {/* ── Tiêu đề & Tác vụ hàng đầu ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-status-success border border-emerald-200 mb-1.5">
            Cổng Thông Tin Nhân Viên
          </div>
          <h1 className="page-title">
            Xin chào, {user?.fullName || 'Nhân Viên'} {user?.employeeCode ? `(${user.employeeCode})` : ''}
          </h1>
          <p className="page-subtitle">
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
            onClick={async () => {
              await logoutService.logout()
              navigate('/login', { replace: true })
            }}
            className="btn-secondary hover:bg-rose-50 hover:text-status-danger"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Banner cảnh báo ký cam kết nếu chưa kích hoạt */}
      {!user?.hasBiometric && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-blue-100 text-blue-700 mt-0.5 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <span>Ký Cam kết & Kích hoạt Điểm danh Khuôn mặt</span>
                <span className="badge-info text-2xs">
                  Nghị định 13/2023
                </span>
              </h3>
              <p className="text-xs text-blue-800 mt-1 max-w-xl leading-relaxed">
                Bạn chưa kích hoạt dữ liệu nhận diện khuôn mặt. Vui lòng ký bản cam kết bảo vệ dữ liệu
                để nhận mã OTP và mã QR nạp khuôn mặt tại trạm Kiosk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsConsentModalOpen(true)}
            data-testid="open-consent-modal-btn"
            className="btn-primary flex items-center gap-2 shrink-0 self-start md:self-auto text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ký cam kết ngay</span>
          </button>
        </div>
      )}

      {/* Summary card */}
      <div className="card-surface p-6 space-y-4">
        <h2 className="text-base font-bold text-text-primary">Trạng thái Nhận diện & Điểm danh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Dữ liệu khuôn mặt
              </span>
              <KeyRound className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="text-sm font-bold text-text-primary">
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
                className="text-xs text-brand-primary hover:underline font-medium inline-block pt-1"
              >
                Mở lại mã OTP kích hoạt
              </button>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Mã PIN dự phòng
              </span>
              <KeyRound className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-sm font-bold text-text-primary">
              {user?.hasPin ? (
                <span className="text-status-success">Đã thiết lập</span>
              ) : (
                <span className="text-text-muted">Chưa tạo mã PIN</span>
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
