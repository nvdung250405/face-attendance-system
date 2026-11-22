/**
 * EmployeeExcuseHistoryView: Màn hình Danh Sách & Theo Dõi Đơn Giải Trình Công Của Nhân Viên
 * (FR-BE-014, API-BE-027, APD-BE-015, UI-WEB-005, TASK-WEB-012).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileQuestion,
  RotateCw,
  Plus,
  AlertCircle,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { Button, TableSkeleton, PaginationBar, Badge, FilterToolbar } from '@/components/ui'
import { excuseService } from '@/services/excuseService'
import { SubmitExcuseModal } from '@/components/excuse/SubmitExcuseModal'
import { formatDateTime } from '@/utils/date'
import type { ExcuseRequestItem, ExcuseRequestStatus } from '@/types'

export const EmployeeExcuseHistoryView: React.FC = () => {
  const [requests, setRequests] = useState<ExcuseRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  // Bộ lọc tìm kiếm & trạng thái
  const [keyword, setKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ExcuseRequestStatus | 'ALL'>('ALL')

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMyExcuses(0)
  }, [fetchMyExcuses])

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesStatus =
        selectedStatus === 'ALL' || item.status === selectedStatus
      const kw = keyword.toLowerCase().trim()
      const matchesKeyword =
        !kw ||
        item.reason?.toLowerCase().includes(kw) ||
        String(item.id).includes(kw)
      return matchesStatus && matchesKeyword
    })
  }, [requests, selectedStatus, keyword])

  const renderStatusBadge = (status: ExcuseRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" dot className="shrink-0">
            Chờ duyệt
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="success" dot className="shrink-0">
            Đã duyệt
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="danger" dot className="shrink-0">
            Từ chối
          </Badge>
        )
    }
  }

  return (
    <div data-testid="employee-excuse-history-view" className="space-y-6">
      {/* ── Tiêu đề trang & Tác vụ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
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
            <RotateCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
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
            <Plus className="w-4 h-4 shrink-0" />
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

      {/* ── Bộ lọc tìm kiếm & trạng thái ── */}
      <FilterToolbar>
        <FilterToolbar.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="Tìm theo lý do, mã đơn..."
          maxLength={100}
        />
        <FilterToolbar.Select
          value={selectedStatus}
          onChange={(val) => setSelectedStatus(val as ExcuseRequestStatus | 'ALL')}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            { value: 'PENDING', label: 'Đơn chờ duyệt' },
            { value: 'APPROVED', label: 'Đơn đã duyệt' },
            { value: 'REJECTED', label: 'Đơn bị từ chối' },
          ]}
        />
        <FilterToolbar.ActiveCount
          count={(keyword.trim() ? 1 : 0) + (selectedStatus !== 'ALL' ? 1 : 0)}
        />
        <FilterToolbar.Reset
          onClick={() => {
            setKeyword('')
            setSelectedStatus('ALL')
          }}
          visible={Boolean(keyword.trim() || selectedStatus !== 'ALL')}
        />
      </FilterToolbar>

      {/* ── Danh sách đơn giải trình (Permanent Table - CLS Free) ── */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="employee-excuses-table">
            <thead className="bg-slate-50 border-b border-border-subtle text-text-secondary font-semibold">
              <tr>
                <th scope="col" className="py-3 px-4">Mã đơn</th>
                <th scope="col" className="py-3 px-4">Ngày nộp</th>
                <th scope="col" className="py-3 px-4">Giờ quẹt ban đầu</th>
                <th scope="col" className="py-3 px-4">Đề xuất điều chỉnh</th>
                <th scope="col" className="py-3 px-4 max-w-xs">Lý do giải trình</th>
                <th scope="col" className="py-3 px-4">Trạng thái</th>
                <th scope="col" className="py-3 px-4">Phản hồi của HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-text-primary">
              {isLoading ? (
                <TableSkeleton columns={7} rows={5} ariaLabel="Đang tải danh sách đơn giải trình..." />
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 shrink-0" />
                      </div>
                      <h3 className="text-sm font-bold text-text-primary">Chưa có đơn giải trình nào</h3>
                      <p className="text-xs text-text-secondary">
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
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Nộp đơn giải trình ngay</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-primary">#{item.id}</td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {formatDateTime(item.originalPunchTimestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold whitespace-nowrap">
                      {item.requestedPunchTimestamp
                        ? formatDateTime(item.requestedPunchTimestamp)
                        : '--'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
                        <span className="line-clamp-2" title={item.reason}>
                          {item.reason}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-xs max-w-sm">
                      {item.status === 'APPROVED' ? (
                        <div className="text-2xs text-status-success font-medium">
                          Bởi {item.decidedByName || 'HR'} ({formatDateTime(item.decidedAt)})
                        </div>
                      ) : item.status === 'REJECTED' ? (
                        <div className="text-2xs text-status-danger font-medium space-y-0.5">
                          <div>Bởi {item.decidedByName || 'HR'}</div>
                          <div className="italic text-slate-600 truncate max-w-[200px]" title={item.rejectionReason || ''}>
                            Lý do: {item.rejectionReason}
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xs text-text-secondary">Đang chờ xem xét</span>
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
          pageSize={10}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={(newPage) => fetchMyExcuses(newPage)}
          itemLabel="đơn"
        />
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
