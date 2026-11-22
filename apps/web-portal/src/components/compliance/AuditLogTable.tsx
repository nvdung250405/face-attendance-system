import React from 'react'
import { Search, RotateCcw, Eye } from 'lucide-react'
import { Button, TableSkeleton, PaginationBar } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import type { AuditLogItem } from '@/types'

interface AuditLogTableProps {
  filterAction: string
  onChangeFilterAction: (val: string) => void
  filterEmail: string
  onChangeFilterEmail: (val: string) => void
  filterStartDate: string
  onChangeFilterStartDate: (val: string) => void
  filterEndDate: string
  onChangeFilterEndDate: (val: string) => void
  onFilterSubmit: (e: React.FormEvent) => void
  onResetFilter: () => void
  auditLogs: AuditLogItem[]
  isAuditLoading: boolean
  auditTotal: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (newPage: number) => void
  onPageSizeChange: (newSize: number) => void
  onSelectLogDetail: (log: AuditLogItem) => void
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  filterAction,
  onChangeFilterAction,
  filterEmail,
  onChangeFilterEmail,
  filterStartDate,
  onChangeFilterStartDate,
  filterEndDate,
  onChangeFilterEndDate,
  onFilterSubmit,
  onResetFilter,
  auditLogs,
  isAuditLoading,
  auditTotal,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onSelectLogDetail,
}) => {
  return (
    <div className="space-y-4">
      {/* Bộ lọc tra cứu đa tiêu chí */}
      <form
        onSubmit={onFilterSubmit}
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
            maxLength={100}
            onChange={(e) => onChangeFilterAction(e.target.value)}
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
            maxLength={100}
            onChange={(e) => onChangeFilterEmail(e.target.value)}
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
            onChange={(e) => onChangeFilterStartDate(e.target.value)}
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
            onChange={(e) => onChangeFilterEndDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            data-testid="audit-search-btn"
            leftIcon={<Search className="w-3.5 h-3.5 shrink-0" />}
            className="flex-1"
          >
            Tìm kiếm
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="audit-reset-btn"
            onClick={onResetFilter}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 shrink-0" />}
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
                <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã #</th>
                <th scope="col" className="py-3 px-4">Thời Điểm</th>
                <th scope="col" className="py-3 px-4">Hành Động</th>
                <th scope="col" className="py-3 px-4">Người Thực Hiện</th>
                <th scope="col" className="py-3 px-4">Tài Nguyên Tác Động</th>
                <th scope="col" className="py-3 px-4">Địa Chỉ IP</th>
                <th scope="col" className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isAuditLoading ? (
                <TableSkeleton columns={7} rows={8} ariaLabel="Đang nạp dữ liệu kiểm toán..." />
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
                      {formatDateTime(log.createdAt || log.timestamp)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-text-primary font-medium">
                      <span
                        className="truncate max-w-[200px] block"
                        title={log.actorEmail || log.actor || log.actorUsername || '—'}
                      >
                        {log.actorEmail || log.actor || log.actorUsername || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-text-secondary">
                      <span
                        className="truncate max-w-[200px] block"
                        title={log.targetResource || log.target || log.resource || '—'}
                      >
                        {log.targetResource || log.target || log.resource || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-text-muted">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(log.oldValues || log.newValues) ? (
                        <button
                          type="button"
                          onClick={() => onSelectLogDetail(log)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
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

        {/* Phân trang Audit Logs */}
        <PaginationBar
          page={page}
          pageSize={pageSize}
          totalElements={auditTotal}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="sự kiện"
        />
      </div>
    </div>
  )
}
