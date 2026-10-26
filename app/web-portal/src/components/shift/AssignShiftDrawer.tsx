/**
 * Modal Drawer Phân ca Nhân sự & Gợi ý Khoảng trống Chống trùng ca
 * (SOL-WEB-007, UXD-WEB-006, BLD-WEB-019, TASK-WEB-034).
 *
 * Hỗ trợ 3 chế độ phân ca linh hoạt:
 * 1. Phân ca theo Phòng ban (Department-Level): 1-click cho toàn bộ nhân sự phòng ban
 * 2. Phân ca Chọn Hàng loạt (Multi-Select): Checkbox, tìm kiếm, lọc phòng ban
 * 3. Phân ca Cá nhân (Single): Gán ca riêng lẻ từng nhân sự
 */

import React, { useState, useMemo, useEffect } from 'react'
import {
  Calendar,
  X,
  AlertTriangle,
  Clock,
  ArrowRight,
  Check,
  Users,
  CheckSquare,
  UserCheck,
  Search,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type {
  ShiftItem,
  EmployeeItem,
  AssignShiftRequest,
  OverlapConflictInfo,
} from '@/types'

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

export const AssignShiftDrawer: React.FC<AssignShiftDrawerProps> = ({
  isOpen,
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
  // Chế độ phân ca: 'department' | 'multi' | 'single'
  const [mode, setMode] = useState<AssignShiftMode>('department')

  // Trạng thái cho chế độ Theo Phòng ban
  const [selectedDept, setSelectedDept] = useState<string>('')

  // Trạng thái cho chế độ Chọn Hàng loạt
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [deptFilter, setDeptFilter] = useState<string>('')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])

  // Danh sách các phòng ban duy nhất
  const departments = useMemo(() => {
    const set = new Set<string>()
    employees.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        set.add(emp.department.trim())
      }
    })
    return Array.from(set).sort()
  }, [employees])

  // Khởi tạo phòng ban mặc định khi danh sách phòng ban thay đổi
  useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0])
    }
  }, [departments, selectedDept])

  // Nhân sự thuộc phòng ban đang chọn
  const departmentEmployees = useMemo(() => {
    if (!selectedDept) return []
    return employees.filter(
      (emp) => emp.department?.trim() === selectedDept && emp.status !== 'TERMINATED'
    )
  }, [employees, selectedDept])

  // Danh sách nhân sự đã lọc trong tab Multi-select
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

  // Chọn / Bỏ chọn 1 nhân viên trong tab Multi-select
  const handleToggleEmployee = (id: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Chọn tất cả nhân sự đang lọc
  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredMultiEmployees.map((e) => e.id)
    setSelectedEmployeeIds((prev) => {
      const merged = new Set([...prev, ...idsToAdd])
      return Array.from(merged)
    })
  }

  // Bỏ chọn tất cả
  const handleDeselectAll = () => {
    setSelectedEmployeeIds([])
  }

  // Xử lý gửi form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'single' || !onSubmitBatch) {
      onSubmit(e)
      return
    }

    if (mode === 'department') {
      const ids = departmentEmployees.map((e) => e.id)
      await onSubmitBatch({
        mode: 'department',
        employeeIds: ids,
        shiftId: formData.shiftId,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate,
        departmentName: selectedDept,
      })
      return
    }

    if (mode === 'multi') {
      await onSubmitBatch({
        mode: 'multi',
        employeeIds: selectedEmployeeIds,
        shiftId: formData.shiftId,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="assign-shift-drawer"
        hideCloseButton
        usePortal={false}
        className="p-0 max-w-xl border-0 bg-transparent shadow-none"
      >
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
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Modal */}
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Thanh chuyển chế độ phân ca */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                data-testid="mode-department-btn"
                onClick={() => setMode('department')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'department'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                  mode === 'multi'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                  mode === 'single'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Từng Cá Nhân</span>
              </button>
            </div>

            {/* Cảnh báo lỗi */}
            {formError && (
              <div
                data-testid="assign-form-error"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Hộp gợi ý khoảng trống khi trùng ca (SOL-WEB-007) */}
            {overlapConflict && (
              <div
                data-testid="overlap-conflict-suggestion-box"
                className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2.5 animate-in fade-in"
              >
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
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Áp Dụng Khoảng Trống Này</span>
                  </button>
                )}
              </div>
            )}

            {/* ── CHẾ ĐỘ 1: THEO PHÒNG BAN ── */}
            {mode === 'department' && (
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
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
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
                          {dept} ({employees.filter((e) => e.department?.trim() === dept).length} nhân sự)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Tóm tắt nhân sự thuộc phòng ban */}
                {selectedDept && (
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
            )}

            {/* ── CHẾ ĐỘ 2: CHỌN HÀNG LOẠT ── */}
            {mode === 'multi' && (
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

                {/* Thanh tìm kiếm và bộ lọc nhanh phòng ban */}
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

                {/* Nút Chọn tất cả / Bỏ chọn */}
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
                      onClick={handleDeselectAll}
                      data-testid="deselect-all-btn"
                      className="text-2xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                {/* Danh sách cuộn nhân sự dạng Checkbox */}
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
                            onChange={() => handleToggleEmployee(emp.id)}
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
            )}

            {/* ── CHẾ ĐỘ 3: TỪNG CÁ NHÂN (SINGLE) ── */}
            {mode === 'single' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Chọn nhân sự áp dụng <span className="text-status-danger">*</span>
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) =>
                    onChangeFormData((prev) => ({ ...prev, employeeId: Number(e.target.value) }))
                  }
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
            )}

            {/* Chọn ca làm việc */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Chọn ca làm việc <span className="text-status-danger">*</span>
              </label>
              <select
                value={formData.shiftId}
                onChange={(e) =>
                  onChangeFormData((prev) => ({ ...prev, shiftId: Number(e.target.value) }))
                }
                data-testid="select-assign-shift"
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white cursor-pointer"
              >
                <option value={0}>-- Chọn ca làm việc --</option>
                {shifts
                  .filter((s) => s.isActive)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.shiftCode}) [{s.startTime} - {s.endTime}]
                    </option>
                  ))}
              </select>
            </div>

            {/* Khoảng ngày hiệu lực */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Từ ngày <span className="text-status-danger">*</span>
                </label>
                <input
                  type="date"
                  value={formData.effectiveStartDate}
                  onChange={(e) =>
                    onChangeFormData((prev) => ({ ...prev, effectiveStartDate: e.target.value }))
                  }
                  data-testid="input-assign-start-date"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Đến ngày <span className="text-status-danger">*</span>
                </label>
                <input
                  type="date"
                  value={formData.effectiveEndDate}
                  onChange={(e) =>
                    onChangeFormData((prev) => ({ ...prev, effectiveEndDate: e.target.value }))
                  }
                  data-testid="input-assign-end-date"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                />
              </div>
            </div>

            {/* Thông báo tiến độ phân ca theo lô */}
            {progressText && (
              <div
                data-testid="batch-assign-progress-banner"
                className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2"
              >
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>{progressText}</span>
              </div>
            )}
          </form>

          {/* Footer Modal */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              {mode === 'department' && selectedDept && (
                <span>
                  Áp dụng: <strong className="text-indigo-700">{departmentEmployees.length} nhân sự</strong> ({selectedDept})
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
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border-subtle bg-white text-text-secondary hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={isSubmitting}
                data-testid="submit-assign-shift-btn"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-hover shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>{progressText || 'Đang phân ca...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {mode === 'department'
                        ? `Phân Ca Cho Phòng Ban (${departmentEmployees.length})`
                        : mode === 'multi'
                          ? `Phân Ca Hàng Loạt (${selectedEmployeeIds.length})`
                          : 'Xác Nhận Phân Ca'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
