/**
 * AdjustAttendanceModal: Hộp thoại điều chỉnh giờ công & trạng thái điểm danh thủ công bởi HR/Admin
 * (FR-BE-008, API-BE-048, API-WEB-021, SOL-BE-007, DD-BE-002, TASK-WEB-019).
 */

import React, { useState, useEffect } from 'react'
import {
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  Lock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/common'
import { attendanceService } from '@/services/attendanceService'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import type { AttendanceRecord, AttendanceStatus, AdjustAttendanceRequest } from '@/types'

export interface AdjustAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  record: AttendanceRecord | null
  onSuccess: () => void
}

export const AdjustAttendanceModal: React.FC<AdjustAttendanceModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
}) => {
  const { periods } = usePayrollPeriodStore()

  // Form states
  const [punchDateTime, setPunchDateTime] = useState<string>('')
  const [status, setStatus] = useState<AttendanceStatus>('ON_TIME')
  const [lateMinutes, setLateMinutes] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Khởi tạo giá trị khi mở modal với record tương ứng
  useEffect(() => {
    if (record) {
      // Chuyển ISO string sang định dạng YYYY-MM-DDTHH:mm cho datetime-local input
      try {
        const d = new Date(record.punchTimestamp)
        const pad = (n: number) => n.toString().padStart(2, '0')
        const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        setPunchDateTime(localIso)
      } catch {
        setPunchDateTime('')
      }
      setStatus(record.status || 'ON_TIME')
      setLateMinutes(record.lateMinutes || 0)
      setReason('')
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [record])

  // Kiểm tra xem kỳ công chứa ngày này có đang bị LOCKED không
  const isDateLocked = React.useMemo(() => {
    if (!record?.punchTimestamp) return false
    try {
      const d = new Date(record.punchTimestamp)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const matched = periods.find(
        (p) => p.periodYear === year && p.periodMonth === month
      )
      return matched?.status === 'LOCKED'
    } catch {
      return false
    }
  }, [record, periods])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    if (!reason.trim()) {
      setErrorMessage('Vui lòng nhập lý do điều chỉnh công (bắt buộc để lưu kiểm toán).')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Chuẩn hóa timestamp sang ISO nếu có thay đổi
      let isoTimestamp: string | undefined = undefined
      if (punchDateTime) {
        isoTimestamp = new Date(punchDateTime).toISOString()
      }

      const payload: AdjustAttendanceRequest = {
        punchTimestamp: isoTimestamp,
        status,
        lateMinutes: status === 'LATE' ? Number(lateMinutes) : 0,
        reason: reason.trim(),
      }

      await attendanceService.adjustAttendance(record.recordId, payload)
      setSuccessMessage('Điều chỉnh giờ công thành công!')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(
        errorObj.message || 'Không thể điều chỉnh bản ghi. Vui lòng kiểm tra lại.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!record) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} data-testid="adjust-attendance-form">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
              <Edit3 className="w-5 h-5 text-brand-primary" />
              <span>Điều Chỉnh Giờ Công #{record.recordId}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Thay đổi mốc giờ quẹt thẻ, trạng thái và lưu vết kiểm toán (Audit Trail)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Thông báo thành công / lỗi */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Cảnh báo nếu kỳ công đã bị khóa */}
            {isDateLocked && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Kỳ công của ngày này đã bị CHỐT (LOCKED)</div>
                  <div className="text-2xs text-amber-700 mt-0.5">
                    Không thể điều chỉnh giờ công khi kỳ lương đã được khóa an toàn.
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin nhân viên */}
            <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-text-muted shrink-0" />
                <div>
                  <div className="font-bold text-text-primary">{record.fullName}</div>
                  <div className="text-2xs font-mono text-brand-primary">{record.employeeCode}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                <div>
                  <div className="text-text-secondary">{record.department || 'Chưa phân bổ'}</div>
                  <div className="text-2xs text-text-muted">
                    Loại: <span className="font-semibold">{record.punchType === 'CHECK_IN' ? 'VÀO CA' : 'RA CA'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mốc thời gian quẹt */}
            <div className="space-y-1">
              <label htmlFor="punch-datetime" className="font-semibold text-text-primary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-text-muted" />
                <span>Mốc thời gian quẹt thẻ</span>
              </label>
              <input
                id="punch-datetime"
                data-testid="punch-datetime-input"
                type="datetime-local"
                value={punchDateTime}
                onChange={(e) => setPunchDateTime(e.target.value)}
                disabled={isDateLocked || isLoading}
                className="w-full text-xs rounded-xl border border-border-subtle p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
              />
            </div>

            {/* Trạng thái công & Số phút trễ */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="adjust-status" className="font-semibold text-text-primary">
                  Trạng thái công <span className="text-status-danger">*</span>
                </label>
                <select
                  id="adjust-status"
                  data-testid="adjust-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                  disabled={isDateLocked || isLoading}
                  className="w-full text-xs rounded-xl border border-border-subtle p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
                >
                  <option value="ON_TIME">Đúng giờ (ON_TIME)</option>
                  <option value="LATE">Đi muộn (LATE)</option>
                  <option value="EARLY_LEAVE">Về sớm (EARLY_LEAVE)</option>
                  <option value="OVERTIME">Tăng ca (OVERTIME)</option>
                  <option value="ANOMALOUS">Bất thường (ANOMALOUS)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="late-minutes" className="font-semibold text-text-primary">
                  Số phút trễ
                </label>
                <input
                  id="late-minutes"
                  data-testid="late-minutes-input"
                  type="number"
                  min="0"
                  max="1440"
                  value={lateMinutes}
                  onChange={(e) => setLateMinutes(Number(e.target.value))}
                  disabled={status !== 'LATE' || isDateLocked || isLoading}
                  className="w-full text-xs rounded-xl border border-border-subtle p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Lý do điều chỉnh (Audit Trail) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="adjust-reason" className="font-semibold text-text-primary">
                  Lý do điều chỉnh <span className="text-status-danger">*</span>
                </label>
                <span className="text-2xs text-text-muted">{reason.length}/500</span>
              </div>
              <textarea
                id="adjust-reason"
                data-testid="adjust-reason-input"
                rows={3}
                maxLength={500}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isDateLocked || isLoading}
                placeholder="Nhập lý do điều chỉnh giờ công (bắt buộc để phục vụ kiểm toán)..."
                className="w-full text-xs rounded-xl border border-border-subtle p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
              />
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
              disabled={isDateLocked || !reason.trim()}
              data-testid="submit-adjust-btn"
              className="gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận điều chỉnh</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
