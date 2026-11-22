import React from 'react'
import { KeyRound, CheckCircle2, Ban, AlertCircle } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import type { PendingConfirmAction } from '@/views/admin/hooks/useEmployeeManagement'

interface EmployeeActionModalProps {
  pendingAction: PendingConfirmAction | null
  actionLoadingId: number | null
  actionError: string | null
  activeAdminCount: number
  onClose: () => void
  onConfirm: () => void
}

export const EmployeeActionModal: React.FC<EmployeeActionModalProps> = ({
  pendingAction,
  actionLoadingId,
  actionError,
  activeAdminCount,
  onClose,
  onConfirm,
}) => {
  if (!pendingAction) return null

  const isPendingReset = pendingAction.type === 'RESET_PASSWORD'
  const st = pendingAction.employee.status
  const isPendingDeactivated =
    pendingAction.type === 'TOGGLE_STATUS' &&
    (st === 'INACTIVE' || st === 'TERMINATED' || st === 'SUSPENDED')

  return (
    <Modal
      isOpen={Boolean(pendingAction)}
      onClose={onClose}
      dataTestId="confirm-action-modal"
      title={
        isPendingReset
          ? 'Cấp lại mật khẩu tạm thời'
          : isPendingDeactivated
          ? 'Kích hoạt lại tài khoản'
          : 'Vô hiệu hóa tài khoản'
      }
      icon={
        isPendingReset ? (
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <KeyRound size={20} strokeWidth={2} className="shrink-0" />
          </div>
        ) : isPendingDeactivated ? (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} strokeWidth={2} className="shrink-0" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Ban size={20} strokeWidth={2} className="shrink-0" />
          </div>
        )
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            data-testid="btn-cancel-action"
            onClick={onClose}
            disabled={Boolean(actionLoadingId)}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            data-testid="btn-confirm-action"
            variant={
              isPendingReset
                ? 'primary'
                : isPendingDeactivated
                ? 'primary'
                : 'danger'
            }
            isLoading={Boolean(actionLoadingId)}
            onClick={onConfirm}
          >
            {isPendingReset
              ? 'Cấp mật khẩu'
              : isPendingDeactivated
              ? 'Kích hoạt'
              : 'Vô hiệu hóa'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-slate-600">
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
            {actionError}
          </div>
        )}
        {isPendingReset ? (
          <p>
            Bạn có chắc chắn muốn cấp lại mật khẩu tạm thời cho nhân viên{' '}
            <strong className="text-slate-900">{pendingAction.employee.fullName}</strong> (
            <span className="font-mono text-slate-800">{pendingAction.employee.employeeCode}</span>)?
            Toàn bộ phiên làm việc hiện tại của nhân sự này sẽ bị thu hồi và một mật khẩu tạm mới sẽ được sinh ra.
          </p>
        ) : isPendingDeactivated ? (
          <p>
            Bạn có chắc chắn muốn kích hoạt lại tài khoản của nhân viên{' '}
            <strong className="text-slate-900">{pendingAction.employee.fullName}</strong> (
            <span className="font-mono text-slate-800">{pendingAction.employee.employeeCode}</span>)?
            Nhân sự này sẽ có thể đăng nhập hệ thống và thực hiện chấm công bình thường.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingAction.employee.role === 'ADMIN' &&
              (pendingAction.employee.status === 'ACTIVE' || !pendingAction.employee.status) &&
              activeAdminCount <= 1 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span>
                    Tài khoản này là Quản trị viên (ADMIN) đang hoạt động duy nhất. Việc vô hiệu hóa sẽ khiến hệ thống không còn Quản trị viên nào hoạt động.
                  </span>
                </div>
              )}
            <p>
              Bạn có chắc chắn muốn vô hiệu hóa tài khoản của nhân viên{' '}
              <strong className="text-slate-900">{pendingAction.employee.fullName}</strong> (
              <span className="font-mono text-slate-800">{pendingAction.employee.employeeCode}</span>)?
              Nhân sự này sẽ không thể điểm danh hay đăng nhập vào hệ thống nữa.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
