/**
 * Modal Drawer Tạo mới / Chỉnh sửa Ca làm việc (UXD-WEB-006, SOL-WEB-007).
 */

import React, { useState } from 'react'
import { Clock, X, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { previewShiftCode } from '@/utils/codePreview'
import type { ShiftItem, CreateShiftRequest } from '@/types'

export interface ShiftFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  editingShift: ShiftItem | null
  formData: CreateShiftRequest & { isActive?: boolean }
  onChangeFormData: React.Dispatch<React.SetStateAction<CreateShiftRequest & { isActive?: boolean }>>
  formError: string | null
  fieldErrors?: Record<string, string>
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
  fieldErrors,
  isSubmitting,
  onSubmit,
}) => {
  const [customCodeExpanded, setCustomCodeExpanded] = useState(false)
  const isCustomCodeActive = customCodeExpanded || Boolean(formData.shiftCode)

  const previewCode = previewShiftCode(
    formData.name || '',
    formData.startTime || '',
    formData.endTime || ''
  )
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="shift-drawer"
        hideCloseButton
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
              disabled={isSubmitting}
              aria-label="Đóng"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 shrink-0" />
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

            {/* Mã ca làm việc / Live Preview */}
            {editingShift ? (
              <Input
                id="input-shift-code"
                data-testid="input-shift-code"
                label="Mã ca làm việc"
                type="text"
                value={formData.shiftCode || editingShift.shiftCode}
                disabled
                className="uppercase font-mono bg-slate-50 text-text-muted"
              />
            ) : (
              <div className="space-y-2">
                <div
                  data-testid="shift-code-preview"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <Sparkles className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="text-xs text-text-secondary">Mã ca dự kiến sinh tự động:</span>
                  <span className="text-xs font-mono font-bold text-brand-primary">{previewCode}</span>
                </div>

                <div>
                  <button
                    type="button"
                    data-testid="toggle-custom-shift-code"
                    onClick={() => {
                      if (isCustomCodeActive) {
                        setCustomCodeExpanded(false)
                        onChangeFormData((f) => ({ ...f, shiftCode: undefined }))
                      } else {
                        setCustomCodeExpanded(true)
                      }
                    }}
                    className="text-xs text-brand-primary hover:text-brand-hover font-medium flex items-center gap-1 transition-colors"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCustomCodeActive ? 'rotate-180' : ''}`} />
                    <span>Tùy chỉnh mã ca (nâng cao)</span>
                  </button>
                </div>

                {isCustomCodeActive && (
                  <div className="animate-in fade-in duration-150">
                    <Input
                      id="input-shift-code"
                      data-testid="input-shift-code"
                      label="Mã ca làm việc thủ công"
                      type="text"
                      error={fieldErrors?.shiftCode}
                      value={formData.shiftCode || ''}
                      onChange={(e) =>
                        onChangeFormData((prev) => ({ ...prev, shiftCode: e.target.value.toUpperCase() }))
                      }
                      placeholder="Để trống để hệ thống tự sinh (ví dụ: SHF-XXXX)"
                      className="uppercase font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tên ca */}
            <Input
              id="input-shift-name"
              data-testid="input-shift-name"
              label={
                <>
                  Tên ca làm việc <span className="text-status-danger">*</span>
                </>
              }
              type="text"
              error={fieldErrors?.shiftName || fieldErrors?.name}
              value={formData.name}
              onChange={(e) => onChangeFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ví dụ: Ca Hành Chính, Ca Chiều..."
            />

            {/* Khung giờ: Bắt đầu - Kết thúc */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="input-shift-start-time"
                data-testid="input-shift-start-time"
                label={
                  <>
                    Giờ bắt đầu <span className="text-status-danger">*</span>
                  </>
                }
                type="time"
                error={fieldErrors?.startTime}
                value={formData.startTime}
                onChange={(e) => onChangeFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                className="font-mono"
              />
              <Input
                id="input-shift-end-time"
                data-testid="input-shift-end-time"
                label={
                  <>
                    Giờ kết thúc <span className="text-status-danger">*</span>
                  </>
                }
                type="time"
                error={fieldErrors?.endTime}
                value={formData.endTime}
                onChange={(e) => onChangeFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                className="font-mono"
              />
            </div>

            {/* Ân hạn */}
            <Input
              id="input-shift-grace-minutes"
              data-testid="input-shift-grace-minutes"
              label="Thời gian ân hạn đi muộn (Phút)"
              hint="Khoảng thời gian nhân viên đến trễ mà không bị tính vi phạm đi muộn (0 - 60 phút)"
              type="number"
              min={0}
              max={60}
              error={fieldErrors?.gracePeriodMinutes}
              value={formData.gracePeriodMinutes}
              onChange={(e) =>
                onChangeFormData((prev) => ({ ...prev, gracePeriodMinutes: Number(e.target.value) }))
              }
            />

            {/* Ca qua đêm (isOvernight) */}
            <div className="pt-1">
              <Switch
                id="shift-is-overnight"
                data-testid="input-shift-is-overnight"
                checked={Boolean(formData.isOvernight)}
                onChange={(e) =>
                  onChangeFormData((prev) => ({ ...prev, isOvernight: e.target.checked }))
                }
                label="Ca qua đêm (isOvernight)"
                description="Ca làm việc bắt đầu hôm trước và kết thúc vào ngày hôm sau (ví dụ: 22:00 - 06:00)"
              />
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              data-testid="submit-shift-btn"
            >
              {editingShift ? 'Lưu Thay Đổi' : 'Tạo Ca'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

