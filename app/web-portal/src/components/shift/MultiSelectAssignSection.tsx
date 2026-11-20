import React, { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { EmployeeItem } from '@/types'

export interface MultiSelectAssignSectionProps {
  employees: EmployeeItem[]
  departments: string[]
  selectedEmployeeIds: number[]
  onToggleEmployee: (id: number) => void
  onSelectAll: (ids: number[]) => void
  onDeselectAll: () => void
}

export const MultiSelectAssignSection: React.FC<MultiSelectAssignSectionProps> = ({
  employees,
  departments,
  selectedEmployeeIds,
  onToggleEmployee,
  onSelectAll,
  onDeselectAll,
}) => {
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [deptFilter, setDeptFilter] = useState<string>('')

  const filteredMultiEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.status === 'TERMINATED') return false
      if (deptFilter && emp.department?.trim() !== deptFilter) return false
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase()
        const matchName = emp.fullName?.toLowerCase().includes(kw)
        const matchCode = emp.employeeCode?.toLowerCase().includes(kw)
        const matchEmail = emp.email?.toLowerCase().includes(kw)
        if (!matchName && !matchCode && !matchEmail) return false
      }
      return true
    })
  }, [employees, deptFilter, searchKeyword])

  const handleSelectAllFiltered = () => {
    onSelectAll(filteredMultiEmployees.map((e) => e.id))
  }

  return (
    <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-secondary">
          Danh Sách Nhân Sự Áp Dụng <span className="text-status-danger">*</span>
        </label>
        <span
          data-testid="multi-selected-count"
          className="text-2xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200"
        >
          Đã chọn {selectedEmployeeIds.length} / {filteredMultiEmployees.length} nhân sự
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo tên, mã NV..."
            data-testid="search-multi-employee-input"
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-border-subtle bg-white"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          data-testid="filter-multi-dept-select"
          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border-subtle bg-white cursor-pointer"
        >
          <option value="">-- Tất cả phòng ban --</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            data-testid="select-all-filtered-btn"
            className="text-2xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
          >
            Chọn tất cả ({filteredMultiEmployees.length})
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            data-testid="deselect-all-btn"
            className="text-2xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer"
          >
            Bỏ chọn tất cả
          </button>
        </div>
      </div>

      <div className="max-h-40 overflow-y-auto bg-white rounded-xl border border-border-subtle divide-y divide-slate-100 p-1">
        {filteredMultiEmployees.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Không tìm thấy nhân sự nào phù hợp
          </div>
        ) : (
          filteredMultiEmployees.map((emp) => {
            const isChecked = selectedEmployeeIds.includes(emp.id)
            return (
              <label
                key={emp.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isChecked ? 'bg-indigo-50/70 text-indigo-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleEmployee(emp.id)}
                  data-testid={`checkbox-employee-${emp.id}`}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{emp.fullName}</span>{' '}
                  <span className="text-slate-500 font-mono text-2xs">({emp.employeeCode})</span>
                </div>
                <span className="text-2xs text-slate-500 shrink-0">
                  {emp.department || 'Chưa phân ban'}
                </span>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}
