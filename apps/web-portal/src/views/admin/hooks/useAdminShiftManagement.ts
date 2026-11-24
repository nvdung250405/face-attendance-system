/**
 * Custom hook quản lý toàn bộ trạng thái nghiệp vụ ca kíp và phân ca nhân sự
 * (SOL-WEB-007, BLD-WEB-019, UXD-WEB-006, FR-WEB-008, TASK-WEB-025, ARCH-W-01).
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { shiftAdminService } from '@/services/shiftAdminService'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { useDebounce } from '@/hooks/useDebounce'
import { formatLocalDateISO } from '@/utils/date'
import type {
  ShiftItem,
  CreateShiftRequest,
  UpdateShiftRequest,
  EmployeeShiftAssignment,
  AssignShiftRequest,
  OverlapConflictInfo,
  EmployeeItem,
} from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

export const useAdminShiftManagement = () => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'assignments'>('shifts')
  const [assignmentViewMode, setAssignmentViewMode] = useState<'table' | 'weekly'>('table')

  // Cờ khóa kỳ công từ store trung tâm
  const isAdjustmentLocked = usePayrollPeriodStore((state) => state.isAdjustmentLocked)
  const selectedPeriod = usePayrollPeriodStore((state) => state.selectedPeriod)

  // Danh mục ca
  const [shifts, setShifts] = useState<ShiftItem[]>([])
  const [isLoadingShifts, setIsLoadingShifts] = useState<boolean>(true)
  const [togglingShiftId, setTogglingShiftId] = useState<number | null>(null)

  // Map tra cứu ca O(1)
  const shiftsMap = useMemo(() => {
    return new Map<number, ShiftItem>(shifts.map((s) => [s.id, s]))
  }, [shifts])

  // Danh sách phân ca
  const [assignments, setAssignments] = useState<EmployeeShiftAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState<boolean>(false)
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<number | null>(null)

  // Danh sách nhân sự phục vụ phân ca
  const [employees, setEmployees] = useState<EmployeeItem[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(false)

  // Bộ lọc lịch phân ca (STAB-004 useDebounce 350ms)
  const [searchEmployeeKeyword, setSearchEmployeeKeyword] = useState<string>('')
  const debouncedEmployeeKeyword = useDebounce(searchEmployeeKeyword, 350)
  const [filterShiftId, setFilterShiftId] = useState<string>('')

  // Trạng thái Drawer Ca làm việc (Tạo mới / Chỉnh sửa)
  const [isShiftDrawerOpen, setIsShiftDrawerOpen] = useState<boolean>(false)
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null)
  const [shiftFormData, setShiftFormData] = useState<CreateShiftRequest & { isActive?: boolean }>({
    shiftCode: undefined,
    name: '',
    startTime: '08:00',
    endTime: '17:30',
    gracePeriodMinutes: 15,
    isOvernight: false,
    isActive: true,
  })
  const [shiftFormError, setShiftFormError] = useState<string | null>(null)
  const [isSubmittingShift, setIsSubmittingShift] = useState<boolean>(false)

  // Trạng thái Drawer Phân ca nhân sự
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState<boolean>(false)
  const [assignFormData, setAssignFormData] = useState<AssignShiftRequest>({
    employeeId: 0,
    shiftId: 0,
    effectiveStartDate: '',
    effectiveEndDate: '',
  })
  const [assignFormError, setAssignFormError] = useState<string | null>(null)
  const [overlapConflict, setOverlapConflict] = useState<OverlapConflictInfo | null>(null)
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false)
  const [batchProgressText, setBatchProgressText] = useState<string | null>(null)

  // Thông báo phản hồi chung (Alert banner)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
  } | null>(null)

  // Tải danh mục ca
  const loadShifts = useCallback(async () => {
    try {
      setIsLoadingShifts(true)
      const data = await shiftAdminService.getShifts()
      setShifts(data || [])
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({
        type: 'error',
        message: error.message || 'Không thể tải danh sách ca làm việc.',
      })
    } finally {
      setIsLoadingShifts(false)
    }
  }, [])

  // Tải danh sách phân ca
  const loadAssignments = useCallback(async () => {
    try {
      setIsLoadingAssignments(true)
      const data = await shiftAdminService.getEmployeeShifts()
      setAssignments(data || [])
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({
        type: 'error',
        message: error.message || 'Không thể tải lịch phân ca nhân sự.',
      })
    } finally {
      setIsLoadingAssignments(false)
    }
  }, [])

  // Tải danh sách nhân sự (WEB-F-10: ARCH-004 không dùng console.error)
  const loadEmployees = useCallback(async (): Promise<EmployeeItem[]> => {
    try {
      setIsLoadingEmployees(true)
      const list = await adminEmployeeService.getAllEmployees()
      setEmployees(list)
      return list
    } catch {
      setNotification({
        type: 'warning',
        message: 'Không thể nạp danh sách nhân sự phục vụ phân ca. Vui lòng thử lại.',
      })
      return []
    } finally {
      setIsLoadingEmployees(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void Promise.allSettled([loadShifts(), loadAssignments(), loadEmployees()])
  }, [loadShifts, loadAssignments, loadEmployees])

  // ── Thao tác Danh mục Ca ───────────────────────────────────────────────────

  const handleOpenCreateShiftDrawer = () => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể tạo ca làm việc mới.',
      })
      return
    }
    setEditingShift(null)
    setShiftFormData({
      shiftCode: undefined,
      name: '',
      startTime: '08:00',
      endTime: '17:30',
      gracePeriodMinutes: 15,
      isOvernight: false,
      isActive: true,
    })
    setShiftFormError(null)
    setIsShiftDrawerOpen(true)
  }

  const handleOpenEditShiftDrawer = (shift: ShiftItem) => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể chỉnh sửa ca làm việc.',
      })
      return
    }
    setEditingShift(shift)
    setShiftFormData({
      shiftCode: shift.shiftCode,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      isOvernight: shift.isOvernight ?? false,
      isActive: shift.isActive,
    })
    setShiftFormError(null)
    setIsShiftDrawerOpen(true)
  }

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault()
    setShiftFormError(null)

    if (!shiftFormData.name.trim()) {
      setShiftFormError('Tên ca làm việc không được để trống.')
      return
    }
    if (shiftFormData.startTime === shiftFormData.endTime) {
      setShiftFormError('Giờ kết thúc ca phải khác giờ bắt đầu ca.')
      return
    }

    try {
      setIsSubmittingShift(true)
      if (editingShift) {
        const updateData: UpdateShiftRequest = {
          name: shiftFormData.name.trim(),
          startTime: shiftFormData.startTime,
          endTime: shiftFormData.endTime,
          gracePeriodMinutes: Number(shiftFormData.gracePeriodMinutes),
          isOvernight: shiftFormData.isOvernight,
          isActive: shiftFormData.isActive,
        }
        await shiftAdminService.updateShift(editingShift.id, updateData)
        setNotification({ type: 'success', message: `Đã cập nhật ca ${editingShift.name} thành công!` })
      } else {
        const createData: CreateShiftRequest = {
          name: shiftFormData.name.trim(),
          startTime: shiftFormData.startTime,
          endTime: shiftFormData.endTime,
          gracePeriodMinutes: Number(shiftFormData.gracePeriodMinutes),
          isOvernight: shiftFormData.isOvernight,
        }
        if (shiftFormData.shiftCode && shiftFormData.shiftCode.trim()) {
          createData.shiftCode = shiftFormData.shiftCode.trim().toUpperCase()
        }
        await shiftAdminService.createShift(createData)
        setNotification({ type: 'success', message: 'Đã tạo mới ca làm việc thành công!' })
      }
      setIsShiftDrawerOpen(false)
      await loadShifts()
    } catch (err) {
      const error = err as NormalizedApiError
      setShiftFormError(error.message || 'Lưu ca làm việc thất bại.')
    } finally {
      setIsSubmittingShift(false)
    }
  }

  // WEB-F-02 (STAB-002): Quản lý togglingShiftId khóa disabled tránh spam click
  const handleToggleShiftActive = async (shift: ShiftItem) => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể thay đổi trạng thái ca.',
      })
      return
    }
    try {
      setTogglingShiftId(shift.id)
      await shiftAdminService.updateShift(shift.id, { isActive: !shift.isActive })
      setNotification({
        type: 'success',
        message: `Đã ${!shift.isActive ? 'kích hoạt' : 'vô hiệu hóa'} ca ${shift.name}.`,
      })
      await loadShifts()
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({ type: 'error', message: error.message || 'Không thể đổi trạng thái ca.' })
    } finally {
      setTogglingShiftId(null)
    }
  }

  // ── Thao tác Phân ca & Kiểm tra Chồng lấn ──────────────────────────────────

  const handleOpenAssignDrawer = async () => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể thực hiện phân ca mới.',
      })
      return
    }
    let currentEmployees = employees
    if (currentEmployees.length === 0) {
      currentEmployees = await loadEmployees()
    }
    const today = formatLocalDateISO(new Date())
    setAssignFormData({
      employeeId: currentEmployees[0]?.id || 0,
      shiftId: shifts[0]?.id || 0,
      effectiveStartDate: today,
      effectiveEndDate: today,
    })
    setAssignFormError(null)
    setOverlapConflict(null)
    setIsAssignDrawerOpen(true)
  }

  const handleQuickAssign = (employeeId: number, dateStr: string) => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể thực hiện phân ca mới.',
      })
      return
    }
    setAssignFormData({
      employeeId,
      shiftId: shifts[0]?.id || 0,
      effectiveStartDate: dateStr,
      effectiveEndDate: dateStr,
    })
    setAssignFormError(null)
    setOverlapConflict(null)
    setIsAssignDrawerOpen(true)
  }

  const checkClientSideOverlap = (
    employeeId: number,
    startDateStr: string,
    endDateStr: string
  ): OverlapConflictInfo | null => {
    const existing = assignments.filter((a) => a.employeeId === employeeId || a.userId === employeeId)
    const newStart = new Date(startDateStr).getTime()
    const newEnd = endDateStr ? new Date(endDateStr).getTime() : Infinity

    for (const item of existing) {
      const startStr = item.effectiveStartDate || item.effectiveFrom || ''
      const endStr = item.effectiveEndDate || item.effectiveTo
      const curStart = new Date(startStr).getTime()
      const curEnd = endStr ? new Date(endStr).getTime() : Infinity

      if (newStart <= curEnd && newEnd >= curStart) {
        let suggestedStartFormatted: string | undefined
        let suggestedEndFormatted: string | undefined

        if (Number.isFinite(curEnd)) {
          const nextDay = new Date(curEnd + 24 * 60 * 60 * 1000)
          const durationDays = Number.isFinite(newEnd)
            ? Math.max(0, Math.round((newEnd - newStart) / (24 * 60 * 60 * 1000)))
            : 0
          const suggestedEnd = new Date(nextDay.getTime() + durationDays * 24 * 60 * 60 * 1000)

          suggestedStartFormatted = formatLocalDateISO(nextDay)
          suggestedEndFormatted = formatLocalDateISO(suggestedEnd)
        }

        const dateRangeText = endStr ? `${startStr} đến ${endStr}` : `từ ${startStr} (Vô thời hạn)`

        return {
          conflictingAssignmentId: item.id,
          suggestedStartDate: suggestedStartFormatted,
          suggestedEndDate: suggestedEndFormatted,
          message: `Lịch phân ca bị chồng lấn với ca ${item.shiftName} (${dateRangeText}).`,
        }
      }
    }
    return null
  }

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignFormError(null)
    setOverlapConflict(null)

    if (!assignFormData.employeeId) {
      setAssignFormError('Vui lòng chọn nhân sự được phân ca.')
      return
    }
    if (!assignFormData.shiftId) {
      setAssignFormError('Vui lòng chọn ca làm việc áp dụng.')
      return
    }
    if (!assignFormData.effectiveStartDate || !assignFormData.effectiveEndDate) {
      setAssignFormError('Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc hiệu lực.')
      return
    }
    if (assignFormData.effectiveStartDate > assignFormData.effectiveEndDate) {
      setAssignFormError('Ngày bắt đầu không được lớn hơn ngày kết thúc.')
      return
    }

    const clientConflict = checkClientSideOverlap(
      assignFormData.employeeId,
      assignFormData.effectiveStartDate,
      assignFormData.effectiveEndDate
    )
    if (clientConflict) {
      setOverlapConflict(clientConflict)
      setAssignFormError(clientConflict.message || 'Lịch phân ca bị chồng lấn khoảng ngày.')
      return
    }

    try {
      setIsSubmittingAssign(true)
      await shiftAdminService.assignShift(assignFormData)
      setNotification({ type: 'success', message: 'Phân ca cho nhân sự thành công!' })
      setIsAssignDrawerOpen(false)
      await loadAssignments()
    } catch (err) {
      const error = err as NormalizedApiError
      if (error.statusCode === 409 || error.overlapConflict) {
        const conflict = error.overlapConflict || {
          message: error.message || 'Lịch phân ca bị chồng lấn thời gian.',
        }
        setOverlapConflict(conflict)
        setAssignFormError(conflict.message || 'Lịch phân ca bị chồng lấn khoảng ngày hiệu lực.')
      } else {
        setAssignFormError(error.message || 'Phân ca thất bại. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmittingAssign(false)
    }
  }

  const handleBatchAssign = async (params: {
    mode: 'department' | 'multi' | 'single'
    employeeIds: number[]
    shiftId: number
    effectiveStartDate: string
    effectiveEndDate: string
    departmentName?: string
  }) => {
    setAssignFormError(null)
    setOverlapConflict(null)

    if (params.employeeIds.length === 0) {
      setAssignFormError('Vui lòng chọn ít nhất 1 nhân sự để phân ca.')
      return
    }
    if (!params.shiftId) {
      setAssignFormError('Vui lòng chọn ca làm việc áp dụng.')
      return
    }
    if (!params.effectiveStartDate || !params.effectiveEndDate) {
      setAssignFormError('Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc hiệu lực.')
      return
    }
    if (params.effectiveStartDate > params.effectiveEndDate) {
      setAssignFormError('Ngày bắt đầu không được lớn hơn ngày kết thúc.')
      return
    }

    try {
      setIsSubmittingAssign(true)
      setBatchProgressText(`Chuẩn bị phân ca cho ${params.employeeIds.length} nhân sự...`)

      const empMap = new Map<number, string>()
      employees.forEach((e) => empMap.set(e.id, `${e.fullName} (${e.employeeCode})`))

      const result = await shiftAdminService.assignShiftBatch(
        {
          employeeIds: params.employeeIds,
          shiftId: params.shiftId,
          effectiveStartDate: params.effectiveStartDate,
          effectiveEndDate: params.effectiveEndDate,
        },
        empMap,
        (completed, total) => {
          setBatchProgressText(`Đang xử lý phân ca... ${completed}/${total} nhân sự`)
        }
      )

      if (result.successCount > 0) {
        let msg = `Đã phân ca thành công cho ${result.successCount}/${result.total} nhân sự.`
        if (result.failedCount > 0) {
          msg += ` (${result.failedCount} nhân sự bị trùng ca hoặc lỗi).`
          setNotification({ type: 'warning', message: msg })
        } else {
          setNotification({ type: 'success', message: msg })
        }
        setIsAssignDrawerOpen(false)
        await loadAssignments()
      } else {
        const failureDetails = result.failures
          .slice(0, 3)
          .map((f) => `${f.employeeName}: ${f.reason}`)
          .join('; ')
        setAssignFormError(
          `Không thể phân ca cho nhân sự nào. Chi tiết: ${failureDetails}${result.failures.length > 3 ? '...' : ''}`
        )
      }
    } catch (err) {
      const error = err as NormalizedApiError
      setAssignFormError(error.message || 'Phân ca hàng loạt thất bại.')
    } finally {
      setIsSubmittingAssign(false)
      setBatchProgressText(null)
    }
  }

  const handleApplySuggestedSlot = () => {
    if (overlapConflict?.suggestedStartDate && overlapConflict?.suggestedEndDate) {
      setAssignFormData((prev) => ({
        ...prev,
        effectiveStartDate: overlapConflict.suggestedStartDate!,
        effectiveEndDate: overlapConflict.suggestedEndDate!,
      }))
      setOverlapConflict(null)
      setAssignFormError(null)
    }
  }

  // WEB-F-01 (STAB-002): Quản lý deletingAssignmentId khóa disabled tránh double click DELETE
  const handleRemoveAssignment = async (assignment: EmployeeShiftAssignment) => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể gỡ bỏ phân ca.',
      })
      return
    }
    if (!window.confirm(`Xác nhận hủy phân ca ${assignment.shiftName} của nhân viên ${assignment.fullName}?`)) {
      return
    }
    try {
      setDeletingAssignmentId(assignment.id)
      await shiftAdminService.removeShiftAssignment(assignment.id)
      setNotification({ type: 'success', message: 'Đã hủy phân ca thành công.' })
      await loadAssignments()
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({ type: 'error', message: error.message || 'Không thể hủy phân ca.' })
    } finally {
      setDeletingAssignmentId(null)
    }
  }

  const filteredAssignments = useMemo(() => {
    const kw = debouncedEmployeeKeyword.trim().toLowerCase()
    return assignments.filter((a) => {
      const matchKeyword =
        !kw ||
        (a.fullName || '').toLowerCase().includes(kw) ||
        (a.employeeCode || '').toLowerCase().includes(kw)

      const matchShift = !filterShiftId || String(a.shiftId) === filterShiftId

      return matchKeyword && matchShift
    })
  }, [assignments, debouncedEmployeeKeyword, filterShiftId])

  return {
    activeTab,
    setActiveTab,
    assignmentViewMode,
    setAssignmentViewMode,
    isAdjustmentLocked,
    selectedPeriod,
    shifts,
    isLoadingShifts,
    togglingShiftId,
    shiftsMap,
    assignments,
    isLoadingAssignments,
    deletingAssignmentId,
    employees,
    isLoadingEmployees,
    searchEmployeeKeyword,
    setSearchEmployeeKeyword,
    filterShiftId,
    setFilterShiftId,
    isShiftDrawerOpen,
    setIsShiftDrawerOpen,
    editingShift,
    shiftFormData,
    setShiftFormData,
    shiftFormError,
    isSubmittingShift,
    isAssignDrawerOpen,
    setIsAssignDrawerOpen,
    assignFormData,
    setAssignFormData,
    assignFormError,
    overlapConflict,
    isSubmittingAssign,
    batchProgressText,
    notification,
    setNotification,
    loadShifts,
    loadAssignments,
    loadEmployees,
    handleOpenCreateShiftDrawer,
    handleOpenEditShiftDrawer,
    handleSaveShift,
    handleToggleShiftActive,
    handleOpenAssignDrawer,
    handleQuickAssign,
    handleSaveAssign,
    handleBatchAssign,
    handleApplySuggestedSlot,
    handleRemoveAssignment,
    filteredAssignments,
  }
}
