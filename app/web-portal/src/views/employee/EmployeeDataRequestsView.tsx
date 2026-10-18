/**
 * EmployeeDataRequestsView: Màn hình Yêu cầu Dữ liệu Cá nhân của Nhân viên
 * (SOL-WEB-009, APD-WEB-008, API-WEB-014, DD-WEB-015, BLD-WEB-020, TASK-WEB-026).
 *
 * Thực thi các quyền của chủ thể dữ liệu theo Nghị định 13/2023/NĐ-CP:
 * - 4 Loại yêu cầu: ACCESS, RECTIFICATION, ERASURE, EXPORT.
 * - Form gửi yêu cầu mới tới Nhân viên Bảo vệ Dữ liệu (DPO).
 * - Bảng theo dõi tiến độ xử lý và phản hồi chính thức từ DPO.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { dataSubjectService } from '@/services/dataSubjectService'
import type { DataRequestType, DataSubjectRequestItem, DataRequestStatus } from '@/types'

const REQUEST_TYPE_LABELS: Record<DataRequestType, { label: string; desc: string }> = {
  ACCESS: {
    label: 'Tiếp cận dữ liệu (Access)',
    desc: 'Yêu cầu trích xuất hồ sơ cá nhân và lịch sử điểm danh đang lưu trữ.',
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

const STATUS_CONFIG: Record<DataRequestStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Chờ tiếp nhận',
    className: 'badge-warning',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    className: 'badge-info',
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

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export const EmployeeDataRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<DataSubjectRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    let ignore = false
    dataSubjectService
      .getEmployeeDataRequests()
      .then((data) => {
        if (!ignore) {
          setRequests(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          const error = err as { message?: string }
          setErrorMessage(error.message || 'Không thể tải danh sách yêu cầu dữ liệu.')
          setIsLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

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
        <button
          type="button"
          onClick={loadRequests}
          disabled={isLoading}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2"
          title="Làm mới danh sách"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>

      {/* ── Khung Gửi Yêu Cầu Mới ── */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Gửi Yêu Cầu Mới tới DPO</h2>
            <p className="text-xs text-text-muted">Nhân viên Bảo vệ Dữ liệu (DPO) sẽ xử lý trong thời hạn luật định</p>
          </div>
        </div>

        {formSuccessMessage && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-sm flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{formSuccessMessage}</span>
          </div>
        )}

        {formErrorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
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
                <option value="RECTIFICATION">{REQUEST_TYPE_LABELS.RECTIFICATION.label}</option>
                <option value="ERASURE">{REQUEST_TYPE_LABELS.ERASURE.label}</option>
                <option value="EXPORT">{REQUEST_TYPE_LABELS.EXPORT.label}</option>
              </select>
              <p className="text-xs text-text-muted mt-1">
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
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mô tả cụ thể thông tin bạn muốn tiếp cận, đính chính hoặc yêu cầu xử lý..."
                className="input-base text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              data-testid="submit-data-request-btn"
              disabled={isSubmitting || !details.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Gửi yêu cầu đến DPO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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
                <th className="py-3 px-4 font-semibold">Mã YC</th>
                <th className="py-3 px-4 font-semibold">Loại Yêu Cầu</th>
                <th className="py-3 px-4 font-semibold">Nội Dung Chi Tiết</th>
                <th className="py-3 px-4 font-semibold">Thời Điểm Gửi</th>
                <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                <th className="py-3 px-4 font-semibold">Phản Hồi DPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <div className="inline-flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5 text-brand-primary" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Đang nạp dữ liệu yêu cầu...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <p className="font-semibold text-text-secondary">Bạn chưa gửi yêu cầu dữ liệu cá nhân nào</p>
                    <p className="text-xs mt-1">Các yêu cầu tiếp cận, chỉnh sửa, xóa hoặc xuất dữ liệu sẽ hiển thị tại đây.</p>
                  </td>
                </tr>
              ) : (
                requests.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || {
                    label: item.status,
                    className: 'badge-info',
                  }
                  return (
                    <tr
                      key={item.id}
                      data-testid={`data-request-row-${item.id}`}
                      className="table-row-hover transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-xs text-text-secondary">
                        #{item.id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-text-primary text-xs">
                          {REQUEST_TYPE_LABELS[item.requestType]?.label || item.requestType}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-text-secondary text-xs" title={item.details}>
                        {item.details}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">
                        {formatDate(item.submittedAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={statusInfo.className}>{statusInfo.label}</span>
                      </td>
                      <td className="py-3 px-4 text-xs max-w-sm">
                        {item.adminNote ? (
                          <div className="space-y-0.5">
                            <p className="text-text-primary font-medium">{item.adminNote}</p>
                            {item.handledAt && (
                              <p className="text-[11px] text-text-muted">
                                Xử lý ngày: {formatDate(item.handledAt)} {item.handledBy ? `bởi ${item.handledBy}` : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted italic">Chưa có phản hồi</span>
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
