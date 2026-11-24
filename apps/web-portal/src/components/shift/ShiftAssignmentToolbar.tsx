import React from 'react'
import { List, CalendarDays, Search, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import type { ShiftItem } from '@/types'

export interface ShiftAssignmentToolbarProps {
  assignmentViewMode: 'table' | 'weekly'
  onChangeViewMode: (mode: 'table' | 'weekly') => void
  searchEmployeeKeyword: string
  onChangeSearchKeyword: (val: string) => void
  filterShiftId: string
  onChangeFilterShiftId: (val: string) => void
  shifts: ShiftItem[]
  filteredCount: number
  totalCount: number
  onResetFilters?: () => void
}

export const ShiftAssignmentToolbar: React.FC<ShiftAssignmentToolbarProps> = ({
  assignmentViewMode,
  onChangeViewMode,
  searchEmployeeKeyword,
  onChangeSearchKeyword,
  filterShiftId,
  onChangeFilterShiftId,
  shifts,
  filteredCount,
  totalCount,
  onResetFilters,
}) => {
  const hasActiveFilters = Boolean(searchEmployeeKeyword || filterShiftId)

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters()
    } else {
      onChangeSearchKeyword('')
      onChangeFilterShiftId('')
    }
  }

  return (
    <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* Toggle Chế độ xem: Bảng vs Lịch tuần */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => onChangeViewMode('table')}
            data-testid="view-mode-table"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              assignmentViewMode === 'table'
                ? 'bg-white text-brand-primary shadow-2xs font-bold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <List className="w-3.5 h-3.5 shrink-0" />
            <span>Dạng Bảng</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('weekly')}
            data-testid="view-mode-weekly"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              assignmentViewMode === 'weekly'
                ? 'bg-white text-brand-primary shadow-2xs font-bold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>Lịch Tuần</span>
          </button>
        </div>

        {/* Tìm kiếm theo tên / mã nhân viên */}
        {assignmentViewMode === 'table' && (
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 shrink-0" />
            </div>
            <input
              type="text"
              maxLength={100}
              value={searchEmployeeKeyword}
              onChange={(e) => onChangeSearchKeyword(e.target.value)}
              data-testid="search-assigned-employee-input"
              placeholder="Mã NV hoặc Họ tên..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchEmployeeKeyword && (
              <button
                type="button"
                data-testid="search-assigned-employee-clear"
                onClick={() => onChangeSearchKeyword('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Xóa tìm kiếm"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* Lọc theo ca làm việc */}
        {assignmentViewMode === 'table' && (
          <select
            value={filterShiftId}
            onChange={(e) => onChangeFilterShiftId(e.target.value)}
            data-testid="filter-assigned-shift-select"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-auto"
          >
            <option value="">Tất cả ca làm việc</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.shiftCode})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        {assignmentViewMode === 'table' && hasActiveFilters && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleReset}
            data-testid="shift-assignment-reset-btn"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 shrink-0" />}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
          >
            Đặt lại
          </Button>
        )}

        {assignmentViewMode === 'table' && (
          <span className="text-xs text-text-secondary font-medium">
            Hiển thị <span className="font-semibold text-text-primary">{filteredCount}</span> /{' '}
            <span className="font-semibold text-text-primary">{totalCount}</span> lịch phân ca
          </span>
        )}
      </div>
    </div>
  )
}
