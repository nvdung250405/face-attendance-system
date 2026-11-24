/**
 * Modal Drawer Phân ca Nhân sự & Gợi ý Khoảng trống Chống trùng ca
 * (SOL-WEB-007, UXD-WEB-006, BLD-WEB-019, TASK-WEB-034).
 */

import React, { useState, useMemo } from 'react'
import {
  Calendar,
  X,
  AlertTriangle,
  Clock,
  ArrowRight,
  Check,
  Building2,
  CheckSquare,
  UserCheck,
  CheckCircle2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ShiftItem, EmployeeItem, AssignShiftRequest, OverlapConflictInfo } from '@/types'
import { DepartmentAssignSection } from './DepartmentAssignSection'
import { MultiSelectAssignSection } from './MultiSelectAssignSection'
import { SingleAssignSection } from './SingleAssignSection'

export type AssignShiftMode = 'department' | 'multi' | 'single'

export interface AssignShiftDrawerProps {
  isOpen: boolean
  onClose: () => void
  formData: AssignShiftRequest
  onChangeFormData: React.Dispatch<React.SetStateAction<AssignShiftRequest>>
  formError: string | null
  overlapConflict: OverlapConflictInfo | null
  onApplySuggestedSlot: () => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  employees: EmployeeItem[]
  shifts: ShiftItem[]
  isLoadingEmployees?: boolean
  progressText?: string | null
  onSubmitBatch?: (params: {
    mode: AssignShiftMode
    employeeIds: number[]
    shiftId: number
    effectiveStartDate: string
    effectiveEndDate: string
    departmentName?: string
  }) => Promise<void>
}

const AssignShiftDrawerContent: React.FC<AssignShiftDrawerProps> = ({
  onClose,
  formData,
  onChangeFormData,
  formError,
  overlapConflict,
  onApplySuggestedSlot,
  isSubmitting,
  onSubmit,
  employees,
  shifts,
  isLoadingEmployees = false,
  progressText = null,
  onSubmitBatch,
}) => {
  const [mode, setMode] = useState<AssignShiftMode>('department')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])

  const handleClose = () => {
    setSelectedEmployeeIds([])
    onClose()
  }

  const departments = useMemo(() => {
    const set = new Set<string>()
    employees.forEach((emp) => emp.department?.trim() && set.add(emp.department.trim()))
    return Array.from(set).sort()
  }, [employees])

  const shiftsMap = useMemo(() => new Map<number, ShiftItem>(shifts.map((s) => [s.id, s])), [shifts])
  const selectedShift = useMemo(() => (formData.shiftId ? shiftsMap.get(formData.shiftId) : undefined), [shiftsMap, formData.shiftId])
  const activeShifts = useMemo(() => shifts.filter((s) => s.isActive), [shifts])

  const departmentCounts = useMemo(() => {
    const counts = new Map<string, number>()
    employees.forEach((emp) => {
      const dept = emp.department?.trim()
      if (dept) counts.set(dept, (counts.get(dept) || 0) + 1)
    })
    return counts
  }, [employees])

  const effectiveDept = selectedDept && departments.includes(selectedDept) ? selectedDept : (departments[0] || '')
  const departmentEmployees = useMemo(() => {
    if (!effectiveDept) return []
    return employees.filter((emp) => emp.department?.trim() === effectiveDept && emp.status !== 'TERMINATED')
  }, [employees, effectiveDept])

  const handleToggleEmployee = (id: number) => {
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSelectAllFiltered = (ids: number[]) => {
    setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...ids])))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'single' || !onSubmitBatch) return onSubmit(e)
    if (mode === 'department') {
      return onSubmitBatch({
        mode: 'department',
        employeeIds: departmentEmployees.map((e) => e.id),
        shiftId: formData.shiftId,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate,
        departmentName: effectiveDept,
      })
    }
    if (mode === 'multi') {
      return onSubmitBatch({
        mode: 'multi',
        employeeIds: selectedEmployeeIds,
        shiftId: formData.shiftId,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate,
      })
    }
  }

  return (
    <div className="relative w-full max-w-xl bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[92vh]">
      {/* Header Modal */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <DialogTitle className="font-bold text-base text-text-primary">
              Phân Ca Nhân Sự Theo Khoảng Ngày
            </DialogTitle>
            <p className="text-xs text-text-secondary">
              Gán ca làm việc theo phòng ban, danh sách hàng loạt hoặc từng cá nhân
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng"
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Modal */}
      <form onSubmit={handleFormSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            data-testid="mode-department-btn"
            onClick={() => setMode('department')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'department' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Theo Phòng Ban</span>
          </button>
          <button
            type="button"
            data-testid="mode-multi-btn"
            onClick={() => setMode('multi')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'multi' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Chọn Hàng Loạt</span>
          </button>
          <button
            type="button"
            data-testid="mode-single-btn"
            onClick={() => setMode('single')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'single' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Từng Cá Nhân</span>
          </button>
        </div>

        {formError && (
          <div data-testid="assign-form-error" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {overlapConflict && (
          <div data-testid="overlap-conflict-suggestion-box" className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Gợi Ý Khoảng Trống Khả Dụng Tiếp Theo</span>
            </div>
            <p className="text-2xs text-indigo-800 leading-relaxed">
              Hệ thống đã tự động tính toán khoảng thời gian trống không bị giao thoa cho nhân sự này:
            </p>
            <div className="flex items-center gap-2 font-mono font-semibold text-xs text-indigo-900 bg-white/80 p-2 rounded-lg border border-indigo-100">
              <span>{overlapConflict.suggestedStartDate || '—'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>{overlapConflict.suggestedEndDate || '—'}</span>
            </div>
            {overlapConflict.suggestedStartDate && (
              <button
                type="button"
                onClick={onApplySuggestedSlot}
                data-testid="apply-suggested-slot-btn"
                className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Áp Dụng Khoảng Trống Này</span>
              </button>
            )}
          </div>
        )}

        {mode === 'department' && (
          <DepartmentAssignSection
            departments={departments}
            effectiveDept={effectiveDept}
            onSelectDept={setSelectedDept}
            departmentCounts={departmentCounts}
            departmentEmployees={departmentEmployees}
            isLoadingEmployees={isLoadingEmployees}
          />
        )}

        {mode === 'multi' && (
          <MultiSelectAssignSection
            employees={employees}
            departments={departments}
            selectedEmployeeIds={selectedEmployeeIds}
            onToggleEmployee={handleToggleEmployee}
            onSelectAll={handleSelectAllFiltered}
            onDeselectAll={() => setSelectedEmployeeIds([])}
          />
        )}

        {mode === 'single' && (
          <SingleAssignSection
            employeeId={formData.employeeId}
            onChangeEmployeeId={(employeeId) => onChangeFormData((prev) => ({ ...prev, employeeId }))}
            employees={employees}
            isLoadingEmployees={isLoadingEmployees}
          />
        )}

        {/* Chọn ca làm việc */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-text-secondary">
            Chọn ca làm việc <span className="text-status-danger">*</span>
          </Label>
          <select
            value={formData.shiftId}
            onChange={(e) => onChangeFormData((prev) => ({ ...prev, shiftId: Number(e.target.value) }))}
            data-testid="select-assign-shift"
            className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white cursor-pointer"
          >
            <option value={0}>-- Chọn ca làm việc --</option>
            {activeShifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.shiftCode}) [{s.startTime} - {s.endTime}]
              </option>
            ))}
          </select>
          {selectedShift && (
            <p className="text-2xs text-indigo-700 font-medium">
              Ca đã chọn: {selectedShift.name} ({selectedShift.startTime} - {selectedShift.endTime})
            </p>
          )}
        </div>

        {/* Khoảng ngày hiệu lực */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="input-assign-start-date"
            data-testid="input-assign-start-date"
            label={
              <>
                Từ ngày <span className="text-status-danger">*</span>
              </>
            }
            type="date"
            value={formData.effectiveStartDate}
            onChange={(e) => onChangeFormData((prev) => ({ ...prev, effectiveStartDate: e.target.value }))}
            className="font-mono"
          />
          <Input
            id="input-assign-end-date"
            data-testid="input-assign-end-date"
            label={
              <>
                Đến ngày <span className="text-status-danger">*</span>
              </>
            }
            type="date"
            value={formData.effectiveEndDate}
            onChange={(e) => onChangeFormData((prev) => ({ ...prev, effectiveEndDate: e.target.value }))}
            className="font-mono"
          />
        </div>

        {progressText && (
          <div data-testid="batch-assign-progress-banner" className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{progressText}</span>
          </div>
        )}
      </form>

      {/* Footer Modal */}
      <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
        <div className="text-xs text-slate-500 font-medium">
          {mode === 'department' && effectiveDept && (
            <span>
              Áp dụng: <strong className="text-indigo-700">{departmentEmployees.length} nhân sự</strong> ({effectiveDept})
            </span>
          )}
          {mode === 'multi' && (
            <span>
              Áp dụng: <strong className="text-indigo-700">{selectedEmployeeIds.length} nhân sự</strong>
            </span>
          )}
          {mode === 'single' && <span>Áp dụng: 1 nhân sự</span>}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            data-testid="submit-assign-shift-btn"
            leftIcon={!isSubmitting ? <CheckCircle2 className="w-4 h-4" /> : undefined}
          >
            {isSubmitting ? (
              <span>{progressText || 'Đang phân ca...'}</span>
            ) : (
              <span>
                {mode === 'department'
                  ? `Phân Ca Cho Phòng Ban (${departmentEmployees.length})`
                  : mode === 'multi'
                    ? `Phân Ca Hàng Loạt (${selectedEmployeeIds.length})`
                    : 'Xác Nhận Phân Ca'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const AssignShiftDrawer: React.FC<AssignShiftDrawerProps> = (props) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent
        data-testid="assign-shift-drawer"
        hideCloseButton
        className="p-0 max-w-xl border-0 bg-transparent shadow-none"
      >
        <AssignShiftDrawerContent key={props.isOpen ? 'open' : 'closed'} {...props} />
      </DialogContent>
    </Dialog>
  )
}
