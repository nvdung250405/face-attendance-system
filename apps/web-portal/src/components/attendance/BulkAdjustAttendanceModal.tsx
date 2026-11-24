/**
 * BulkAdjustAttendanceModal: Hộp thoại điều chỉnh hàng loạt chấm công bởi HR/Admin
 * (BIZ-01, RFC-02, TASK-WEB-019).
 */

import React, { useState } from 'react'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button, toast } from '@/components/ui'
import { attendanceService } from '@/services/attendanceService'
import { normalizeApiError } from '@/services/errorNormalizer'
import type { AttendanceRecord, AttendanceStatus, AdjustAttendanceRequest } from '@/types'

export type BulkReasonCode = 'DEVICE_OFFLINE' | 'BIOMETRIC_MISREAD' | 'AUTHORIZED_OVERTIME'

export interface BulkAdjustAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  selectedRecords: AttendanceRecord[]
  onSuccess: () => void
}

const REASON_CODES: Array<{ code: BulkReasonCode; label: string; desc: string }> = [
  {
    code: 'DEVICE_OFFLINE',
    label: 'Thiết bị ngoại tuyến (DEVICE_OFFLINE)',
    desc: 'Trạm Kiosk mất kết nối mạng hoặc mất điện cục bộ khi nhân viên quẹt thẻ',
  },
  {
    code: 'BIOMETRIC_MISREAD',
    label: 'Sai sót sinh trắc học (BIOMETRIC_MISREAD)',
    desc: 'Hệ thống nhận diện nhầm hoặc không nhận diện được do ánh sáng / góc quét',
  },
  {
    code: 'AUTHORIZED_OVERTIME',
    label: 'Làm thêm giờ có phê duyệt (AUTHORIZED_OVERTIME)',
    desc: 'Nhân viên tăng ca theo kế hoạch sản xuất kinh doanh đã được quản lý duyệt',
  },
]

export const BulkAdjustAttendanceModal: React.FC<BulkAdjustAttendanceModalProps> = ({
  isOpen,
  onClose,
  selectedRecords,
  onSuccess,
}) => {
  const [reasonCode, setReasonCode] = useState<BulkReasonCode>('DEVICE_OFFLINE')
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('ON_TIME')
  const [justification, setJustification] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedJustification = justification.trim()
    if (!trimmedJustification) {
      setFieldErrors({ justification: 'Vui lòng nhập lý do giải trình hàng loạt.' })
      setErrorMessage('Lý do giải trình không được để trống.')
      return
    }

    if (trimmedJustification.length < 10) {
      setFieldErrors({
        justification: `Lý do giải trình phải có ít nhất 10 ký tự (hiện tại: ${trimmedJustification.length}/10).`,
      })
      setErrorMessage('Lý do giải trình phải có ít nhất 10 ký tự để phục vụ kiểm toán.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setFieldErrors({})

    const fullReason = `[${reasonCode}] ${trimmedJustification}`

    try {
      const results = await Promise.allSettled(
        selectedRecords.map((record) => {
          const payload: AdjustAttendanceRequest = {
            status: targetStatus,
            reason: fullReason,
          }
          return attendanceService.adjustAttendance(record.recordId, payload)
        })
      )

      const fulfilled = results.filter((r) => r.status === 'fulfilled')
      const rejected = results.filter((r) => r.status === 'rejected')

      if (rejected.length === 0) {
        const msg = `Điều chỉnh thành công toàn bộ ${fulfilled.length} bản ghi điểm danh!`
        toast.success(msg)
        setSuccessMessage(msg)
        onSuccess()
        onClose()
      } else {
        const firstReject = rejected[0] as PromiseRejectedResult
        const normErr = normalizeApiError(firstReject.reason)
        setErrorMessage(
          `Hoàn tất ${fulfilled.length}/${selectedRecords.length} bản ghi. Có ${rejected.length} lỗi: ${normErr.message}`
        )
        if (normErr.fieldErrors) {
          setFieldErrors(normErr.fieldErrors)
        }
      }
    } catch (err: unknown) {
      const normErr = normalizeApiError(err)
      setErrorMessage(normErr.message || 'Không thể thực hiện điều chỉnh hàng loạt.')
      if (normErr.fieldErrors) {
        setFieldErrors(normErr.fieldErrors)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={handleSubmit}
          data-testid="bulk-adjust-attendance-form"
          className="max-h-[85vh] overflow-y-auto pr-1"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
              <Users className="w-5 h-5 text-brand-primary" />
              <span>Chỉnh Sửa Điểm Danh Hàng Loạt ({selectedRecords.length} lượt quẹt)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Áp dụng điều chỉnh trạng thái và lý do chuẩn hóa cho nhiều bản ghi cùng lúc
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Thông báo kết quả */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Danh sách bản ghi đang chọn */}
            <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl space-y-1.5">
              <div className="font-semibold text-text-primary flex items-center justify-between">
                <span>Danh sách bản ghi áp dụng ({selectedRecords.length}):</span>
                <span className="text-2xs font-mono text-brand-primary font-bold">
                  {selectedRecords.map((r) => r.employeeCode).slice(0, 5).join(', ')}
                  {selectedRecords.length > 5 ? ` và ${selectedRecords.length - 5} người khác` : ''}
                </span>
              </div>
              <div className="text-2xs text-text-muted">
                Tất cả các bản ghi được chọn sẽ được cập nhật trạng thái mới kèm lý do kiểm toán.
              </div>
            </div>

            {/* Mã lý do hàng loạt (Batch Reason Code) */}
            <div className="space-y-1.5">
              <label htmlFor="bulk-reason-code" className="font-semibold text-text-primary block">
                Mã lý do điều chỉnh <span className="text-status-danger">*</span>
              </label>
              <select
                id="bulk-reason-code"
                data-testid="bulk-reason-code-select"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as BulkReasonCode)}
                disabled={isLoading}
                className="w-full text-xs rounded-xl border border-border-subtle p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {REASON_CODES.map((rc) => (
                  <option key={rc.code} value={rc.code}>
                    {rc.label}
                  </option>
                ))}
              </select>
              <p className="text-2xs text-text-muted">
                {REASON_CODES.find((rc) => rc.code === reasonCode)?.desc}
              </p>
            </div>

            {/* Trạng thái công đích */}
            <div className="space-y-1">
              <label htmlFor="bulk-target-status" className="font-semibold text-text-primary">
                Trạng thái áp dụng mới <span className="text-status-danger">*</span>
              </label>
              <select
                id="bulk-target-status"
                data-testid="bulk-target-status-select"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as AttendanceStatus)}
                disabled={isLoading}
                className="w-full text-xs rounded-xl border border-border-subtle p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="ON_TIME">Đúng giờ (ON_TIME)</option>
                <option value="OVERTIME">Tăng ca (OVERTIME)</option>
                <option value="EARLY_LEAVE">Về sớm (EARLY_LEAVE)</option>
                <option value="LATE">Đi muộn (LATE)</option>
                <option value="ANOMALOUS">Bất thường (ANOMALOUS)</option>
              </select>
            </div>

            {/* Lý do giải trình chi tiết (>= 10 ký tự) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="bulk-justification" className="font-semibold text-text-primary">
                  Lý do giải trình chi tiết <span className="text-status-danger">*</span>
                </label>
                <span className="text-2xs text-text-muted">{justification.length}/500</span>
              </div>
              <textarea
                id="bulk-justification"
                data-testid="bulk-justification-input"
                rows={3}
                maxLength={500}
                required
                value={justification}
                onChange={(e) => {
                  setJustification(e.target.value)
                  if (fieldErrors.justification) {
                    setFieldErrors((prev) => ({ ...prev, justification: '' }))
                  }
                }}
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.justification || (justification.length > 0 && justification.trim().length < 10))}
                aria-describedby={fieldErrors.justification ? 'bulk-justification-error' : undefined}
                placeholder="Nhập giải trình chi tiết cho việc điều chỉnh hàng loạt (tối thiểu 10 ký tự)..."
                className={`w-full text-xs rounded-xl border p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 ${
                  fieldErrors.justification || (justification.length > 0 && justification.trim().length < 10)
                    ? 'border-status-danger ring-1 ring-status-danger'
                    : 'border-border-subtle'
                }`}
              />
              {fieldErrors.justification && (
                <p id="bulk-justification-error" role="alert" className="text-2xs text-status-danger mt-1">
                  {fieldErrors.justification}
                </p>
              )}
              {justification.length > 0 && justification.trim().length < 10 && !fieldErrors.justification && (
                <p role="alert" className="text-2xs text-amber-700 mt-1">
                  Lý do cần tối thiểu 10 ký tự (còn thiếu {10 - justification.trim().length} ký tự).
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={justification.trim().length < 10 || selectedRecords.length === 0}
              data-testid="submit-bulk-adjust-btn"
              className="gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Áp dụng cho {selectedRecords.length} bản ghi</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
