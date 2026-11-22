import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { formatDateTime } from '@/utils/date'
import type { AuditLogItem } from '@/types'

interface AuditDiffModalProps {
  selectedLogDetail: AuditLogItem | null
  onClose: () => void
}

export const AuditDiffModal: React.FC<AuditDiffModalProps> = ({
  selectedLogDetail,
  onClose,
}) => {
  return (
    <Dialog
      open={Boolean(selectedLogDetail)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        hideCloseButton
        usePortal={false}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
      >
        {selectedLogDetail && (
          <>
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <DialogTitle className="text-base font-bold text-slate-900">
                Chi tiết Kiểm toán #{selectedLogDetail.id} ({selectedLogDetail.action})
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-500">Thời điểm:</span>{' '}
                <span className="font-mono text-slate-800">{formatDateTime(selectedLogDetail.createdAt || selectedLogDetail.timestamp)}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Người thực hiện:</span>{' '}
                <span className="font-semibold text-slate-800">{selectedLogDetail.actorEmail || selectedLogDetail.actor || selectedLogDetail.actorUsername || '—'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Tài nguyên:</span>{' '}
                <span className="font-mono text-slate-800">{selectedLogDetail.targetResource || selectedLogDetail.target || selectedLogDetail.resource || '—'}</span>
              </div>

              {selectedLogDetail.oldValues && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500">Giá trị trước thay đổi:</span>
                  <pre className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs overflow-x-auto font-mono text-slate-700">
                    {JSON.stringify(selectedLogDetail.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLogDetail.newValues && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500">Giá trị mới cập nhật:</span>
                  <pre className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedLogDetail.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Đóng
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
