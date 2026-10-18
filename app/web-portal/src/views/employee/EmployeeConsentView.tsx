/**
 * EmployeeConsentView: Màn hình Đăng ký & Rút Cam kết Sinh trắc học
 * (SOL-WEB-009, UXD-WEB-007, DD-WEB-015, BLD-WEB-020, TASK-WEB-026).
 *
 * Cho phép nhân viên theo dõi trạng thái dữ liệu khuôn mặt, ký mới Informed Consent,
 * hoặc kích hoạt quy trình rút cam kết 2 bước kèm cảnh báo hệ quả pháp lý & vận hành.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ConsentModal, ConsentWithdrawalModal } from '@/components/consent'
import { PinManagementModal } from '@/components/account'
import { apiClient } from '@/services/apiClient'
import type { ApiResponse, UserProfile } from '@/types'

export const EmployeeConsentView: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshProfile = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const res = await apiClient.get<ApiResponse<UserProfile>>('/api/v1/auth/me')
      if (res.data?.data) {
        updateUser(res.data.data)
      }
    } catch {
      // Bỏ qua lỗi nếu mạng tạm thời gián đoạn
    } finally {
      setIsRefreshing(false)
    }
  }, [updateUser])

  useEffect(() => {
    let ignore = false
    const fetchOnMount = async () => {
      try {
        const res = await apiClient.get<ApiResponse<UserProfile>>('/api/v1/auth/me')
        if (!ignore && res.data?.data) {
          useAuthStore.getState().updateUser(res.data.data)
        }
      } catch {
        // im lặng
      }
    }
    fetchOnMount()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Đăng ký sinh trắc &amp; Informed Consent</h1>
          <p className="page-subtitle">
            Quản lý cam kết bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP &amp; Nghị định 356/2025/NĐ-CP
          </p>
        </div>
        <button
          type="button"
          onClick={refreshProfile}
          disabled={isRefreshing}
          className="btn-outline self-start sm:self-auto flex items-center gap-2 text-xs py-2 px-3"
          title="Đồng bộ lại trạng thái sinh trắc từ CSDL hệ thống"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới trạng thái'}</span>
        </button>
      </div>

      {/* ── Khung Thông tin Pháp lý ── */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-brand-50 to-indigo-50 border border-brand-200/80 shadow-xs flex flex-col md:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <span>Nguyên tắc Bảo vệ Quyền Riêng tư &amp; Dữ liệu Sinh trắc</span>
            <span className="px-2 py-0.5 text-xs bg-brand-light text-brand-primary font-semibold rounded-full">
              Nghị định 13/2023/NĐ-CP
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Hệ thống FAS chỉ lưu trữ biểu diễn vector đặc trưng một chiều (Embedding) và không lưu trữ hình ảnh khuôn mặt thô.
            Bạn luôn có toàn quyền rút lại cam kết Informed Consent bất cứ lúc nào. Khi rút cam kết, dữ liệu vector sẽ được tiêu hủy trong vòng 7 ngày làm việc và bạn sẽ chuyển sang chấm công bằng mã PIN.
          </p>
        </div>
      </div>

      {/* ── Thẻ Trạng thái Sinh trắc học & PIN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thẻ 1: Khuôn mặt */}
        <div className="card-surface p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    <path d="M9 11.5c0 .8.9 1.5 3 1.5s3-.7 3-1.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Dữ liệu khuôn mặt Kiosk</h3>
                  <p className="text-xs text-text-muted">Nhận diện điểm danh tự động</p>
                </div>
              </div>

              {user?.hasBiometric ? (
                <span className="badge-success" data-testid="biometric-status-active">
                  ĐÃ KÍCH HOẠT
                </span>
              ) : (
                <span className="badge-warning" data-testid="biometric-status-inactive">
                  CHƯA KÍCH HOẠT
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {user?.hasBiometric
                ? 'Dữ liệu khuôn mặt của bạn đã được đăng ký và đồng bộ thành công tới toàn bộ trạm Kiosk. Bạn có thể điểm danh bằng khuôn mặt.'
                : 'Bạn chưa hoàn tất đăng ký nhận diện khuôn mặt. Vui lòng ký cam kết Informed Consent để nhận mã kích hoạt quét mặt tại trạm Kiosk.'}
            </p>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-end">
            {user?.hasBiometric ? (
              <button
                type="button"
                data-testid="open-withdraw-modal-btn"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="px-4 py-2 border border-rose-300 text-status-danger hover:bg-rose-50 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Rút lại cam kết sinh trắc</span>
              </button>
            ) : (
              <button
                type="button"
                data-testid="open-consent-modal-btn"
                onClick={() => setIsConsentModalOpen(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Ký cam kết ngay</span>
              </button>
            )}
          </div>
        </div>

        {/* Thẻ 2: Mã PIN dự phòng */}
        <div className="card-surface p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Mã PIN dự phòng</h3>
                  <p className="text-xs text-text-muted">Chấm công bàn phím Kiosk</p>
                </div>
              </div>

              {user?.hasPin ? (
                <span className="badge-success">ĐÃ THIẾT LẬP</span>
              ) : (
                <span className="badge-warning">CHƯA THIẾT LẬP</span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Mã PIN 6 số là phương thức chấm công dự phòng bắt buộc khi gặp sự cố nhận diện khuôn mặt hoặc sau khi rút cam kết sinh trắc học.
            </p>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span>Dùng tại màn hình PIN Kiosk</span>
            <button
              type="button"
              data-testid="open-pin-management-modal-btn"
              onClick={() => setIsPinModalOpen(true)}
              className="btn-secondary text-xs font-semibold py-1 px-2.5"
            >
              {user?.hasPin ? 'Đổi mã PIN' : 'Thiết lập mã PIN'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Ký cam kết Informed Consent ── */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
      />

      {/* ── Modal Rút cam kết 2 bước ── */}
      <ConsentWithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />

      {/* ── Modal Thiết lập / Đặt lại Mã PIN Dự phòng (UI-WEB-008, TASK-WEB-029) ── */}
      <PinManagementModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  )
}
