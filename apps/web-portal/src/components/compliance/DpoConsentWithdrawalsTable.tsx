import React from 'react'
import { TableSkeleton, PaginationBar } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import type { DpoConsentWithdrawalItem } from '@/types'

interface DpoConsentWithdrawalsTableProps {
  dpoWithdrawals: DpoConsentWithdrawalItem[]
  isWithdrawalsLoading: boolean
  page?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export const DpoConsentWithdrawalsTable: React.FC<DpoConsentWithdrawalsTableProps> = ({
  dpoWithdrawals,
  isWithdrawalsLoading,
  page = 0,
  pageSize = 20,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
  const effectiveTotal = totalElements ?? dpoWithdrawals.length
  const effectiveTotalPages = totalPages ?? Math.max(1, Math.ceil(effectiveTotal / pageSize))
  return (
    <div className="space-y-4">
      {/* ── Banner Quy định 20 Ngày Tiêu Hủy Khi Rút Consent ── */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed shadow-xs">
        <strong className="font-bold">Quy định Tiêu hủy khi Rút Đồng thuận (Decree 13/2023 &amp; Decree 356/2025):</strong>{' '}
        Khi nhân sự thực hiện quyền rút lại cam kết Informed Consent, toàn bộ bản mã vector đặc trưng khuôn mặt (ArcFace 512D) phải được cách ly và tiêu hủy vĩnh viễn khỏi hệ thống trong thời hạn tối đa 20 ngày theo luật định.
      </div>

      <div className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900">
            Danh Sách Rút Cam Kết Informed Consent
          </h3>
          <p className="text-xs text-slate-500">
            Theo dõi yêu cầu rút đồng thuận sinh trắc và hạn chót tiêu hủy 20 ngày theo Nghị định 356/2025/NĐ-CP
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="dpo-consent-withdrawals-table">
            <thead>
              <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">
                  Mã NV
                </th>
                <th scope="col" className="py-3 px-4">Họ và Tên</th>
                <th scope="col" className="py-3 px-4">Thời Điểm Rút</th>
                <th scope="col" className="py-3 px-4">Hạn Tiêu Hủy Sinh Trắc (20 ngày)</th>
                <th scope="col" className="py-3 px-4">Lý Do Rút Cam Kết</th>
                <th scope="col" className="py-3 px-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isWithdrawalsLoading ? (
                <TableSkeleton columns={6} rows={5} ariaLabel="Đang nạp danh sách rút cam kết..." />
              ) : dpoWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary">
                    Chưa có yêu cầu rút cam kết Informed Consent nào.
                  </td>
                </tr>
              ) : (
                dpoWithdrawals.map((item) => {
                  const isCompleted = item.status === 'COMPLETED' || item.status === 'DISPOSED'
                  const isCancelled = item.status === 'CANCELLED'

                  return (
                    <tr
                      key={item.id}
                      data-testid={`dpo-withdrawal-row-${item.id}`}
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
                      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap font-mono">
                        {formatDateTime(item.withdrawnAt)}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-amber-700 whitespace-nowrap font-mono">
                        {formatDateTime(item.biometricDisposalDueAt)}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary max-w-[260px] truncate" title={item.reason || '—'}>
                        {item.reason || <span className="text-text-muted italic">Không nêu lý do</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={
                            isCompleted
                              ? 'badge-success'
                              : isCancelled
                                ? 'badge-slate'
                                : 'badge-warning'
                          }
                        >
                          {isCompleted
                            ? 'ĐÃ TIÊU HỦY'
                            : isCancelled
                              ? 'ĐÃ HỦY'
                              : 'CHỜ TIÊU HỦY'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang DPO Withdrawals (F-SPEC-04) */}
        <PaginationBar
          page={page}
          pageSize={pageSize}
          totalElements={effectiveTotal}
          totalPages={effectiveTotalPages}
          onPageChange={onPageChange ?? (() => {})}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="yêu cầu"
        />
      </div>
    </div>
  )
}
