import React from 'react'
import { Users } from 'lucide-react'
import type { EmployeeItem } from '@/types'

export interface DepartmentAssignSectionProps {
  departments: string[]
  effectiveDept: string
  onSelectDept: (dept: string) => void
  departmentCounts: Map<string, number>
  departmentEmployees: EmployeeItem[]
  isLoadingEmployees: boolean
}

export const DepartmentAssignSection: React.FC<DepartmentAssignSectionProps> = ({
  departments,
  effectiveDept,
  onSelectDept,
  departmentCounts,
  departmentEmployees,
  isLoadingEmployees,
}) => {
  return (
    <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span>
            Chọn Phòng Ban Áp Dụng <span className="text-status-danger">*</span>
          </span>
          <span className="text-2xs font-normal text-slate-500">
            Tự động gán cho toàn bộ nhân sự trong phòng
          </span>
        </label>
        <select
          value={effectiveDept}
          onChange={(e) => onSelectDept(e.target.value)}
          data-testid="select-assign-department"
          disabled={isLoadingEmployees || departments.length === 0}
          className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-medium cursor-pointer"
        >
          {isLoadingEmployees ? (
            <option value="">Đang tải danh sách phòng ban...</option>
          ) : departments.length === 0 ? (
            <option value="">Không có phòng ban khả dụng</option>
          ) : (
            departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept} ({departmentCounts.get(dept) || 0} nhân sự)
              </option>
            ))
          )}
        </select>
      </div>

      {/* Tóm tắt nhân sự thuộc phòng ban */}
      {effectiveDept && (
        <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Users className="w-3.5 h-3.5" />
              <span>Quy mô áp dụng:</span>
            </span>
            <span
              data-testid="dept-employees-count"
              className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold font-mono text-2xs"
            >
              {departmentEmployees.length} nhân sự
            </span>
          </div>
          {departmentEmployees.length === 0 ? (
            <p className="text-2xs text-slate-400 italic">
              Không có nhân sự đang hoạt động nào thuộc phòng ban này.
            </p>
          ) : (
            <div className="max-h-24 overflow-y-auto pr-1 text-2xs text-slate-600 flex flex-wrap gap-1 pt-1">
              {departmentEmployees.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {e.fullName} ({e.employeeCode})
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
