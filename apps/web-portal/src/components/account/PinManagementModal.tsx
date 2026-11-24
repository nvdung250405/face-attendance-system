/**
 * Hộp thoại Thiết lập & Đặt lại Mã PIN Dự phòng (UI-WEB-008, APD-WEB-006, TASK-WEB-029).
 *
 * - Nhập mã PIN 6 số qua Bàn phím số ảo (Virtual Numeric Keypad) để phòng chống keylogger.
 * - Quy trình 2 bước: Nhập PIN -> Nhập lại để xác nhận.
 * - Hỗ trợ thiết lập lần đầu và đặt lại mã PIN (yêu cầu mật khẩu tài khoản).
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  Shield,
  Delete,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
} from 'lucide-react'
import { credentialService } from '@/services/credentialService'
import { useAuthStore } from '@/store/authStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui'
import { normalizeApiError } from '@/services/errorNormalizer'

export interface PinManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PinManagementDialog: React.FC<{
  onClose: () => void
  onSuccess?: () => void
}> = ({ onClose, onSuccess }) => {
  const { user } = useAuthStore()
  const hasExistingPin = Boolean(user?.hasPin)

  // Chế độ: 'setup' (lần đầu) | 'reset' (đã có PIN, đổi lại)
  const [step, setStep] = useState<'password' | 'enter_pin' | 'confirm_pin'>(() =>
    hasExistingPin ? 'password' : 'enter_pin'
  )

  // Dữ liệu nhập
  const [accountPassword, setAccountPassword] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      const stepTimer = stepTimerRef.current
      const closeTimer = closeTimerRef.current
      if (stepTimer) clearTimeout(stepTimer)
      if (closeTimer) clearTimeout(closeTimer)
    }
  }, [])

  const handleClose = () => {
    if (isLoading) return
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    onClose()
  }

  // Thao tác với bàn phím số ảo (Keypad click)
  const handleKeypadClick = (digit: string) => {
    if (isLoading) return
    setErrorMessage(null)
    if (step === 'enter_pin') {
      if (pin.length < 6) {
        const nextPin = pin + digit
        setPin(nextPin)
        if (nextPin.length === 6) {
          // Tự động chuyển sang bước xác nhận nhập lại
          if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
          stepTimerRef.current = setTimeout(() => {
            setStep('confirm_pin')
          }, 250)
        }
      }
    } else if (step === 'confirm_pin') {
      if (confirmPin.length < 6) {
        setConfirmPin((prev) => prev + digit)
      }
    }
  }

  const handleBackspace = () => {
    if (isLoading) return
    setErrorMessage(null)
    if (step === 'enter_pin') {
      setPin((prev) => prev.slice(0, -1))
    } else if (step === 'confirm_pin') {
      setConfirmPin((prev) => prev.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (isLoading) return
    setErrorMessage(null)
    if (step === 'enter_pin') {
      setPin('')
    } else if (step === 'confirm_pin') {
      setConfirmPin('')
    }
  }

  const handlePasswordVerified = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu tài khoản hiện tại.')
      return
    }
    setErrorMessage(null)
    setStep('enter_pin')
  }

  const handleFinalSubmit = async () => {
    setErrorMessage(null)

    if (pin.length !== 6) {
      setErrorMessage('Mã PIN phải bao gồm đúng 6 chữ số.')
      return
    }

    if (confirmPin !== pin) {
      setErrorMessage('Mã PIN xác nhận không khớp. Vui lòng nhập lại.')
      setConfirmPin('')
      return
    }

    try {
      setIsLoading(true)
      if (hasExistingPin) {
        await credentialService.resetPin({
          currentPassword: accountPassword,
          newPin: pin,
        })
      } else {
        await credentialService.setupPin({
          pin,
        })
      }

      const msg = 'Thiết lập mã PIN dự phòng thành công! Mã PIN đã có hiệu lực tại mọi trạm Kiosk.'
      toast.success(msg)
      setSuccessMessage(msg)

      // Cập nhật trạng thái hasPin vào store (ghi luôn xuống storage để không mất sau reload)
      useAuthStore.getState().updateUser({ hasPin: true })

      onSuccess?.()
      handleClose()
    } catch (err) {
      const error = normalizeApiError(err)
      setErrorMessage(error.message || 'Không thể thiết lập mã PIN. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <DialogTitle className="text-sm font-bold text-slate-900">
              {hasExistingPin ? 'Đặt Lại Mã PIN Dự Phòng' : 'Thiết Lập Mã PIN Dự Phòng'}
            </DialogTitle>
            <DialogDescription id="pin-modal-desc" className="text-xs text-slate-500 mt-0.5">
              {hasExistingPin
                ? 'Nhập mật khẩu tài khoản và mã PIN 6 số mới'
                : 'Mã PIN 6 chữ số dùng để điểm danh tại Kiosk'}
            </DialogDescription>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          aria-label="Đóng"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <X className="w-5 h-5 shrink-0" />
        </button>
      </DialogHeader>

      {/* Thông báo lỗi & thành công */}
      {errorMessage && (
        <div
          data-testid="pin-modal-error"
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2 animate-in fade-in"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          data-testid="pin-modal-success"
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Bước 0: Xác thực mật khẩu tài khoản nếu đã có PIN trước đó */}
      {step === 'password' && (
        <form onSubmit={handlePasswordVerified} className="space-y-4">
          <Input
            id="pin-verify-password-input"
            data-testid="pin-verify-password-input"
            type="password"
            label="Mật khẩu tài khoản"
            hint="Xác thực danh tính trước khi đổi mã PIN dự phòng."
            value={accountPassword}
            disabled={isLoading}
            onChange={(e) => setAccountPassword(e.target.value)}
            placeholder="Nhập mật khẩu tài khoản..."
          />

          <Button
            type="submit"
            data-testid="submit-verify-password-btn"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full py-2.5 min-h-[44px] rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-hover shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Tiếp tục</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>
        </form>
      )}

      {/* Bước 1 & Bước 2: Nhập PIN và Xác nhận qua Lưới số ảo Keypad */}
      {(step === 'enter_pin' || step === 'confirm_pin') && (
        <div className="space-y-4">
          {/* Chỉ báo bước */}
          <div className="text-center">
            <span className="text-xs font-bold text-text-primary">
              {step === 'enter_pin' ? 'Bước 1: Nhập 6 số PIN mới' : 'Bước 2: Xác nhận lại 6 số PIN'}
            </span>
          </div>

          {/* Ô hiển thị 6 chấm mã PIN (PIN Dots) */}
          <div
            data-testid="pin-dots-display"
            role="status"
            aria-live="polite"
            aria-label={`${step === 'enter_pin' ? 'Mã PIN mới' : 'Xác nhận mã PIN'}: đã nhập ${(step === 'enter_pin' ? pin : confirmPin).length} trên 6 số`}
            className="flex items-center justify-center gap-3 py-2"
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const currentVal = step === 'enter_pin' ? pin : confirmPin
              const isFilled = idx < currentVal.length
              return (
                <div
                  key={idx}
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-brand-primary scale-110 shadow-xs'
                      : 'bg-slate-200 border border-slate-300'
                  }`}
                />
              )
            })}
          </div>

          {/* Bàn phím số ảo Virtual Numeric Keypad (UI-WEB-008) */}
          <div
            data-testid="virtual-numeric-keypad"
            className="grid grid-cols-3 gap-2 pt-2 max-w-60 mx-auto"
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadClick(digit)}
                disabled={isLoading}
                data-testid={`keypad-btn-${digit}`}
                aria-label={`Số ${digit}`}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-brand-50 active:text-brand-primary border border-slate-200/80 font-mono font-bold text-base text-text-primary transition-all shadow-2xs flex items-center justify-center select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {digit}
              </button>
            ))}

            {/* Nút Xóa hết */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              data-testid="keypad-btn-clear"
              title="Xóa hết"
              aria-label="Xóa toàn bộ mã PIN"
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-text-secondary transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            {/* Số 0 */}
            <button
              type="button"
              onClick={() => handleKeypadClick('0')}
              disabled={isLoading}
              data-testid="keypad-btn-0"
              aria-label="Số 0"
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-brand-50 active:text-brand-primary border border-slate-200/80 font-mono font-bold text-base text-text-primary transition-all shadow-2xs flex items-center justify-center select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              0
            </button>

            {/* Nút Xóa 1 số */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isLoading}
              data-testid="keypad-btn-backspace"
              title="Xóa lùi"
              aria-label="Xóa lùi một số"
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-text-secondary transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <Delete className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>

          {/* Nút xác nhận hoàn tất (ở bước confirm_pin khi đủ 6 số) */}
          {step === 'confirm_pin' && (
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => {
                  setStep('enter_pin')
                  setConfirmPin('')
                }}
                className="flex-1 py-2 text-xs min-h-[44px] shrink-0"
              >
                Nhập lại từ đầu
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isLoading || confirmPin.length !== 6}
                data-testid="submit-pin-confirm-btn"
                isLoading={isLoading}
                className="flex-1 py-2 text-xs min-h-[44px] shrink-0"
              >
                Xác Nhận PIN
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const PinManagementModal: React.FC<PinManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        data-testid="pin-management-modal"
        hideCloseButton
        aria-describedby="pin-modal-desc"
        className="sm:max-w-sm sm:p-6"
      >
        <PinManagementDialog key={isOpen ? 'open' : 'closed'} onClose={onClose} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
