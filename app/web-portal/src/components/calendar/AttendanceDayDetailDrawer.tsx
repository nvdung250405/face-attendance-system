/**
 * AttendanceDayDetailDrawer: Khung Drawer chi tiết ngày chấm công (3:25772, UXD-WEB-005, UI-WEB-005).
 * Trượt từ bên phải 420px hiển thị chi tiết các lượt quẹt thẻ, ca làm việc và trạng thái trong ngày.
 */

import React, { useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  FileQuestion,
  ScanFace,
  KeyRound,
  ShieldAlert,
} from 'lucide-react'
import type { PersonalAttendanceDayRecord, DayAttendanceStatus } from '@/types'

export interface AttendanceDayDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  record: PersonalAttendanceDayRecord | null
  onOpenExcuseModal?: (date: string) => void
}

export const AttendanceDayDetailDrawer: React.FC<AttendanceDayDetailDrawerProps> = ({
  isOpen,
  onClose,
  record,
  onOpenExcuseModal,
}) => {
  // Đóng Drawer khi nhấn phím Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !record) return null

  const getStatusBadge = (status: DayAttendanceStatus | string, lateMinutes = 0) => {
    switch (status) {
      case 'ON_TIME':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-status-success border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đúng giờ</span>
          </span>
        )
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Đi muộn {lateMinutes > 0 ? `(${lateMinutes} phút)` : ''}</span>
          </span>
        )
      case 'EARLY_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Về sớm</span>
          </span>
        )
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-status-danger border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Vắng mặt</span>
          </span>
        )
      case 'REST_DAY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Nghỉ tuần</span>
          </span>
        )
      case 'HOLIDAY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Calendar className="w-3.5 h-3.5" />
            <span>Nghỉ lễ</span>
          </span>
        )
      case 'EXCUSE_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Chờ duyệt giải trình</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
            {status}
          </span>
        )
    }
  }

  // Định dạng ngày theo Tiếng Việt
  const formatDisplayDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number)
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const isLateOrAbnormal =
    record.status === 'LATE' ||
    record.status === 'EARLY_LEAVE' ||
    record.status === 'ABSENT' ||
    (record.lateMinutes != null && record.lateMinutes > 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-date-title"
      data-testid="attendance-day-detail-drawer"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop mờ */}
      <div
        onClick={onClose}
        data-testid="drawer-backdrop"
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-[420px] bg-surface-card border-l border-border-subtle shadow-2xl flex flex-col justify-between transform transition-transform ease-out duration-300"
          style={{ width: '420px' }}
        >
          {/* Header Drawer */}
          <div className="px-6 py-5 border-b border-border-subtle bg-slate-50/70 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3
                  id="drawer-date-title"
                  className="text-base font-bold text-text-primary tracking-tight"
                >
                  {record.dayOfWeek ? `${record.dayOfWeek}, ` : ''}
                  {formatDisplayDate(record.date)}
                </h3>
              </div>
              <p className="text-xs text-text-secondary">Chi tiết lượt điểm danh trong ngày</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              data-testid="close-drawer-btn"
              aria-label="Đóng chi tiết ngày"
              className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nội dung chi tiết cuộn */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Trạng thái tổng quan */}
            <div className="p-4 rounded-xl bg-slate-50 border border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary block font-medium">Trạng thái công</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">
                  {record.shiftCode || 'Ca Hành Chính'}
                </span>
              </div>
              <div>{getStatusBadge(record.status, record.lateMinutes)}</div>
            </div>

            {/* Chi tiết quẹt thẻ Vào & Ra */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                Lượt ghi nhận điểm danh
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {/* Giờ vào */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">Giờ vào</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div
                    data-testid="drawer-check-in-time"
                    className="text-lg font-extrabold font-mono text-text-primary"
                  >
                    {record.checkIn || '--:--:--'}
                  </div>
                  <span className="text-2xs text-text-muted block">Bắt đầu ca</span>
                </div>

                {/* Giờ ra */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">Giờ ra</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div
                    data-testid="drawer-check-out-time"
                    className="text-lg font-extrabold font-mono text-text-primary"
                  >
                    {record.checkOut || '--:--:--'}
                  </div>
                  <span className="text-2xs text-text-muted block">Kết thúc ca</span>
                </div>
              </div>
            </div>

            {/* Thông số ca & phương thức */}
            <div className="space-y-2.5 p-4 rounded-xl border border-border-subtle bg-slate-50 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-secondary">Tổng thời gian làm việc:</span>
                <span className="font-bold text-text-primary">
                  {record.workingHours != null ? `${record.workingHours} giờ` : 'Chưa tính'}
                </span>
              </div>

              {record.lateMinutes != null && record.lateMinutes > 0 && (
                <div className="flex items-center justify-between text-amber-700">
                  <span className="font-medium">Thời gian trễ:</span>
                  <span className="font-bold">+{record.lateMinutes} phút</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-medium flex items-center gap-1.5">
                  {record.verificationMethod === 'VERIFICATION_PIN' ? (
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ScanFace className="w-3.5 h-3.5 text-brand-600" />
                  )}
                  Phương thức xác thực:
                </span>
                <span className="font-semibold text-text-primary">
                  {record.verificationMethod === 'VERIFICATION_PIN' ? 'Mã PIN' : 'Khuôn mặt (Face)'}
                </span>
              </div>

              {record.kioskId && (
                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Trạm Kiosk ghi nhận:
                  </span>
                  <span className="font-semibold text-text-primary font-mono">
                    {record.kioskId}
                  </span>
                </div>
              )}
            </div>

            {/* Cảnh báo nộp giải trình nếu đi muộn hoặc thiếu quẹt (ARC-018) */}
            {isLateOrAbnormal && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Cần giải trình công?</span>
                </div>
                <p className="text-amber-700 leading-relaxed">
                  Nếu lượt quẹt thẻ này có sự cố kỹ thuật hoặc lý do công tác hợp lệ, bạn có thể nộp
                  đơn giải trình trực tuyến trong vòng 30 ngày để HR phê duyệt điều chỉnh.
                </p>
                {onOpenExcuseModal && (
                  <button
                    type="button"
                    onClick={() => onOpenExcuseModal(record.date)}
                    data-testid="open-excuse-btn"
                    className="inline-flex items-center gap-1.5 font-bold text-amber-800 hover:text-amber-900 underline pt-1"
                  >
                    <span>Nộp đơn giải trình ngay →</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Drawer */}
          <div className="p-4 border-t border-border-subtle bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              data-testid="drawer-footer-close-btn"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-text-secondary hover:text-text-primary hover:bg-slate-200 transition-colors"
            >
              Đóng chi tiết
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
