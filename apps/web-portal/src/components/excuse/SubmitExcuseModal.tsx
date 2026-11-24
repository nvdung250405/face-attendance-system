/**
 * SubmitExcuseModal: Modal Nộp Đơn Giải Trình Công Dành Cho Nhân Viên
 * (FR-BE-014, API-BE-026, APD-BE-015, UI-WEB-005, TASK-WEB-012).
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

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
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      successTimerRef.current = setTimeout(() => {
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
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      setErrorMessage(null)
      setIsSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="pb-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Nộp Đơn Giải Trình Công</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Giải trình đi muộn, về sớm hoặc sự cố chấm công cho ngày{' '}
            <span className="font-semibold text-slate-700">{attendanceDate || 'đã chọn'}</span>.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Nộp đơn thành công!</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Đơn giải trình của bạn đã được gửi đến bộ phận HR để xem xét phê duyệt.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
            {/* Cảnh báo khi mở form tự do mà chưa chọn lượt chấm công cụ thể */}
            {!attendanceLogId && (
              <div
                data-testid="excuse-missing-log-id-notice"
                className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 leading-relaxed"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Chưa chọn lượt chấm công. Vui lòng mở form từ chi tiết ngày chấm công cụ thể để gửi đơn.
                </span>
              </div>
            )}

            {/* Thông tin lượt quẹt thu gọn thành meta badge thanh lịch */}
            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Ngày chấm công:</span>
                <span className="font-medium text-slate-900">{attendanceDate || 'Hôm nay'}</span>
              </div>
              {currentPunchTime && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">Giờ ghi nhận:</span>
                  <span className="font-mono font-semibold text-amber-700">{currentPunchTime}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex items-center gap-1">
                <span>* Chỉ tiếp nhận đơn giải trình trong vòng 30 ngày kể từ ngày chấm công.</span>
              </div>
            </div>

            {errorMessage && (
              <div
                id="excuse-error-message"
                role="alert"
                aria-live="assertive"
                className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
              >
                {errorMessage}
              </div>
            )}

            {/* Lý do giải trình */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="excuse-reason" className="text-xs font-semibold text-slate-800">
                  Lý do giải trình <span className="text-status-danger">*</span>
                </Label>
                <span className="text-[11px] font-mono text-slate-400">{reason.length}/500</span>
              </div>
              <textarea
                id="excuse-reason"
                data-testid="excuse-reason-input"
                rows={3}
                maxLength={500}
                required
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? 'excuse-error-message' : undefined}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Kẹt xe, máy chấm công không nhận diện, đi công tác đột xuất..."
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Giờ đề xuất điều chỉnh */}
            <Input
              id="excuse-punch-time"
              data-testid="excuse-punch-time-input"
              type="datetime-local"
              label={
                <>
                  Thời gian đề xuất điều chỉnh <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </>
              }
              hint="Nếu để trống, HR sẽ xem xét theo ca làm việc đã đăng ký."
              value={requestedPunchTimestamp}
              onChange={(e) => setRequestedPunchTimestamp(e.target.value)}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleModalClose}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
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
