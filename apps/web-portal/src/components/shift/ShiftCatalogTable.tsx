import React from 'react'
import { Clock, Edit2 } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { isOvernightShift } from '@/utils/date'
import type { ShiftItem } from '@/types'

export interface ShiftCatalogTableProps {
  shifts: ShiftItem[]
  isLoadingShifts: boolean
  isAdjustmentLocked: boolean
  togglingShiftId?: number | null
  onEditShift: (shift: ShiftItem) => void
  onToggleShiftActive: (shift: ShiftItem) => void
}

export const ShiftCatalogTable: React.FC<ShiftCatalogTableProps> = ({
  shifts,
  isLoadingShifts,
  isAdjustmentLocked,
  togglingShiftId,
  onEditShift,
  onToggleShiftActive,
}) => {
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Mã Ca</th>
              <th scope="col" className="py-3 px-4">Tên Ca Làm Việc</th>
              <th scope="col" className="py-3 px-4">Giờ Bắt Đầu</th>
              <th scope="col" className="py-3 px-4">Giờ Kết Thúc</th>
              <th scope="col" className="py-3 px-4">Ân Hạn (Phút)</th>
              <th scope="col" className="py-3 px-4">Trạng Thái</th>
              <th scope="col" className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoadingShifts ? (
              <TableSkeleton columns={7} rows={5} hasActionColumn ariaLabel="Đang tải danh mục ca..." />
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-secondary">
                  Chưa có ca làm việc nào. Bấm "Thêm Ca Mới" để thiết lập.
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr
                  key={shift.id}
                  data-testid={`shift-row-${shift.id}`}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-primary text-xs">
                    {shift.shiftCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="font-semibold text-text-primary text-xs truncate max-w-[200px] block"
                      title={shift.name || shift.shiftName}
                    >
                      {shift.name || shift.shiftName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary text-xs">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                      <span>{shift.startTime}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary text-xs">
                    <div className="inline-flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                        <span>{shift.endTime}</span>
                      </span>
                      {(Boolean(shift.isOvernight) || isOvernightShift(shift.startTime, shift.endTime)) && (
                        <span
                          data-testid={`overnight-badge-${shift.id}`}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
                          title="Ca làm việc qua đêm (kết thúc vào ngày hôm sau)"
                        >
                          +1 ngày
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary font-medium text-xs">
                    {shift.gracePeriodMinutes} phút
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold shrink-0 ${
                        shift.isActive
                          ? 'bg-emerald-50 text-status-success border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {shift.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-bg-app shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditShift(shift)}
                        disabled={isAdjustmentLocked}
                        data-testid={`edit-shift-btn-${shift.id}`}
                        title="Sửa thông tin ca"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-40 shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5 shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleShiftActive(shift)}
                        disabled={isAdjustmentLocked || togglingShiftId === shift.id}
                        data-testid={`toggle-shift-active-btn-${shift.id}`}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-semibold border transition-all shrink-0 ${
                          shift.isActive
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-status-success hover:bg-emerald-50'
                        } disabled:opacity-40`}
                      >
                        {shift.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
