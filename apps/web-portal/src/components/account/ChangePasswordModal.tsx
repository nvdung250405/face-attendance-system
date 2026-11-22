/**
 * Hộp thoại Đổi Mật khẩu Tự nguyện (UXD-WEB-008, DD-WEB-018, SOL-WEB-006, APD-WEB-006).
 *
 * ĐẶC TẢ KỸ THUẬT:
 * 1. Mở từ menu người dùng phía trên TopHeader.
 * 2. Đo lường & hiển thị chỉ số độ mạnh mật khẩu trực quan.
 * 3. Cảnh báo rõ ràng các phiên cũ trên mọi thiết bị sẽ bị thu hồi sau khi đổi thành công.
 * 4. Không chặn điều hướng (người dùng tự do đóng hộp thoại hoặc huỷ bất kỳ lúc nào).
 */

import React, { useState, useId, useRef, useEffect, useCallback } from 'react'
import { Lock, X, Check, Eye, EyeOff } from 'lucide-react'
import { credentialService } from '@/services/credentialService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetForm = useCallback(() => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowOld(false)
    setShowNew(false)
    setShowConfirm(false)
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsLoading(false)
  }, [])

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    resetForm()
    onClose()
  }, [resetForm, onClose])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  if (!isOpen) {
    return null
  }

  const strength = calculatePasswordStrength(newPassword)

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
        currentPassword: oldPassword,
        newPassword,
      })

      setSuccessMessage(
        res.message || 'Đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được thu hồi.'
      )
      onSuccess?.()
      timerRef.current = setTimeout(() => {
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent
        data-testid="change-password-modal"
        hideCloseButton
        usePortal={false}
        className="sm:max-w-md sm:p-6"
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-brand-primary flex items-center justify-center shrink-0">
              <Lock size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle id={titleId} className="text-base font-bold text-slate-900">
                Đổi mật khẩu tài khoản
              </DialogTitle>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </DialogHeader>

        {/* Thông báo kết quả */}
        {errorMessage && (
          <div
            id="change-password-error"
            data-testid="change-password-error"
            role="alert"
            aria-live="assertive"
            className="mb-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            id="change-password-success"
            data-testid="change-password-success"
            role="status"
            aria-live="polite"
            className="mb-3.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2"
          >
            <Check size={16} strokeWidth={2.5} />
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
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng"
                className="input-base pr-11"
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? 'change-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:text-text-primary transition-colors cursor-pointer"
                aria-label={showOld ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                aria-pressed={showOld}
                aria-controls="input-old-password"
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
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
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, số"
                className="input-base pr-11"
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? 'change-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:text-text-primary transition-colors cursor-pointer"
                aria-label={showNew ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                aria-pressed={showNew}
                aria-controls="input-new-password"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Thước đo độ mạnh mật khẩu */}
            {newPassword && (
              <div data-testid="password-strength-meter" className="mt-2" role="region" aria-label="Độ mạnh mật khẩu">
                <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-text-secondary">
                  <span>Độ mạnh:</span>
                  <span
                    aria-live="polite"
                    className={`font-semibold ${
                      strength.score <= 2 ? 'text-rose-600' : strength.score === 3 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={strength.score}
                  aria-valuemin={0}
                  aria-valuemax={4}
                  aria-valuetext={strength.label}
                  className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"
                >
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
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="input-base pr-11"
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? 'change-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:text-text-primary transition-colors cursor-pointer"
                aria-label={showConfirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                aria-pressed={showConfirm}
                aria-controls="input-confirm-password"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              id="btn-cancel-change-password"
              data-testid="btn-cancel-change-password"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              id="btn-submit-change-password"
              data-testid="btn-submit-change-password"
              isLoading={isLoading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cập nhật mật khẩu
            </Button>
          </div>

          <p className="text-center text-[11px] text-slate-500 pt-1">
            <span className="font-semibold text-slate-600">Lưu ý thu hồi phiên:</span> Toàn bộ phiên đăng nhập khác sẽ được thu hồi sau khi đổi mật khẩu.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
