import React, { useState } from 'react'
import { Unlock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { PayrollPeriodResponse } from '@/types'

export interface UnlockPayrollModalProps {
  period: PayrollPeriodResponse | null
  isUnlocking: boolean
  onConfirm: (reason: string) => Promise<void> | void
  onCancel: () => void
}

interface UnlockPayrollModalContentProps {
  period: PayrollPeriodResponse
  isUnlocking: boolean
  onConfirm: (reason: string) => Promise<void> | void
  onCancel: () => void
}

const UnlockPayrollModalContent: React.FC<UnlockPayrollModalContentProps> = ({
  period,
  isUnlocking,
  onConfirm,
  onCancel,
}) => {
  const [unlockReason, setUnlockReason] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const handleConfirm = async () => {
    const trimmedReason = unlockReason.trim()
    if (!trimmedReason) {
      setUnlockError('Bắt buộc phải nhập lý do mở lại kỳ công theo quy định kiểm toán tuân thủ.')
      return
    }
    if (trimmedReason.length < 5) {
      setUnlockError('Lý do mở lại kỳ công phải có độ dài tối thiểu 5 ký tự.')
      return
    }
    try {
      await onConfirm(trimmedReason)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setUnlockError(error?.message || 'Không thể mở lại kỳ công. Vui lòng thử lại.')
    }
  }

  return (
    <DialogContent
      data-testid="unlock-payroll-modal"
      hideCloseButton
      aria-describedby="unlock-payroll-desc"
      className="w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
          <Unlock className="w-6 h-6 shrink-0" />
        </div>
        <div className="min-w-0 flex-1">
          <DialogTitle className="font-bold text-base text-slate-900 truncate">Mở Lại Kỳ Công Đã Chốt</DialogTitle>
          <span id="unlock-payroll-desc" className="text-xs text-slate-500">
            Kỳ Tháng {String(period.periodMonth).padStart(2, '0')}/{period.periodYear}
          </span>
        </div>
      </div>

      {unlockError && (
        <div
          data-testid="unlock-modal-error"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{unlockError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="unlock-reason"
          className="text-xs font-semibold text-slate-700 flex items-center justify-between"
        >
          <span>
            Lý do mở lại kỳ công <span className="text-rose-600">*</span>
          </span>
          <span className="text-2xs text-slate-400">Bắt buộc theo quy định kiểm toán</span>
        </label>
        <textarea
          id="unlock-reason"
          rows={3}
          maxLength={500}
          value={unlockReason}
          onChange={(e) => setUnlockReason(e.target.value)}
          data-testid="input-unlock-reason"
          placeholder="Ví dụ: Điều chỉnh bổ sung giờ công cho nhân viên phòng Kỹ thuật theo biên bản phê duyệt số 12/BB-NS..."
          className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
        />
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-2xs space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Quy định kiểm toán tuân thủ (DPO / Audit Log)</span>
        </div>
        <p>
          Thao tác mở lại kỳ công sẽ được hệ thống lưu vết vĩnh viễn kèm danh tính Quản trị viên và lý do giải trình.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isUnlocking}
        >
          Hủy bỏ
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          isLoading={isUnlocking}
          disabled={isUnlocking}
          data-testid="confirm-unlock-period-btn"
          leftIcon={<Unlock className="w-3.5 h-3.5 shrink-0" />}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Xác Nhận Mở Lại
        </Button>
      </div>
    </DialogContent>
  )
}

export const UnlockPayrollModal: React.FC<UnlockPayrollModalProps> = ({
  period,
  isUnlocking,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={Boolean(period)} onOpenChange={(open) => !open && !isUnlocking && onCancel()}>
      {period && (
        <UnlockPayrollModalContent
          key={period.id}
          period={period}
          isUnlocking={isUnlocking}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </Dialog>
  )
}
