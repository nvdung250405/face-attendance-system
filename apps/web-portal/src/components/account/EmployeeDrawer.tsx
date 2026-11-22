/**
 * Khung Nhập liệu Drawer Hồ sơ Nhân sự (UXD-WEB-006, SOL-WEB-006, APD-WEB-004, TASK-WEB-024).
 *
 * ĐẶC TẢ KỸ THUẬT:
 * 1. Drawer trượt từ cạnh phải (chiều rộng max-w-drawer), hỗ trợ tạo mới và chỉnh sửa hồ sơ.
 * 2. Vùng cảnh báo nghiệp vụ (409 Conflict: trùng mã nhân viên, trùng email) hiển thị trên đầu form.
 * 3. Khi tạo mới thành công và nhận temporaryPassword, kích hoạt callback mở TemporaryPasswordModal.
 * 4. Tuân thủ chuẩn React (Reset state bằng key thay vì setState trong effect).
 */

import React, { useState } from 'react'
import { X, AlertCircle, Sparkles } from 'lucide-react'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DEPARTMENTS } from '@/constants/departments'
import { previewEmployeeCode } from '@/utils/codePreview'
import type { EmployeeItem, UserRole } from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

export interface EmployeeDrawerProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialData?: EmployeeItem | null
  isLastActiveAdmin?: boolean
  onClose: () => void
  onSuccess: (result: { employee: EmployeeItem; temporaryPassword?: string }) => void
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'EMPLOYEE', label: 'Nhân viên (EMPLOYEE)' },
  { value: 'HR_MANAGER', label: 'Quản lý Nhân sự (HR_MANAGER)' },
  { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
  { value: 'DPO', label: 'Cán bộ Bảo vệ Dữ liệu (DPO)' },
]

interface DrawerFormProps {
  mode: 'create' | 'edit'
  initialData?: EmployeeItem | null
  isLastActiveAdmin?: boolean
  onClose: () => void
  onSuccess: (result: { employee: EmployeeItem; temporaryPassword?: string }) => void
}

const DrawerForm: React.FC<DrawerFormProps> = ({ mode, initialData, isLastActiveAdmin, onClose, onSuccess }) => {
  const [employeeCode, setEmployeeCode] = useState(() => {
    if (initialData?.employeeCode) return initialData.employeeCode
    return ''
  })
  const [fullName, setFullName] = useState(initialData?.fullName ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [department, setDepartment] = useState(initialData?.department || 'Phòng Kỹ thuật')
  const [role, setRole] = useState<UserRole>(initialData?.role ?? 'EMPLOYEE')

  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setFieldErrors({})

    const errs: Record<string, string> = {}
    if (mode === 'edit' && !employeeCode.trim()) {
      errs.employeeCode = 'Mã nhân viên không được để trống'
    }
    if (!fullName.trim()) errs.fullName = 'Họ và tên không được để trống'
    if (!email.trim()) {
      errs.email = 'Email không được để trống'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Email không đúng định dạng'
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setIsLoading(true)
    try {
      if (mode === 'create') {
        const finalEmployeeCode = employeeCode.trim() || undefined
        const res = await adminEmployeeService.createEmployee({
          employeeCode: finalEmployeeCode,
          fullName: fullName.trim(),
          email: email.trim(),
          department,
          role,
        })
        const createdEmployee: EmployeeItem = res.employee || {
          id: 0,
          employeeCode: finalEmployeeCode || 'EMP-AUTO',
          fullName: fullName.trim(),
          email: email.trim(),
          department,
          role,
          status: 'PENDING_CONSENT',
          hasBiometric: false,
          hasPin: false,
          createdAt: new Date().toISOString(),
        }
        onClose()
        try {
          onSuccess({
            employee: createdEmployee,
            temporaryPassword: res.temporaryPassword,
          })
        } catch {
          // Callback error handled silently in production
        }
        return
      } else if (initialData) {
        const updated = await adminEmployeeService.updateEmployee(initialData.id, {
          fullName: fullName.trim(),
          department,
          role,
        })
        onClose()
        onSuccess({ employee: updated })
        return
      }
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      if (apiErr?.fieldErrors && Object.keys(apiErr.fieldErrors).length > 0) {
        setFieldErrors(apiErr.fieldErrors)
      }
      setGeneralError(apiErr?.message || 'Có lỗi xảy ra khi lưu hồ sơ nhân sự.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
      {/* Header Modal */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50 shrink-0">
        <div>
          <h2 id="employee-drawer-title" className="text-base font-bold text-text-primary">
            {mode === 'create' ? 'Tạo mới hồ sơ nhân sự' : 'Chỉnh sửa hồ sơ nhân sự'}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {mode === 'create'
              ? 'Thông tin nhân viên & cấp quyền truy cập'
              : `Mã NV: ${initialData?.employeeCode}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng Drawer"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
        >
          <X size={18} strokeWidth={2} className="shrink-0" />
        </button>
      </div>

      {/* Vùng cảnh báo nghiệp vụ (UXD-WEB-006) */}
      {generalError && (
        <div
          data-testid="employee-form-error"
          className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2"
        >
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Nội dung Form cuộn được */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Mã nhân viên */}
        <div className="space-y-2">
          {mode === 'create' ? (
            <>
              {/* Live Preview Badge */}
              <div
                data-testid="employee-code-preview"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <Sparkles size={16} className="text-brand-primary shrink-0" />
                <span className="text-xs text-text-secondary">Mã NV sẽ được hệ thống cấp tự động:</span>
                <span className="text-xs font-mono font-bold text-brand-primary">
                  {previewEmployeeCode(department)}
                </span>
              </div>

              <div>
                <label
                  htmlFor="drawer-employee-code"
                  className="block text-xs font-semibold text-text-secondary mb-1"
                >
                  Mã nhân viên <span className="text-text-muted font-normal">(Tùy chọn - để trống để cấp tự động)</span>
                </label>
                <input
                  id="drawer-employee-code"
                  data-testid="drawer-employee-code"
                  type="text"
                  value={employeeCode}
                  maxLength={50}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  placeholder="Để trống hoặc nhập mã định danh riêng..."
                  className={`input-base font-mono w-full ${fieldErrors.employeeCode ? 'border-rose-400 focus:border-rose-500' : ''}`}
                />
              </div>
            </>
          ) : (
            <div>
              <label
                htmlFor="drawer-employee-code"
                className="block text-xs font-semibold text-text-secondary mb-1"
              >
                Mã nhân viên <span className="text-rose-500">*</span>
              </label>
              <input
                id="drawer-employee-code"
                data-testid="drawer-employee-code"
                type="text"
                value={employeeCode}
                disabled
                className="input-base font-mono w-full bg-slate-50 text-text-muted"
              />
            </div>
          )}
          {fieldErrors.employeeCode && (
            <p className="text-xs text-rose-600 mt-1">{fieldErrors.employeeCode}</p>
          )}
        </div>

        {/* Họ và tên */}
        <div>
          <label
            htmlFor="drawer-full-name"
            className="block text-xs font-semibold text-text-secondary mb-1"
          >
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <input
            id="drawer-full-name"
            data-testid="drawer-full-name"
            type="text"
            value={fullName}
            maxLength={100}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            placeholder="VD: Nguyễn Văn A"
            className={`input-base ${fieldErrors.fullName ? 'border-rose-400 focus:border-rose-500' : ''}`}
          />
          {fieldErrors.fullName && (
            <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="drawer-email"
            className="block text-xs font-semibold text-text-secondary mb-1"
          >
            Email công vụ <span className="text-rose-500">*</span>
          </label>
          <input
            id="drawer-email"
            data-testid="drawer-email"
            type="email"
            value={email}
            maxLength={100}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mode === 'edit' || isLoading}
            placeholder="VD: a.nv@company.com"
            className={`input-base ${fieldErrors.email ? 'border-rose-400 focus:border-rose-500' : ''}`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Phòng ban */}
        <div>
          <label
            htmlFor="drawer-department"
            className="block text-xs font-semibold text-text-secondary mb-1"
          >
            Phòng ban
          </label>
          <select
            id="drawer-department"
            data-testid="drawer-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={isLoading}
            className="input-base"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Vai trò */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="drawer-role"
              className="block text-xs font-semibold text-text-secondary"
            >
              Vai trò & Phân quyền <span className="text-rose-500">*</span>
            </label>
            {isLastActiveAdmin && mode === 'edit' && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium inline-flex items-center gap-1">
                <AlertCircle size={12} className="text-amber-600 shrink-0" />
                ADMIN duy nhất
              </span>
            )}
          </div>
          <select
            id="drawer-role"
            data-testid="drawer-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isLoading || (Boolean(isLastActiveAdmin) && mode === 'edit')}
            className={`input-base ${isLastActiveAdmin && mode === 'edit' ? 'bg-slate-100 cursor-not-allowed opacity-80' : ''}`}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {isLastActiveAdmin && mode === 'edit' ? (
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Hệ thống yêu cầu duy trì ít nhất 1 Quản trị viên (ADMIN) đang hoạt động. Không thể chuyển sang vai trò khác.
            </p>
          ) : (
            <p className="text-[11px] text-slate-600 mt-1 leading-normal">
              {role === 'EMPLOYEE' && 'Quyền nhân viên: Xem bảng công cá nhân, đăng ký sinh trắc & gửi yêu cầu dữ liệu.'}
              {role === 'HR_MANAGER' && 'Quyền quản lý nhân sự: Quản lý danh mục nhân viên, điểm danh trực tiếp, ca kíp & kỳ công.'}
              {role === 'ADMIN' && 'Quyền quản trị toàn quyền: Toàn quyền truy cập mọi tính năng và cấu hình trạm Kiosk.'}
              {role === 'DPO' && 'Quyền bảo vệ dữ liệu: Tra cứu audit log và giám sát tuân thủ Nghị định 13 (chế độ chỉ đọc).'}
            </p>
          )}
        </div>

        {mode === 'create' && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <span className="font-semibold">Lưu ý mật khẩu tạm:</span> Sau khi tạo hồ sơ, hệ thống sẽ tự động cấp một mật khẩu tạm thời hiển thị trên màn hình để bàn giao cho nhân viên.
          </div>
        )}
      </form>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
        <Button
          type="button"
          variant="secondary"
          id="drawer-btn-cancel"
          data-testid="drawer-btn-cancel"
          onClick={onClose}
          disabled={isLoading}
          className="shrink-0"
        >
          Hủy bỏ
        </Button>
        <Button
          type="button"
          id="drawer-btn-submit"
          data-testid="drawer-btn-submit"
          onClick={handleSubmit}
          isLoading={isLoading}
          className="shrink-0"
        >
          {mode === 'create' ? 'Tạo nhân sự' : 'Cập nhật hồ sơ'}
        </Button>
      </div>
    </div>
  )
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  isOpen,
  mode,
  initialData,
  isLastActiveAdmin,
  onClose,
  onSuccess,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        data-testid="employee-drawer"
        aria-labelledby="employee-drawer-title"
        hideCloseButton
        className="p-0 max-w-lg border-0 bg-transparent shadow-none"
      >
        <DrawerForm
          key={`${mode}-${initialData?.id ?? 'new'}`}
          mode={mode}
          initialData={initialData}
          isLastActiveAdmin={isLastActiveAdmin}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
