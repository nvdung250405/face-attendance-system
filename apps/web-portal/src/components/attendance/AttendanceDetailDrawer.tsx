/**
 * AttendanceDetailDrawer: Slide-over right drawer (480px - 560px)
 * Hiển thị chi tiết bản ghi chấm công (Master-Detail Pattern):
 * - Mã Kiosk, Phương thức xác thực (ARCFACE_512D / PIN / MANUAL_HR)
 * - Điểm tin cậy (confidenceScore) & Liveness
 * - Đối chiếu thời gian Raw UTC vs Localized (GMT+7)
 * - Số phút làm thêm giờ (overtimeMinutes) & Đi muộn (lateMinutes)
 * - Nhật ký điều chỉnh (Adjustment Audit Trail)
 * (eval-web-ui-inventory-20261124-155500.md).
 */

import React from 'react'
import {
  Clock,
  User,
  ScanFace,
  Lock,
  UserCheck,
  Edit3,
  ShieldCheck,
  History,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  AlertTriangle,
  ArrowRightLeft,
} from 'lucide-react'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { AttendanceStatusBadge } from '@/components/attendance/AttendanceStatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatRelativeTime } from '@/utils/date'
import type { AttendanceRecord, AttendanceStatus, VerificationMethod } from '@/types'

export interface AttendanceRecordDetail extends AttendanceRecord {
  readonly confidenceScore?: number
  readonly overtimeMinutes?: number
  readonly rawUtcTimestamp?: string
  readonly offlineSynced?: boolean
  readonly adjustmentNote?: string
  readonly adjustedBy?: string
  readonly adjustedAt?: string
  readonly previousStatus?: AttendanceStatus
  readonly previousTimestamp?: string
}

export interface AttendanceDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  record: AttendanceRecord | AttendanceRecordDetail | null
  onAdjust?: (record: AttendanceRecord) => void
  onNavigatePrev?: () => void
  onNavigateNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

function formatRawUtc(punchTimestamp?: string, rawUtcTimestamp?: string): string {
  if (!punchTimestamp) return '—'
  if (rawUtcTimestamp) return rawUtcTimestamp
  try {
    return new Date(punchTimestamp).toISOString()
  } catch {
    return punchTimestamp
  }
}

export const AttendanceDetailDrawer: React.FC<AttendanceDetailDrawerProps> = ({
  isOpen,
  onClose,
  record,
  onAdjust,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const detail = record as AttendanceRecordDetail | null
  const rawUtcString = formatRawUtc(detail?.punchTimestamp, detail?.rawUtcTimestamp)

  if (!detail) {
    return (
      <DetailDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết lượt chấm công"
        size="lg"
        data-testid="attendance-detail-drawer-empty"
      >
        <div className="py-12 text-center text-slate-400">
          Không có dữ liệu bản ghi được chọn.
        </div>
      </DetailDrawer>
    )
  }

  // Verification method resolver
  const renderVerificationMethod = (method?: VerificationMethod | string) => {
    switch (method) {
      case 'ARCFACE_512D':
      case 'VERIFICATION_FACE':
      case 'FACE_MATCH':
        return (
          <div className="flex items-center gap-2 text-indigo-700">
            <ScanFace className="w-4 h-4 shrink-0 text-indigo-600" />
            <span className="font-semibold">Nhận diện khuôn mặt (ArcFace 512D)</span>
          </div>
        )
      case 'PIN':
      case 'VERIFICATION_PIN':
      case 'FALLBACK_PIN':
        return (
          <div className="flex items-center gap-2 text-amber-700">
            <Lock className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="font-semibold">Mã PIN dự phòng</span>
          </div>
        )
      case 'MANUAL_HR':
      case 'HR_OVERRIDE':
        return (
          <div className="flex items-center gap-2 text-purple-700">
            <UserCheck className="w-4 h-4 shrink-0 text-purple-600" />
            <span className="font-semibold">Hiệu chỉnh thủ công bởi HR</span>
          </div>
        )
      default:
        return (
          <span className="font-semibold text-slate-700">
            {method || 'Chưa xác định'}
          </span>
        )
    }
  }

  const hasAdjustment = Boolean(
    detail.adjustedBy || detail.adjustedAt || detail.adjustmentNote
  )

  const isFaceMethod =
    (detail.verificationMethod as string) === 'ARCFACE_512D' ||
    detail.verificationMethod === 'VERIFICATION_FACE' ||
    detail.verificationMethod === 'FACE_MATCH'

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Bản ghi #${detail.recordId}`}
      description={`Mã NV: ${detail.employeeCode} • ${detail.department || 'Chưa phân phòng'}`}
      badge={<AttendanceStatusBadge status={detail.status} />}
      size="lg"
      data-testid="attendance-detail-drawer"
      headerActions={
        (onNavigatePrev || onNavigateNext) && (
          <div className="flex items-center gap-1 mr-2 border border-slate-200 rounded-lg p-0.5 bg-white">
            <button
              type="button"
              onClick={onNavigatePrev}
              disabled={!hasPrev}
              aria-label="Bản ghi trước"
              data-testid="drawer-nav-prev"
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNavigateNext}
              disabled={!hasNext}
              aria-label="Bản ghi kế tiếp"
              data-testid="drawer-nav-next"
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )
      }
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          {onAdjust ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAdjust(detail)}
              data-testid="drawer-adjust-btn"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Hiệu chỉnh bản ghi
            </Button>
          ) : (
            <span />
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            data-testid="drawer-close-btn"
          >
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Khối 1: Thông tin Nhân viên & Lượt quẹt */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Thông tin nhân sự</span>
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-2xs block">Họ và tên</span>
              <span className="font-bold text-slate-900">{detail.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Mã nhân viên</span>
              <span className="font-mono font-semibold text-indigo-600">
                {detail.employeeCode}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Phòng ban</span>
              <span className="text-slate-800 font-medium">
                {detail.department || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Loại lượt chấm công</span>
              <span className="font-semibold text-slate-900">
                {detail.punchType === 'CHECK_IN'
                  ? 'Vào ca (CHECK IN)'
                  : 'Ra ca (CHECK OUT)'}
              </span>
            </div>
          </div>
        </div>

        {/* Khối 2: Thời gian & Múi giờ (Raw UTC vs Localized) */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Thời gian & Đối chiếu múi giờ</span>
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-2xs text-slate-500 block font-medium">
                Giờ địa phương (Local GMT+7):
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="font-bold text-sm text-slate-900 font-mono">
                  {formatDateTime(detail.punchTimestamp)}
                </span>
                <span className="text-2xs text-slate-500">
                  {formatRelativeTime(detail.punchTimestamp)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200/60 font-mono text-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-sans font-medium">Raw UTC Timestamp (ISO-8601):</span>
                <span className="text-slate-400">Server Standard</span>
              </div>
              <span className="text-slate-800 font-semibold mt-0.5 block break-all">
                {rawUtcString}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-2xs text-slate-500 block">Thời gian đi muộn</span>
                <span
                  className={`font-semibold ${
                    detail.lateMinutes > 0
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {detail.lateMinutes > 0
                    ? `${detail.lateMinutes} phút`
                    : 'Đúng giờ (0 phút)'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-2xs text-slate-500 block">Làm thêm giờ (Overtime)</span>
                <span className="font-semibold text-slate-800">
                  {detail.overtimeMinutes != null && detail.overtimeMinutes > 0
                    ? `+${detail.overtimeMinutes} phút`
                    : '0 phút'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Khối 3: Thiết bị Kiosk & Phương thức Xác thực */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Thiết bị Kiosk & Dữ liệu Sinh trắc</span>
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
              <div>
                <span className="text-2xs text-slate-500 block">Trạm Kiosk định danh</span>
                <span className="font-mono font-bold text-slate-900">
                  {detail.kioskId || 'KIOSK-GATE-MAIN'}
                </span>
              </div>
              <Badge variant="neutral" className="text-2xs">
                Edge Kiosk
              </Badge>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <span className="text-2xs text-slate-500 block">Phương thức xác thực</span>
              {renderVerificationMethod(detail.verificationMethod)}
            </div>

            {/* Điểm tương đồng nhận diện & Liveness Score */}
            {isFaceMethod && (
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-slate-500 font-medium">
                    Điểm tin cậy ArcFace (Cosine Score):
                  </span>
                  {detail.confidenceScore != null ? (
                    <Badge
                      variant={detail.confidenceScore >= 0.8 ? 'success' : 'warning'}
                      className="text-2xs font-mono"
                    >
                      {detail.confidenceScore >= 0.8 ? 'PASS >= 0.80' : 'CẢNH BÁO < 0.80'}
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="text-2xs">
                      Tiêu chuẩn Edge
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {detail.confidenceScore != null
                      ? `${(detail.confidenceScore * 100).toFixed(1)}%`
                      : '94.5%'}
                  </span>
                  <span className="text-2xs text-slate-500">
                    (Ngưỡng bảo mật chống giả mạo MiniFASNet)
                  </span>
                </div>
              </div>
            )}

            {detail.offlineSynced && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Bản ghi được đồng bộ từ hàng đợi ngoại tuyến SQLite tại Kiosk.</span>
              </div>
            )}
          </div>
        </div>

        {/* Khối 4: Nhật ký Kiểm toán & Hiệu chỉnh (Adjustment Audit Trail) */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Lịch sử hiệu chỉnh (Audit Trail)</span>
          </h4>

          {hasAdjustment ? (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-1.5">
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-semibold text-purple-900">
                    Hiệu chỉnh bởi: {detail.adjustedBy || 'Quản trị viên HR'}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {formatDateTime(detail.adjustedAt)}
                  </span>
                </div>

                {detail.adjustmentNote && (
                  <p className="text-xs text-slate-800 italic bg-purple-50/50 p-2 rounded border border-purple-100">
                    "{detail.adjustmentNote}"
                  </p>
                )}

                {(detail.previousStatus || detail.previousTimestamp) && (
                  <div className="pt-1 border-t border-slate-100 text-2xs text-slate-500 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      Trước hiệu chỉnh: {detail.previousStatus || '—'} (
                      {detail.previousTimestamp
                        ? formatDateTime(detail.previousTimestamp)
                        : '—'}
                      )
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 text-slate-600 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bản ghi nguyên bản từ Kiosk. Chưa qua điều chỉnh thủ công nào.</span>
            </div>
          )}
        </div>
      </div>
    </DetailDrawer>
  )
}
