import React from 'react'
import { TableSkeleton, PaginationBar } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import type { DpoConsentAuditItem } from '@/types'

interface DpoConsentsTableProps {
  dpoConsents: DpoConsentAuditItem[]
  isConsentsLoading: boolean
  page?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export const DpoConsentsTable: React.FC<DpoConsentsTableProps> = ({
  dpoConsents,
  isConsentsLoading,
  page = 0,
  pageSize = 20,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
  const effectiveTotal = totalElements ?? dpoConsents.length
  const effectiveTotalPages = totalPages ?? Math.max(1, Math.ceil(effectiveTotal / pageSize))
  return (
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
              <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã NV</th>
              <th scope="col" className="py-3 px-4">Họ và Tên</th>
              <th scope="col" className="py-3 px-4">Phiên Bản Consent</th>
              <th scope="col" className="py-3 px-4">Thời Điểm Ký Điện Tử</th>
              <th scope="col" className="py-3 px-4">Địa Chỉ IP Ký</th>
              <th scope="col" className="py-3 px-4">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isConsentsLoading ? (
              <TableSkeleton columns={6} rows={5} ariaLabel="Đang nạp hồ sơ cam kết..." />
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
                    <span className="truncate max-w-[200px] block" title={item.fullName}>
                      {item.fullName}
                    </span>
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

      {/* Phân trang DPO Consents (F-SPEC-04) */}
      <PaginationBar
        page={page}
        pageSize={pageSize}
        totalElements={effectiveTotal}
        totalPages={effectiveTotalPages}
        onPageChange={onPageChange ?? (() => {})}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50, 100]}
        itemLabel="hồ sơ"
      />
    </div>
  )
}
