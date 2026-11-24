/**
 * AttendanceFilterToolbar: Thanh công cụ lọc dữ liệu chấm công đa chiều (ARCH-02, TASK-WEB-019).
 */

import React from 'react'
import { FilterToolbar } from '@/components/ui'
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
      <FilterToolbar className="flex-col !items-stretch space-y-3">
        {/* Hàng 1: Ô tìm kiếm từ khóa & 3 Dropdown bộ lọc */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <FilterToolbar.Search
            value={keyword}
            onChange={onKeywordChange}
            data-testid="filter-keyword-input"
            aria-label="Tìm kiếm lượt điểm danh"
            placeholder="Tìm theo Mã NV, Họ tên..."
            maxLength={100}
            className="flex-1 min-w-56"
          />

          <FilterToolbar.Select
            value={department}
            onChange={onDepartmentChange}
            placeholder="Tất cả phòng ban"
            data-testid="filter-department-select"
            aria-label="Lọc theo phòng ban"
            className="w-full sm:w-44"
            options={DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))}
          />

          <FilterToolbar.Select
            value={status}
            onChange={(val) => onStatusChange(val as AttendanceStatus | '')}
            placeholder="Tất cả trạng thái"
            data-testid="filter-status-select"
            aria-label="Lọc theo trạng thái điểm danh"
            className="w-full sm:w-38"
            options={[
              { value: 'ON_TIME', label: 'Đúng giờ' },
              { value: 'LATE', label: 'Đi muộn' },
              { value: 'EARLY_LEAVE', label: 'Về sớm' },
              { value: 'OVERTIME', label: 'Tăng ca' },
              { value: 'ANOMALOUS', label: 'Bất thường' },
            ]}
          />

          <FilterToolbar.Select
            value={verificationMethod}
            onChange={(val) => onVerificationMethodChange(val as VerificationMethod | '')}
            placeholder="Tất cả phương thức"
            data-testid="filter-method-select"
            aria-label="Lọc theo phương thức xác thực"
            className="w-full sm:w-44"
            options={[
              { value: 'VERIFICATION_FACE', label: 'Khuôn mặt (Face)' },
              { value: 'ARCFACE_512D', label: 'Khuôn mặt (ArcFace 512D)' },
              { value: 'VERIFICATION_PIN', label: 'Mã PIN' },
            ]}
          />
        </div>

        {/* Hàng 2: Khoảng ngày & Nút Xóa lọc */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <FilterToolbar.DateRange
            from={fromDate}
            to={toDate}
            onFromChange={onFromDateChange}
            onToChange={onToDateChange}
            fromDataTestId="filter-from-date"
            toDataTestId="filter-to-date"
            label="Khoảng ngày:"
          />

          <FilterToolbar.Reset
            visible={hasActiveFilters}
            onClick={onResetFilters}
            data-testid="reset-filters-btn"
            label="Đặt lại"
          />
        </div>
      </FilterToolbar>
    )
  }
)

AttendanceFilterToolbar.displayName = 'AttendanceFilterToolbar'
