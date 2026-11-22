/**
 * AttendanceFilterToolbar: Thanh công cụ lọc dữ liệu chấm công đa chiều (ARCH-02, TASK-WEB-019).
 */

import React from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { DEPARTMENTS } from '@/constants/departments'
import type { AttendanceStatus, VerificationMethod } from '@/types'

export interface AttendanceFilterToolbarProps {
  keyword: string
  department: string
  status: AttendanceStatus | ''
  verificationMethod: VerificationMethod | ''
  fromDate: string
  toDate: string
  hasActiveFilters: boolean
  onKeywordChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onStatusChange: (value: AttendanceStatus | '') => void
  onVerificationMethodChange: (value: VerificationMethod | '') => void
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
  onResetFilters: () => void
}

export const AttendanceFilterToolbar: React.FC<AttendanceFilterToolbarProps> = React.memo(
  ({
    keyword,
    department,
    status,
    verificationMethod,
    fromDate,
    toDate,
    hasActiveFilters,
    onKeywordChange,
    onDepartmentChange,
    onStatusChange,
    onVerificationMethodChange,
    onFromDateChange,
    onToDateChange,
    onResetFilters,
  }) => {
    return (
      <div className="card-surface p-4 space-y-3">
        {/* Hàng 1: Ô tìm kiếm từ khóa & 3 Dropdown bộ lọc */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Ô tìm kiếm từ khóa */}
          <div className="flex-1 min-w-56 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 shrink-0" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              data-testid="filter-keyword-input"
              aria-label="Tìm kiếm lượt điểm danh"
              placeholder="Tìm theo Mã NV, Họ tên..."
              maxLength={100}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            />
          </div>

          {/* Lọc theo phòng ban (EXP3-16: Centralized DEPARTMENTS) */}
          <div className="w-full sm:w-44">
            <select
              value={department}
              onChange={(e) => onDepartmentChange(e.target.value)}
              data-testid="filter-department-select"
              aria-label="Lọc theo phòng ban"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            >
              <option value="">Tất cả phòng ban</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo trạng thái (EXP3-11: Strict typing) */}
          <div className="w-full sm:w-38">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as AttendanceStatus | '')}
              data-testid="filter-status-select"
              aria-label="Lọc theo trạng thái điểm danh"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ON_TIME">Đúng giờ</option>
              <option value="LATE">Đi muộn</option>
              <option value="EARLY_LEAVE">Về sớm</option>
              <option value="OVERTIME">Tăng ca</option>
              <option value="ANOMALOUS">Bất thường</option>
            </select>
          </div>

          {/* Lọc theo phương thức xác thực */}
          <div className="w-full sm:w-44">
            <select
              value={verificationMethod}
              onChange={(e) =>
                onVerificationMethodChange(e.target.value as VerificationMethod | '')
              }
              data-testid="filter-method-select"
              aria-label="Lọc theo phương thức xác thực"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            >
              <option value="">Tất cả phương thức</option>
              <option value="VERIFICATION_FACE">Khuôn mặt (Face)</option>
              <option value="VERIFICATION_PIN">Mã PIN</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Khoảng ngày & Nút Xóa lọc */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 mr-1">Khoảng ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              data-testid="filter-from-date"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
              title="Từ ngày"
            />
            <span className="text-slate-400 text-xs font-medium">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              data-testid="filter-to-date"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
              title="Đến ngày"
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-center self-end sm:self-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={onResetFilters}
                data-testid="reset-filters-btn"
                leftIcon={<X className="w-3.5 h-3.5 shrink-0" />}
                className="h-9 px-3 text-xs font-semibold text-rose-700 bg-rose-50/80 border-rose-200 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-800 shadow-2xs shrink-0 cursor-pointer"
              >
                Xóa tất cả lọc
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }
)

AttendanceFilterToolbar.displayName = 'AttendanceFilterToolbar'
