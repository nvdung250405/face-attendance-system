/**
 * Màn hình Quản lý Hồ sơ Nhân sự & Vòng đời Tài khoản
 * (TASK-WEB-024, BLD-WEB-018, UXD-WEB-006, SOL-WEB-006, APD-WEB-004).
 *
 * TÍNH NĂNG CHÍNH:
 * 1. Bảng dữ liệu danh sách nhân sự với cột hành động cố định bên phải.
 * 2. Bộ lọc tìm kiếm theo từ khóa (Mã NV, Tên, Email), phòng ban, trạng thái và vai trò.
 * 3. Drawer tạo mới & chỉnh sửa hồ sơ nhân sự (UXD-WEB-006).
 * 4. Hộp thoại mật khẩu tạm thời hiển thị duy nhất một lần khi tạo mới hoặc cấp lại mật khẩu (DD-WEB-018).
 * 5. Thao tác vô hiệu hóa/kích hoạt tài khoản nhân sự với xác nhận.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, ScanFace, Lock, Edit2, KeyRound, CheckCircle2, Ban, X, AlertCircle } from 'lucide-react'
import { Button, Modal, TableSkeleton } from '@/components/common'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { EmployeeDrawer, TemporaryPasswordModal } from '@/components/account'
import { useAuthStore } from '@/store/authStore'
import type { EmployeeItem, UserRole, UserStatus } from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

interface PendingConfirmAction {
  type: 'RESET_PASSWORD' | 'TOGGLE_STATUS'
  employee: EmployeeItem
}

const DEFAULT_DEPARTMENTS = [
  'Phòng Kỹ thuật & Tích hợp',
  'Phòng Nhân sự & Đào tạo',
  'Phòng Kinh doanh & Khách hàng',
  'Phòng Kế toán - Tài chính',
  'Phòng Kho vận & Logistics',
  'Ban Quản Trị Hệ Thống',
  'Ban Pháp chế & Bảo mật',
  'Phòng Kỹ thuật',
  'Phòng Nhân sự',
  'Phòng Kế toán',
  'Phòng Kinh doanh',
  'Ban Giám đốc',
]

export const EmployeeManagementView: React.FC = () => {
  // Danh sách & Phân trang
  const [employees, setEmployees] = useState<EmployeeItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Bộ lọc
  const [keyword, setKeyword] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null)

  // Temporary Password Modal State (CHỈ TỒN TẠI TRONG RAM, TUYỆT ĐỐI KHÔNG LƯU STORAGE)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [tempPasswordTarget, setTempPasswordTarget] = useState<{ name: string; code: string } | null>(null)
  const [isTempModalOpen, setIsTempModalOpen] = useState(false)

  // Tác vụ Vô hiệu hóa / Reset
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingConfirmAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Tải danh sách nhân sự
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const criteria = {
        page,
        size: pageSize,
        keyword: keyword.trim() || undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as UserStatus) : undefined,
      }
      const data = await adminEmployeeService.getEmployees(criteria)
      setEmployees(data.content || [])
      setTotalElements(data.totalElements || 0)
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      setErrorMessage(apiErr?.message || 'Không thể tải danh mục hồ sơ nhân sự.')
    } finally {
      setIsLoading(false)
    }
  }, [page, keyword, departmentFilter, statusFilter])

  useEffect(() => {
    let active = true
    const run = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const criteria = {
          page,
          size: pageSize,
          keyword: keyword.trim() || undefined,
          department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as UserStatus) : undefined,
        }
        const data = await adminEmployeeService.getEmployees(criteria)
        if (active) {
          setEmployees(data.content || [])
          setTotalElements(data.totalElements || 0)
        }
      } catch (err: unknown) {
        if (active) {
          const apiErr = err as NormalizedApiError
          setErrorMessage(apiErr?.message || 'Không thể tải danh mục hồ sơ nhân sự.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [page, keyword, departmentFilter, statusFilter])

  // Danh sách phòng ban tổng hợp (chuẩn hóa cùng dữ liệu thực tế)
  const availableDepartments = useMemo(() => {
    const set = new Set(DEFAULT_DEPARTMENTS)
    employees.forEach((emp) => {
      if (emp.department && emp.department !== '—') {
        set.add(emp.department)
      }
    })
    return Array.from(set)
  }, [employees])

  // Đếm số lượng Quản trị viên (ADMIN) đang hoạt động
  const activeAdminCount = useMemo(() => {
    return employees.filter(
      (emp) => emp.role === 'ADMIN' && (emp.status === 'ACTIVE' || !emp.status)
    ).length
  }, [employees])

  const hasActiveFilters = Boolean(
    keyword.trim() || departmentFilter !== 'ALL' || statusFilter !== 'ALL' || roleFilter !== 'ALL'
  )

  const handleResetFilters = () => {
    setKeyword('')
    setDepartmentFilter('ALL')
    setStatusFilter('ALL')
    setRoleFilter('ALL')
    setPage(0)
  }

  // Lọc thêm theo role ở client nếu backend chưa hỗ trợ query role
  const displayedEmployees = useMemo(() => {
    if (roleFilter === 'ALL') return employees
    return employees.filter((emp) => emp.role === roleFilter)
  }, [employees, roleFilter])

  // Mở Drawer tạo mới
  const handleOpenCreate = () => {
    setSelectedEmployee(null)
    setDrawerMode('create')
    setIsDrawerOpen(true)
  }

  // Mở Drawer chỉnh sửa
  const handleOpenEdit = (emp: EmployeeItem) => {
    setSelectedEmployee(emp)
    setDrawerMode('edit')
    setIsDrawerOpen(true)
  }

  // Xử lý sau khi lưu hồ sơ từ Drawer
  const handleDrawerSuccess = (result: { employee?: Partial<EmployeeItem>; temporaryPassword?: string }) => {
    fetchEmployees()
    if (result.employee) {
      const currentUser = useAuthStore.getState().user
      if (currentUser && result.employee.id && currentUser.id === result.employee.id) {
        useAuthStore.getState().updateUser({
          role: result.employee.role,
          fullName: result.employee.fullName,
          department: result.employee.department,
        })
      }
    }
    if (result.temporaryPassword) {
      setTempPassword(result.temporaryPassword)
      const emp = result.employee
      setTempPasswordTarget({
        name: emp?.fullName || 'Nhân viên mới',
        code: emp?.employeeCode || '',
      })
      setIsTempModalOpen(true)
    }
  }

  // Đóng hộp thoại mật khẩu tạm (Hủy sạch mật khẩu khỏi RAM)
  const handleCloseTempModal = () => {
    setIsTempModalOpen(false)
    setTempPassword(null)
    setTempPasswordTarget(null)
  }

  // Cấp lại mật khẩu tạm thời (mở modal xác nhận)
  const handleResetCredentials = (emp: EmployeeItem) => {
    setActionError(null)
    setPendingAction({ type: 'RESET_PASSWORD', employee: emp })
  }

  // Đổi trạng thái nhân sự (Vô hiệu hóa / Kích hoạt - mở modal xác nhận)
  const handleToggleStatus = (emp: EmployeeItem) => {
    setActionError(null)
    setPendingAction({ type: 'TOGGLE_STATUS', employee: emp })
  }

  // Thực thi tác vụ xác nhận từ Modal
  const handleConfirmAction = async () => {
    if (!pendingAction) return
    const { type, employee } = pendingAction
    setActionLoadingId(employee.id)
    setActionError(null)
    try {
      if (type === 'RESET_PASSWORD') {
        const res = await adminEmployeeService.resetCredentials(employee.id)
        setPendingAction(null)
        setTempPassword(res.temporaryPassword)
        setTempPasswordTarget({
          name: employee.fullName,
          code: employee.employeeCode,
        })
        setIsTempModalOpen(true)
      } else {
        const isActivating =
          employee.status === 'INACTIVE' || employee.status === 'TERMINATED' || employee.status === 'SUSPENDED'
        const newStatus: UserStatus = isActivating ? 'ACTIVE' : 'INACTIVE'
        await adminEmployeeService.updateEmployeeStatus(employee.id, newStatus)
        setPendingAction(null)
        await fetchEmployees()
        const currentUser = useAuthStore.getState().user
        if (currentUser && currentUser.id === employee.id) {
          useAuthStore.getState().updateUser({ status: newStatus })
        }
      }
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      setActionError(apiErr?.message || 'Có lỗi xảy ra khi thực hiện thao tác.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Badge vai trò
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge-danger">ADMIN</span>
      case 'HR_MANAGER':
        return <span className="badge-info">HR_MANAGER</span>
      case 'DPO':
        return <span className="badge-warning">DPO</span>
      case 'EMPLOYEE':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            EMPLOYEE
          </span>
        )
    }
  }

  // Badge trạng thái
  const renderStatusBadge = (status: UserStatus | string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge-success">Đang hoạt động</span>
      case 'PENDING_CONSENT':
        return <span className="badge-warning">Chờ cam kết</span>
      case 'SUSPENDED':
        return <span className="badge-warning">Tạm đình chỉ</span>
      case 'TERMINATED':
      case 'INACTIVE':
      default:
        return <span className="badge-danger">Đã vô hiệu hóa</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề & Tác vụ hàng đầu ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Hồ sơ nhân sự</h1>
          <p className="page-subtitle">
            Quản lý danh sách nhân viên, thông tin tài khoản và phân quyền hệ thống
          </p>
        </div>
        <Button
          id="btn-add-employee"
          data-testid="btn-add-employee"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus size={16} strokeWidth={2.2} />}
        >
          Thêm nhân viên
        </Button>
      </div>

      {/* ── Vùng Cảnh báo Lỗi nếu có ── */}
      {errorMessage && (
        <div
          data-testid="employee-list-error"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchEmployees}
            className="text-xs underline font-semibold hover:text-rose-900"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Thanh Tìm kiếm & Bộ lọc ── */}
      <div className="card-surface p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Tìm kiếm từ khóa */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} strokeWidth={2} />
          </div>
          <input
            id="search-input"
            data-testid="search-input"
            type="text"
            aria-label="Tìm kiếm nhân sự"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            placeholder="Tìm theo Mã NV, Họ tên, Email..."
            className="bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all"
          />
          {keyword && (
            <button
              type="button"
              data-testid="search-clear-btn"
              onClick={() => {
                setKeyword('')
                setPage(0)
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              title="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Lọc phòng ban */}
        <div className="w-full md:w-56">
          <select
            id="filter-department"
            data-testid="filter-department"
            aria-label="Lọc theo phòng ban"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value)
              setPage(0)
            }}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all"
          >
            <option value="ALL">Mọi phòng ban</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc trạng thái */}
        <div className="w-full md:w-44">
          <select
            id="filter-status"
            data-testid="filter-status"
            aria-label="Lọc theo trạng thái tài khoản"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="PENDING_CONSENT">Chờ cam kết</option>
            <option value="INACTIVE">Đã vô hiệu hóa</option>
            <option value="SUSPENDED">Tạm đình chỉ</option>
          </select>
        </div>

        {/* Lọc vai trò */}
        <div className="w-full md:w-40">
          <select
            id="filter-role"
            data-testid="filter-role"
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
            }}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-full transition-all"
          >
            <option value="ALL">Mọi vai trò</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="HR_MANAGER">HR_MANAGER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DPO">DPO</option>
          </select>
        </div>

        {/* Nút đặt lại bộ lọc */}
        {hasActiveFilters && (
          <button
            type="button"
            data-testid="employee-clear-filters-btn"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-brand-primary hover:text-brand-hover hover:underline self-center shrink-0 px-2 py-1"
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* ── Bảng Dữ liệu Nhân sự (UXD-WEB-006: Cột hành động dính bên phải) ── */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table
            data-testid="employee-table"
            className="w-full text-left border-collapse text-sm"
          >
            <thead>
              <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã NV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Sinh trắc / PIN</th>
                <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <TableSkeleton
                  columns={8}
                  rows={5}
                  hasActionColumn={true}
                  ariaLabel="Đang tải danh sách nhân sự..."
                />
              ) : displayedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-secondary">
                    <p className="text-base font-medium">Không tìm thấy hồ sơ nhân sự nào</p>
                    <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc thêm mới nhân viên</p>
                  </td>
                </tr>
              ) : (
                displayedEmployees.map((emp) => {
                  const isBusy = actionLoadingId === emp.id
                  return (
                    <tr
                      key={emp.id}
                      data-testid={`employee-row-${emp.id}`}
                      className="table-row-hover group transition-colors"
                    >
                      {/* Mã NV */}
                      <td className="py-3.5 px-4 font-mono font-bold text-text-primary sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)] whitespace-nowrap">
                        {emp.employeeCode}
                      </td>

                      {/* Họ tên */}
                      <td className="py-3.5 px-4 font-medium text-text-primary">
                        {emp.fullName}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        {emp.email}
                      </td>

                      {/* Phòng ban */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        {emp.department || '—'}
                      </td>

                      {/* Vai trò */}
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(emp.role)}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(emp.status)}
                      </td>

                      {/* Sinh trắc & PIN */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span
                            title={emp.hasBiometric ? 'Đã kích hoạt sinh trắc mặt' : 'Chưa kích hoạt'}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                              emp.hasBiometric ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <ScanFace size={14} strokeWidth={2} />
                          </span>
                          <span
                            title={emp.hasPin ? 'Đã cài đặt PIN dự phòng' : 'Chưa có PIN'}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                              emp.hasPin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Lock size={14} strokeWidth={2} />
                          </span>
                        </div>
                      </td>

                      {/* Cột Hành động Dính bên phải (UXD-WEB-006) */}
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Nút sửa */}
                          <button
                            type="button"
                            title="Chỉnh sửa hồ sơ"
                            aria-label={`Sửa hồ sơ ${emp.fullName}`}
                            onClick={() => handleOpenEdit(emp)}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>

                          {/* Nút cấp lại mật khẩu tạm */}
                          <button
                            type="button"
                            title="Cấp lại mật khẩu tạm"
                            aria-label={`Cấp lại mật khẩu cho ${emp.fullName}`}
                            onClick={() => handleResetCredentials(emp)}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <KeyRound size={16} strokeWidth={2} />
                          </button>

                          {/* Nút đổi trạng thái */}
                          {(() => {
                            const isDeactivated = emp.status === 'INACTIVE' || emp.status === 'TERMINATED' || emp.status === 'SUSPENDED'
                            return (
                              <button
                                type="button"
                                title={isDeactivated ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                                aria-label={`${isDeactivated ? 'Kích hoạt' : 'Vô hiệu hóa'} ${emp.fullName}`}
                                onClick={() => handleToggleStatus(emp)}
                                disabled={isBusy}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDeactivated
                                    ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                {isDeactivated ? (
                                  <CheckCircle2 size={16} strokeWidth={2} />
                                ) : (
                                  <Ban size={16} strokeWidth={2} />
                                )}
                              </button>
                            )
                          })()}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Thanh Phân trang ── */}
        <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-900">{displayedEmployees.length}</span> /{' '}
            <span className="font-semibold text-slate-900">{totalElements}</span> nhân sự
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trước
            </Button>
            <span className="px-2 font-semibold text-slate-700">Trang {page + 1}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={displayedEmployees.length < pageSize || (page + 1) * pageSize >= totalElements || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      {/* ── Drawer Tạo / Sửa hồ sơ nhân sự (UXD-WEB-006) ── */}
      <EmployeeDrawer
        isOpen={isDrawerOpen}
        mode={drawerMode}
        initialData={selectedEmployee}
        isLastActiveAdmin={
          selectedEmployee?.role === 'ADMIN' &&
          (selectedEmployee.status === 'ACTIVE' || !selectedEmployee.status) &&
          activeAdminCount <= 1
        }
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
      />

      {/* ── Hộp thoại Mật khẩu Tạm thời (DD-WEB-018 - Single Display) ── */}
      <TemporaryPasswordModal
        isOpen={isTempModalOpen}
        temporaryPassword={tempPassword}
        employeeName={tempPasswordTarget?.name}
        employeeCode={tempPasswordTarget?.code}
        onClose={handleCloseTempModal}
      />

      {/* ── Hộp thoại Xác nhận Tác vụ (Cấp lại mật khẩu / Vô hiệu hóa) ── */}
      {pendingAction && (
        <Modal
          isOpen={Boolean(pendingAction)}
          onClose={() => {
            if (!actionLoadingId) {
              setPendingAction(null)
              setActionError(null)
            }
          }}
          dataTestId="confirm-action-modal"
          title={
            pendingAction.type === 'RESET_PASSWORD'
              ? 'Cấp lại mật khẩu tạm thời'
              : (pendingAction.employee.status === 'INACTIVE' ||
                 pendingAction.employee.status === 'TERMINATED' ||
                 pendingAction.employee.status === 'SUSPENDED')
              ? 'Kích hoạt lại tài khoản'
              : 'Vô hiệu hóa tài khoản'
          }
          icon={
            pendingAction.type === 'RESET_PASSWORD' ? (
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <KeyRound size={20} strokeWidth={2} />
              </div>
            ) : (pendingAction.employee.status === 'INACTIVE' ||
                 pendingAction.employee.status === 'TERMINATED' ||
                 pendingAction.employee.status === 'SUSPENDED') ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={20} strokeWidth={2} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Ban size={20} strokeWidth={2} />
              </div>
            )
          }
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                data-testid="btn-cancel-action"
                onClick={() => {
                  setPendingAction(null)
                  setActionError(null)
                }}
                disabled={Boolean(actionLoadingId)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                data-testid="btn-confirm-action"
                variant={
                  pendingAction.type === 'RESET_PASSWORD'
                    ? 'primary'
                    : (pendingAction.employee.status === 'INACTIVE' ||
                       pendingAction.employee.status === 'TERMINATED' ||
                       pendingAction.employee.status === 'SUSPENDED')
                    ? 'primary'
                    : 'danger'
                }
                isLoading={Boolean(actionLoadingId)}
                onClick={handleConfirmAction}
              >
                {pendingAction.type === 'RESET_PASSWORD'
                  ? 'Cấp mật khẩu'
                  : (pendingAction.employee.status === 'INACTIVE' ||
                     pendingAction.employee.status === 'TERMINATED' ||
                     pendingAction.employee.status === 'SUSPENDED')
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
            {pendingAction.type === 'RESET_PASSWORD' ? (
              <p>
                Bạn có chắc chắn muốn cấp lại mật khẩu tạm thời cho nhân viên{' '}
                <strong className="text-slate-900">{pendingAction.employee.fullName}</strong> (
                <span className="font-mono text-slate-800">{pendingAction.employee.employeeCode}</span>)?
                Toàn bộ phiên làm việc hiện tại của nhân sự này sẽ bị thu hồi và một mật khẩu tạm mới sẽ được sinh ra.
              </p>
            ) : (pendingAction.employee.status === 'INACTIVE' ||
                 pendingAction.employee.status === 'TERMINATED' ||
                 pendingAction.employee.status === 'SUSPENDED') ? (
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
      )}
    </div>
  )
}
