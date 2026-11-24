import React, { useState } from 'react'
import { X, ShieldAlert, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { Button, TableSkeleton } from '@/components/ui'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatDateTime } from '@/utils/date'
import { dataSubjectService } from '@/services/dataSubjectService'
import type {
  DataSubjectRequestItem,
  DataSubjectRequestStatus,
  UpdateDataSubjectRequest,
} from '@/types'

interface DpoDataRequestsReviewTableProps {
  dataRequests: DataSubjectRequestItem[]
  isLoading: boolean
  onUpdateStatus?: (id: number, data: UpdateDataSubjectRequest) => Promise<void>
}

function getRequestTypeBadge(type: string) {
  switch (type) {
    case 'ACCESS':
      return {
        label: 'Truy cập dữ liệu',
        className: 'badge-info',
      }
    case 'CORRECTION':
    case 'RECTIFICATION':
      return {
        label: 'Đính chính thông tin',
        className: 'badge-warning',
      }
    case 'ERASURE':
      return {
        label: 'Xóa dữ liệu',
        className: 'badge-danger',
      }
    case 'EXPORT':
      return {
        label: 'Trích xuất dữ liệu',
        className: 'badge-primary',
      }
    default:
      return {
        label: type,
        className: 'badge-slate',
      }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'FULFILLED':
    case 'COMPLETED':
      return {
        label: 'ĐÃ HOÀN TẤT',
        className: 'badge-success',
        icon: CheckCircle,
      }
    case 'IN_PROGRESS':
      return {
        label: 'ĐANG XỬ LÝ',
        className: 'badge-info',
        icon: Clock,
      }
    case 'REJECTED':
      return {
        label: 'TỪ CHỐI',
        className: 'badge-danger',
        icon: XCircle,
      }
    case 'RECEIVED':
    case 'PENDING':
    default:
      return {
        label: 'CHỜ TIẾP NHẬN',
        className: 'badge-warning',
        icon: AlertCircle,
      }
  }
}

export const DpoDataRequestsReviewTable: React.FC<DpoDataRequestsReviewTableProps> = ({
  dataRequests,
  isLoading,
  onUpdateStatus,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequestItem | null>(null)
  const [reviewStatus, setReviewStatus] = useState<DataSubjectRequestStatus>('FULFILLED')
  const [reviewNote, setReviewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const handleOpenReviewModal = (item: DataSubjectRequestItem) => {
    setSelectedRequest(item)
    // Default to current status if valid, else FULFILLED
    const currentStatus = item.status as DataSubjectRequestStatus
    if (['RECEIVED', 'IN_PROGRESS', 'FULFILLED', 'REJECTED'].includes(currentStatus)) {
      setReviewStatus(currentStatus)
    } else if (item.status === 'COMPLETED') {
      setReviewStatus('FULFILLED')
    } else {
      setReviewStatus('FULFILLED')
    }
    setReviewNote(item.response || item.adminNote || '')
    setModalError(null)
  }

  const handleCloseModal = () => {
    setSelectedRequest(null)
    setReviewNote('')
    setModalError(null)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return

    try {
      setIsSubmitting(true)
      setModalError(null)
      const payload: UpdateDataSubjectRequest = {
        status: reviewStatus,
        response: reviewNote.trim() || undefined,
        adminNote: reviewNote.trim() || undefined,
      }

      if (onUpdateStatus) {
        await onUpdateStatus(selectedRequest.id, payload)
      } else {
        await dataSubjectService.updateDataRequestStatus(selectedRequest.id, payload)
      }
      handleCloseModal()
    } catch (err) {
      const error = err as { message?: string }
      setModalError(error.message || 'Không thể cập nhật trạng thái yêu cầu dữ liệu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Banner Hướng dẫn Pháp lý DSR theo NĐ 13/2023 ── */}
      <div className="p-4 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 text-xs sm:text-sm leading-relaxed shadow-xs">
        <strong className="font-bold">Quyền của Chủ thể Dữ liệu (Decree 13/2023/NĐ-CP):</strong>{' '}
        Cán bộ Bảo vệ Dữ liệu (DPO) có nghĩa vụ tiếp nhận, thẩm tra và xử lý các yêu cầu truy cập, đính chính, hoặc xóa dữ liệu cá nhân của nhân sự trong thời hạn 72 giờ kể từ khi tiếp nhận yêu cầu hợp lệ.
      </div>

      <div className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900">
            Yêu Cầu Về Quyền Chủ Thể Dữ Liệu (DSR)
          </h3>
          <p className="text-xs text-slate-500">
            Thẩm tra và cập nhật kết quả xử lý các yêu cầu liên quan đến thông tin cá nhân và dữ liệu sinh trắc học
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="dpo-data-requests-table">
            <thead>
              <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">
                  Mã NV
                </th>
                <th scope="col" className="py-3 px-4">Họ và Tên</th>
                <th scope="col" className="py-3 px-4">Loại Quyền Dữ Liệu</th>
                <th scope="col" className="py-3 px-4">Nội Dung Yêu Cầu</th>
                <th scope="col" className="py-3 px-4">Thời Điểm Gửi</th>
                <th scope="col" className="py-3 px-4">Trạng Thái</th>
                <th scope="col" className="py-3 px-4">Ghi Chú Phản Hồi</th>
                <th scope="col" className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <TableSkeleton columns={8} rows={5} ariaLabel="Đang nạp danh sách yêu cầu quyền dữ liệu..." />
              ) : dataRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-secondary">
                    Chưa có yêu cầu quyền chủ thể dữ liệu nào được gửi đến.
                  </td>
                </tr>
              ) : (
                dataRequests.map((item) => {
                  const typeBadge = getRequestTypeBadge(item.requestType)
                  const statusBadge = getStatusBadge(item.status)
                  const detailText = item.detail || item.details || item.reason || '—'
                  const responseText = item.response || item.adminNote || item.responseSummary || '—'

                  return (
                    <tr
                      key={item.id}
                      data-testid={`data-request-row-${item.id}`}
                      className="hover:bg-slate-50/80 group transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)] whitespace-nowrap">
                        {item.employeeCode || `NV-${item.employeeId ?? item.id}`}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-text-primary">
                        <span className="truncate max-w-[180px] block" title={item.fullName || '—'}>
                          {item.fullName || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={typeBadge.className}>{typeBadge.label}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary max-w-[220px] truncate" title={detailText}>
                        {detailText}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap font-mono">
                        {formatDateTime(item.submittedAt || item.createdAt || item.requestedAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={statusBadge.className}>{statusBadge.label}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary max-w-[200px] truncate" title={responseText}>
                        {responseText !== '—' ? responseText : <span className="text-text-muted italic">Chưa phản hồi</span>}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          data-testid={`review-request-btn-${item.id}`}
                          onClick={() => handleOpenReviewModal(item)}
                          className="text-xs font-semibold"
                        >
                          Xử lý
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Thẩm Tra & Phản Hồi Yêu Cầu DSR của DPO ── */}
      <Dialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent
          hideCloseButton
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        >
          {selectedRequest && (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                      Thẩm Tra Yêu Cầu #{selectedRequest.id}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Cập nhật tiến độ xử lý và phản hồi cho chủ thể dữ liệu
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Đóng hộp thoại"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Thông tin tóm tắt yêu cầu */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-medium block">Nhân sự:</span>
                    <span className="font-bold text-slate-800">
                      {selectedRequest.fullName || '—'} ({selectedRequest.employeeCode || `NV-${selectedRequest.employeeId ?? selectedRequest.id}`})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Loại quyền:</span>
                    <span className="font-semibold text-slate-800">
                      {getRequestTypeBadge(selectedRequest.requestType).label}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Nội dung yêu cầu chi tiết:</span>
                  <p className="mt-1 p-2 bg-white rounded-lg border border-slate-200 text-slate-800 font-mono text-2xs leading-relaxed break-words">
                    {selectedRequest.detail || selectedRequest.details || selectedRequest.reason || '—'}
                  </p>
                </div>
              </div>

              {/* Form cập nhật trạng thái & ghi chú phản hồi */}
              <div className="space-y-3 text-xs">
                <div>
                  <label htmlFor="review-status-select" className="block font-semibold text-slate-700 mb-1">
                    Trạng thái xử lý <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="review-status-select"
                    data-testid="request-status-select"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as DataSubjectRequestStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                    <option value="FULFILLED">Đã hoàn tất / Chấp thuận (FULFILLED)</option>
                    <option value="REJECTED">Từ chối yêu cầu (REJECTED)</option>
                    <option value="RECEIVED">Tiếp nhận (RECEIVED)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="review-response-input" className="block font-semibold text-slate-700 mb-1">
                    Ghi chú thẩm tra / Nội dung phản hồi nhân sự
                  </label>
                  <textarea
                    id="review-response-input"
                    data-testid="request-response-input"
                    rows={4}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Nhập chi tiết biện pháp đã thực hiện hoặc lý do từ chối theo điều khoản pháp lý..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {modalError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {modalError}
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  data-testid="cancel-review-btn"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  data-testid="submit-review-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu kết quả xử lý'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
