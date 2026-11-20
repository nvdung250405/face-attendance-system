import React from 'react'
import { Trash2 } from 'lucide-react'
import type { EmployeeShiftAssignment, ShiftItem } from '@/types'

export interface ShiftAssignmentTableProps {
  filteredAssignments: EmployeeShiftAssignment[]
  shiftsMap: Map<number, ShiftItem>
  isLoadingAssignments: boolean
  isAdjustmentLocked: boolean
  deletingAssignmentId?: number | null
  onRemoveAssignment: (assignment: EmployeeShiftAssignment) => void
}

export const ShiftAssignmentTable: React.FC<ShiftAssignmentTableProps> = ({
  filteredAssignments,
  shiftsMap,
  isLoadingAssignments,
  isAdjustmentLocked,
  deletingAssignmentId,
  onRemoveAssignment,
}) => {
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Nhân Sự</th>
              <th className="py-3 px-4">Ca Áp Dụng</th>
              <th className="py-3 px-4">Khung Giờ</th>
              <th className="py-3 px-4">Ngày Bắt Đầu</th>
              <th className="py-3 px-4">Ngày Kết Thúc</th>
              <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoadingAssignments ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-secondary">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                    <span>Đang tải lịch phân ca...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-secondary">
                  Không có lịch phân ca nào phù hợp. Bấm "Phân Ca Nhân Sự" để tạo lịch mới.
                </td>
              </tr>
            ) : (
              filteredAssignments.map((item) => {
                const matchedShift = shiftsMap.get(item.shiftId)
                return (
                  <tr
                    key={item.id}
                    data-testid={`assignment-row-${item.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-text-primary block text-xs">{item.fullName}</span>
                        <span className="text-2xs font-mono text-slate-400">
                          {item.employeeCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-text-secondary">{item.shiftName}</span>
                      <span className="ml-1 text-2xs font-mono text-indigo-600 font-bold">
                        ({item.shiftCode})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary text-xs font-mono">
                      {matchedShift ? `${matchedShift.startTime} - ${matchedShift.endTime}` : 'Theo ca'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-secondary text-xs">
                      {item.effectiveStartDate || item.effectiveFrom || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-secondary text-xs">
                      {item.effectiveEndDate || item.effectiveTo || 'Vô thời hạn'}
                    </td>
                    <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-bg-app shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRemoveAssignment(item)}
                        disabled={isAdjustmentLocked || deletingAssignmentId === item.id}
                        data-testid={`remove-assignment-btn-${item.id}`}
                        title="Hủy lịch phân ca"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
