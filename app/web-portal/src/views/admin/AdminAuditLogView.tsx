/**
 * AdminAuditLogView: Màn hình Nhật ký Kiểm toán & Tuân thủ DPO Chỉ Đọc
 * (SOL-WEB-012, UI-WEB-012, UXD-WEB-007, APD-WEB-011, BLD-WEB-021, TASK-WEB-027).
 *
 * Tính năng chính:
 * 1. Chế độ tra cứu chỉ đọc (Read-only Compliance Log) phục vụ vai trò DPO và Quản trị viên.
 * 2. Tab 1: Nhật ký kiểm toán hệ thống (Audit Logs) có bộ lọc đa chiều (Hành động, Email, Ngày).
 * 3. Tab 2: Hồ sơ lưu trữ Informed Consent của nhân viên (DPO Consents).
 * 4. Tab 3: Lịch trình tiêu hủy dữ liệu sinh trắc học 7 ngày (Retention Schedule) theo NĐ 13/2023.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { complianceAdminService } from '@/services/complianceAdminService'
import type {
  AuditLogItem,
  DpoConsentAuditItem,
  RetentionScheduleItem,
  AuditLogQueryCriteria,
} from '@/types'

export type ComplianceTab = 'AUDIT_LOGS' | 'DPO_CONSENTS' | 'RETENTION_SCHEDULE'

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—'
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

export const AdminAuditLogView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('AUDIT_LOGS')

  // Tab 1: Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [isAuditLoading, setIsAuditLoading] = useState(true)
  const [auditTotal, setAuditTotal] = useState(0)
  const [filterAction, setFilterAction] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Tab 2: DPO Consents state
  const [dpoConsents, setDpoConsents] = useState<DpoConsentAuditItem[]>([])
  const [isConsentsLoading, setIsConsentsLoading] = useState(false)

  // Tab 3: Retention Schedule state
  const [retentionItems, setRetentionItems] = useState<RetentionScheduleItem[]>([])
  const [isRetentionLoading, setIsRetentionLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogItem | null>(null)

  // 1. Tải Audit Logs
  const loadAuditLogs = useCallback(async (criteria?: AuditLogQueryCriteria) => {
    try {
      setIsAuditLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getAuditLogs(criteria)
      setAuditLogs(data.content)
      setAuditTotal(data.totalElements)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải nhật ký kiểm toán.')
    } finally {
      setIsAuditLoading(false)
    }
  }, [])

  // 2. Tải DPO Consents
  const loadDpoConsents = useCallback(async () => {
    try {
      setIsConsentsLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getDpoConsents()
      setDpoConsents(data)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải danh sách cam kết DPO.')
    } finally {
      setIsConsentsLoading(false)
    }
  }, [])

  // 3. Tải Retention Schedule
  const loadRetentionSchedule = useCallback(async () => {
    try {
      setIsRetentionLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getDpoRetentionSchedule()
      setRetentionItems(data)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải lịch trình tiêu hủy dữ liệu.')
    } finally {
      setIsRetentionLoading(false)
    }
  }, [])

  // Tải dữ liệu ban đầu
  useEffect(() => {
    let ignore = false
    complianceAdminService
      .getAuditLogs()
      .then((data) => {
        if (!ignore) {
          setAuditLogs(data.content)
          setAuditTotal(data.totalElements)
          setIsAuditLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          const error = err as { message?: string }
          setErrorMessage(error.message || 'Không thể tải nhật ký kiểm toán.')
          setIsAuditLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const handleTabChange = (tab: ComplianceTab) => {
    setActiveTab(tab)
    if (tab === 'AUDIT_LOGS' && auditLogs.length === 0) {
      loadAuditLogs()
    } else if (tab === 'DPO_CONSENTS' && dpoConsents.length === 0) {
      loadDpoConsents()
    } else if (tab === 'RETENTION_SCHEDULE' && retentionItems.length === 0) {
      loadRetentionSchedule()
    }
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadAuditLogs({
      action: filterAction.trim() || undefined,
      actorEmail: filterEmail.trim() || undefined,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined,
    })
  }

  const handleResetFilter = () => {
    setFilterAction('')
    setFilterEmail('')
    setFilterStartDate('')
    setFilterEndDate('')
    loadAuditLogs()
  }

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang ── */}
      <div>
        <h1 className="page-title">Nhật ký Kiểm toán &amp; Tuân thủ DPO</h1>
        <p className="page-subtitle">
          Tra cứu toàn diện các sự kiện hệ thống, cam kết Informed Consent và lịch tiêu hủy dữ liệu sinh trắc học (NĐ 13/2023 &amp; NĐ 356/2025)
        </p>
      </div>

      {/* ── Banner Chế độ Chỉ Đọc (UXD-WEB-007, DD-WEB-019) ── */}
      <div
        role="status"
        data-testid="read-only-compliance-banner"
        className="p-4 rounded-xl bg-slate-100 border border-border-subtle flex items-center justify-between gap-4 text-xs sm:text-sm text-text-secondary"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-semibold text-text-primary">
            Chế độ Tra cứu Chỉ Đọc (Read-Only Compliance &amp; Audit Trail)
          </span>
          <span className="hidden md:inline text-text-muted">
            — Toàn bộ nhật ký kiểm toán mang tính bất biến và được bảo vệ toàn vẹn.
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-text-primary border border-border-subtle shrink-0">
          CHỈ ĐỌC
        </span>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex border-b border-border-subtle gap-2">
        <button
          type="button"
          data-testid="tab-audit-logs"
          onClick={() => handleTabChange('AUDIT_LOGS')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'AUDIT_LOGS'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Nhật ký Kiểm toán ({auditTotal})
        </button>
        <button
          type="button"
          data-testid="tab-dpo-consents"
          onClick={() => handleTabChange('DPO_CONSENTS')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'DPO_CONSENTS'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Hồ sơ Cam kết DPO ({dpoConsents.length})
        </button>
        <button
          type="button"
          data-testid="tab-retention-schedule"
          onClick={() => handleTabChange('RETENTION_SCHEDULE')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'RETENTION_SCHEDULE'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Lịch Tiêu hủy 7 Ngày ({retentionItems.length})
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
          {errorMessage}
        </div>
      )}

      {/* ── TAB 1: NHẬT KÝ KIỂM TOÁN HỆ THỐNG ── */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          {/* Bộ lọc tra cứu đa tiêu chí */}
          <form
            onSubmit={handleFilterSubmit}
            data-testid="audit-filter-form"
            className="card-surface p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label htmlFor="filter-action" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Hành động
              </label>
              <input
                type="text"
                id="filter-action"
                data-testid="filter-action-input"
                placeholder="VD: KIOSK_REGISTERED..."
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="input-base text-xs h-9"
              />
            </div>

            <div>
              <label htmlFor="filter-email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Người thực hiện
              </label>
              <input
                type="text"
                id="filter-email"
                data-testid="filter-email-input"
                placeholder="VD: admin@company.com"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="input-base text-xs h-9"
              />
            </div>

            <div>
              <label htmlFor="filter-start-date" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                id="filter-start-date"
                data-testid="filter-start-date-input"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="input-base text-xs h-9"
              />
            </div>

            <div>
              <label htmlFor="filter-end-date" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                id="filter-end-date"
                data-testid="filter-end-date-input"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="input-base text-xs h-9"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                data-testid="audit-search-btn"
                className="btn-primary text-xs h-9 flex-1"
              >
                Tìm kiếm
              </button>
              <button
                type="button"
                data-testid="audit-reset-btn"
                onClick={handleResetFilter}
                className="btn-secondary text-xs h-9 px-3"
              >
                Đặt lại
              </button>
            </div>
          </form>

          {/* Bảng Audit Logs */}
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="audit-logs-table">
                <thead>
                  <tr className="table-sticky-header">
                    <th className="py-3 px-4">Mã #</th>
                    <th className="py-3 px-4">Thời Điểm</th>
                    <th className="py-3 px-4">Hành Động</th>
                    <th className="py-3 px-4">Người Thực Hiện</th>
                    <th className="py-3 px-4">Tài Nguyên Tác Động</th>
                    <th className="py-3 px-4">Địa Chỉ IP</th>
                    <th className="py-3 px-4 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isAuditLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-muted">
                        Đang nạp dữ liệu kiểm toán...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-muted">
                        Không tìm thấy sự kiện kiểm toán nào phù hợp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        data-testid={`audit-row-${log.id}`}
                        className="table-row-hover transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-xs text-text-secondary">
                          #{log.id}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-primary font-medium">
                          {log.actorEmail}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-text-secondary">
                          {log.targetResource}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-text-muted">
                          {log.ipAddress || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {(log.oldValues || log.newValues) ? (
                            <button
                              type="button"
                              onClick={() => setSelectedLogDetail(log)}
                              className="text-xs text-brand-primary hover:underline font-medium"
                            >
                              Xem diff
                            </button>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: HỒ SƠ CAM KẾT DPO ── */}
      {activeTab === 'DPO_CONSENTS' && (
        <div className="card-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
            <h3 className="text-base font-bold text-text-primary">
              Danh Sách Ký Cam Kết Informed Consent
            </h3>
            <p className="text-xs text-text-muted">
              Lưu trữ bằng chứng đồng thuận theo quy định tại Nghị định 13/2023/NĐ-CP
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="dpo-consents-table">
              <thead>
                <tr className="table-sticky-header">
                  <th className="py-3 px-4 font-semibold">Mã NV</th>
                  <th className="py-3 px-4 font-semibold">Họ và Tên</th>
                  <th className="py-3 px-4 font-semibold">Phiên Bản Consent</th>
                  <th className="py-3 px-4 font-semibold">Thời Điểm Ký Điện Tử</th>
                  <th className="py-3 px-4 font-semibold">Địa Chỉ IP Ký</th>
                  <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isConsentsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      Đang nạp hồ sơ cam kết...
                    </td>
                  </tr>
                ) : dpoConsents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      Chưa có dữ liệu cam kết điện tử nào.
                    </td>
                  </tr>
                ) : (
                  dpoConsents.map((item) => (
                    <tr
                      key={item.id}
                      data-testid={`dpo-consent-row-${item.id}`}
                      className="table-row-hover transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary">
                        {item.employeeCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-text-primary">
                        {item.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                        {item.consentVersion}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                        {formatDateTime(item.agreedAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-muted">
                        {item.ipAddress}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={
                            item.status === 'ACTIVE'
                              ? 'badge-success'
                              : 'badge-warning'
                          }
                        >
                          {item.status === 'ACTIVE' ? 'HIỆU LỰC' : 'ĐÃ RÚT CAM KẾT'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: LỊCH TIÊU HỦY DỮ LIỆU SINH TRẮC 7 NGÀY ── */}
      {activeTab === 'RETENTION_SCHEDULE' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed">
            <strong className="font-bold">Quy định Tiêu hủy Dữ liệu (Decree 13/2023 &amp; Decree 356/2025):</strong>{' '}
            Toàn bộ bản mã vector đặc trưng khuôn mặt của nhân viên nghỉ việc hoặc đã rút Informed Consent phải được xóa sạch hoàn toàn khỏi hệ thống trong thời hạn tối đa 7 ngày làm việc kể từ thời điểm có hiệu lực.
          </div>

          <div className="card-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
              <h3 className="text-base font-bold text-text-primary">
                Lịch Trình Tiêu Hủy Vector Sinh Trắc Học
              </h3>
              <p className="text-xs text-text-muted">
                Theo dõi thời hạn và trạng thái tiêu hủy dữ liệu đặc trưng khuôn mặt theo luật định
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="retention-schedule-table">
                <thead>
                  <tr className="table-sticky-header">
                    <th className="py-3 px-4 font-semibold">Mã NV</th>
                    <th className="py-3 px-4 font-semibold">Họ và Tên</th>
                    <th className="py-3 px-4 font-semibold">Thời Điểm Rút / Nghỉ Việc</th>
                    <th className="py-3 px-4 font-semibold">Hạn Tiêu Hủy Dự Kiến (7 ngày)</th>
                    <th className="py-3 px-4 font-semibold">Thời Điểm Tiêu Hủy Thực Tế</th>
                    <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isRetentionLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted">
                        Đang nạp lịch trình tiêu hủy...
                      </td>
                    </tr>
                  ) : retentionItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted">
                        Hiện không có dữ liệu sinh trắc nào đang trong lịch tiêu hủy.
                      </td>
                    </tr>
                  ) : (
                    retentionItems.map((item) => (
                      <tr
                        key={item.id}
                        data-testid={`retention-row-${item.id}`}
                        className="table-row-hover transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary">
                          {item.employeeCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-xs text-text-primary">
                          {item.fullName}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                          {formatDateTime(item.resignedAt)}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-amber-700 whitespace-nowrap">
                          {formatDateTime(item.scheduledDestructionDate)}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                          {formatDateTime(item.actualDestructionDate)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={
                              item.status === 'COMPLETED'
                                ? 'badge-success'
                                : item.status === 'SCHEDULED'
                                  ? 'badge-warning'
                                  : 'badge-danger'
                            }
                          >
                            {item.status === 'COMPLETED'
                              ? 'ĐÃ TIÊU HỦY'
                              : item.status === 'SCHEDULED'
                                ? 'ĐANG CHỜ TIÊU HỦY'
                                : 'ĐÃ HỦY BỎ'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Chi Tiết Diff Giá Trị Cũ / Mới ── */}
      {selectedLogDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">
                Chi tiết Kiểm toán #{selectedLogDetail.id} ({selectedLogDetail.action})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-text-secondary">Thời điểm:</span>{' '}
                {formatDateTime(selectedLogDetail.createdAt)}
              </div>
              <div>
                <span className="font-semibold text-text-secondary">Người thực hiện:</span>{' '}
                {selectedLogDetail.actorEmail}
              </div>
              <div>
                <span className="font-semibold text-text-secondary">Tài nguyên:</span>{' '}
                {selectedLogDetail.targetResource}
              </div>

              {selectedLogDetail.oldValues && (
                <div className="space-y-1">
                  <span className="font-semibold text-text-secondary">Giá trị trước thay đổi:</span>
                  <pre className="p-2.5 bg-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedLogDetail.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLogDetail.newValues && (
                <div className="space-y-1">
                  <span className="font-semibold text-text-secondary">Giá trị mới cập nhật:</span>
                  <pre className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedLogDetail.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="btn-secondary text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
