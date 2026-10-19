/**
 * EmployeeConsentView: Màn hình Đăng ký & Rút Cam kết Sinh trắc học
 * (SOL-WEB-009, UXD-WEB-007, DD-WEB-015, BLD-WEB-020, TASK-WEB-026).
 *
 * Cho phép nhân viên theo dõi trạng thái dữ liệu khuôn mặt, ký mới Informed Consent,
 * hoặc kích hoạt quy trình rút cam kết 2 bước kèm cảnh báo hệ quả pháp lý & vận hành.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Shield, ScanFace, AlertTriangle, Plus, Lock } from 'lucide-react'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          className="btn-secondary self-start sm:self-auto flex items-center gap-2"
          title="Đồng bộ lại trạng thái sinh trắc từ CSDL hệ thống"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* ── Khung Thông tin Pháp lý ── */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col md:flex-row items-start gap-3">
        <div className="p-1 rounded-lg bg-blue-100 text-blue-700 mt-0.5 shrink-0">
          <Shield size={20} strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
            <span>Nguyên tắc Bảo vệ Quyền Riêng tư &amp; Dữ liệu Sinh trắc</span>
            <span className="badge-info text-2xs">
              Nghị định 13/2023/NĐ-CP
            </span>
          </h2>
          <p className="text-xs text-blue-800 leading-relaxed">
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
                  <ScanFace size={20} strokeWidth={1.75} />
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
                <AlertTriangle size={16} strokeWidth={2} />
                <span>Rút lại cam kết sinh trắc</span>
              </button>
            ) : (
              <button
                type="button"
                data-testid="open-consent-modal-btn"
                onClick={() => setIsConsentModalOpen(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={16} strokeWidth={2} />
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
                  <Lock size={20} strokeWidth={1.75} />
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
