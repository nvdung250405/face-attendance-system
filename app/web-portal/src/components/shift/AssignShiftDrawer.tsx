/**
 * Modal Drawer Phân ca Nhân sự & Gợi ý Khoảng trống Chống trùng ca
 * (SOL-WEB-007, UXD-WEB-006, BLD-WEB-019).
 */

import React from 'react'
import { Calendar, X, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type {
  ShiftItem,
  EmployeeItem,
  AssignShiftRequest,
  OverlapConflictInfo,
} from '@/types'

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
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="assign-shift-drawer"
        hideCloseButton
        usePortal={false}
        className="p-0 max-w-lg border-0 bg-transparent shadow-none"
      >
        <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="font-bold text-base text-text-primary">
                  Phân Ca Nhân Sự Theo Khoảng Ngày
                </DialogTitle>
                <p className="text-xs text-text-secondary">
                  Gán ca làm việc cho nhân viên & kiểm tra xung đột ca
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Modal */}
          <form onSubmit={onSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Cảnh báo lỗi thông thường */}
            {formError && (
              <div
                data-testid="assign-form-error"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Hộp gợi ý khoảng trống khi trùng ca (BLD-WEB-019, SOL-WEB-007) */}
            {overlapConflict && (
              <div
                data-testid="overlap-conflict-suggestion-box"
                className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2.5 animate-in fade-in"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
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
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Áp Dụng Khoảng Trống Này</span>
                  </button>
                )}
              </div>
            )}

            {/* Chọn nhân viên */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Chọn nhân sự áp dụng <span className="text-status-danger">*</span>
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) =>
                  onChangeFormData((prev) => ({ ...prev, employeeId: Number(e.target.value) }))
                }
                data-testid="select-assign-employee"
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
              >
                <option value={0}>-- Chọn nhân sự --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode}) - {emp.department}
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
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
          </form>

          {/* Footer Modal */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border-subtle bg-white text-text-secondary hover:bg-slate-100 transition-colors shadow-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              data-testid="submit-assign-shift-btn"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-hover shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Đang phân ca...' : 'Xác Nhận Phân Ca'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

