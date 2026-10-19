/**
 * SubmitExcuseModal: Modal Nộp Đơn Giải Trình Công Dành Cho Nhân Viên
 * (FR-BE-014, API-BE-026, APD-BE-015, UI-WEB-005, TASK-WEB-012).
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/common'
import { excuseService } from '@/services/excuseService'
import { AlertTriangle, Clock, Send, CheckCircle2 } from 'lucide-react'

export interface SubmitExcuseModalProps {
  isOpen: boolean
  onClose: () => void
  attendanceLogId?: number
  attendanceDate?: string
  currentPunchTime?: string
  onSuccess?: () => void
}

export const SubmitExcuseModal: React.FC<SubmitExcuseModalProps> = ({
  isOpen,
  onClose,
  attendanceLogId,
  attendanceDate,
  currentPunchTime,
  onSuccess,
}) => {
  const [reason, setReason] = useState('')
  const [requestedPunchTimestamp, setRequestedPunchTimestamp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceLogId) {
      setErrorMessage('Không xác định được lượt chấm công cần giải trình.')
      return
    }

    if (!reason.trim()) {
      setErrorMessage('Vui lòng nhập lý do giải trình.')
      return
    }

    if (reason.length > 500) {
      setErrorMessage('Lý do giải trình không được vượt quá 500 ký tự.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      let formattedTimestamp: string | undefined = undefined
      if (requestedPunchTimestamp) {
        // Chuyển sang định dạng ISO-8601
        formattedTimestamp = new Date(requestedPunchTimestamp).toISOString()
      }

      await excuseService.submitExcuseRequest({
        attendanceLogId,
        reason: reason.trim(),
        requestedPunchTimestamp: formattedTimestamp,
      })

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setReason('')
        setRequestedPunchTimestamp('')
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Không thể gửi đơn giải trình. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    if (!isSubmitting) {
      setErrorMessage(null)
      setIsSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
            <Clock className="w-5 h-5 text-brand-primary" />
            <span>Nộp Đơn Giải Trình Công</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Giải trình đi muộn, về sớm hoặc sự cố chấm công cho ngày{' '}
            <span className="font-semibold text-text-primary">{attendanceDate || 'đã chọn'}</span>.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-status-success flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Nộp đơn thành công!</h3>
            <p className="text-xs text-text-secondary max-w-xs">
              Đơn giải trình của bạn đã được chuyển đến bộ phận HR để xem xét phê duyệt.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Cảnh báo khi không xác định được lượt chấm công cần giải trình */}
            {!attendanceLogId && (
              <div
                data-testid="excuse-missing-log-id-notice"
                className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>Không xác định được lượt chấm công cần giải trình. Vui lòng mở đơn từ chi tiết ngày chấm công cụ thể.</span>
              </div>
            )}

            {/* Thông tin lượt quẹt */}
            <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-secondary">Ngày chấm công:</span>
                <span className="font-semibold text-text-primary">{attendanceDate || 'Hôm nay'}</span>
              </div>
              {currentPunchTime && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Giờ quẹt ghi nhận:</span>
                  <span className="font-mono font-bold text-amber-700">{currentPunchTime}</span>
                </div>
              )}
              <div className="flex items-start gap-1.5 text-2xs text-text-muted pt-1 border-t border-slate-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Quy định: Chỉ tiếp nhận đơn giải trình trong vòng 30 ngày kể từ ngày chấm công.</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-status-danger text-xs">
                {errorMessage}
              </div>
            )}

            {/* Lý do giải trình */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="excuse-reason" className="text-xs font-semibold text-text-primary">
                  Lý do giải trình <span className="text-status-danger">*</span>
                </label>
                <span className="text-2xs text-text-muted">{reason.length}/500</span>
              </div>
              <textarea
                id="excuse-reason"
                data-testid="excuse-reason-input"
                rows={4}
                maxLength={500}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập chi tiết lý do (ví dụ: Sự cố kẹt xe đường Nguyễn Trãi, thiết bị Kiosk bảo trì, đi công tác khẩn cấp...)"
                className="w-full text-xs rounded-xl border border-border-subtle p-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Giờ đề xuất điều chỉnh */}
            <div className="space-y-1.5">
              <label htmlFor="excuse-punch-time" className="text-xs font-semibold text-text-primary">
                Thời gian đề xuất điều chỉnh <span className="text-text-muted font-normal">(tùy chọn)</span>
              </label>
              <input
                id="excuse-punch-time"
                data-testid="excuse-punch-time-input"
                type="datetime-local"
                value={requestedPunchTimestamp}
                onChange={(e) => setRequestedPunchTimestamp(e.target.value)}
                className="w-full text-xs rounded-xl border border-border-subtle p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <span className="text-2xs text-text-muted block">
                Nếu không điền, HR sẽ xem xét theo ca làm việc đã đăng ký.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleModalClose}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                disabled={!attendanceLogId || isSubmitting}
                data-testid="submit-excuse-btn"
                className="gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi đơn</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
