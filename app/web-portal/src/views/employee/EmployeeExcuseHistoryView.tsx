/**
 * EmployeeExcuseHistoryView: Màn hình Danh Sách & Theo Dõi Đơn Giải Trình Công Của Nhân Viên
 * (FR-BE-014, API-BE-027, APD-BE-015, UI-WEB-005, TASK-WEB-012).
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileQuestion,
  RotateCw,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/common'
import { excuseService } from '@/services/excuseService'
import { SubmitExcuseModal } from '@/components/excuse/SubmitExcuseModal'
import type { ExcuseRequestItem, ExcuseRequestStatus } from '@/types'

export const EmployeeExcuseHistoryView: React.FC = () => {
  const [requests, setRequests] = useState<ExcuseRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  // Phân trang
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const fetchMyExcuses = useCallback(async (targetPage = 0) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await excuseService.getMyExcuseRequests({ page: targetPage, size: 10 })
      setRequests(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
      setPage(targetPage)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Không thể tải danh sách đơn giải trình.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const res = await excuseService.getMyExcuseRequests({ page: 0, size: 10 })
        if (!ignore) {
          setRequests(res.content || [])
          setTotalPages(res.totalPages || 1)
          setTotalElements(res.totalElements || 0)
          setPage(0)
        }
      } catch (err: unknown) {
        if (!ignore) {
          const errorObj = err as { message?: string }
          setErrorMessage(errorObj.message || 'Không thể tải danh sách đơn giải trình.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [])

  const renderStatusBadge = (status: ExcuseRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ duyệt</span>
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-status-success border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã duyệt</span>
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-status-danger border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Từ chối</span>
          </span>
        )
    }
  }

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '--'
    try {
      const d = new Date(isoString)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div data-testid="employee-excuse-history-view" className="space-y-6">
      {/* ── Tiêu đề trang & Tác vụ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-brand-primary border border-blue-200 mb-1.5">
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Cổng Nhân Viên</span>
          </div>
          <h1 className="page-title">Đơn Giải Trình Công Của Tôi</h1>
          <p className="page-subtitle">
            Theo dõi tiến độ phê duyệt đơn giải trình đi muộn, về sớm hoặc sự cố chấm công (Tổng cộng:{' '}
            <span className="font-semibold text-text-primary">{totalElements}</span> đơn)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fetchMyExcuses(page)}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            data-testid="create-excuse-btn"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nộp đơn mới</span>
          </Button>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Danh sách đơn giải trình ── */}
      <div className="card-surface overflow-hidden">
        {isLoading && requests.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-muted">
            <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
            <span>Đang tải danh sách đơn giải trình...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Chưa có đơn giải trình nào</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Khi bạn cần điều chỉnh giờ công do kẹt xe hoặc sự cố chấm công, hãy nộp đơn tại đây để HR
              phê duyệt.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              className="gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nộp đơn giải trình ngay</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-subtle text-text-secondary font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Ngày nộp</th>
                  <th className="py-3 px-4">Giờ quẹt ban đầu</th>
                  <th className="py-3 px-4">Đề xuất điều chỉnh</th>
                  <th className="py-3 px-4 max-w-xs">Lý do giải trình</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Phản hồi của HR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-primary">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-primary">#{item.id}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {formatDateTime(item.originalPunchTimestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                      {item.requestedPunchTimestamp
                        ? formatDateTime(item.requestedPunchTimestamp)
                        : '--'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                        <span className="line-clamp-2" title={item.reason}>
                          {item.reason}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>
                    <td className="py-3 px-4">
                      {item.status === 'APPROVED' ? (
                        <div className="text-2xs text-status-success font-medium">
                          Bởi {item.decidedByName || 'HR'} ({formatDateTime(item.decidedAt)})
                        </div>
                      ) : item.status === 'REJECTED' ? (
                        <div className="text-2xs text-status-danger font-medium space-y-0.5">
                          <div>Bởi {item.decidedByName || 'HR'}</div>
                          <div className="italic text-slate-600">Lý do: {item.rejectionReason}</div>
                        </div>
                      ) : (
                        <span className="text-2xs text-text-muted">Đang chờ xem xét</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
            <span>
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchMyExcuses(page - 1)}
                disabled={page <= 0 || isLoading}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchMyExcuses(page + 1)}
                disabled={page >= totalPages - 1 || isLoading}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal nộp đơn mới */}
      <SubmitExcuseModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => fetchMyExcuses(0)}
      />
    </div>
  )
}
