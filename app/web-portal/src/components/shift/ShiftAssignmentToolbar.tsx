import React from 'react'
import { List, CalendarDays, Search } from 'lucide-react'
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
}) => {
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
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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

      {assignmentViewMode === 'table' && (
        <span className="text-xs text-text-secondary self-end sm:self-auto font-medium">
          Hiển thị <span className="font-semibold text-text-primary">{filteredCount}</span> / <span className="font-semibold text-text-primary">{totalCount}</span> lịch phân ca
        </span>
      )}
    </div>
  )
}
