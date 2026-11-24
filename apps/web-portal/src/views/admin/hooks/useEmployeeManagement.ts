/**
 * Custom hook quản lý trạng thái và tác vụ nghiệp vụ quản trị hồ sơ nhân sự
 * (TASK-WEB-024, BLD-WEB-018, UXD-WEB-006, SOL-WEB-006, APD-WEB-004, ARCH-W-01).
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { useDebounce } from '@/hooks'
import { useAuthStore } from '@/store/authStore'
import { DEPARTMENTS } from '@/constants/departments'
import type { EmployeeItem, UserRole, UserStatus } from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

export interface PendingConfirmAction {
  type: 'RESET_PASSWORD' | 'TOGGLE_STATUS'
  employee: EmployeeItem
}

export const useEmployeeManagement = () => {
  // Danh sách & Phân trang
  const [employees, setEmployees] = useState<EmployeeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Bộ lọc (WEB-F-05: STAB-004 useDebounce 350ms)
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 350)
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null)

  // Employee Detail Drawer State (Master-Detail Pattern)
  const [detailEmployee, setDetailEmployee] = useState<EmployeeItem | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)

  // Temporary Password Modal State (CHỈ TỒN TẠI TRONG RAM, TUYỆT ĐỐI KHÔNG LƯU STORAGE)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [tempPasswordTarget, setTempPasswordTarget] = useState<{ name: string; code: string } | null>(null)
  const [isTempModalOpen, setIsTempModalOpen] = useState(false)

  // Tác vụ Vô hiệu hóa / Reset
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingConfirmAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Trạng thái tác vụ xác nhận (Reset mật khẩu / Vô hiệu hóa)
  const isPendingReset = pendingAction?.type === 'RESET_PASSWORD'
  const isPendingDeactivated = useMemo(() => {
    if (!pendingAction || pendingAction.type === 'RESET_PASSWORD') return false
    const st = pendingAction.employee.status
    return st === 'INACTIVE' || st === 'TERMINATED' || st === 'SUSPENDED'
  }, [pendingAction])

  // Tải danh sách nhân sự
  const fetchEmployees = useCallback(async () => {
    try {
      const criteria = {
        page,
        size: pageSize,
        keyword: debouncedKeyword.trim() || undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as UserStatus) : undefined,
        role: roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined,
      }
      const data = await adminEmployeeService.getEmployees(criteria)
      setEmployees(data.content || [])
      setTotalElements(data.totalElements || 0)
      setErrorMessage(null)
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      setErrorMessage(apiErr?.message || 'Không thể tải danh mục hồ sơ nhân sự.')
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedKeyword, departmentFilter, statusFilter, roleFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchEmployees()
  }, [fetchEmployees])

  // Danh sách phòng ban tổng hợp (chuẩn hóa cùng dữ liệu thực tế)
  const availableDepartments = useMemo(() => {
    const set = new Set<string>(DEPARTMENTS)
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

  // Mở Detail Drawer xem chi tiết hồ sơ
  const handleOpenDetail = useCallback((emp: EmployeeItem) => {
    setDetailEmployee(emp)
    setIsDetailDrawerOpen(true)
  }, [])

  // Đóng Detail Drawer
  const handleCloseDetail = useCallback(() => {
    setIsDetailDrawerOpen(false)
    setDetailEmployee(null)
  }, [])

  // Mở Edit Drawer từ trong Detail Drawer
  const handleEditFromDetail = useCallback((emp: EmployeeItem) => {
    setIsDetailDrawerOpen(false)
    setDetailEmployee(null)
    setSelectedEmployee(emp)
    setDrawerMode('edit')
    setIsDrawerOpen(true)
  }, [])

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

  return {
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
    isPendingReset,
    isPendingDeactivated,
    availableDepartments,
    activeAdminCount,
    hasActiveFilters,
    fetchEmployees,
    handleResetFilters,
    handleOpenCreate,
    handleOpenEdit,
    detailEmployee,
    isDetailDrawerOpen,
    handleOpenDetail,
    handleCloseDetail,
    handleEditFromDetail,
    handleDrawerSuccess,
    handleCloseTempModal,
    handleResetCredentials,
    handleToggleStatus,
    handleConfirmAction,
  }
}
