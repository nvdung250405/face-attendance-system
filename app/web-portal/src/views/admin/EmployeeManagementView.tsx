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
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { EmployeeDrawer, TemporaryPasswordModal } from '@/components/account'
import type { EmployeeItem, UserRole, UserStatus } from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

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
  const handleDrawerSuccess = (result: { employee: EmployeeItem; temporaryPassword?: string }) => {
    fetchEmployees()
    if (result.temporaryPassword) {
      setTempPassword(result.temporaryPassword)
      setTempPasswordTarget({
        name: result.employee.fullName,
        code: result.employee.employeeCode,
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
    const isActivating = emp.status === 'INACTIVE'
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
  const renderStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge-success">Đang hoạt động</span>
      case 'PENDING_CONSENT':
        return <span className="badge-warning">Chờ cam kết</span>
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
        <button
          type="button"
          id="btn-add-employee"
          data-testid="btn-add-employee"
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Thêm nhân viên</span>
        </button>
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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
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
            className="input-base pl-9.5 text-sm"
          />
        </div>

        {/* Lọc phòng ban */}
        <div className="w-full md:w-44">
          <select
            id="filter-department"
            data-testid="filter-department"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value)
              setPage(0)
            }}
            className="input-base text-sm"
          >
            <option value="ALL">Mọi phòng ban</option>
            <option value="Phòng Kỹ thuật">Phòng Kỹ thuật</option>
            <option value="Phòng Nhân sự">Phòng Nhân sự</option>
            <option value="Phòng Kế toán">Phòng Kế toán</option>
            <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
            <option value="Ban Giám đốc">Ban Giám đốc</option>
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
            className="input-base text-sm"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="PENDING_CONSENT">Chờ cam kết</option>
            <option value="INACTIVE">Đã vô hiệu hóa</option>
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
            className="input-base text-sm"
          >
            <option value="ALL">Mọi vai trò</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="HR_MANAGER">HR_MANAGER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DPO">DPO</option>
          </select>
        </div>
      </div>

      {/* ── Bảng Dữ liệu Nhân sự (UXD-WEB-006: Cột hành động dính bên phải) ── */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table
            data-testid="employee-table"
            className="w-full text-left border-collapse text-sm"
          >
            <thead>
              <tr className="table-sticky-header">
                <th className="py-3 px-4 font-semibold">Mã NV</th>
                <th className="py-3 px-4 font-semibold">Họ và tên</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phòng ban</th>
                <th className="py-3 px-4 font-semibold">Vai trò</th>
                <th className="py-3 px-4 font-semibold">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-center">Sinh trắc / PIN</th>
                <th className="py-3 px-4 font-semibold text-right sticky right-0 bg-[#f8fafc] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="8" r="4" />
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                          </span>
                          <span
                            title={emp.hasPin ? 'Đã cài đặt PIN dự phòng' : 'Chưa có PIN'}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                              emp.hasPin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </span>
                        </div>
                      </td>

                      {/* Cột Hành động Dính bên phải (UXD-WEB-006) */}
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-[#f8fafc] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Nút sửa */}
                          <button
                            type="button"
                            title="Chỉnh sửa hồ sơ"
                            aria-label={`Sửa hồ sơ ${emp.fullName}`}
                            onClick={() => handleOpenEdit(emp)}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-brand-primary hover:bg-indigo-50 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Nút cấp lại mật khẩu tạm */}
                          <button
                            type="button"
                            title="Cấp lại mật khẩu tạm"
                            aria-label={`Cấp lại mật khẩu cho ${emp.fullName}`}
                            onClick={() => handleResetCredentials(emp)}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 2l-2 2m-2-2l2 2" />
                              <circle cx="7.5" cy="15.5" r="4.5" />
                              <path d="M10.5 12.5L20 3l1 1-2 2 2 2-3 3-2-2" />
                            </svg>
                          </button>

                          {/* Nút đổi trạng thái */}
                          <button
                            type="button"
                            title={emp.status === 'INACTIVE' ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                            aria-label={`${emp.status === 'INACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa'} ${emp.fullName}`}
                            onClick={() => handleToggleStatus(emp)}
                            disabled={isBusy}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.status === 'INACTIVE'
                                ? 'text-text-secondary hover:text-emerald-600 hover:bg-emerald-50'
                                : 'text-text-secondary hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            {emp.status === 'INACTIVE' ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 8 12 12 14 14" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                            )}
                          </button>
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
        <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
          <div>
            Hiển thị <span className="font-semibold text-text-primary">{displayedEmployees.length}</span> /{' '}
            <span className="font-semibold text-text-primary">{totalElements}</span> nhân sự
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="btn-secondary h-8 px-3 text-xs disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-2 font-medium">Trang {page + 1}</span>
            <button
              type="button"
              disabled={displayedEmployees.length < pageSize || (page + 1) * pageSize >= totalElements || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary h-8 px-3 text-xs disabled:opacity-40"
            >
              Sau
            </button>
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
