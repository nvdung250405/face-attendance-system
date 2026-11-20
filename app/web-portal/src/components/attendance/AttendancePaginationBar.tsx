/**
 * AttendancePaginationBar: Thanh điều khiển phân trang chuẩn hóa cho bảng chấm công (ARCH-02, TASK-WEB-019).
 */

import React from 'react'
import { Button } from '@/components/common'

export interface AttendancePaginationBarProps {
  page: number
  pageSize: number
  totalElements: number
  displayedCount: number
  totalPages: number
  onPageChange: (newPage: number | ((prev: number) => number)) => void
  onPageSizeChange: (newPageSize: number) => void
}

export const AttendancePaginationBar: React.FC<AttendancePaginationBarProps> = React.memo(
  ({
    page,
    pageSize,
    totalElements,
    displayedCount,
    totalPages,
    onPageChange,
    onPageSizeChange,
  }) => {
    return (
      <div className="card-surface p-4 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Hiển thị <span className="font-semibold text-slate-900">{displayedCount}</span> /{' '}
          <span className="font-semibold text-slate-900">{totalElements}</span> lượt điểm danh
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            data-testid="page-size-select"
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value={20}>20 dòng / trang</option>
            <option value={50}>50 dòng / trang</option>
            <option value={100}>100 dòng / trang</option>
          </select>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange((p) => Math.max(0, p - 1))}
            data-testid="prev-page-btn"
          >
            Trước
          </Button>

          <span className="px-2 font-semibold text-slate-700">Trang {page + 1}</span>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={(page + 1) * pageSize >= totalElements}
            onClick={() => onPageChange((p) => (p + 1 < totalPages ? p + 1 : p))}
            data-testid="next-page-btn"
          >
            Sau
          </Button>
        </div>
      </div>
    )
  }
)

AttendancePaginationBar.displayName = 'AttendancePaginationBar'
