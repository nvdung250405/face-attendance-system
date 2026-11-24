/**
 * AdminExcuseManagementView: Màn hình Phê Duyệt & Quản Trị Đơn Giải Trình Công Dành Cho HR / Admin
 * (FR-BE-015, API-BE-028, API-BE-029, APD-BE-016, UI-WEB-003, TASK-WEB-019).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileQuestion,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react'
import { Button, TableSkeleton, PaginationBar, Badge, toast } from '@/components/ui'
import { ApproveExcuseModal, RejectExcuseModal } from '@/components/excuse'
import { excuseService } from '@/services/excuseService'
import { normalizeApiError } from '@/services/errorNormalizer'
import { formatDateTime } from '@/utils/date'
import { sanitizePlainText } from '@/utils/security'
import type { ExcuseRequestItem, ExcuseRequestStatus } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  ALL: 'toàn bộ',
  PENDING: 'chờ duyệt',
  APPROVED: 'đã duyệt',
  REJECTED: 'đã từ chối',
}

export const AdminExcuseManagementView: React.FC = () => {
  const [requests, setRequests] = useState<ExcuseRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Bộ lọc trạng thái
  const [selectedStatus, setSelectedStatus] = useState<ExcuseRequestStatus | 'ALL'>('PENDING')

  // Phân trang
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // State Modal Duyệt đơn
  const [approveTarget, setApproveTarget] = useState<ExcuseRequestItem | null>(null)
  const [isProcessingApprove, setIsProcessingApprove] = useState(false)

  // State Modal Từ chối đơn
  const [rejectTarget, setRejectTarget] = useState<ExcuseRequestItem | null>(null)
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [isProcessingReject, setIsProcessingReject] = useState(false)

  const fetchExcuseRequests = useCallback(
    async (targetPage = 0, statusFilter = selectedStatus, targetPageSize = pageSize) => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const queryStatus = statusFilter === 'ALL' ? undefined : statusFilter
        const res = await excuseService.getAdminExcuseRequests({
          status: queryStatus,
          page: targetPage,
          size: targetPageSize,
        })
        setRequests(res.content || [])
        setTotalPages(res.totalPages || 1)
        setTotalElements(res.totalElements || 0)
        setPage(targetPage)
      } catch (err: unknown) {
        const errorObj = normalizeApiError(err)
        setErrorMessage(errorObj.message || 'Không thể tải danh sách đơn giải trình.')
      } finally {
        setIsLoading(false)
      }
    },
    [selectedStatus, pageSize]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchExcuseRequests(0, selectedStatus)
  }, [fetchExcuseRequests, selectedStatus])

  // Xử lý Phê duyệt đơn
  const handleConfirmApprove = async (note?: string) => {
    if (!approveTarget) return
    setIsProcessingApprove(true)
    setErrorMessage(null)

    try {
      await excuseService.approveExcuseRequest(approveTarget.id, note)
      toast.success(`Đã phê duyệt đơn giải trình #${approveTarget.id} thành công!`)
      setApproveTarget(null)
      fetchExcuseRequests(page, selectedStatus)
    } catch (err: unknown) {
      const errorObj = normalizeApiError(err)
      setErrorMessage(errorObj.message || 'Phê duyệt thất bại. Vui lòng kiểm tra lại.')
    } finally {
      setIsProcessingApprove(false)
    }
  }

  // Xử lý Từ chối đơn
  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return

    setIsProcessingReject(true)
    setRejectError(null)

    try {
      await excuseService.rejectExcuseRequest(rejectTarget.id, reason)
      toast.success(`Đã từ chối đơn giải trình #${rejectTarget.id}.`)
      setRejectTarget(null)
      fetchExcuseRequests(page, selectedStatus)
    } catch (err: unknown) {
      const errorObj = normalizeApiError(err)
      setRejectError(errorObj.message || 'Từ chối thất bại. Vui lòng kiểm tra lại.')
      throw err
    } finally {
      setIsProcessingReject(false)
    }
  }

  const pendingCount = useMemo(() => {
    return requests.filter((r) => r.status === 'PENDING').length
  }, [requests])

  return (
    <div data-testid="admin-excuse-management-view" className="space-y-6">
      {/* ── Tiêu đề trang & Tác vụ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Quản Lý & Duyệt Đơn Giải Trình Công</h1>
          <p className="page-subtitle">
            Tiếp nhận, kiểm tra và ra quyết định phê duyệt hoặc từ chối giải trình chấm công của nhân sự
            (Tổng cộng: <span className="font-semibold text-text-primary">{totalElements}</span> đơn)
          </p>
        </div>

        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fetchExcuseRequests(page, selectedStatus)}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Thông báo Lỗi */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Tabs Lọc Trạng Thái ── */}
      <div className="flex border-b border-border-subtle gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSelectedStatus('PENDING')}
          data-testid="tab-pending"
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            selectedStatus === 'PENDING'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Chờ xử lý</span>
          {pendingCount > 0 && selectedStatus !== 'PENDING' && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-2xs">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('APPROVED')}
          data-testid="tab-approved"
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            selectedStatus === 'APPROVED'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Đã phê duyệt</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('REJECTED')}
          data-testid="tab-rejected"
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            selectedStatus === 'REJECTED'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Đã từ chối</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('ALL')}
          data-testid="tab-all"
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            selectedStatus === 'ALL'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Tất cả đơn</span>
        </button>
      </div>

      {/* ── Bảng Dữ Liệu Đơn Giải Trình (Permanent Table Structure - CLS Free) ── */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="admin-excuses-table">
            <thead className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95">Mã đơn</th>
                <th scope="col" className="py-3 px-4">Nhân sự</th>
                <th scope="col" className="py-3 px-4">Ngày nộp</th>
                <th scope="col" className="py-3 px-4">Giờ quẹt ban đầu</th>
                <th scope="col" className="py-3 px-4">Giờ đề xuất</th>
                <th scope="col" className="py-3 px-4 max-w-xs">Lý do giải trình</th>
                <th scope="col" className="py-3 px-4">Trạng thái</th>
                <th scope="col" className="py-3 px-4 text-right sticky right-0 z-20 bg-slate-50/95">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-text-primary">
              {isLoading ? (
                <TableSkeleton columns={8} rows={5} hasActionColumn ariaLabel="Đang tải danh sách đơn giải trình..." />
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 shrink-0" />
                      </div>
                      <h3 className="text-sm font-bold text-text-primary">Không có đơn giải trình nào</h3>
                      <p className="text-xs text-text-secondary">
                        Không có đơn nào thuộc trạng thái{' '}
                        {STATUS_LABELS[selectedStatus] || selectedStatus}.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-primary sticky left-0 z-10 bg-white group-hover:bg-slate-50 whitespace-nowrap tabular-nums">#{item.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary truncate max-w-[200px]" title={item.fullName}>{item.fullName}</div>
                      <div className="text-2xs text-text-secondary flex items-center gap-1">
                        <User className="w-3 h-3 text-text-muted shrink-0" />
                        <span className="font-mono tabular-nums">{item.employeeCode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap tabular-nums">
                      {formatDateTime(item.originalPunchTimestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold whitespace-nowrap tabular-nums">
                      {item.requestedPunchTimestamp
                        ? formatDateTime(item.requestedPunchTimestamp)
                        : '--'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                        <span className="line-clamp-2" title={sanitizePlainText(item.reason)}>
                          {sanitizePlainText(item.reason)}
                        </span>
                      </div>
                      {item.rejectionReason && (
                        <div className="text-2xs text-status-danger italic mt-1 line-clamp-1" title={sanitizePlainText(item.rejectionReason)}>
                          Từ chối: {sanitizePlainText(item.rejectionReason)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.status === 'PENDING' && (
                        <Badge variant="warning" dot className="shrink-0">
                          Chờ duyệt
                        </Badge>
                      )}
                      {item.status === 'APPROVED' && (
                        <Badge variant="success" dot className="shrink-0">
                          Đã duyệt
                        </Badge>
                      )}
                      {item.status === 'REJECTED' && (
                        <Badge variant="danger" dot className="shrink-0">
                          Từ chối
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right sticky right-0 z-10 bg-white group-hover:bg-slate-50 whitespace-nowrap">
                      {item.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            aria-label={`Phê duyệt đơn giải trình của ${item.fullName}`}
                            onClick={() => {
                              setApproveTarget(item)
                            }}
                            data-testid={`approve-btn-${item.id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 py-1 px-2.5 text-xs shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Duyệt</span>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            aria-label={`Từ chối đơn giải trình của ${item.fullName}`}
                            onClick={() => {
                              setRejectTarget(item)
                              setRejectError(null)
                            }}
                            data-testid={`reject-btn-${item.id}`}
                            className="text-status-danger hover:bg-rose-50 border-rose-200 gap-1 py-1 px-2.5 text-xs shrink-0"
                          >
                            <X className="w-3.5 h-3.5 shrink-0" />
                            <span>Từ chối</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-2xs text-text-muted">
                          {item.decidedByName ? `Bởi ${item.decidedByName}` : 'Đã xử lý'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <PaginationBar
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={(newPage) => fetchExcuseRequests(newPage, selectedStatus, pageSize)}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize)
            fetchExcuseRequests(0, selectedStatus, newPageSize)
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="đơn"
        />
      </div>

      {/* ── Modal Phê Duyệt Đơn ── */}
      <ApproveExcuseModal
        target={approveTarget}
        isProcessing={isProcessingApprove}
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveTarget(null)}
      />

      {/* ── Modal Từ Chối Đơn ── */}
      <RejectExcuseModal
        target={rejectTarget}
        isProcessing={isProcessingReject}
        error={rejectError}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  )
}
