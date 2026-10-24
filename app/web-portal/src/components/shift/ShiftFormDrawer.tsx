/**
 * Modal Drawer Tạo mới / Chỉnh sửa Ca làm việc (UXD-WEB-006, SOL-WEB-007).
 */

import React from 'react'
import { Clock, X, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { ShiftItem, CreateShiftRequest } from '@/types'

export interface ShiftFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  editingShift: ShiftItem | null
  formData: CreateShiftRequest & { isActive?: boolean }
  onChangeFormData: React.Dispatch<React.SetStateAction<CreateShiftRequest & { isActive?: boolean }>>
  formError: string | null
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export const ShiftFormDrawer: React.FC<ShiftFormDrawerProps> = ({
  isOpen,
  onClose,
  editingShift,
  formData,
  onChangeFormData,
  formError,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="shift-drawer"
        hideCloseButton
        usePortal={false}
        className="p-0 max-w-lg border-0 bg-transparent shadow-none"
      >
        <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="font-bold text-base text-text-primary">
                  {editingShift ? 'Chỉnh Sửa Ca Làm Việc' : 'Tạo Mới Ca Làm Việc'}
                </DialogTitle>
                <p className="text-xs text-text-secondary">
                  {editingShift ? 'Cập nhật khung giờ & thời gian ân hạn' : 'Thiết lập khung giờ làm việc chuẩn cho tổ chức'}
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
            {formError && (
              <div
                data-testid="shift-form-error"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Mã ca */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Mã ca làm việc <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.shiftCode}
                onChange={(e) =>
                  onChangeFormData((prev) => ({ ...prev, shiftCode: e.target.value.toUpperCase() }))
                }
                disabled={Boolean(editingShift)}
                data-testid="input-shift-code"
                placeholder="Ví dụ: CA_SANG, CA_TOI..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white disabled:bg-slate-50 disabled:text-text-muted uppercase font-mono"
              />
            </div>

            {/* Tên ca */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Tên ca làm việc <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onChangeFormData((prev) => ({ ...prev, name: e.target.value }))}
                data-testid="input-shift-name"
                placeholder="Ví dụ: Ca Hành Chính, Ca Chiều..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
              />
            </div>

            {/* Khung giờ: Bắt đầu - Kết thúc */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Giờ bắt đầu <span className="text-status-danger">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => onChangeFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  data-testid="input-shift-start-time"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Giờ kết thúc <span className="text-status-danger">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => onChangeFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                  data-testid="input-shift-end-time"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                />
              </div>
            </div>

            {/* Ân hạn */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Thời gian ân hạn đi muộn (Phút)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={formData.gracePeriodMinutes}
                onChange={(e) =>
                  onChangeFormData((prev) => ({ ...prev, gracePeriodMinutes: Number(e.target.value) }))
                }
                data-testid="input-shift-grace-minutes"
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
              />
              <span className="text-2xs text-text-secondary">
                Khoảng thời gian nhân viên đến trễ mà không bị tính vi phạm đi muộn (0 - 60 phút)
              </span>
            </div>

            {/* Kích hoạt trạng thái khi chỉnh sửa */}
            {editingShift && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shift-is-active"
                  checked={formData.isActive}
                  onChange={(e) =>
                    onChangeFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  data-testid="input-shift-is-active"
                  className="rounded text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="shift-is-active" className="text-xs font-semibold text-text-secondary">
                  Kích hoạt áp dụng ca làm việc này
                </label>
              </div>
            )}
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
              data-testid="submit-shift-btn"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-hover shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Đang lưu...' : editingShift ? 'Lưu Thay Đổi' : 'Tạo Ca'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

