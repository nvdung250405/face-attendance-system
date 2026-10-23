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
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/common'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { excuseService } from '@/services/excuseService'
import type { ExcuseRequestItem, ExcuseRequestStatus } from '@/types'

export const AdminExcuseManagementView: React.FC = () => {
  const [requests, setRequests] = useState<ExcuseRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Bộ lọc trạng thái
  const [selectedStatus, setSelectedStatus] = useState<ExcuseRequestStatus | 'ALL'>('PENDING')

  // Phân trang
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // State Modal Duyệt đơn
  const [approveTarget, setApproveTarget] = useState<ExcuseRequestItem | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [isProcessingApprove, setIsProcessingApprove] = useState(false)

  // State Modal Từ chối đơn
  const [rejectTarget, setRejectTarget] = useState<ExcuseRequestItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [isProcessingReject, setIsProcessingReject] = useState(false)

  const fetchExcuseRequests = useCallback(
    async (targetPage = 0, statusFilter = selectedStatus) => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const queryStatus = statusFilter === 'ALL' ? undefined : statusFilter
        const res = await excuseService.getAdminExcuseRequests({
          status: queryStatus,
          page: targetPage,
          size: 15,
        })
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
    },
    [selectedStatus]
  )

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const queryStatus = selectedStatus === 'ALL' ? undefined : selectedStatus
        const res = await excuseService.getAdminExcuseRequests({
          status: queryStatus,
          page: 0,
          size: 15,
        })
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
  }, [selectedStatus])

  // Xử lý Phê duyệt đơn
  const handleConfirmApprove = async () => {
    if (!approveTarget) return
    setIsProcessingApprove(true)
    setErrorMessage(null)

    try {
      await excuseService.approveExcuseRequest(approveTarget.id, reviewNote.trim() || undefined)
      setSuccessMessage(`Đã phê duyệt đơn giải trình #${approveTarget.id} thành công!`)
      setApproveTarget(null)
      setReviewNote('')
      fetchExcuseRequests(page, selectedStatus)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Phê duyệt thất bại. Vui lòng kiểm tra lại.')
    } finally {
      setIsProcessingApprove(false)
    }
  }

  // Xử lý Từ chối đơn
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectTarget) return

    if (!rejectionReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối (bắt buộc).')
      return
    }

    setIsProcessingReject(true)
    setRejectError(null)

    try {
      await excuseService.rejectExcuseRequest(rejectTarget.id, rejectionReason.trim())
      setSuccessMessage(`Đã từ chối đơn giải trình #${rejectTarget.id}.`)
      setRejectTarget(null)
      setRejectionReason('')
      fetchExcuseRequests(page, selectedStatus)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setRejectError(errorObj.message || 'Từ chối thất bại. Vui lòng kiểm tra lại.')
    } finally {
      setIsProcessingReject(false)
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
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Thông báo Thành công / Lỗi */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2">
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
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            selectedStatus === 'PENDING'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Clock className="w-4 h-4" />
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
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            selectedStatus === 'APPROVED'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã phê duyệt</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('REJECTED')}
          data-testid="tab-rejected"
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            selectedStatus === 'REJECTED'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Đã từ chối</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('ALL')}
          data-testid="tab-all"
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            selectedStatus === 'ALL'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Tất cả đơn</span>
        </button>
      </div>

      {/* ── Bảng Dữ Liệu Đơn Giải Trình ── */}
      <div className="card-surface overflow-hidden">
        {isLoading && requests.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-muted">
            <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
            <span>Đang tải danh sách đơn giải trình...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Không có đơn giải trình nào</h3>
            <p className="text-xs text-text-secondary">
              Không có đơn nào thuộc trạng thái{' '}
              {selectedStatus === 'ALL' ? 'toàn bộ' : selectedStatus}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-subtle text-text-secondary font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Nhân sự</th>
                  <th className="py-3 px-4">Ngày nộp</th>
                  <th className="py-3 px-4">Giờ quẹt ban đầu</th>
                  <th className="py-3 px-4">Giờ đề xuất</th>
                  <th className="py-3 px-4 max-w-xs">Lý do giải trình</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-primary">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-primary">#{item.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{item.fullName}</div>
                      <div className="text-2xs text-text-secondary flex items-center gap-1">
                        <User className="w-3 h-3 text-text-muted" />
                        <span>{item.employeeCode}</span>
                      </div>
                    </td>
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
                    <td className="py-3 px-4">
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chờ duyệt</span>
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-status-success border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã duyệt</span>
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-status-danger border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setApproveTarget(item)
                              setReviewNote('')
                            }}
                            data-testid={`approve-btn-${item.id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 py-1 px-2.5 text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Duyệt</span>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setRejectTarget(item)
                              setRejectionReason('')
                              setRejectError(null)
                            }}
                            data-testid={`reject-btn-${item.id}`}
                            className="text-status-danger hover:bg-rose-50 border-rose-200 gap-1 py-1 px-2.5 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
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
                onClick={() => fetchExcuseRequests(page - 1, selectedStatus)}
                disabled={page <= 0 || isLoading}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchExcuseRequests(page + 1, selectedStatus)}
                disabled={page >= totalPages - 1 || isLoading}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Phê Duyệt Đơn ── */}
      <Dialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
              <span>Phê Duyệt Đơn Giải Trình #{approveTarget?.id}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Nhân viên:{' '}
              <span className="font-semibold text-text-primary">
                {approveTarget?.fullName} ({approveTarget?.employeeCode})
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
              <div className="font-semibold">Lý do giải trình của nhân viên:</div>
              <p className="text-slate-700 italic">{approveTarget?.reason}</p>
              {approveTarget?.requestedPunchTimestamp && (
                <div className="pt-1 text-2xs text-emerald-800 font-mono">
                  Mốc giờ đề xuất: {formatDateTime(approveTarget.requestedPunchTimestamp)}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="approve-note" className="font-semibold text-text-primary">
                Ghi chú phê duyệt <span className="text-text-muted font-normal">(tùy chọn)</span>
              </label>
              <textarea
                id="approve-note"
                data-testid="approve-note-input"
                rows={3}
                maxLength={500}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Nhập ghi chú cho nhân viên hoặc kiểm toán..."
                className="w-full text-xs rounded-xl border border-border-subtle p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setApproveTarget(null)}
              disabled={isProcessingApprove}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmApprove}
              isLoading={isProcessingApprove}
              data-testid="confirm-approve-btn"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận duyệt</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Từ Chối Đơn ── */}
      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleConfirmReject}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-status-danger">
                <ShieldAlert className="w-5 h-5 text-status-danger" />
                <span>Từ Chối Đơn Giải Trình #{rejectTarget?.id}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                Nhân viên:{' '}
                <span className="font-semibold text-text-primary">
                  {rejectTarget?.fullName} ({rejectTarget?.employeeCode})
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              {rejectError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-status-danger">
                  {rejectError}
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl space-y-1">
                <div className="font-semibold text-text-secondary">Lý do giải trình:</div>
                <p className="text-text-primary italic">{rejectTarget?.reason}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="reject-reason" className="font-semibold text-text-primary">
                    Lý do từ chối <span className="text-status-danger">*</span>
                  </label>
                  <span className="text-2xs text-text-muted">{rejectionReason.length}/500</span>
                </div>
                <textarea
                  id="reject-reason"
                  data-testid="reject-reason-input"
                  rows={3}
                  maxLength={500}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối (bắt buộc, ví dụ: Không có xác nhận quản lý, đã quá hạn...)"
                  className="w-full text-xs rounded-xl border border-border-subtle p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={isProcessingReject}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isProcessingReject}
                data-testid="confirm-reject-btn"
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1"
              >
                <X className="w-4 h-4" />
                <span>Xác nhận từ chối</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
