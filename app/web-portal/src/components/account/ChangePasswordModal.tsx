/**
 * Hộp thoại Đổi Mật khẩu Tự nguyện (UXD-WEB-008, DD-WEB-018, SOL-WEB-006, APD-WEB-006).
 *
 * ĐẶC TẢ KỸ THUẬT:
 * 1. Mở từ menu người dùng phía trên TopHeader.
 * 2. Đo lường & hiển thị chỉ số độ mạnh mật khẩu trực quan.
 * 3. Cảnh báo rõ ràng các phiên cũ trên mọi thiết bị sẽ bị thu hồi sau khi đổi thành công.
 * 4. Không chặn điều hướng (người dùng tự do đóng hộp thoại hoặc huỷ bất kỳ lúc nào).
 */

import React, { useState, useId } from 'react'
import { credentialService } from '@/services/credentialService'
import type { NormalizedApiError } from '@/services/errorNormalizer'

import { calculatePasswordStrength } from './passwordStrength'

export interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const titleId = useId()

  if (!isOpen) {
    return null
  }

  const strength = calculatePasswordStrength(newPassword)

  const resetForm = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!oldPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 8 ký tự.')
      return
    }

    if (newPassword === oldPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp.')
      return
    }

    setIsLoading(true)
    try {
      const res = await credentialService.changePassword({
        oldPassword,
        newPassword,
      })

      setSuccessMessage(
        res.message || 'Đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được thu hồi.'
      )
      onSuccess?.()
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      setErrorMessage(apiErr?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="change-password-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="card-surface w-full max-w-md p-6 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-brand-primary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h3 id={titleId} className="text-base font-bold text-text-primary">
                Đổi mật khẩu tài khoản
              </h3>
              <p className="text-xs text-text-secondary">Thiết lập mật khẩu bảo mật mới</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Khối cảnh báo thu hồi phiên (UXD-WEB-008) */}
        <div className="my-3.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <span className="font-semibold">Lưu ý thu hồi phiên:</span> Sau khi đổi mật khẩu thành công, toàn bộ các phiên đăng nhập khác của bạn sẽ tự động bị thu hồi để đảm bảo an toàn.
          </div>
        </div>

        {/* Thông báo kết quả */}
        {errorMessage && (
          <div
            data-testid="change-password-error"
            className="mb-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            data-testid="change-password-success"
            className="mb-3.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form nhập liệu */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mật khẩu hiện tại */}
          <div>
            <label
              htmlFor="input-old-password"
              className="block text-xs font-semibold text-text-secondary mb-1"
            >
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-old-password"
                data-testid="input-old-password"
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng"
                className="input-base pr-10"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label={showOld ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showOld ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label
              htmlFor="input-new-password"
              className="block text-xs font-semibold text-text-secondary mb-1"
            >
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-new-password"
                data-testid="input-new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, số"
                className="input-base pr-10"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showNew ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Thước đo độ mạnh mật khẩu */}
            {newPassword && (
              <div data-testid="password-strength-meter" className="mt-2">
                <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-text-secondary">
                  <span>Độ mạnh:</span>
                  <span className={`font-semibold ${
                    strength.score <= 2 ? 'text-rose-600' : strength.score === 3 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: strength.barWidth }}
                    className={`h-full transition-all duration-300 ${strength.colorClass}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label
              htmlFor="input-confirm-password"
              className="block text-xs font-semibold text-text-secondary mb-1"
            >
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-confirm-password"
                data-testid="input-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="input-base pr-10"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirm ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-change-password"
              data-testid="btn-cancel-change-password"
              onClick={handleClose}
              disabled={isLoading}
              className="btn-secondary"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              id="btn-submit-change-password"
              data-testid="btn-submit-change-password"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
