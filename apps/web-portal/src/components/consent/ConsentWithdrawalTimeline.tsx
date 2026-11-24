/**
 * ConsentWithdrawalTimeline: Lộ trình Xử lý Rút Cam kết & Tiêu hủy Sinh trắc
 * (SOL-WEB-009, UXD-WEB-007, DD-WEB-015, TASK-WEB-026).
 *
 * Tuân thủ Nghị định 13/2023/NĐ-CP và Nghị định 356/2025/NĐ-CP:
 * - Hiển thị mốc thời gian rút cam kết
 * - Trực quan hóa hành động ngừng nhận diện khuôn mặt Kiosk tức thì
 * - Huy hiệu đếm ngược thời hạn tiêu hủy sinh trắc luật định (tối đa 20 ngày)
 * - Đảm bảo khả năng tiếp cận WCAG 2.1/2.2 AA (semantic structure, ARIA landmarks, high contrast)
 */

import React from 'react'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react'
import { formatDateTime } from '@/utils/date'
import type { WithdrawConsentResponse } from '@/types'

export interface ConsentWithdrawalTimelineProps {
  withdrawal: WithdrawConsentResponse
  className?: string
  onRefresh?: () => void
}

/**
 * Tính số ngày còn lại đến hạn tiêu hủy sinh trắc luật định (20 ngày theo Nghị định 356/2025/NĐ-CP)
 */
function calculateDaysRemaining(deadlineIso?: string | null): {
  days: number
  isExpired: boolean
  isToday: boolean
} {
  if (!deadlineIso) return { days: 20, isExpired: false, isToday: false }
  try {
    const deadline = new Date(deadlineIso)
    const now = new Date()
    // Chuẩn hóa theo ngày để tính chính xác
    const diffMs = deadline.getTime() - now.getTime()
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return {
      days,
      isExpired: days < 0,
      isToday: days === 0,
    }
  } catch {
    return { days: 20, isExpired: false, isToday: false }
  }
}

export const ConsentWithdrawalTimeline: React.FC<ConsentWithdrawalTimelineProps> = ({
  withdrawal,
  className = '',
  onRefresh,
}) => {
  const deadlineStr = withdrawal.biometricDisposalDueAt || withdrawal.retentionDeadline
  const { days, isExpired, isToday } = calculateDaysRemaining(deadlineStr)
  const isDisposed = withdrawal.status === 'DISPOSED' || withdrawal.status === 'COMPLETED'

  // Render badge trạng thái tổng quan
  const renderStatusBadge = () => {
    if (isDisposed) {
      return (
        <span
          data-testid="withdrawal-status-badge"
          className="badge-success inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shrink-0"
        >
          <ShieldCheck size={14} className="shrink-0" />
          <span>ĐÃ TIÊU HỦY DỮ LIỆU</span>
        </span>
      )
    }

    if (withdrawal.status === 'CANCELLED') {
      return (
        <span
          data-testid="withdrawal-status-badge"
          className="badge-neutral inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shrink-0"
        >
          <span>ĐÃ HỦY YÊU CẦU</span>
        </span>
      )
    }

    return (
      <span
        data-testid="withdrawal-status-badge"
        className="badge-warning inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shrink-0"
      >
        <Clock size={14} className="shrink-0" />
        <span>ĐANG CHỜ TIÊU HỦY</span>
      </span>
    )
  }

  // Render badge đếm ngược luật định (Statutory 20-Day Disposal Countdown Badge)
  const renderCountdownBadge = () => {
    if (isDisposed) {
      return (
        <span
          data-testid="disposal-countdown-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0"
        >
          <CheckCircle2 size={14} className="shrink-0" />
          <span>Đã hoàn tất tiêu hủy an toàn</span>
        </span>
      )
    }

    if (isExpired) {
      return (
        <span
          data-testid="disposal-countdown-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0"
        >
          <AlertTriangle size={14} className="shrink-0" />
          <span>Quá hạn tiêu hủy ({Math.abs(days)} ngày)</span>
        </span>
      )
    }

    if (isToday) {
      return (
        <span
          data-testid="disposal-countdown-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shrink-0"
        >
          <Clock size={14} className="shrink-0" />
          <span>Hạn chót tiêu hủy hôm nay</span>
        </span>
      )
    }

    return (
      <span
        data-testid="disposal-countdown-badge"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0"
      >
        <Clock size={14} className="shrink-0" />
        <span>Còn {days} ngày đến hạn tiêu hủy (NĐ 356/2025)</span>
      </span>
    )
  }

  return (
    <section
      role="region"
      aria-label="Lộ trình rút cam kết và tiêu hủy sinh trắc học"
      data-testid="consent-withdrawal-timeline"
      className={`card-surface p-6 space-y-6 ${className}`}
    >
      {/* ── Tiêu đề & Badges ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold text-text-primary">
              Lộ trình Xử lý Rút Cam kết &amp; Tiêu hủy Sinh trắc
            </h2>
            {renderStatusBadge()}
          </div>
          <p className="text-xs text-text-muted">
            Quy trình tuân thủ bảo vệ quyền chủ thể dữ liệu theo Nghị định 13/2023/NĐ-CP &amp; Nghị định 356/2025/NĐ-CP
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {renderCountdownBadge()}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Cập nhật tiến trình rút cam kết"
              title="Làm mới trạng thái tiến trình"
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer shrink-0"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Visual Timeline List ── */}
      <ol
        role="list"
        className="relative border-l-2 border-indigo-200 ml-4 space-y-6 pl-6 text-left"
      >
        {/* Mốc 1: Tiếp nhận yêu cầu rút cam kết */}
        <li role="listitem" className="relative group">
          <span
            className="absolute -left-[33px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white"
            aria-hidden="true"
          >
            <CheckCircle2 size={16} strokeWidth={2.5} />
          </span>

          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-text-primary">
                1. Tiếp nhận &amp; Ghi nhận rút Informed Consent
              </h3>
              <time
                dateTime={withdrawal.withdrawnAt}
                className="text-xs font-mono font-medium text-text-muted"
                data-testid="timeline-withdrawn-date"
              >
                {formatDateTime(withdrawal.withdrawnAt)}
              </time>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Yêu cầu rút lại cam kết bảo vệ dữ liệu đã được ghi nhận vào nhật ký kiểm toán bất biến (Audit Log) theo tiêu chuẩn bảo mật.
            </p>
            {withdrawal.reason && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Lý do rút: </span>
                <span>{withdrawal.reason}</span>
              </div>
            )}
          </div>
        </li>

        {/* Mốc 2: Vô hiệu hóa sinh trắc tại Kiosk & Chuyển sang PIN */}
        <li role="listitem" className="relative group">
          <span
            className="absolute -left-[33px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-brand-primary ring-4 ring-white"
            aria-hidden="true"
          >
            <ShieldAlert size={16} strokeWidth={2.5} />
          </span>

          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-text-primary">
                2. Vô hiệu hóa nhận diện Kiosk &amp; Chuyển sang PIN dự phòng
              </h3>
              <span className="badge-info text-2xs font-semibold shrink-0">
                Hiệu lực ngay lập tức
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Vector đặc trưng khuôn mặt của bạn đã bị loại khỏi bộ nhớ RAM và thư viện nhận diện tại toàn bộ trạm Kiosk. Bạn chuyển sang sử dụng mã PIN 6 số để điểm danh.
            </p>
          </div>
        </li>

        {/* Mốc 3: Hạn tiêu hủy sinh trắc học luật định 20 ngày */}
        <li role="listitem" className="relative group">
          <span
            className={`absolute -left-[33px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
              isDisposed
                ? 'bg-emerald-100 text-emerald-600'
                : isExpired
                ? 'bg-rose-100 text-rose-600'
                : 'bg-amber-100 text-amber-600'
            }`}
            aria-hidden="true"
          >
            {isDisposed ? (
              <ShieldCheck size={16} strokeWidth={2.5} />
            ) : (
              <Trash2 size={16} strokeWidth={2.5} />
            )}
          </span>

          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>3. Tiêu hủy vĩnh viễn vector sinh trắc học trong CSDL</span>
                <span className="badge-neutral text-2xs font-normal shrink-0">
                  Nghị định 356/2025/NĐ-CP
                </span>
              </h3>
              <time
                dateTime={deadlineStr || undefined}
                className="text-xs font-mono font-semibold text-text-primary"
                data-testid="timeline-deadline-date"
              >
                {deadlineStr ? formatDateTime(deadlineStr) : 'Trong vòng 20 ngày'}
              </time>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {isDisposed
                ? 'Dữ liệu vector ArcFace 512D mã hóa AES-256-GCM đã được tiêu hủy vĩnh viễn khỏi CSDL trung tâm, đảm bảo quyền riêng tư tuyệt đối.'
                : 'Tiến trình tự động theo lịch định kỳ sẽ xóa vĩnh viễn toàn bộ vector khuôn mặt 512D ArcFace trước thời hạn luật định 20 ngày.'}
            </p>
          </div>
        </li>
      </ol>

      {/* ── Thông tin hướng dẫn bổ trợ ── */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-text-secondary">
        <Info size={16} className="text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-text-primary">
            Cần kích hoạt lại tính năng nhận diện khuôn mặt?
          </p>
          <p>
            Bạn có thể đăng ký lại cam kết Informed Consent bất cứ lúc nào tại màn hình này để nhận mã kích hoạt quét mặt tại trạm Kiosk.
          </p>
        </div>
      </div>
    </section>
  )
}
