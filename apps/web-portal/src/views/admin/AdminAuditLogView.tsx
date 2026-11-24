/**
 * AdminAuditLogView: Màn hình Nhật ký Kiểm toán & Tuân thủ DPO Chỉ Đọc
 * (SOL-WEB-012, UI-WEB-012, UXD-WEB-007, APD-WEB-011, BLD-WEB-021, TASK-WEB-027, ARCH-W-01).
 *
 * Presenter view kết nối useAdminAuditLog hook (Container/Presenter pattern).
 */

import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import {
  ShieldCheck,
  FileText,
  Trash2,
  History,
  UserX,
  ClipboardList,
} from 'lucide-react'
import {
  AuditLogTable,
  DpoConsentsTable,
  RetentionScheduleTable,
  DpoConsentWithdrawalsTable,
  DpoDataRequestsReviewTable,
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
    consentsPage,
    consentsPageSize,
    consentsTotal,
    consentsTotalPages,
    loadDpoConsents,
    retentionItems,
    isRetentionLoading,
    retentionPage,
    retentionPageSize,
    retentionTotal,
    retentionTotalPages,
    loadRetentionSchedule,
    dpoWithdrawals,
    isWithdrawalsLoading,
    withdrawalsPage,
    withdrawalsPageSize,
    withdrawalsTotal,
    withdrawalsTotalPages,
    loadDpoConsentWithdrawals,
    dpoDataRequests,
    isDataRequestsLoading,
    dataRequestsPage,
    dataRequestsPageSize,
    dataRequestsTotal,
    dataRequestsTotalPages,
    loadDpoDataRequests,
    errorMessage,
    selectedLogDetail,
    setSelectedLogDetail,
    loadAuditLogs,
    handleUpdateDataRequest,
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

      {/* ── Tab Navigation Đồng bộ Radix Accessible Tabs (F-TECH-13) ── */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(val) => handleTabChange(val as ComplianceTab)}
        className="space-y-6"
      >
        <Tabs.List
          aria-label="Các danh mục kiểm toán và tuân thủ DPO"
          className="flex border-b border-border-subtle gap-6 overflow-x-auto"
        >
          <Tabs.Trigger
            value="AUDIT_LOGS"
            data-testid="tab-audit-logs"
            onClick={() => handleTabChange('AUDIT_LOGS')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 ${
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
          </Tabs.Trigger>

          <Tabs.Trigger
            value="DPO_CONSENTS"
            data-testid="tab-dpo-consents"
            onClick={() => handleTabChange('DPO_CONSENTS')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 ${
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
          </Tabs.Trigger>

          <Tabs.Trigger
            value="RETENTION_SCHEDULE"
            data-testid="tab-retention-schedule"
            onClick={() => handleTabChange('RETENTION_SCHEDULE')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              activeTab === 'RETENTION_SCHEDULE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Lịch Tiêu hủy 20 Ngày</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
              activeTab === 'RETENTION_SCHEDULE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {retentionItems.length}
            </span>
          </Tabs.Trigger>

          <Tabs.Trigger
            value="DPO_WITHDRAWALS"
            data-testid="tab-dpo-withdrawals"
            onClick={() => handleTabChange('DPO_WITHDRAWALS')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              activeTab === 'DPO_WITHDRAWALS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserX className="w-4 h-4 shrink-0" />
            <span>Rút Cam Kết</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
              activeTab === 'DPO_WITHDRAWALS' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {dpoWithdrawals.length}
            </span>
          </Tabs.Trigger>

          <Tabs.Trigger
            value="DPO_DATA_REQUESTS"
            data-testid="tab-dpo-data-requests"
            onClick={() => handleTabChange('DPO_DATA_REQUESTS')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              activeTab === 'DPO_DATA_REQUESTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Yêu Cầu Dữ Liệu (DSR)</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
              activeTab === 'DPO_DATA_REQUESTS' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {dpoDataRequests.length}
            </span>
          </Tabs.Trigger>
        </Tabs.List>

        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200"
          >
            {errorMessage}
          </div>
        )}

        {/* ── TAB 1: NHẬT KÝ KIỂM TOÁN HỆ THỐNG ── */}
        <Tabs.Content value="AUDIT_LOGS" className="focus-visible:outline-hidden">
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
        </Tabs.Content>

        {/* ── TAB 2: HỒ SƠ CAM KẾT DPO ── */}
        <Tabs.Content value="DPO_CONSENTS" className="focus-visible:outline-hidden">
          <DpoConsentsTable
            dpoConsents={dpoConsents}
            isConsentsLoading={isConsentsLoading}
            page={consentsPage}
            pageSize={consentsPageSize}
            totalElements={consentsTotal}
            totalPages={consentsTotalPages}
            onPageChange={(newPage) => loadDpoConsents(newPage, consentsPageSize)}
            onPageSizeChange={(newSize) => loadDpoConsents(0, newSize)}
          />
        </Tabs.Content>

        {/* ── TAB 3: LỊCH TIÊU HỦY DỮ LIỆU SINH TRẮC 20 NGÀY ── */}
        <Tabs.Content value="RETENTION_SCHEDULE" className="focus-visible:outline-hidden">
          <RetentionScheduleTable
            retentionItems={retentionItems}
            isRetentionLoading={isRetentionLoading}
            page={retentionPage}
            pageSize={retentionPageSize}
            totalElements={retentionTotal}
            totalPages={retentionTotalPages}
            onPageChange={(newPage) => loadRetentionSchedule(newPage, retentionPageSize)}
            onPageSizeChange={(newSize) => loadRetentionSchedule(0, newSize)}
          />
        </Tabs.Content>

        {/* ── TAB 4: DANH SÁCH RÚT CAM KẾT DPO ── */}
        <Tabs.Content value="DPO_WITHDRAWALS" className="focus-visible:outline-hidden">
          <DpoConsentWithdrawalsTable
            dpoWithdrawals={dpoWithdrawals}
            isWithdrawalsLoading={isWithdrawalsLoading}
            page={withdrawalsPage}
            pageSize={withdrawalsPageSize}
            totalElements={withdrawalsTotal}
            totalPages={withdrawalsTotalPages}
            onPageChange={(newPage) => loadDpoConsentWithdrawals(newPage, withdrawalsPageSize)}
            onPageSizeChange={(newSize) => loadDpoConsentWithdrawals(0, newSize)}
          />
        </Tabs.Content>

        {/* ── TAB 5: YÊU CẦU QUYỀN CHỦ THỂ DỮ LIỆU (DSR) ── */}
        <Tabs.Content value="DPO_DATA_REQUESTS" className="focus-visible:outline-hidden">
          <DpoDataRequestsReviewTable
            dataRequests={dpoDataRequests}
            isLoading={isDataRequestsLoading}
            onUpdateStatus={handleUpdateDataRequest}
            page={dataRequestsPage}
            pageSize={dataRequestsPageSize}
            totalElements={dataRequestsTotal}
            totalPages={dataRequestsTotalPages}
            onPageChange={(newPage) => loadDpoDataRequests(newPage, dataRequestsPageSize)}
            onPageSizeChange={(newSize) => loadDpoDataRequests(0, newSize)}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* ── Modal Chi Tiết Diff Giá Trị Cũ / Mới ── */}
      <AuditDiffModal
        selectedLogDetail={selectedLogDetail}
        onClose={() => setSelectedLogDetail(null)}
      />
    </div>
  )
}
