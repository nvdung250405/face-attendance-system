import React, { useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ExcuseRequestItem } from '@/types'

export interface RejectExcuseModalProps {
  target: ExcuseRequestItem | null
  isProcessing: boolean
  error?: string | null
  onConfirm: (rejectionReason: string) => Promise<void> | void
  onCancel: () => void
}

interface RejectExcuseModalContentProps {
  target: ExcuseRequestItem
  isProcessing: boolean
  error?: string | null
  onConfirm: (rejectionReason: string) => Promise<void> | void
  onCancel: () => void
}

const RejectExcuseModalContent: React.FC<RejectExcuseModalContentProps> = ({
  target,
  isProcessing,
  error,
  onConfirm,
  onCancel,
}) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = rejectionReason.trim()
    if (!trimmed) {
      setLocalError('Vui lòng nhập lý do từ chối.')
      return
    }
    try {
      await onConfirm(trimmed)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setLocalError(errObj?.message || 'Từ chối thất bại. Vui lòng kiểm tra lại.')
    }
  }

  const displayError = error || localError

  return (
    <DialogContent className="sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-status-danger">
            <ShieldAlert className="w-5 h-5 text-status-danger" />
            <span>Từ Chối Đơn Giải Trình #{target.id}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Nhân viên:{' '}
            <span className="font-semibold text-text-primary">
              {target.fullName} ({target.employeeCode})
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 text-xs">
          {displayError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-status-danger">
              {displayError}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl space-y-1">
            <div className="font-semibold text-text-secondary">Lý do giải trình:</div>
            <p className="text-text-primary italic">{target.reason}</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="reject-reason" className="font-semibold text-text-primary">
                Lý do từ chối <span className="text-status-danger">*</span>
              </label>
              <span className="text-2xs text-text-muted">{rejectionReason.length}/500</span>
            </div>
            <textarea
              id="reject-reason"
              data-testid="reject-reason-input"
              rows={3}
              maxLength={500}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối (bắt buộc, ví dụ: Không có xác nhận quản lý, đã quá hạn...)"
              className="w-full text-xs rounded-xl border border-border-subtle p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isProcessing}
            data-testid="confirm-reject-btn"
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1"
          >
            <X className="w-4 h-4" />
            <span>Xác nhận từ chối</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export const RejectExcuseModal: React.FC<RejectExcuseModalProps> = ({
  target,
  isProcessing,
  error,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onCancel()}>
      {target && (
        <RejectExcuseModalContent
          key={target.id}
          target={target}
          isProcessing={isProcessing}
          error={error}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </Dialog>
  )
}
