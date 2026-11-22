import React, { useState } from 'react'
import { CheckCircle2, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/utils/date'
import type { ExcuseRequestItem } from '@/types'

export interface ApproveExcuseModalProps {
  target: ExcuseRequestItem | null
  isProcessing: boolean
  onConfirm: (reviewNote?: string) => Promise<void> | void
  onCancel: () => void
}

interface ApproveExcuseModalContentProps {
  target: ExcuseRequestItem
  isProcessing: boolean
  onConfirm: (reviewNote?: string) => Promise<void> | void
  onCancel: () => void
}

const ApproveExcuseModalContent: React.FC<ApproveExcuseModalContentProps> = ({
  target,
  isProcessing,
  onConfirm,
  onCancel,
}) => {
  const [reviewNote, setReviewNote] = useState('')

  const handleConfirm = () => {
    onConfirm(reviewNote.trim() || undefined)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
          <CheckCircle2 className="w-5 h-5 text-status-success" />
          <span>Phê Duyệt Đơn Giải Trình #{target.id}</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-text-secondary">
          Nhân viên:{' '}
          <span className="font-semibold text-text-primary">
            {target.fullName} ({target.employeeCode})
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2 text-xs">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
          <div className="font-semibold">Lý do giải trình của nhân viên:</div>
          <p className="text-slate-700 italic">{target.reason}</p>
          {target.requestedPunchTimestamp && (
            <div className="pt-1 text-2xs text-emerald-800 font-mono">
              Mốc giờ đề xuất: {formatDateTime(target.requestedPunchTimestamp)}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="approve-note" className="font-semibold text-text-primary">
            Ghi chú phê duyệt <span className="text-text-secondary font-normal">(tùy chọn)</span>
          </label>
          <textarea
            id="approve-note"
            data-testid="approve-note-input"
            rows={3}
            maxLength={500}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Nhập ghi chú cho nhân viên hoặc kiểm toán..."
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
          type="button"
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          isLoading={isProcessing}
          data-testid="confirm-approve-btn"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
        >
          <Check className="w-4 h-4" />
          <span>Xác nhận duyệt</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export const ApproveExcuseModal: React.FC<ApproveExcuseModalProps> = ({
  target,
  isProcessing,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onCancel()}>
      {target && (
        <ApproveExcuseModalContent
          key={target.id}
          target={target}
          isProcessing={isProcessing}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </Dialog>
  )
}
