/**
 * EmployeeDataRequestsView: Màn hình Yêu cầu Dữ liệu Cá nhân của Nhân viên
 * (SOL-WEB-009, APD-WEB-008, API-WEB-014, DD-WEB-015, BLD-WEB-020, TASK-WEB-026).
 *
 * Thực thi các quyền của chủ thể dữ liệu theo Nghị định 13/2023/NĐ-CP:
 * - 4 Loại yêu cầu: ACCESS, RECTIFICATION, ERASURE, EXPORT.
 * - Form gửi yêu cầu mới tới Nhân viên Bảo vệ Dữ liệu (DPO).
 * - Bảng theo dõi tiến độ xử lý và phản hồi chính thức từ DPO.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw, MessageSquare, Check, AlertCircle, Send } from 'lucide-react'
import { Button, TableSkeleton, FilterToolbar } from '@/components/ui'
import { dataSubjectService } from '@/services/dataSubjectService'
import { formatDateTime } from '@/utils/date'
import type { DataRequestType, DataSubjectRequestItem } from '@/types'

const REQUEST_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
  ACCESS: {
    label: 'Tiếp cận dữ liệu (Access)',
    desc: 'Yêu cầu trích xuất hồ sơ cá nhân và lịch sử điểm danh đang lưu trữ.',
  },
  CORRECTION: {
    label: 'Đính chính thông tin (Correction)',
    desc: 'Yêu cầu sửa đổi các trường thông tin cá nhân bị sai lệch hoặc chưa cập nhật.',
  },
  RECTIFICATION: {
    label: 'Đính chính thông tin (Rectification)',
    desc: 'Yêu cầu sửa đổi các trường thông tin cá nhân bị sai lệch hoặc chưa cập nhật.',
  },
  ERASURE: {
    label: 'Tiêu hủy dữ liệu (Erasure)',
    desc: 'Yêu cầu xóa dữ liệu sinh trắc học hoặc thông tin điểm danh theo quy định.',
  },
  EXPORT: {
    label: 'Xuất dữ liệu cá nhân (Export)',
    desc: 'Yêu cầu cung cấp bản sao dữ liệu cá nhân ở định dạng máy đọc được (JSON/CSV).',
  },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RECEIVED: {
    label: 'Chờ tiếp nhận',
    className: 'badge-warning',
  },
  PENDING: {
    label: 'Chờ tiếp nhận',
    className: 'badge-warning',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    className: 'badge-info',
  },
  FULFILLED: {
    label: 'Đã hoàn tất',
    className: 'badge-success',
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    className: 'badge-success',
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'badge-danger',
  },
}

const formatDate = formatDateTime

export const EmployeeDataRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<DataSubjectRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Bộ lọc lịch sử yêu cầu
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Form State
  const [selectedType, setSelectedType] = useState<DataRequestType>('ACCESS')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const data = await dataSubjectService.getEmployeeDataRequests()
      setRequests(data)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải danh sách yêu cầu dữ liệu.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests()
  }, [loadRequests])

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        item.status === statusFilter ||
        (statusFilter === 'RECEIVED' && item.status === 'PENDING') ||
        (statusFilter === 'FULFILLED' && item.status === 'COMPLETED')
      const kw = keyword.toLowerCase().trim()
      const matchesKeyword =
        !kw ||
        item.details?.toLowerCase().includes(kw) ||
        (REQUEST_TYPE_LABELS[item.requestType]?.label || item.requestType).toLowerCase().includes(kw) ||
        (item.adminNote || '').toLowerCase().includes(kw) ||
        String(item.id).includes(kw)
      return matchesStatus && matchesKeyword
    })
  }, [requests, statusFilter, keyword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!details.trim()) {
      setFormErrorMessage('Vui lòng nhập nội dung chi tiết của yêu cầu.')
      return
    }

    try {
      setIsSubmitting(true)
      setFormErrorMessage(null)
      setFormSuccessMessage(null)

      const created = await dataSubjectService.createEmployeeDataRequest({
        requestType: selectedType,
        details: details.trim(),
      })

      setFormSuccessMessage('Yêu cầu dữ liệu cá nhân của bạn đã được gửi tới DPO thành công!')
      setDetails('')
      // Chèn yêu cầu mới lên đầu danh sách
      setRequests((prev) => [created, ...prev])
    } catch (err) {
      const error = err as { message?: string }
      setFormErrorMessage(error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang & Tác vụ hàng đầu ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Yêu cầu dữ liệu cá nhân (Quyền chủ thể)</h1>
          <p className="page-subtitle">
            Thực thi các quyền của chủ thể dữ liệu đối với thông tin cá nhân và dữ liệu sinh trắc học theo Nghị định 13/2023/NĐ-CP
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={loadRequests}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 shrink-0"
          title="Làm mới danh sách"
        >
          <RefreshCw size={16} className={`shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* ── Khung Gửi Yêu Cầu Mới ── */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center shrink-0">
            <MessageSquare size={18} strokeWidth={2} className="shrink-0" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Gửi Yêu Cầu Mới tới DPO</h2>
            <p className="text-xs text-text-secondary">Nhân viên Bảo vệ Dữ liệu (DPO) sẽ xử lý trong thời hạn luật định</p>
          </div>
        </div>

        {formSuccessMessage && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-sm flex items-center gap-2"
          >
            <Check size={18} strokeWidth={2} className="shrink-0" />
            <span>{formSuccessMessage}</span>
          </div>
        )}

        {formErrorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"
          >
            <AlertCircle size={18} strokeWidth={2} className="shrink-0" />
            <span>{formErrorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="request-type" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Loại quyền chủ thể dữ liệu *
              </label>
              <select
                id="request-type"
                data-testid="request-type-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DataRequestType)}
                className="input-base text-sm"
              >
                <option value="ACCESS">{REQUEST_TYPE_LABELS.ACCESS.label}</option>
                <option value="CORRECTION">{REQUEST_TYPE_LABELS.CORRECTION.label}</option>
                <option value="RECTIFICATION">{REQUEST_TYPE_LABELS.RECTIFICATION.label}</option>
                <option value="ERASURE">{REQUEST_TYPE_LABELS.ERASURE.label}</option>
                <option value="EXPORT">{REQUEST_TYPE_LABELS.EXPORT.label}</option>
              </select>
              <p className="text-xs text-text-secondary mt-1">
                {REQUEST_TYPE_LABELS[selectedType].desc}
              </p>
            </div>

            <div>
              <label htmlFor="request-details" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Nội dung chi tiết yêu cầu *
              </label>
              <textarea
                id="request-details"
                data-testid="request-details-input"
                rows={3}
                value={details}
                maxLength={500}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mô tả cụ thể thông tin bạn muốn tiếp cận, đính chính hoặc yêu cầu xử lý..."
                className="input-base text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              data-testid="submit-data-request-btn"
              disabled={isSubmitting || !details.trim()}
              isLoading={isSubmitting}
              leftIcon={<Send size={16} strokeWidth={2} className="shrink-0" />}
              className="shrink-0"
            >
              Gửi yêu cầu đến DPO
            </Button>
          </div>
        </form>
      </div>

      {/* ── Bộ lọc tìm kiếm & trạng thái yêu cầu ── */}
      <FilterToolbar>
        <FilterToolbar.Search
          value={keyword}
          onChange={setKeyword}
          placeholder="Tìm theo nội dung, loại yêu cầu, phản hồi..."
          maxLength={100}
        />
        <FilterToolbar.Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            { value: 'RECEIVED', label: 'Yêu cầu chờ tiếp nhận' },
            { value: 'IN_PROGRESS', label: 'Yêu cầu đang xử lý' },
            { value: 'FULFILLED', label: 'Yêu cầu đã hoàn tất' },
            { value: 'REJECTED', label: 'Yêu cầu bị từ chối' },
          ]}
        />
        <FilterToolbar.ActiveCount
          count={(keyword.trim() ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)}
        />
        <FilterToolbar.Reset
          onClick={() => {
            setKeyword('')
            setStatusFilter('ALL')
          }}
          visible={Boolean(keyword.trim() || statusFilter !== 'ALL')}
        />
      </FilterToolbar>

      {/* ── Bảng Lịch Sử Yêu Cầu ── */}
      <div className="card-surface overflow-hidden">
        {errorMessage && (
          <div className="p-4 bg-rose-50 text-rose-700 text-sm border-b border-rose-200">
            {errorMessage}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm" data-testid="data-requests-table">
            <thead>
              <tr className="table-sticky-header">
                <th scope="col" className="py-3 px-4 font-semibold">Mã YC</th>
                <th scope="col" className="py-3 px-4 font-semibold">Loại Yêu Cầu</th>
                <th scope="col" className="py-3 px-4 font-semibold">Nội Dung Chi Tiết</th>
                <th scope="col" className="py-3 px-4 font-semibold">Thời Điểm Gửi</th>
                <th scope="col" className="py-3 px-4 font-semibold">Trạng Thái</th>
                <th scope="col" className="py-3 px-4 font-semibold">Phản Hồi DPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <TableSkeleton columns={6} rows={5} ariaLabel="Đang nạp dữ liệu yêu cầu..." />
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary">
                    <p className="font-semibold text-text-secondary">Bạn chưa gửi yêu cầu dữ liệu cá nhân nào</p>
                    <p className="text-xs mt-1">Các yêu cầu tiếp cận, chỉnh sửa, xóa hoặc xuất dữ liệu sẽ hiển thị tại đây.</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary">
                    <p className="font-semibold text-text-secondary">Không tìm thấy yêu cầu dữ liệu cá nhân nào phù hợp</p>
                    <p className="text-xs mt-1">Thử thay đổi bộ lọc tìm kiếm hoặc trạng thái.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || {
                    label: item.status,
                    className: 'badge-info',
                  }
                  const adminNoteText = item.adminNote || item.responseSummary
                  return (
                    <tr
                      key={item.id}
                      data-testid={`data-request-row-${item.id}`}
                      className="table-row-hover transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-xs text-text-secondary whitespace-nowrap">
                        #{item.id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-text-primary text-xs">
                          {REQUEST_TYPE_LABELS[item.requestType]?.label || item.requestType}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-text-secondary text-xs" title={item.details || item.reason}>
                        {item.details || item.reason || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(item.submittedAt || item.createdAt || item.requestedAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`${statusInfo.className} shrink-0`}>{statusInfo.label}</span>
                      </td>
                      <td className="py-3 px-4 text-xs max-w-sm">
                        {adminNoteText ? (
                          <div className="space-y-0.5">
                            <p className="text-text-primary font-medium truncate max-w-sm" title={adminNoteText}>
                              {adminNoteText}
                            </p>
                            {(item.handledAt || item.completedAt) && (
                              <p className="text-[11px] text-text-secondary whitespace-nowrap">
                                Xử lý ngày: {formatDate(item.handledAt || item.completedAt)} {item.handledBy ? `bởi ${item.handledBy}` : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-secondary italic">Chưa có phản hồi</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
