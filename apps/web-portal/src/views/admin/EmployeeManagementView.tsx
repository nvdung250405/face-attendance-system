/**
 * Màn hình Quản lý Hồ sơ Nhân sự & Vòng đời Tài khoản
 * (TASK-WEB-024, BLD-WEB-018, UXD-WEB-006, SOL-WEB-006, APD-WEB-004, ARCH-W-01).
 *
 * Presenter view kết nối useEmployeeManagement hook (Container/Presenter pattern).
 */

import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  EmployeeDrawer,
  TemporaryPasswordModal,
  EmployeeFilterToolbar,
  EmployeeTable,
  EmployeeActionModal,
} from '@/components/account'
import { useEmployeeManagement } from './hooks/useEmployeeManagement'

export const EmployeeManagementView: React.FC = () => {
  const {
    employees,
    isLoading,
    errorMessage,
    totalElements,
    page,
    pageSize,
    setPage,
    keyword,
    setKeyword,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    isDrawerOpen,
    setIsDrawerOpen,
    drawerMode,
    selectedEmployee,
    tempPassword,
    tempPasswordTarget,
    isTempModalOpen,
    actionLoadingId,
    pendingAction,
    setPendingAction,
    actionError,
    setActionError,
    activeAdminCount,
    hasActiveFilters,
    fetchEmployees,
    handleResetFilters,
    handleOpenCreate,
    handleOpenEdit,
    handleDrawerSuccess,
    handleCloseTempModal,
    handleResetCredentials,
    handleToggleStatus,
    handleConfirmAction,
    availableDepartments,
  } = useEmployeeManagement()

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề & Tác vụ hàng đầu ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Hồ sơ nhân sự</h1>
          <p className="page-subtitle text-slate-600">
            Quản lý danh sách nhân viên, thông tin tài khoản và phân quyền hệ thống
          </p>
        </div>
        <Button
          id="btn-add-employee"
          data-testid="btn-add-employee"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus size={16} strokeWidth={2.2} className="shrink-0" />}
          className="shrink-0"
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
            className="text-xs underline font-semibold hover:text-rose-900 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Thanh Tìm kiếm & Bộ lọc ── */}
      <EmployeeFilterToolbar
        keyword={keyword}
        onChangeKeyword={(val) => {
          setKeyword(val)
          setPage(0)
        }}
        onClearKeyword={() => {
          setKeyword('')
          setPage(0)
        }}
        departmentFilter={departmentFilter}
        onChangeDepartmentFilter={(val) => {
          setDepartmentFilter(val)
          setPage(0)
        }}
        availableDepartments={availableDepartments}
        statusFilter={statusFilter}
        onChangeStatusFilter={(val) => {
          setStatusFilter(val)
          setPage(0)
        }}
        roleFilter={roleFilter}
        onChangeRoleFilter={(val) => {
          setRoleFilter(val)
        }}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* ── Bảng Dữ liệu Nhân sự (UXD-WEB-006: Cột hành động dính bên phải) ── */}
      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        actionLoadingId={actionLoadingId}
        page={page}
        pageSize={pageSize}
        totalElements={totalElements}
        onPageChange={(newPage) => setPage(newPage)}
        onEdit={handleOpenEdit}
        onResetCredentials={handleResetCredentials}
        onToggleStatus={handleToggleStatus}
      />

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
      <EmployeeActionModal
        pendingAction={pendingAction}
        actionLoadingId={actionLoadingId}
        actionError={actionError}
        activeAdminCount={activeAdminCount}
        onClose={() => {
          if (!actionLoadingId) {
            setPendingAction(null)
            setActionError(null)
          }
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
