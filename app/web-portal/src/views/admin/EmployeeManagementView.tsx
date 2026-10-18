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
import { Plus, Search, ScanFace, Lock, Edit2, KeyRound, CheckCircle2, Ban, X } from 'lucide-react'
import { Button } from '@/components/common'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { EmployeeDrawer, TemporaryPasswordModal } from '@/components/account'
import type { EmployeeItem, UserRole, UserStatus } from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

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

  // Cấp lại mật khẩu tạm thời
  const handleResetCredentials = async (emp: EmployeeItem) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn cấp lại mật khẩu tạm thời cho nhân viên ${emp.fullName} (${emp.employeeCode})? Toàn bộ phiên hiện tại của nhân sự này sẽ bị thu hồi.`
    )
    if (!confirmed) return

    setActionLoadingId(emp.id)
    try {
      const res = await adminEmployeeService.resetCredentials(emp.id)
      setTempPassword(res.temporaryPassword)
      setTempPasswordTarget({
        name: emp.fullName,
        code: emp.employeeCode,
      })
      setIsTempModalOpen(true)
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      alert(apiErr?.message || 'Không thể cấp lại mật khẩu tạm.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Đổi trạng thái nhân sự (Vô hiệu hóa / Kích hoạt)
  const handleToggleStatus = async (emp: EmployeeItem) => {
    const isActivating = emp.status === 'INACTIVE' || emp.status === 'TERMINATED' || emp.status === 'SUSPENDED'
    const newStatus: UserStatus = isActivating ? 'ACTIVE' : 'INACTIVE'

    const message = isActivating
      ? `Bạn có chắc chắn muốn kích hoạt lại tài khoản ${emp.fullName} (${emp.employeeCode})?`
      : `Bạn có chắc chắn muốn vô hiệu hóa tài khoản ${emp.fullName} (${emp.employeeCode})? Nhân sự này sẽ không thể điểm danh hay đăng nhập hệ thống.`

    if (!window.confirm(message)) return

    setActionLoadingId(emp.id)
    try {
      await adminEmployeeService.updateEmployeeStatus(emp.id, newStatus)
      await fetchEmployees()
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      alert(apiErr?.message || 'Không thể cập nhật trạng thái nhân sự.')
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
                <th className="py-3 px-4">Mã NV</th>
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
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                      <span>Đang tải danh sách nhân sự...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
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
                      className="table-row-hover transition-colors"
                    >
                      {/* Mã NV */}
                      <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
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
    </div>
  )
}
