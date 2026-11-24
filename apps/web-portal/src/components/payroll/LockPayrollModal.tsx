import React from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { PayrollPeriodResponse } from '@/types'

export interface LockPayrollModalProps {
  period: PayrollPeriodResponse | null
  isLocking: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const LockPayrollModal: React.FC<LockPayrollModalProps> = ({
  period,
  isLocking,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={Boolean(period)} onOpenChange={(open) => !open && !isLocking && onCancel()}>
      <DialogContent
        data-testid="lock-payroll-modal"
        hideCloseButton
        aria-describedby="lock-payroll-desc"
        className="w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto"
      >
        {period && (
          <>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <Lock className="w-6 h-6 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-bold text-base text-slate-900 truncate">Xác Nhận Chốt Kỳ Công</DialogTitle>
                <span id="lock-payroll-desc" className="text-xs text-slate-500">
                  Kỳ Tháng {String(period.periodMonth).padStart(2, '0')}/{period.periodYear}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 leading-relaxed">
              <p className="font-bold">Cảnh báo hệ quả quan trọng:</p>
              <ul className="list-disc list-inside space-y-1 text-2xs text-amber-800">
                <li>Bảng chấm công và số liệu kỳ này sẽ chính thức bị đóng băng.</li>
                <li>Toàn bộ chức năng duyệt đơn giải trình, phân ca và điều chỉnh công sẽ bị khóa.</li>
                <li>Hành động mở lại kỳ sau này sẽ được ghi nhận vào nhật ký kiểm toán bảo mật.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onCancel}
                disabled={isLocking}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onConfirm}
                isLoading={isLocking}
                disabled={isLocking}
                data-testid="confirm-lock-period-btn"
                leftIcon={<Lock className="w-3.5 h-3.5 shrink-0" />}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Xác Nhận Chốt Kỳ
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
