import React from 'react'
import { FilterToolbar } from '@/components/ui'

export type BiometricFilterOption = 'ALL' | 'ENROLLED' | 'PENDING_ENROLLMENT'

export interface EmployeeFilterToolbarProps {
  keyword: string
  onChangeKeyword: (value: string) => void
  onClearKeyword?: () => void
  departmentFilter: string
  onChangeDepartmentFilter: (value: string) => void
  availableDepartments: string[]
  statusFilter: string
  onChangeStatusFilter: (value: string) => void
  roleFilter: string
  onChangeRoleFilter: (value: string) => void
  biometricFilter?: BiometricFilterOption
  onChangeBiometricFilter?: (value: BiometricFilterOption) => void
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export const EmployeeFilterToolbar: React.FC<EmployeeFilterToolbarProps> = ({
  keyword,
  onChangeKeyword,
  departmentFilter,
  onChangeDepartmentFilter,
  availableDepartments,
  statusFilter,
  onChangeStatusFilter,
  roleFilter,
  onChangeRoleFilter,
  biometricFilter = 'ALL',
  onChangeBiometricFilter,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <FilterToolbar className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      {/* Tìm kiếm từ khóa */}
      <FilterToolbar.Search
        id="search-input"
        data-testid="search-input"
        aria-label="Tìm kiếm nhân sự"
        value={keyword}
        maxLength={100}
        onChange={onChangeKeyword}
        placeholder="Tìm theo Mã NV, Họ tên, Email..."
        className="flex-1"
      />

      {/* Lọc phòng ban */}
      <FilterToolbar.Select
        id="filter-department"
        data-testid="filter-department"
        aria-label="Lọc theo phòng ban"
        value={departmentFilter}
        onChange={onChangeDepartmentFilter}
        className="w-full md:w-56"
        options={[
          { value: 'ALL', label: 'Mọi phòng ban' },
          ...availableDepartments.map((dept) => ({ value: dept, label: dept })),
        ]}
      />

      {/* Lọc trạng thái */}
      <FilterToolbar.Select
        id="filter-status"
        data-testid="filter-status"
        aria-label="Lọc theo trạng thái tài khoản"
        value={statusFilter}
        onChange={onChangeStatusFilter}
        className="w-full md:w-44"
        options={[
          { value: 'ALL', label: 'Mọi trạng thái' },
          { value: 'ACTIVE', label: 'Đang hoạt động' },
          { value: 'PENDING_CONSENT', label: 'Chờ cam kết' },
          { value: 'INACTIVE', label: 'Đã vô hiệu hóa' },
          { value: 'SUSPENDED', label: 'Tạm đình chỉ' },
        ]}
      />

      {/* Lọc vai trò */}
      <FilterToolbar.Select
        id="filter-role"
        data-testid="filter-role"
        aria-label="Lọc theo vai trò"
        value={roleFilter}
        onChange={onChangeRoleFilter}
        className="w-full md:w-40"
        options={[
          { value: 'ALL', label: 'Mọi vai trò' },
          { value: 'EMPLOYEE', label: 'EMPLOYEE' },
          { value: 'HR_MANAGER', label: 'HR_MANAGER' },
          { value: 'ADMIN', label: 'ADMIN' },
          { value: 'DPO', label: 'DPO' },
        ]}
      />

      {/* Lọc sinh trắc học (F-SPEC-12) */}
      <FilterToolbar.Select
        id="filter-biometric-select"
        data-testid="filter-biometric-select"
        aria-label="Lọc theo dữ liệu sinh trắc học"
        value={biometricFilter}
        onChange={(val) => onChangeBiometricFilter?.(val as BiometricFilterOption)}
        className="w-full md:w-44"
        options={[
          { value: 'ALL', label: 'Mọi sinh trắc' },
          { value: 'ENROLLED', label: 'Đã đăng ký (Khuôn mặt)' },
          { value: 'PENDING_ENROLLMENT', label: 'Chưa đăng ký' },
        ]}
      />

      {/* Nút đặt lại bộ lọc */}
      <FilterToolbar.Reset
        visible={hasActiveFilters}
        onClick={onResetFilters}
        data-testid="employee-clear-filters-btn"
        className="sm:ml-auto"
      />
    </FilterToolbar>
  )
}
