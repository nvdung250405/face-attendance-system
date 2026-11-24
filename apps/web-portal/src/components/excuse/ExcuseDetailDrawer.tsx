/**
 * ExcuseDetailDrawer: Slide-over right drawer (480px - 560px)
 * Hiển thị chi tiết đơn giải trình công (Master-Detail Pattern):
 * - Đối soát ca làm việc quy định vs Lượt quẹt thực tế / Giờ đề xuất
 * - Nội dung giải trình được làm sạch chống XSS (sanitizeUserContent)
 * - Vùng xem trước tệp minh chứng đính kèm (Proof Attachment Preview)
 * - Nút tác vụ phê duyệt / từ chối trực tiếp từ drawer (Approve/Reject CTAs)
 * - Nhật ký thẩm định (Decision & Audit Trail)
 * (eval-web-ui-inventory-20261124-155500.md).
 */

import React from 'react'
import {
  FileText,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Paperclip,
  Check,
  X,
  ExternalLink,
  History,
  CalendarDays,
} from 'lucide-react'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/utils/date'
import { sanitizeUserContent } from '@/utils/security'
import type { ExcuseRequestItem, ExcuseRequestStatus } from '@/types'

export interface ExcuseRequestDetail extends ExcuseRequestItem {
  proofUrl?: string | null
  proofFileName?: string | null
  attachmentUrl?: string | null
  scheduledShift?: string | null
  shiftName?: string | null
  shiftStartTime?: string | null
  shiftEndTime?: string | null
}

export interface ExcuseDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  request: ExcuseRequestItem | ExcuseRequestDetail | null
  onApprove?: (request: ExcuseRequestItem) => void
  onReject?: (request: ExcuseRequestItem) => void
  isProcessing?: boolean
}

export const ExcuseDetailDrawer: React.FC<ExcuseDetailDrawerProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  isProcessing = false,
}) => {
  const detail = request as ExcuseRequestDetail | null

  if (!detail) {
    return (
      <DetailDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết đơn giải trình"
        size="lg"
        data-testid="excuse-detail-drawer-empty"
      >
        <div className="py-12 text-center text-slate-400">
          Không có dữ liệu đơn giải trình được chọn.
        </div>
      </DetailDrawer>
    )
  }

  // Trạng thái badge
  const renderStatusBadge = (status: ExcuseRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" dot className="shrink-0 font-medium">
            Chờ duyệt
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="success" dot className="shrink-0 font-medium">
            Đã duyệt
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="danger" dot className="shrink-0 font-medium">
            Từ chối
          </Badge>
        )
      default:
        return (
          <Badge variant="neutral" className="shrink-0 font-medium">
            {status}
          </Badge>
        )
    }
  }

  const proofUrl = detail.proofUrl || detail.attachmentUrl
  const isPending = detail.status === 'PENDING'

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Đơn giải trình #${detail.id}`}
      description={`Nhân viên: ${detail.fullName} (${detail.employeeCode})`}
      badge={renderStatusBadge(detail.status)}
      size="lg"
      data-testid="excuse-detail-drawer"
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          {isPending && (onApprove || onReject) ? (
            <div className="flex items-center gap-2">
              {onReject && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(detail)}
                  disabled={isProcessing}
                  data-testid="drawer-reject-btn"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Từ chối đơn
                </Button>
              )}
              {onApprove && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onApprove(detail)}
                  isLoading={isProcessing}
                  data-testid="drawer-approve-btn"
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Phê duyệt đơn
                </Button>
              )}
            </div>
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
        {/* Khối 1: Thông tin Nhân viên & Lịch sử nộp */}
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
              <span className="text-slate-500 text-2xs block">Thời điểm gửi đơn</span>
              <span className="text-slate-800 font-medium">
                {formatDateTime(detail.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Mã bản ghi công liên quan</span>
              <span className="font-mono font-semibold text-slate-700">
                #{detail.attendanceLogId}
              </span>
            </div>
          </div>
        </div>

        {/* Khối 2: Đối soát Ca làm việc vs Thực tế (Scheduled Shift vs Punch) */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>Đối soát ca làm việc & Giờ chấm công</span>
          </h4>

          <div className="space-y-2.5 text-xs">
            {/* Ca làm việc quy định */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-2xs text-slate-500 block font-medium">
                Ca làm việc quy định:
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-semibold text-slate-900">
                  {detail.shiftName ||
                    detail.scheduledShift ||
                    'Ca Hành Chính (08:00 - 17:00)'}
                </span>
                <span className="text-2xs text-slate-500 font-mono">
                  {detail.shiftStartTime && detail.shiftEndTime
                    ? `${detail.shiftStartTime} - ${detail.shiftEndTime}`
                    : 'Tiêu chuẩn'}
                </span>
              </div>
            </div>

            {/* So sánh Giờ quẹt ban đầu vs Giờ đề xuất */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-2xs text-slate-500 block">
                  Giờ quẹt ban đầu (Kiosk)
                </span>
                <span className="font-mono font-semibold text-slate-700 block text-xs">
                  {detail.originalPunchTimestamp
                    ? formatDateTime(detail.originalPunchTimestamp)
                    : 'Không có dữ liệu quẹt'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
                <span className="text-2xs text-emerald-800 block font-medium">
                  Giờ đề xuất công nhận
                </span>
                <span className="font-mono font-bold text-emerald-900 block text-xs">
                  {detail.requestedPunchTimestamp
                    ? formatDateTime(detail.requestedPunchTimestamp)
                    : 'Không yêu cầu đổi mốc giờ'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Khối 3: Nội dung & Lý do giải trình (Justification Text) */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Nội dung & Lý do giải trình</span>
          </h4>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
            <p
              className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words"
              data-testid="excuse-reason-text"
              dangerouslySetInnerHTML={{
                __html: sanitizeUserContent(detail.reason) || 'Không có mô tả chi tiết.',
              }}
            />
          </div>
        </div>

        {/* Khối 4: Minh chứng đính kèm (Proof Attachment Preview) */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            <span>Tệp minh chứng đính kèm</span>
          </h4>

          {proofUrl ? (
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                  {detail.proofFileName || 'minh_chung_giai_trinh.png'}
                </span>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
                >
                  <span>Mở toàn màn hình</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center max-h-56">
                <img
                  src={proofUrl}
                  alt="Minh chứng giải trình"
                  className="max-h-56 w-auto object-contain hover:scale-102 transition-transform duration-200"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center space-y-1">
              <Paperclip className="w-5 h-5 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Không có tệp minh chứng đính kèm.
              </p>
              <p className="text-2xs text-slate-400">
                Nhân viên giải trình bằng văn bản thuần túy theo quy định nội bộ.
              </p>
            </div>
          )}
        </div>

        {/* Khối 5: Kết quả thẩm định & Lịch sử phê duyệt (Decision & Audit Trail) */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Kết quả thẩm định & Kiểm toán</span>
          </h4>

          {detail.status === 'APPROVED' && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-1.5 text-emerald-950">
              <div className="flex items-center justify-between text-2xs font-semibold text-emerald-800">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Đã phê duyệt bởi: {detail.decidedByName || 'Quản lý/HR'}</span>
                </span>
                <span className="font-mono text-emerald-700">
                  {formatDateTime(detail.decidedAt)}
                </span>
              </div>
              <p className="text-xs text-emerald-900 italic">
                Ghi chú: {detail.rejectionReason || 'Đã đồng ý điều chỉnh công.'}
              </p>
            </div>
          )}

          {detail.status === 'REJECTED' && (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs space-y-1.5 text-rose-950">
              <div className="flex items-center justify-between text-2xs font-semibold text-rose-800">
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Đã từ chối bởi: {detail.decidedByName || 'Quản lý/HR'}</span>
                </span>
                <span className="font-mono text-rose-700">
                  {formatDateTime(detail.decidedAt)}
                </span>
              </div>
              <p className="text-xs text-rose-900 font-medium">
                Lý do từ chối:{' '}
                <span
                  dangerouslySetInnerHTML={{
                    __html:
                      sanitizeUserContent(detail.rejectionReason) ||
                      'Không đáp ứng quy định giải trình.',
                  }}
                />
              </p>
            </div>
          )}

          {detail.status === 'PENDING' && (
            <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Đơn đang trong hàng đợi chờ Quản lý Nhân sự / Quản trị viên xét duyệt.
              </span>
            </div>
          )}
        </div>
      </div>
    </DetailDrawer>
  )
}
