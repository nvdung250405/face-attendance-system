import React, { useState, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { isOvernightShift } from '@/utils/date'
import type { EmployeeShiftAssignment, ShiftItem } from '@/types'

export interface ShiftAssignmentTableProps {
  filteredAssignments: EmployeeShiftAssignment[]
  shiftsMap: Map<number, ShiftItem>
  isLoadingAssignments: boolean
  isAdjustmentLocked: boolean
  deletingAssignmentId?: number | null
  onRemoveAssignment: (assignment: EmployeeShiftAssignment) => void
  page?: number
  pageSize?: number
  onPageChange?: (newPage: number) => void
  onPageSizeChange?: (newPageSize: number) => void
}

export const ShiftAssignmentTable: React.FC<ShiftAssignmentTableProps> = ({
  filteredAssignments,
  shiftsMap,
  isLoadingAssignments,
  isAdjustmentLocked,
  deletingAssignmentId,
  onRemoveAssignment,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const [localPage, setLocalPage] = useState(0)
  const [localPageSize, setLocalPageSize] = useState(10)

  const currentPage = page !== undefined ? page : localPage
  const currentPageSize = pageSize !== undefined ? pageSize : localPageSize
  const handlePageChange = onPageChange || setLocalPage
  const handlePageSizeChange = onPageSizeChange || setLocalPageSize

  const totalElements = filteredAssignments.length
  const totalPages = Math.max(1, Math.ceil(totalElements / currentPageSize))
  const activePage = Math.min(Math.max(0, currentPage), totalPages - 1)

  const displayedAssignments = useMemo(() => {
    if (page !== undefined) return filteredAssignments
    const start = activePage * currentPageSize
    return filteredAssignments.slice(start, start + currentPageSize)
  }, [filteredAssignments, page, activePage, currentPageSize])

  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Nhân Sự</th>
              <th scope="col" className="py-3 px-4">Ca Áp Dụng</th>
              <th scope="col" className="py-3 px-4">Khung Giờ</th>
              <th scope="col" className="py-3 px-4">Ngày Bắt Đầu</th>
              <th scope="col" className="py-3 px-4">Ngày Kết Thúc</th>
              <th scope="col" className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoadingAssignments ? (
              <TableSkeleton columns={6} rows={5} hasActionColumn ariaLabel="Đang tải lịch phân ca..." />
            ) : filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-secondary">
                  Không có lịch phân ca nào phù hợp. Bấm "Phân Ca Nhân Sự" để tạo lịch mới.
                </td>
              </tr>
            ) : (
              displayedAssignments.map((item) => {
                const matchedShift = shiftsMap.get(item.shiftId)
                return (
                  <tr
                    key={item.id}
                    data-testid={`assignment-row-${item.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <span
                          className="font-semibold text-text-primary block text-xs truncate max-w-[200px]"
                          title={item.fullName}
                        >
                          {item.fullName}
                        </span>
                        <span className="text-2xs font-mono text-slate-400">
                          {item.employeeCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className="font-semibold text-text-secondary truncate max-w-[200px] inline-block align-middle"
                        title={item.shiftName}
                      >
                        {item.shiftName}
                      </span>
                      <span className="ml-1 text-2xs font-mono text-indigo-600 font-bold shrink-0">
                        ({item.shiftCode})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary text-xs font-mono">
                      <div className="inline-flex items-center gap-1.5 flex-wrap">
                        <span>{matchedShift ? `${matchedShift.startTime} - ${matchedShift.endTime}` : 'Theo ca'}</span>
                        {matchedShift &&
                          (Boolean(matchedShift.isOvernight) ||
                            isOvernightShift(matchedShift.startTime, matchedShift.endTime)) && (
                            <span
                              data-testid={`overnight-badge-${item.id}`}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
                              title="Ca làm việc qua đêm (kết thúc vào ngày hôm sau)"
                            >
                              +1 ngày
                            </span>
                          )}
                      </div>
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
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {!isLoadingAssignments && totalElements > 0 && (
        <PaginationBar
          page={activePage}
          pageSize={currentPageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[10, 20, 50]}
          itemLabel="lịch phân ca"
        />
      )}
    </div>
  )
}
