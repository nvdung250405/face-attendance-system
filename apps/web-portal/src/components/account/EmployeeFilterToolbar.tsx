import React from 'react'
import { Search, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'

interface EmployeeFilterToolbarProps {
  keyword: string
  onChangeKeyword: (value: string) => void
  onClearKeyword: () => void
  departmentFilter: string
  onChangeDepartmentFilter: (value: string) => void
  availableDepartments: string[]
  statusFilter: string
  onChangeStatusFilter: (value: string) => void
  roleFilter: string
  onChangeRoleFilter: (value: string) => void
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export const EmployeeFilterToolbar: React.FC<EmployeeFilterToolbarProps> = ({
  keyword,
  onChangeKeyword,
  onClearKeyword,
  departmentFilter,
  onChangeDepartmentFilter,
  availableDepartments,
  statusFilter,
  onChangeStatusFilter,
  roleFilter,
  onChangeRoleFilter,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <div className="card-surface p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      {/* Tìm kiếm từ khóa */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} strokeWidth={2} className="shrink-0" />
        </div>
        <input
          id="search-input"
          data-testid="search-input"
          type="text"
          aria-label="Tìm kiếm nhân sự"
          value={keyword}
          maxLength={100}
          onChange={(e) => onChangeKeyword(e.target.value)}
          placeholder="Tìm theo Mã NV, Họ tên, Email..."
          className="bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all"
        />
        {keyword && (
          <button
            type="button"
            data-testid="search-clear-btn"
            onClick={onClearKeyword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X size={14} className="shrink-0" />
          </button>
        )}
      </div>

      {/* Lọc phòng ban */}
      <div className="w-full md:w-56">
        <select
          id="filter-department"
          data-testid="filter-department"
          aria-label="Lọc theo phòng ban"
          value={departmentFilter}
          onChange={(e) => onChangeDepartmentFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all cursor-pointer"
        >
          <option value="ALL">Mọi phòng ban</option>
          {availableDepartments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Lọc trạng thái */}
      <div className="w-full md:w-44">
        <select
          id="filter-status"
          data-testid="filter-status"
          aria-label="Lọc theo trạng thái tài khoản"
          value={statusFilter}
          onChange={(e) => onChangeStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all cursor-pointer"
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="PENDING_CONSENT">Chờ cam kết</option>
          <option value="INACTIVE">Đã vô hiệu hóa</option>
          <option value="SUSPENDED">Tạm đình chỉ</option>
        </select>
      </div>

      {/* Lọc vai trò */}
      <div className="w-full md:w-40">
        <select
          id="filter-role"
          data-testid="filter-role"
          aria-label="Lọc theo vai trò"
          value={roleFilter}
          onChange={(e) => onChangeRoleFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all cursor-pointer"
        >
          <option value="ALL">Mọi vai trò</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
          <option value="HR_MANAGER">HR_MANAGER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="DPO">DPO</option>
        </select>
      </div>

      {/* Nút đặt lại bộ lọc */}
      {hasActiveFilters && (
        <div className="flex items-center sm:ml-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="employee-clear-filters-btn"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 shrink-0" />}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
          >
            Đặt lại
          </Button>
        </div>
      )}
    </div>
  )
}
