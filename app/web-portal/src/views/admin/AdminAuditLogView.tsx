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
import {
  ShieldCheck,
  FileText,
  Trash2,
  Search,
  RotateCcw,
  Eye,
  X,
  History,
} from 'lucide-react'
import { Button } from '@/components/common'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
        className="p-4 rounded-xl bg-slate-100 border border-border-subtle flex items-center justify-between gap-4 text-xs sm:text-sm text-text-secondary shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold text-text-primary">
              Chế độ Tra cứu Chỉ Đọc (Read-Only Compliance &amp; Audit Trail)
            </span>
            <span className="hidden md:inline text-text-secondary text-xs ml-2">
              — Toàn bộ nhật ký kiểm toán mang tính bất biến và được bảo vệ toàn vẹn theo quy chuẩn.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-border-subtle shrink-0 shadow-2xs">
          CHỈ ĐỌC
        </span>
      </div>

      {/* ── Tab Navigation Đồng bộ ── */}
      <div className="flex border-b border-border-subtle gap-6">
        <button
          type="button"
          data-testid="tab-audit-logs"
          onClick={() => handleTabChange('AUDIT_LOGS')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 ${
            activeTab === 'AUDIT_LOGS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký Kiểm toán</span>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
            activeTab === 'AUDIT_LOGS' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {auditTotal}
          </span>
        </button>

        <button
          type="button"
          data-testid="tab-dpo-consents"
          onClick={() => handleTabChange('DPO_CONSENTS')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 ${
            activeTab === 'DPO_CONSENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Hồ sơ Cam kết DPO</span>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
            activeTab === 'DPO_CONSENTS' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {dpoConsents.length}
          </span>
        </button>

        <button
          type="button"
          data-testid="tab-retention-schedule"
          onClick={() => handleTabChange('RETENTION_SCHEDULE')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 ${
            activeTab === 'RETENTION_SCHEDULE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Lịch Tiêu hủy 7 Ngày</span>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
            activeTab === 'RETENTION_SCHEDULE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {retentionItems.length}
          </span>
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
              <label htmlFor="filter-action" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Hành động
              </label>
              <input
                type="text"
                id="filter-action"
                data-testid="filter-action-input"
                placeholder="VD: KIOSK_REGISTERED..."
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="filter-email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Người thực hiện
              </label>
              <input
                type="text"
                id="filter-email"
                data-testid="filter-email-input"
                placeholder="VD: admin@company.com"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="filter-start-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                id="filter-start-date"
                data-testid="filter-start-date-input"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="filter-end-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                id="filter-end-date"
                data-testid="filter-end-date-input"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                data-testid="audit-search-btn"
                leftIcon={<Search className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Tìm kiếm
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                data-testid="audit-reset-btn"
                onClick={handleResetFilter}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Đặt lại
              </Button>
            </div>
          </form>

          {/* Bảng Audit Logs */}
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="audit-logs-table">
                <thead>
                  <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã #</th>
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
                      <td colSpan={7} className="py-12 text-center text-text-secondary">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                          <span>Đang nạp dữ liệu kiểm toán...</span>
                        </div>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-secondary">
                        Không tìm thấy sự kiện kiểm toán nào phù hợp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        data-testid={`audit-row-${log.id}`}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-xs text-text-secondary sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)] whitespace-nowrap">
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
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem diff</span>
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
          <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/70">
            <h3 className="text-sm font-bold text-slate-900">
              Danh Sách Ký Cam Kết Informed Consent
            </h3>
            <p className="text-xs text-slate-500">
              Lưu trữ bằng chứng đồng thuận theo quy định tại Nghị định 13/2023/NĐ-CP
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="dpo-consents-table">
              <thead>
                <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã NV</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Phiên Bản Consent</th>
                  <th className="py-3 px-4">Thời Điểm Ký Điện Tử</th>
                  <th className="py-3 px-4">Địa Chỉ IP Ký</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isConsentsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                        <span>Đang nạp hồ sơ cam kết...</span>
                      </div>
                    </td>
                  </tr>
                ) : dpoConsents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary">
                      Chưa có dữ liệu cam kết điện tử nào.
                    </td>
                  </tr>
                ) : (
                  dpoConsents.map((item) => (
                    <tr
                      key={item.id}
                      data-testid={`dpo-consent-row-${item.id}`}
                      className="hover:bg-slate-50/80 group transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)] whitespace-nowrap">
                        {item.employeeCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-text-primary">
                        {item.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                        {item.consentVersion}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap font-mono">
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
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed shadow-xs">
            <strong className="font-bold">Quy định Tiêu hủy Dữ liệu (Decree 13/2023 &amp; Decree 356/2025):</strong>{' '}
            Toàn bộ bản mã vector đặc trưng khuôn mặt của nhân viên nghỉ việc hoặc đã rút Informed Consent phải được xóa sạch hoàn toàn khỏi hệ thống trong thời hạn tối đa 7 ngày làm việc kể từ thời điểm có hiệu lực.
          </div>

          <div className="card-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900">
                Lịch Trình Tiêu Hủy Vector Sinh Trắc Học
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi thời hạn và trạng thái tiêu hủy dữ liệu đặc trưng khuôn mặt theo luật định
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="retention-schedule-table">
                <thead>
                  <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã NV</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Thời Điểm Rút / Nghỉ Việc</th>
                    <th className="py-3 px-4">Hạn Tiêu Hủy Dự Kiến (7 ngày)</th>
                    <th className="py-3 px-4">Thời Điểm Tiêu Hủy Thực Tế</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {isRetentionLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-secondary">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                          <span>Đang nạp lịch trình tiêu hủy...</span>
                        </div>
                      </td>
                    </tr>
                  ) : retentionItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-secondary">
                        Hiện không có dữ liệu sinh trắc nào đang trong lịch tiêu hủy.
                      </td>
                    </tr>
                  ) : (
                    retentionItems.map((item) => (
                      <tr
                        key={item.id}
                        data-testid={`retention-row-${item.id}`}
                        className="hover:bg-slate-50/80 group transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)] whitespace-nowrap">
                          {item.employeeCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-xs text-text-primary">
                          {item.fullName}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap font-mono">
                          {formatDateTime(item.resignedAt)}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-amber-700 whitespace-nowrap font-mono">
                          {formatDateTime(item.scheduledDestructionDate)}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap font-mono">
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
      <Dialog
        open={Boolean(selectedLogDetail)}
        onOpenChange={(open) => !open && setSelectedLogDetail(null)}
      >
        <DialogContent
          hideCloseButton
          usePortal={false}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        >
          {selectedLogDetail && (
            <>
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <DialogTitle className="text-base font-bold text-slate-900">
                  Chi tiết Kiểm toán #{selectedLogDetail.id} ({selectedLogDetail.action})
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Thời điểm:</span>{' '}
                  <span className="font-mono text-slate-800">{formatDateTime(selectedLogDetail.createdAt)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Người thực hiện:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedLogDetail.actorEmail}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Tài nguyên:</span>{' '}
                  <span className="font-mono text-slate-800">{selectedLogDetail.targetResource}</span>
                </div>

                {selectedLogDetail.oldValues && (
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500">Giá trị trước thay đổi:</span>
                    <pre className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs overflow-x-auto font-mono text-slate-700">
                      {JSON.stringify(selectedLogDetail.oldValues, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLogDetail.newValues && (
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500">Giá trị mới cập nhật:</span>
                    <pre className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs overflow-x-auto font-mono">
                      {JSON.stringify(selectedLogDetail.newValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedLogDetail(null)}
                >
                  Đóng
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
