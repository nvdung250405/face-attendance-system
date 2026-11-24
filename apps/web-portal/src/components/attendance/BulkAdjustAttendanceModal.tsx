/**
 * BulkAdjustAttendanceModal: Hộp thoại điều chỉnh hàng loạt chấm công bởi HR/Admin
 * (BIZ-01, RFC-02, TASK-WEB-019, F-SPEC-01).
 *
 * Tính năng chính:
 * - Xử lý theo lô băm nhỏ kiểm soát tải (throttled chunks of 3).
 * - Theo dõi tiến độ từng lô (progress tracking).
 * - Tách biệt kết quả thành công và thất bại theo từng bản ghi.
 * - Khi có thất bại cục bộ: hiển thị chi tiết lý do lỗi từng bản ghi và tự động loại bỏ các bản ghi đã thành công để người dùng chỉ cần thử lại các bản ghi lỗi.
 */

import React, { useState, useEffect, useRef } from 'react'
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

export interface FailedRecordItem {
  record: AttendanceRecord
  reason: string
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
  const [currentRecords, setCurrentRecords] = useState<AttendanceRecord[]>(selectedRecords)
  const [failedItems, setFailedItems] = useState<FailedRecordItem[]>([])
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const [reasonCode, setReasonCode] = useState<BulkReasonCode>('DEVICE_OFFLINE')
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('ON_TIME')
  const [justification, setJustification] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const prevIsOpenRef = useRef<boolean>(false)

  // Chỉ khởi tạo currentRecords khi modal chuyển từ đóng sang mở (F-SPEC-01)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setCurrentRecords(selectedRecords)
      setFailedItems([])
      setProgress(null)
      setErrorMessage(null)
      setSuccessMessage(null)
      setFieldErrors({})
    }
    prevIsOpenRef.current = isOpen
  }, [selectedRecords, isOpen])

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
    setSuccessMessage(null)

    const fullReason = `[${reasonCode}] ${trimmedJustification}`
    const recordsToProcess = [...currentRecords]
    const succeededIds: number[] = []
    const newFailedItems: FailedRecordItem[] = []

    setProgress({ current: 0, total: recordsToProcess.length })

    // Xử lý theo lô phân đoạn (throttled chunks of 3 - F-SPEC-01)
    const chunkSize = 3
    try {
      for (let i = 0; i < recordsToProcess.length; i += chunkSize) {
        const chunk = recordsToProcess.slice(i, i + chunkSize)
        const chunkResults = await Promise.allSettled(
          chunk.map(async (record) => {
            const payload: AdjustAttendanceRequest = {
              status: targetStatus,
              reason: fullReason,
            }
            await attendanceService.adjustAttendance(record.recordId, payload)
            return record
          })
        )

        chunkResults.forEach((res, idx) => {
          const record = chunk[idx]
          if (res.status === 'fulfilled') {
            succeededIds.push(record.recordId)
          } else {
            const normErr = normalizeApiError(res.reason)
            newFailedItems.push({
              record,
              reason: normErr.message || 'Lỗi không xác định khi điều chỉnh bản ghi',
            })
          }
        })

        setProgress({
          current: Math.min(i + chunkSize, recordsToProcess.length),
          total: recordsToProcess.length,
        })
      }

      if (newFailedItems.length === 0) {
        const msg = `Điều chỉnh thành công toàn bộ ${succeededIds.length} bản ghi điểm danh!`
        toast.success(msg)
        setSuccessMessage(msg)
        setFailedItems([])
        onSuccess()
        onClose()
      } else {
        // Có lỗi cục bộ: cập nhật lại currentRecords chỉ gồm các bản ghi chưa thành công
        const remainingRecords = recordsToProcess.filter((r) => !succeededIds.includes(r.recordId))
        setCurrentRecords(remainingRecords)
        setFailedItems(newFailedItems)
        if (succeededIds.length > 0) {
          onSuccess()
        }
        const partialMsg = `Đã điều chỉnh thành công ${succeededIds.length}/${recordsToProcess.length} bản ghi. Còn ${newFailedItems.length} bản ghi bị lỗi, vui lòng kiểm tra và thử lại.`
        setErrorMessage(partialMsg)
        toast.warning(partialMsg)
      }
    } catch (err: unknown) {
      const normErr = normalizeApiError(err)
      setErrorMessage(normErr.message || 'Không thể thực hiện điều chỉnh hàng loạt.')
      if (normErr.fieldErrors) {
        setFieldErrors(normErr.fieldErrors)
      }
    } finally {
      setIsLoading(false)
      setProgress(null)
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
              <span>Chỉnh Sửa Điểm Danh Hàng Loạt ({currentRecords.length} lượt quẹt)</span>
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

            {/* Tiến trình xử lý theo lô (F-SPEC-01) */}
            {isLoading && progress && (
              <div data-testid="bulk-adjust-progress-bar" className="space-y-1">
                <div className="flex justify-between text-2xs text-slate-500 font-medium">
                  <span>Đang xử lý theo từng lô...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Chi tiết bản ghi lỗi cục bộ nếu có (F-SPEC-01) */}
            {failedItems.length > 0 && (
              <div
                data-testid="bulk-failed-records-breakdown"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2"
              >
                <div className="font-semibold text-rose-800 flex items-center justify-between">
                  <span>Danh sách bản ghi thất bại ({failedItems.length}):</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-rose-100 pr-1">
                  {failedItems.map(({ record, reason }) => (
                    <div
                      key={record.recordId}
                      data-testid={`failed-record-item-${record.recordId}`}
                      className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 text-2xs"
                    >
                      <div>
                        <span className="font-semibold text-rose-900">{record.fullName}</span>{' '}
                        <span className="font-mono text-rose-700">({record.employeeCode})</span>
                      </div>
                      <span className="text-rose-600 text-right">{reason}</span>
                    </div>
                  ))}
                </div>
                <p className="text-2xs text-rose-700 italic">
                  Các bản ghi đã điều chỉnh thành công đã được loại bỏ. Bạn có thể kiểm tra lại thông tin và bấm gửi lại để thử lại cho các bản ghi lỗi.
                </p>
              </div>
            )}

            {/* Danh sách bản ghi đang chọn */}
            <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl space-y-1.5">
              <div className="font-semibold text-text-primary flex items-center justify-between">
                <span>Danh sách bản ghi áp dụng ({currentRecords.length}):</span>
                <span className="text-2xs font-mono text-brand-primary font-bold">
                  {currentRecords.map((r) => r.employeeCode).slice(0, 5).join(', ')}
                  {currentRecords.length > 5 ? ` và ${currentRecords.length - 5} người khác` : ''}
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
              disabled={justification.trim().length < 10 || currentRecords.length === 0}
              data-testid="submit-bulk-adjust-btn"
              className="gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Áp dụng cho {currentRecords.length} bản ghi</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
