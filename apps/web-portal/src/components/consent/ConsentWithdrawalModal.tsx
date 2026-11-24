/**
 * ConsentWithdrawalModal: Hộp thoại Quy trình Rút Cam kết Informed Consent 2 Bước
 * (SOL-WEB-009, UXD-WEB-007, DD-WEB-015, BLD-WEB-020, TASK-WEB-026).
 *
 * Tính năng chính:
 * 1. Bước 1 - Cảnh báo 3 Hệ quả Pháp lý & Vận hành:
 *    - Ngừng nhận diện khuôn mặt tại Kiosk ngay lập tức.
 *    - Bắt buộc chấm công bằng mã PIN dự phòng.
 *    - Tiêu hủy vĩnh viễn vector đặc trưng khuôn mặt trong 7 ngày làm việc (NĐ 13/2023 & NĐ 356/2025).
 *    - Nhập lý do rút cam kết (tùy chọn).
 * 2. Bước 2 - Xác nhận rõ ràng:
 *    - Checkbox cam kết hiểu rõ hệ quả pháp lý & vận hành.
 *    - Nút thực thi rút cam kết (gọi POST /api/v1/employee/consent/withdraw).
 *    - Cập nhật AuthStore (hasBiometric: false).
 * 3. Bước 3 - Thông báo Hạn Tiêu hủy Dữ liệu (Retention Deadline 7 ngày).
 */

import React, { useState } from 'react'
import { AlertTriangle, X, AlertCircle, Check } from 'lucide-react'
import { dataSubjectService } from '@/services/dataSubjectService'
import { useAuthStore } from '@/store/authStore'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utils/date'
import type { WithdrawConsentResponse } from '@/types'

export type WithdrawalStep = 'WARNING' | 'CONFIRM' | 'SUCCESS'

export interface ConsentWithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: WithdrawConsentResponse) => void
}

const ConsentWithdrawalModalContent: React.FC<ConsentWithdrawalModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState<WithdrawalStep>('WARNING')
  const [reason, setReason] = useState('')
  const [isAgreed, setIsAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [withdrawalResult, setWithdrawalResult] = useState<WithdrawConsentResponse | null>(null)

  const handleNextToConfirm = () => {
    setErrorMessage(null)
    setStep('CONFIRM')
  }

  const handleBackToWarning = () => {
    setErrorMessage(null)
    setStep('WARNING')
  }

  const handleExecuteWithdrawal = async () => {
    if (!isAgreed || isSubmitting) return

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const result = await dataSubjectService.withdrawConsent({
        reason: reason.trim() || undefined,
      })

      // Cập nhật trạng thái người dùng trong AuthStore (hasBiometric: false)
      updateUser({ hasBiometric: false })

      setWithdrawalResult(result)
      setStep('SUCCESS')
      onSuccess?.(result)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể rút cam kết sinh trắc. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDeadline = (isoString?: string) => {
    if (!isoString) return '7 ngày làm việc kể từ thời điểm này'
    return formatDateTime(isoString)
  }

  return (
    <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle size={18} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle id="withdrawal-modal-title" className="text-base font-bold text-text-primary">
                {step === 'SUCCESS' ? 'Rút Cam Kết Thành Công' : 'Rút Lại Cam Kết Sinh Trắc Học'}
              </DialogTitle>
              <DialogDescription id="withdrawal-modal-description" className="text-xs text-text-secondary">
                {step === 'WARNING' && 'Bước 1/2: Cảnh báo hệ quả pháp lý & vận hành'}
                {step === 'CONFIRM' && 'Bước 2/2: Xác nhận hủy dữ liệu nhận diện'}
                {step === 'SUCCESS' && 'Quy trình tiêu hủy dữ liệu đã được kích hoạt'}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* CẢNH BÁO MÃ PIN DỰ PHÒNG (BIZ-04: Consent Withdrawal PIN Guard) */}
          {!user?.hasPin && (
            <div
              role="alert"
              data-testid="missing-pin-warning"
              className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <span>Cảnh báo: Bạn chưa thiết lập mã PIN dự phòng!</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Sau khi rút cam kết sinh trắc học, bạn sẽ không thể quét khuôn mặt tại Kiosk và bắt buộc phải dùng mã PIN để chấm công. Vui lòng thiết lập mã PIN dự phòng trong phần Quản lý tài khoản trước khi hoàn tất rút cam kết để tránh gián đoạn việc chấm công.
              </p>
            </div>
          )}

          {/* BƯỚC 1: CẢNH BÁO HỆ QUẢ */}
          {step === 'WARNING' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-3">
                <div className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <span>Hệ quả khi rút Informed Consent:</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-amber-900/90 list-disc list-inside">
                  <li>
                    <strong className="font-semibold">Ngừng quét mặt Kiosk:</strong> Trạm Kiosk sẽ ngừng ngay lập tức tính năng nhận diện khuôn mặt của bạn khi chấm công.
                  </li>
                  <li>
                    <strong className="font-semibold">Chuyển sang PIN dự phòng:</strong> Bạn chỉ có thể thực hiện chấm công bằng mã PIN cá nhân đã thiết lập tại trạm Kiosk.
                  </li>
                  <li>
                    <strong className="font-semibold">Tiêu hủy trong 7 ngày:</strong> Dữ liệu vector đặc trưng khuôn mặt của bạn sẽ bị tiêu hủy vĩnh viễn không thể khôi phục trong vòng 7 ngày làm việc theo Nghị định 13/2023/NĐ-CP và Nghị định 356/2025/NĐ-CP.
                  </li>
                </ul>
              </div>

              <div>
                <label htmlFor="withdrawal-reason" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Lý do rút cam kết (không bắt buộc)
                </label>
                <textarea
                  id="withdrawal-reason"
                  data-testid="withdrawal-reason-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Mong muốn chấm công bằng mã PIN, bảo vệ dữ liệu cá nhân..."
                  className="w-full p-3 text-sm bg-white border border-border-subtle rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 placeholder:text-text-muted transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* BƯỚC 2: XÁC NHẬN CHÍNH THỨC */}
          {step === 'CONFIRM' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-text-secondary text-sm space-y-2">
                <p>
                  Bạn đang chuẩn bị thực hiện việc rút cam kết sinh trắc học. Sau khi bấm xác nhận, yêu cầu của bạn sẽ được gửi lên hệ thống và kích hoạt lịch trình tiêu hủy vector khuôn mặt.
                </p>
                {reason.trim() && (
                  <p className="text-xs text-text-muted italic">
                    Lý do ghi nhận: &ldquo;{reason.trim()}&rdquo;
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="confirm-withdrawal-checkbox"
                    data-testid="confirm-withdrawal-checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-xs sm:text-sm font-medium text-amber-950 leading-snug">
                    Tôi đã đọc, hiểu rõ các hệ quả pháp lý &amp; vận hành nêu trên và đồng ý rút lại cam kết sinh trắc học.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* BƯỚC 3: THÀNH CÔNG */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-status-success mx-auto flex items-center justify-center">
                <Check size={28} strokeWidth={2.5} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">
                  Cam kết sinh trắc học đã được rút thành công
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary">
                  {withdrawalResult?.message ||
                    'Hệ thống đã ngừng kích hoạt nhận diện khuôn mặt của bạn trên toàn bộ trạm Kiosk.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Thời hạn tiêu hủy dữ liệu sinh trắc học (7 ngày):
                </div>
                <div className="text-sm font-bold text-text-primary">
                  {formatDeadline(withdrawalResult?.retentionDeadline)}
                </div>
                <p className="text-xs text-text-muted">
                  Theo quy định của Nghị định 13/2023/NĐ-CP &amp; Nghị định 356/2025/NĐ-CP, toàn bộ bản mã vector khuôn mặt của bạn sẽ được xóa vĩnh viễn trước thời hạn trên.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border-subtle bg-slate-50/50 flex items-center justify-end gap-3">
          {step === 'WARNING' && (
            <>
              <Button
                type="button"
                variant="secondary"
                data-testid="withdrawal-cancel-btn"
                onClick={onClose}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                data-testid="withdrawal-next-step-btn"
                onClick={handleNextToConfirm}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Tiếp tục
              </Button>
            </>
          )}

          {step === 'CONFIRM' && (
            <>
              <Button
                type="button"
                variant="secondary"
                data-testid="withdrawal-back-btn"
                onClick={handleBackToWarning}
                disabled={isSubmitting}
              >
                Quay lại
              </Button>
              <Button
                type="button"
                variant="destructive"
                data-testid="confirm-withdraw-submit-btn"
                onClick={handleExecuteWithdrawal}
                disabled={!isAgreed || isSubmitting}
                isLoading={isSubmitting}
              >
                Xác nhận rút cam kết
              </Button>
            </>
          )}

          {step === 'SUCCESS' && (
            <Button
              type="button"
              variant="primary"
              data-testid="withdrawal-close-success-btn"
              onClick={onClose}
            >
              Đóng
            </Button>
          )}
        </div>
      </div>
  )
}

export const ConsentWithdrawalModal: React.FC<ConsentWithdrawalModalProps> = (props) => {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) props.onClose()
      }}
    >
      <DialogContent
        data-testid="consent-withdrawal-modal"
        hideCloseButton
        aria-labelledby="withdrawal-modal-title"
        aria-describedby="withdrawal-modal-description"
        className="p-0 max-w-lg border-0 bg-transparent shadow-none"
      >
        <ConsentWithdrawalModalContent {...props} />
      </DialogContent>
    </Dialog>
  )
}

