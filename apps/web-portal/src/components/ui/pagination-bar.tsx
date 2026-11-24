import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/utils/cn'

export interface PaginationBarProps {
  page: number // 0-indexed
  pageSize: number
  totalElements: number
  totalPages: number
  onPageChange: (newPage: number) => void
  onPageSizeChange?: (newPageSize: number) => void
  pageSizeOptions?: number[] // default: [10, 20, 50, 100]
  itemLabel?: string // default: 'mục'
  className?: string
  'data-testid'?: string
}

export const PaginationBar: React.FC<PaginationBarProps> = React.memo(
  ({
    page,
    pageSize,
    totalElements,
    totalPages,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    itemLabel = 'mục',
    className,
    'data-testid': dataTestId = 'pagination-bar',
  }) => {
    const startItem = totalElements === 0 ? 0 : page * pageSize + 1
    const endItem = Math.min((page + 1) * pageSize, totalElements)
    const effectiveTotalPages = Math.max(1, totalPages)

    return (
      <div
        data-testid={dataTestId}
        className={cn(
          'p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500',
          className
        )}
      >
        <div data-testid="pagination-info" className="shrink-0">
          Hiển thị{' '}
          <span className="font-semibold text-slate-900">
            {totalElements === 0 ? 0 : `${startItem} - ${endItem}`}
          </span>{' '}
          /{' '}
          <span className="font-semibold text-slate-900">{totalElements}</span>{' '}
          {itemLabel}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onPageSizeChange && pageSizeOptions.length > 0 && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              data-testid="page-size-select"
              aria-label="Số dòng trên mỗi trang"
              className="min-h-[44px] px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 shrink-0 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} dòng / trang
                </option>
              ))}
            </select>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            data-testid="prev-page-btn"
            className="min-h-[44px] min-w-[44px] px-3 rounded-lg shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1 shrink-0" aria-hidden="true" />
            Trước
          </Button>

          <span
            data-testid="page-indicator"
            className="px-2 font-semibold text-slate-700 shrink-0"
          >
            Trang {page + 1} / {effectiveTotalPages}
          </span>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page + 1 >= effectiveTotalPages || totalElements === 0}
            onClick={() => onPageChange(page + 1)}
            data-testid="next-page-btn"
            className="min-h-[44px] min-w-[44px] px-3 rounded-lg shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Sau
            <ChevronRight className="w-3.5 h-3.5 ml-1 shrink-0" aria-hidden="true" />
          </Button>
        </div>
      </div>
    )
  }
)

PaginationBar.displayName = 'PaginationBar'
