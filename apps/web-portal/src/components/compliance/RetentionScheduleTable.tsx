import React from 'react'
import { TableSkeleton } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import type { RetentionScheduleItem } from '@/types'

interface RetentionScheduleTableProps {
  retentionItems: RetentionScheduleItem[]
  isRetentionLoading: boolean
}

export const RetentionScheduleTable: React.FC<RetentionScheduleTableProps> = ({
  retentionItems,
  isRetentionLoading,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed shadow-xs">
        <strong className="font-bold">Quy định Tiêu hủy Dữ liệu (Decree 13/2023 &amp; Decree 356/2025):</strong>{' '}
        Toàn bộ bản mã vector đặc trưng khuôn mặt của nhân viên nghỉ việc hoặc đã rút Informed Consent phải được xóa sạch hoàn toàn khỏi hệ thống trong thời hạn tối đa 20 ngày theo quy định tại Nghị định 356/2025/NĐ-CP kể từ thời điểm có hiệu lực.
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
                <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã NV</th>
                <th scope="col" className="py-3 px-4">Họ và Tên</th>
                <th scope="col" className="py-3 px-4">Thời Điểm Rút / Nghỉ Việc</th>
                <th scope="col" className="py-3 px-4">Hạn Tiêu Hủy Dự Kiến (20 ngày)</th>
                <th scope="col" className="py-3 px-4">Thời Điểm Tiêu Hủy Thực Tế</th>
                <th scope="col" className="py-3 px-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isRetentionLoading ? (
                <TableSkeleton columns={6} rows={5} ariaLabel="Đang nạp lịch trình tiêu hủy..." />
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
                      <span className="truncate max-w-[200px] block" title={item.fullName}>
                        {item.fullName}
                      </span>
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
  )
}
