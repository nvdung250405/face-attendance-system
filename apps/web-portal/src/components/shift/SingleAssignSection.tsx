import React from 'react'
import type { EmployeeItem } from '@/types'

export interface SingleAssignSectionProps {
  employeeId: number
  onChangeEmployeeId: (employeeId: number) => void
  employees: EmployeeItem[]
  isLoadingEmployees?: boolean
}

export const SingleAssignSection: React.FC<SingleAssignSectionProps> = ({
  employeeId,
  onChangeEmployeeId,
  employees,
  isLoadingEmployees = false,
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-text-secondary">
        Chọn nhân sự áp dụng <span className="text-status-danger">*</span>
      </label>
      <select
        value={employeeId}
        onChange={(e) => onChangeEmployeeId(Number(e.target.value))}
        disabled={isLoadingEmployees || employees.length === 0}
        data-testid="select-assign-employee"
        className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white disabled:opacity-60 cursor-pointer"
      >
        {isLoadingEmployees ? (
          <option value={0}>Đang tải danh sách nhân sự...</option>
        ) : employees.length === 0 ? (
          <option value={0}>Không có nhân sự khả dụng</option>
        ) : (
          <>
            <option value={0}>-- Chọn nhân sự ({employees.length} nhân sự) --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.employeeCode}) - {emp.department || 'Chưa phân ban'}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  )
}
