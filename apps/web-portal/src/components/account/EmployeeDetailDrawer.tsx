/**
 * EmployeeDetailDrawer: Ngăn Trượt Xem Chi Tiết Hồ Sơ Nhân Sự (Read-only Profile Overview Drawer)
 * (UXD-WEB-006, SOL-WEB-006, APD-WEB-004, TASK-WEB-024).
 *
 * Cung cấp góc nhìn toàn diện về một nhân sự:
 * - Trạng thái dữ liệu khuôn mặt (ArcFace 512D, mã hóa AES-256-GCM)
 * - Ca làm việc hiện hành (Active Shift)
 * - Phiên bản Informed Consent tuân thủ NĐ 13/2023 & NĐ 356/2025
 * - Trạng thái mã PIN dự phòng
 * - Quản trị và nút chuyển vai trò (Role Switch Button)
 * - Tuân thủ WCAG 2.1/2.2 AA qua DetailDrawer container
 */

import React, { useState } from 'react'
import {
  ScanFace,
  Lock,
  Clock,
  Shield,
  Edit3,
  ArrowRightLeft,
  Mail,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Button } from '@/components/ui/button'
import type { EmployeeItem, UserProfile, UserRole } from '@/types'

export interface EmployeeDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  employee: EmployeeItem | UserProfile | null
  activeShift?: string
  consentVersion?: string
  biometricTemplateStatus?: string
  onEdit?: (employee: EmployeeItem) => void
  onRoleSwitch?: (employee: EmployeeItem, newRole: UserRole) => void
}

const ROLE_LABELS: Record<UserRole, { label: string; badgeClass: string }> = {
  ADMIN: {
    label: 'Quản trị viên (ADMIN)',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  HR_MANAGER: {
    label: 'Quản lý Nhân sự (HR_MANAGER)',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  EMPLOYEE: {
    label: 'Nhân viên (EMPLOYEE)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  DPO: {
    label: 'Cán bộ Bảo vệ Dữ liệu (DPO)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  isOpen,
  onClose,
  employee,
  activeShift = 'Ca Hành Chính (08:00 - 17:00)',
  consentVersion = 'v2.0 (Nghị định 13/2023/NĐ-CP & Nghị định 356/2025/NĐ-CP)',
  biometricTemplateStatus,
  onEdit,
  onRoleSwitch,
}) => {
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(employee?.role || 'EMPLOYEE')

  if (!employee) {
    return (
      <DetailDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Hồ sơ nhân sự"
        size="lg"
        data-testid="employee-detail-drawer"
      >
        <div className="py-12 text-center text-slate-400">
          Không có thông tin nhân sự được chọn.
        </div>
      </DetailDrawer>
    )
  }

  const roleMeta = ROLE_LABELS[employee.role] || {
    label: employee.role,
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  }

  const handleConfirmRoleSwitch = () => {
    if (onRoleSwitch && employee) {
      onRoleSwitch(employee as EmployeeItem, selectedRole)
    }
    setIsSwitchingRole(false)
  }

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={employee.fullName}
      description={`Mã nhân viên: ${employee.employeeCode} • ${employee.department || 'Chưa phân phòng'}`}
      size="lg"
      data-testid="employee-detail-drawer"
      badge={
        employee.status === 'ACTIVE' ? (
          <span
            data-testid="employee-detail-status-badge"
            className="badge-success inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold"
          >
            ĐANG HOẠT ĐỘNG
          </span>
        ) : employee.status === 'PENDING_CONSENT' ? (
          <span
            data-testid="employee-detail-status-badge"
            className="badge-warning inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold"
          >
            CHỜ KÝ CAM KẾT
          </span>
        ) : (
          <span
            data-testid="employee-detail-status-badge"
            className="badge-neutral inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold"
          >
            {employee.status}
          </span>
        )
      }
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(employee as EmployeeItem)}
              data-testid="employee-detail-edit-btn"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Chỉnh sửa hồ sơ
            </Button>
          ) : (
            <span />
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            data-testid="employee-detail-close-btn"
          >
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {/* ── Khối 1: Thông tin nhân sự tổng quan ── */}
        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-base border border-brand-primary/20 shrink-0">
              {employee.fullName
                .split(' ')
                .slice(-2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {employee.fullName}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                <Mail size={13} className="shrink-0 text-slate-400" />
                <span>{employee.email}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 text-2xs block">Mã nhân viên</span>
              <span className="font-mono font-semibold text-brand-primary">
                {employee.employeeCode}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Phòng ban</span>
              <span className="font-medium text-slate-800">
                {employee.department || 'Chưa phân bổ'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Khối 2: Trạng thái Dữ liệu Sinh trắc học & Informed Consent ── */}
        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ScanFace className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sinh trắc học &amp; Informed Consent</span>
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mẫu vector khuôn mặt Kiosk</span>
              <span data-testid="detail-biometric-status">
                {employee.hasBiometric ? (
                  <span className="badge-success inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>ĐÃ KÍCH HOẠT</span>
                  </span>
                ) : (
                  <span className="badge-warning inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>CHƯA KÍCH HOẠT</span>
                  </span>
                )}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="text-2xs text-slate-500 font-medium">Chi tiết mẫu sinh trắc:</div>
              <div className="text-xs font-semibold text-slate-800">
                {biometricTemplateStatus ||
                  (employee.hasBiometric
                    ? 'Vector 512D ArcFace (Mã hóa chuẩn AES-256-GCM)'
                    : 'Chưa khởi tạo mẫu sinh trắc trên hệ thống')}
              </div>
              <div className="text-2xs text-slate-500">
                {employee.hasBiometric
                  ? 'Đã đồng bộ tới toàn bộ mạng lưới trạm Kiosk điểm danh.'
                  : 'Yêu cầu nhân viên ký Informed Consent để đăng ký quét mặt.'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Phiên bản Informed Consent</span>
              <span
                data-testid="detail-consent-version"
                className="font-mono text-xs font-bold text-slate-800"
              >
                {consentVersion}
              </span>
            </div>
          </div>
        </div>

        {/* ── Khối 3: Phương thức Xác thực Dự phòng (PIN Backup) ── */}
        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Phương thức Xác thực Dự phòng (Mã PIN)</span>
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trạng thái mã PIN</span>
              <span data-testid="detail-pin-status">
                {employee.hasPin ? (
                  <span className="badge-success inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold">
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>ĐÃ THIẾT LẬP</span>
                  </span>
                ) : (
                  <span className="badge-warning inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>CHƯA THIẾT LẬP</span>
                  </span>
                )}
              </span>
            </div>
            <p className="text-2xs text-slate-600 leading-relaxed">
              Mã PIN 6 số dùng để xác thực điểm danh tại bàn phím số trạm Kiosk khi gặp sự cố camera hoặc sau khi rút cam kết sinh trắc học.
            </p>
          </div>
        </div>

        {/* ── Khối 4: Ca làm việc Hiện tại (Active Shift) ── */}
        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 space-y-3">
          <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-primary" />
            <span>Ca làm việc Hiện tại (Active Shift)</span>
          </h4>

          <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div
                data-testid="detail-active-shift"
                className="text-xs font-bold text-slate-900"
              >
                {activeShift}
              </div>
              <div className="text-2xs text-slate-500">
                Áp dụng quy tắc tính đi muộn &amp; làm thêm giờ tự động
              </div>
            </div>
            <span className="badge-info text-2xs font-semibold shrink-0">
              ĐANG ÁP DỤNG
            </span>
          </div>
        </div>

        {/* ── Khối 5: Vai trò & Quản lý Phân quyền (Role Management) ── */}
        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Vai trò &amp; Quyền hạn</span>
            </h4>

            {/* Nút chuyển vai trò (Role Switch Button) */}
            <button
              type="button"
              data-testid="employee-role-switch-btn"
              onClick={() => setIsSwitchingRole(!isSwitchingRole)}
              className="text-xs font-semibold text-brand-primary hover:text-brand-dark flex items-center gap-1 focus:outline-hidden focus-visible:underline cursor-pointer"
            >
              <ArrowRightLeft size={13} />
              <span>{isSwitchingRole ? 'Hủy' : 'Chuyển vai trò'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Vai trò hiện hành</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleMeta.badgeClass}`}
            >
              {roleMeta.label}
            </span>
          </div>

          {/* Inline Role Switcher UI */}
          {isSwitchingRole && (
            <div className="p-3 rounded-lg bg-white border border-indigo-200 space-y-3 pt-3">
              <label
                htmlFor="role-select"
                className="text-2xs font-bold text-slate-700 block uppercase"
              >
                Chọn vai trò mới cho nhân sự:
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
              >
                <option value="EMPLOYEE">Nhân viên (EMPLOYEE)</option>
                <option value="HR_MANAGER">Quản lý Nhân sự (HR_MANAGER)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                <option value="DPO">Cán bộ Bảo vệ Dữ liệu (DPO)</option>
              </select>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSwitchingRole(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmRoleSwitch}
                  disabled={selectedRole === employee.role}
                >
                  Lưu vai trò mới
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DetailDrawer>
  )
}
