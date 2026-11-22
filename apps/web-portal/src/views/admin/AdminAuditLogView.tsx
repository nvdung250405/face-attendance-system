/**
 * AdminAuditLogView: Màn hình Nhật ký Kiểm toán & Tuân thủ DPO Chỉ Đọc
 * (SOL-WEB-012, UI-WEB-012, UXD-WEB-007, APD-WEB-011, BLD-WEB-021, TASK-WEB-027, ARCH-W-01).
 *
 * Presenter view kết nối useAdminAuditLog hook (Container/Presenter pattern).
 */

import React from 'react'
import {
  ShieldCheck,
  FileText,
  Trash2,
  History,
} from 'lucide-react'
import {
  AuditLogTable,
  DpoConsentsTable,
  RetentionScheduleTable,
  AuditDiffModal,
} from '@/components/compliance'
import { useAdminAuditLog, type ComplianceTab } from './hooks/useAdminAuditLog'

export { type ComplianceTab }

export const AdminAuditLogView: React.FC = () => {
  const {
    activeTab,
    auditLogs,
    isAuditLoading,
    auditTotal,
    page,
    pageSize,
    totalPages,
    filterAction,
    setFilterAction,
    filterEmail,
    setFilterEmail,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    dpoConsents,
    isConsentsLoading,
    retentionItems,
    isRetentionLoading,
    errorMessage,
    selectedLogDetail,
    setSelectedLogDetail,
    loadAuditLogs,
    handleTabChange,
    handleFilterSubmit,
    handleResetFilter,
  } = useAdminAuditLog()

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
          <History className="w-4 h-4 shrink-0" />
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
          <FileText className="w-4 h-4 shrink-0" />
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
          <Trash2 className="w-4 h-4 shrink-0" />
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
        <AuditLogTable
          filterAction={filterAction}
          onChangeFilterAction={setFilterAction}
          filterEmail={filterEmail}
          onChangeFilterEmail={setFilterEmail}
          filterStartDate={filterStartDate}
          onChangeFilterStartDate={setFilterStartDate}
          filterEndDate={filterEndDate}
          onChangeFilterEndDate={setFilterEndDate}
          onFilterSubmit={handleFilterSubmit}
          onResetFilter={handleResetFilter}
          auditLogs={auditLogs}
          isAuditLoading={isAuditLoading}
          auditTotal={auditTotal}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={(newPage) => loadAuditLogs(newPage, pageSize)}
          onPageSizeChange={(newSize) => {
            loadAuditLogs(0, newSize)
          }}
          onSelectLogDetail={setSelectedLogDetail}
        />
      )}

      {/* ── TAB 2: HỒ SƠ CAM KẾT DPO ── */}
      {activeTab === 'DPO_CONSENTS' && (
        <DpoConsentsTable
          dpoConsents={dpoConsents}
          isConsentsLoading={isConsentsLoading}
        />
      )}

      {/* ── TAB 3: LỊCH TIÊU HỦY DỮ LIỆU SINH TRẮC 7 NGÀY ── */}
      {activeTab === 'RETENTION_SCHEDULE' && (
        <RetentionScheduleTable
          retentionItems={retentionItems}
          isRetentionLoading={isRetentionLoading}
        />
      )}

      {/* ── Modal Chi Tiết Diff Giá Trị Cũ / Mới ── */}
      <AuditDiffModal
        selectedLogDetail={selectedLogDetail}
        onClose={() => setSelectedLogDetail(null)}
      />
    </div>
  )
}
