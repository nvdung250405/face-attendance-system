import React, { useMemo } from 'react'
import { X, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatDateTime } from '@/utils/date'
import type { AuditLogItem } from '@/types'

interface AuditDiffModalProps {
  selectedLogDetail: AuditLogItem | null
  onClose: () => void
}

interface DiffRow {
  key: string
  oldVal: unknown
  newVal: unknown
  type: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED'
}

function parseJsonOrObject(val: unknown): Record<string, unknown> | null {
  if (!val) return null
  if (typeof val === 'object') {
    return val as Record<string, unknown>
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }
  return null
}

function formatDiffValue(val: unknown): string {
  if (val === undefined || val === null) return '—'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

export const AuditDiffModal: React.FC<AuditDiffModalProps> = ({
  selectedLogDetail,
  onClose,
}) => {
  const diffRows = useMemo<DiffRow[]>(() => {
    if (!selectedLogDetail) return []
    const oldObj = parseJsonOrObject(selectedLogDetail.oldValues)
    const newObj = parseJsonOrObject(selectedLogDetail.newValues)

    if (!oldObj && !newObj) return []

    const allKeys = Array.from(
      new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])
    )

    return allKeys.map((key) => {
      const hasOld = oldObj !== null && Object.prototype.hasOwnProperty.call(oldObj, key)
      const hasNew = newObj !== null && Object.prototype.hasOwnProperty.call(newObj, key)
      const oldVal = hasOld ? oldObj[key] : undefined
      const newVal = hasNew ? newObj[key] : undefined

      if (hasOld && !hasNew) {
        return { key, oldVal, newVal, type: 'REMOVED' }
      }
      if (!hasOld && hasNew) {
        return { key, oldVal, newVal, type: 'ADDED' }
      }
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        return { key, oldVal, newVal, type: 'MODIFIED' }
      }
      return { key, oldVal, newVal, type: 'UNCHANGED' }
    })
  }, [selectedLogDetail])

  return (
    <Dialog
      open={Boolean(selectedLogDetail)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        hideCloseButton
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
      >
        {selectedLogDetail && (
          <>
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Chi tiết Kiểm toán #{selectedLogDetail.id} ({selectedLogDetail.action})
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Đối chiếu so sánh thay đổi dữ liệu cấu hình và trạng thái hệ thống
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại"
                className="min-w-[44px] min-h-[44px] p-1.5 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="font-semibold text-slate-500 block">Thời điểm:</span>{' '}
                  <span className="font-mono text-slate-800 font-medium">
                    {formatDateTime(selectedLogDetail.createdAt || selectedLogDetail.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Người thực hiện:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedLogDetail.actorEmail || selectedLogDetail.actor || selectedLogDetail.actorUsername || '—'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Tài nguyên:</span>{' '}
                  <span className="font-mono text-slate-800 font-medium truncate block" title={selectedLogDetail.targetResource || selectedLogDetail.target || selectedLogDetail.resource || '—'}>
                    {selectedLogDetail.targetResource || selectedLogDetail.target || selectedLogDetail.resource || '—'}
                  </span>
                </div>
              </div>

              {/* Bảng đối chiếu có cấu trúc (Structured Comparison Table - BIZ-03) */}
              {diffRows.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-700">So sánh thay đổi dữ liệu (Audit Diff):</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs" data-testid="audit-diff-table">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th scope="col" className="py-2.5 px-3">Trường Dữ Liệu</th>
                          <th scope="col" className="py-2.5 px-3">Giá Trị Trước</th>
                          <th scope="col" className="py-2.5 px-3">Giá Trị Sau</th>
                          <th scope="col" className="py-2.5 px-3 text-center">Phân Loại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {diffRows.map((row) => (
                          <tr
                            key={row.key}
                            data-testid={`diff-row-${row.key}`}
                            className={
                              row.type === 'ADDED'
                                ? 'bg-emerald-50/70 hover:bg-emerald-50'
                                : row.type === 'REMOVED'
                                  ? 'bg-rose-50/70 hover:bg-rose-50'
                                  : row.type === 'MODIFIED'
                                    ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                    : 'bg-white hover:bg-slate-50/50'
                            }
                          >
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                              {row.key}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 max-w-[200px] break-all">
                              {row.type === 'REMOVED' || row.type === 'MODIFIED' ? (
                                <span className="p-1 rounded bg-rose-100/80 text-rose-800 font-medium line-through">
                                  {formatDiffValue(row.oldVal)}
                                </span>
                              ) : (
                                formatDiffValue(row.oldVal)
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-800 max-w-[200px] break-all">
                              {row.type === 'ADDED' || row.type === 'MODIFIED' ? (
                                <span className="p-1 rounded bg-emerald-100/80 text-emerald-800 font-medium">
                                  {formatDiffValue(row.newVal)}
                                </span>
                              ) : (
                                formatDiffValue(row.newVal)
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {row.type === 'ADDED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <PlusCircle size={11} className="shrink-0" />
                                  <span>Thêm mới</span>
                                </span>
                              )}
                              {row.type === 'REMOVED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                                  <MinusCircle size={11} className="shrink-0" />
                                  <span>Đã xóa</span>
                                </span>
                              )}
                              {row.type === 'MODIFIED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                  <RefreshCw size={11} className="shrink-0" />
                                  <span>Thay đổi</span>
                                </span>
                              )}
                              {row.type === 'UNCHANGED' && (
                                <span className="text-slate-400 text-2xs">Giữ nguyên</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedLogDetail.oldValues && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500">Giá trị trước thay đổi:</span>
                  <pre className="p-2.5 bg-rose-50/60 text-rose-900 border border-rose-200 rounded-lg text-xs overflow-x-auto font-mono">
                    {typeof selectedLogDetail.oldValues === 'string'
                      ? selectedLogDetail.oldValues
                      : JSON.stringify(selectedLogDetail.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLogDetail.newValues && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500">Giá trị mới cập nhật:</span>
                  <pre className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs overflow-x-auto font-mono">
                    {typeof selectedLogDetail.newValues === 'string'
                      ? selectedLogDetail.newValues
                      : JSON.stringify(selectedLogDetail.newValues, null, 2)}
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
