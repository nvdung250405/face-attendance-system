import React from 'react'
import { ScanFace, Lock, Edit2, KeyRound, CheckCircle2, Ban } from 'lucide-react'
import { TableSkeleton, PaginationBar } from '@/components/ui'
import type { EmployeeItem, UserRole, UserStatus } from '@/types'

interface EmployeeTableProps {
  employees: EmployeeItem[]
  isLoading: boolean
  actionLoadingId: number | null
  page: number
  pageSize: number
  totalElements: number
  onPageChange: (newPage: number) => void
  onPageSizeChange?: (newPageSize: number) => void
  onEdit: (emp: EmployeeItem) => void
  onResetCredentials: (emp: EmployeeItem) => void
  onToggleStatus: (emp: EmployeeItem) => void
  onRowClick?: (emp: EmployeeItem) => void
}

const renderRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return <span className="badge-danger shrink-0">ADMIN</span>
    case 'HR_MANAGER':
      return <span className="badge-info shrink-0">HR_MANAGER</span>
    case 'DPO':
      return <span className="badge-warning shrink-0">DPO</span>
    case 'EMPLOYEE':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
          EMPLOYEE
        </span>
      )
  }
}

const renderStatusBadge = (status: UserStatus | string) => {
  switch (status) {
    case 'ACTIVE':
      return <span className="badge-success shrink-0">Đang hoạt động</span>
    case 'PENDING_CONSENT':
      return <span className="badge-warning shrink-0">Chờ cam kết</span>
    case 'SUSPENDED':
      return <span className="badge-warning shrink-0">Tạm đình chỉ</span>
    case 'TERMINATED':
    case 'INACTIVE':
    default:
      return <span className="badge-danger shrink-0">Đã vô hiệu hóa</span>
  }
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  isLoading,
  actionLoadingId,
  page,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onResetCredentials,
  onToggleStatus,
  onRowClick,
}) => {
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table
          data-testid="employee-table"
          className="w-full text-left border-collapse text-sm"
        >
          <thead>
            <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã NV</th>
              <th scope="col" className="py-3 px-4">Họ và tên</th>
              <th scope="col" className="py-3 px-4">Email</th>
              <th scope="col" className="py-3 px-4">Phòng ban</th>
              <th scope="col" className="py-3 px-4">Vai trò</th>
              <th scope="col" className="py-3 px-4">Trạng thái</th>
              <th scope="col" className="py-3 px-4 text-center">Sinh trắc / PIN</th>
              <th scope="col" className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
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
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-secondary">
                  <p className="text-base font-medium">Không tìm thấy hồ sơ nhân sự nào</p>
                  <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc thêm mới nhân viên</p>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const isBusy = actionLoadingId === emp.id
                const isDeactivated = emp.status === 'INACTIVE' || emp.status === 'TERMINATED' || emp.status === 'SUSPENDED'
                return (
                  <tr
                    key={emp.id}
                    data-testid={`employee-row-${emp.id}`}
                    onClick={() => onRowClick?.(emp)}
                    className="table-row-hover group transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-text-primary sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)] whitespace-nowrap tabular-nums">
                      {emp.employeeCode}
                    </td>

                    <td className="py-3 px-4 font-medium text-text-primary">
                      <span className="truncate max-w-[200px] block" title={emp.fullName}>
                        {emp.fullName}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-text-secondary">
                      <span className="truncate max-w-[200px] block" title={emp.email}>
                        {emp.email}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-text-secondary">
                      <span className="truncate max-w-[200px] block" title={emp.department || '—'}>
                        {emp.department || '—'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {renderRoleBadge(emp.role)}
                    </td>

                    <td className="py-3 px-4">
                      {renderStatusBadge(emp.status)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span
                          title={emp.hasBiometric ? 'Đã kích hoạt sinh trắc mặt' : 'Chưa kích hoạt'}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${
                            emp.hasBiometric ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <ScanFace size={14} strokeWidth={2} className="shrink-0" />
                        </span>
                        <span
                          title={emp.hasPin ? 'Đã cài đặt PIN dự phòng' : 'Chưa có PIN'}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${
                            emp.hasPin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Lock size={14} strokeWidth={2} className="shrink-0" />
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Chỉnh sửa hồ sơ"
                          aria-label={`Sửa hồ sơ ${emp.fullName}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(emp)
                          }}
                          disabled={isBusy}
                          className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                        >
                          <Edit2 size={16} strokeWidth={2} className="shrink-0" />
                        </button>

                        <button
                          type="button"
                          title="Cấp lại mật khẩu tạm"
                          aria-label={`Cấp lại mật khẩu cho ${emp.fullName}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onResetCredentials(emp)
                          }}
                          disabled={isBusy}
                          className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                        >
                          <KeyRound size={16} strokeWidth={2} className="shrink-0" />
                        </button>

                        <button
                          type="button"
                          title={isDeactivated ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                          aria-label={`${isDeactivated ? 'Kích hoạt' : 'Vô hiệu hóa'} ${emp.fullName}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleStatus(emp)
                          }}
                          disabled={isBusy}
                          className={`min-w-[44px] min-h-[44px] p-2.5 rounded-lg transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                            isDeactivated
                              ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          {isDeactivated ? (
                            <CheckCircle2 size={16} strokeWidth={2} className="shrink-0" />
                          ) : (
                            <Ban size={16} strokeWidth={2} className="shrink-0" />
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

      <PaginationBar
        page={page}
        pageSize={pageSize}
        totalElements={totalElements}
        totalPages={Math.ceil(totalElements / pageSize) || 1}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50, 100]}
        itemLabel="nhân sự"
      />
    </div>
  )
}
