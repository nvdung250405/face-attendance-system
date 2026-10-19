/**
 * Màn hình Quản lý Danh mục Ca làm việc & Phân ca Nhân sự
 * (SOL-WEB-007, BLD-WEB-019, UXD-WEB-006, FR-WEB-008, TASK-WEB-025).
 *
 * - Quản lý CRUD ca làm việc (Shift Catalog): Tạo mới, sửa giờ, ân hạn, đổi trạng thái.
 * - Phân ca nhân sự theo khoảng ngày hiệu lực (Shift Assignment).
 * - Phát hiện chồng lấn ca (409 SHIFT_OVERLAP) và hiển thị khoảng trống thời gian gợi ý.
 * - Lan tỏa cờ khóa điều chỉnh từ PayrollPeriodStore: Vô hiệu hóa phân ca khi kỳ công bị khóa.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Trash2,
  Edit2,
  Lock,
  Search,
  RotateCw,
  Sparkles,
  ArrowRight,
  List,
  CalendarDays,
} from 'lucide-react'
import { shiftAdminService } from '@/services/shiftAdminService'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { WeeklyShiftScheduleView } from '@/components/shift'
import { Button } from '@/components/common'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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

/** Định dạng ngày theo múi giờ địa phương (YYYY-MM-DD) thay vì toISOString (UTC). */
function formatLocalDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const AdminShiftManagementView: React.FC = () => {
  // Trạng thái tab hiển thị: 'shifts' (Danh mục ca) | 'assignments' (Lịch phân ca)
  const [activeTab, setActiveTab] = useState<'shifts' | 'assignments'>('shifts')
  // Chế độ xem lịch phân ca: 'table' (Bảng) | 'weekly' (Lịch tuần) - UI-WEB-007, UXD-WEB-006
  const [assignmentViewMode, setAssignmentViewMode] = useState<'table' | 'weekly'>('table')

  // Cờ khóa kỳ công từ store trung tâm
  const isAdjustmentLocked = usePayrollPeriodStore((state) => state.isAdjustmentLocked)
  const selectedPeriod = usePayrollPeriodStore((state) => state.selectedPeriod)

  // Danh mục ca
  const [shifts, setShifts] = useState<ShiftItem[]>([])
  const [isLoadingShifts, setIsLoadingShifts] = useState<boolean>(true)

  // Danh sách phân ca
  const [assignments, setAssignments] = useState<EmployeeShiftAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState<boolean>(false)

  // Danh sách nhân sự phục vụ phân ca
  const [employees, setEmployees] = useState<EmployeeItem[]>([])

  // Bộ lọc lịch phân ca
  const [searchEmployeeKeyword, setSearchEmployeeKeyword] = useState<string>('')
  const [filterShiftId, setFilterShiftId] = useState<string>('')

  // Trạng thái Drawer Ca làm việc (Tạo mới / Chỉnh sửa)
  const [isShiftDrawerOpen, setIsShiftDrawerOpen] = useState<boolean>(false)
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null)
  const [shiftFormData, setShiftFormData] = useState<CreateShiftRequest & { isActive?: boolean }>({
    shiftCode: '',
    name: '',
    startTime: '08:00',
    endTime: '17:30',
    gracePeriodMinutes: 15,
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

  // Tải danh sách nhân sự
  const loadEmployees = useCallback(async () => {
    try {
      const result = await adminEmployeeService.getEmployees({ page: 0, size: 200 })
      setEmployees(result.content || [])
    } catch {
      // Bỏ qua nếu lỗi nạp danh sách gợi ý nhân sự
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const initData = async () => {
      try {
        const [shiftRes, assignRes, empRes] = await Promise.allSettled([
          shiftAdminService.getShifts(),
          shiftAdminService.getEmployeeShifts(),
          adminEmployeeService.getEmployees({ page: 0, size: 200 }),
        ])
        if (ignore) return
        if (shiftRes.status === 'fulfilled') setShifts(shiftRes.value || [])
        if (assignRes.status === 'fulfilled') setAssignments(assignRes.value || [])
        if (empRes.status === 'fulfilled') setEmployees(empRes.value?.content || [])
      } finally {
        if (!ignore) {
          setIsLoadingShifts(false)
          setIsLoadingAssignments(false)
        }
      }
    }
    void initData()
    return () => {
      ignore = true
    }
  }, [])

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
      shiftCode: '',
      name: '',
      startTime: '08:00',
      endTime: '17:30',
      gracePeriodMinutes: 15,
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
    if (!editingShift && !shiftFormData.shiftCode.trim()) {
      setShiftFormError('Mã ca làm việc không được để trống.')
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
          isActive: shiftFormData.isActive,
        }
        await shiftAdminService.updateShift(editingShift.id, updateData)
        setNotification({ type: 'success', message: `Đã cập nhật ca ${editingShift.name} thành công!` })
      } else {
        const createData: CreateShiftRequest = {
          shiftCode: shiftFormData.shiftCode.trim().toUpperCase(),
          name: shiftFormData.name.trim(),
          startTime: shiftFormData.startTime,
          endTime: shiftFormData.endTime,
          gracePeriodMinutes: Number(shiftFormData.gracePeriodMinutes),
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

  const handleToggleShiftActive = async (shift: ShiftItem) => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể thay đổi trạng thái ca.',
      })
      return
    }
    try {
      await shiftAdminService.updateShift(shift.id, { isActive: !shift.isActive })
      setNotification({
        type: 'success',
        message: `Đã ${!shift.isActive ? 'kích hoạt' : 'vô hiệu hóa'} ca ${shift.name}.`,
      })
      await loadShifts()
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({ type: 'error', message: error.message || 'Không thể đổi trạng thái ca.' })
    }
  }

  // ── Thao tác Phân ca & Kiểm tra Chồng lấn ──────────────────────────────────

  const handleOpenAssignDrawer = () => {
    if (isAdjustmentLocked) {
      setNotification({
        type: 'warning',
        message: 'Kỳ công hiện tại đang bị khóa. Không thể thực hiện phân ca mới.',
      })
      return
    }
    if (employees.length === 0) {
      void loadEmployees()
    }
    const today = formatLocalDateISO(new Date())
    setAssignFormData({
      employeeId: employees[0]?.id || 0,
      shiftId: shifts[0]?.id || 0,
      effectiveStartDate: today,
      effectiveEndDate: today,
    })
    setAssignFormError(null)
    setOverlapConflict(null)
    setIsAssignDrawerOpen(true)
  }

  // Phân ca nhanh cho nhân viên từ Lịch tuần (TASK-WEB-028, UI-WEB-007)
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

  // Kiểm tra xung đột chồng lấn ca phía Client trước khi gọi API (SOL-WEB-007)
  const checkClientSideOverlap = (
    employeeId: number,
    startDateStr: string,
    endDateStr: string
  ): OverlapConflictInfo | null => {
    const existing = assignments.filter((a) => a.employeeId === employeeId)
    const newStart = new Date(startDateStr).getTime()
    const newEnd = new Date(endDateStr).getTime()

    for (const item of existing) {
      const curStart = new Date(item.effectiveStartDate).getTime()
      const curEnd = new Date(item.effectiveEndDate).getTime()

      // Giao thoa khoảng ngày: newStart <= curEnd && newEnd >= curStart
      if (newStart <= curEnd && newEnd >= curStart) {
        // Tính khoảng trống gợi ý khả dụng tiếp theo (ngày kế tiếp của curEnd)
        const nextDay = new Date(curEnd + 24 * 60 * 60 * 1000)
        const durationDays = Math.max(0, Math.round((newEnd - newStart) / (24 * 60 * 60 * 1000)))
        const suggestedEnd = new Date(nextDay.getTime() + durationDays * 24 * 60 * 60 * 1000)

        const suggestedStartFormatted = formatLocalDateISO(nextDay)
        const suggestedEndFormatted = formatLocalDateISO(suggestedEnd)

        return {
          conflictingAssignmentId: item.id,
          suggestedStartDate: suggestedStartFormatted,
          suggestedEndDate: suggestedEndFormatted,
          message: `Lịch phân ca bị chồng lấn với ca ${item.shiftName} (${item.effectiveStartDate} đến ${item.effectiveEndDate}).`,
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

    // 1. Kiểm tra chồng lấn phía client
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

    // 2. Gửi request lên Backend
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

  // Áp dụng khoảng trống thời gian gợi ý tự động
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
      await shiftAdminService.removeShiftAssignment(assignment.id)
      setNotification({ type: 'success', message: 'Đã hủy phân ca thành công.' })
      await loadAssignments()
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({ type: 'error', message: error.message || 'Không thể hủy phân ca.' })
    }
  }

  // Lọc lịch phân ca
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchKeyword =
        !searchEmployeeKeyword.trim() ||
        a.fullName.toLowerCase().includes(searchEmployeeKeyword.toLowerCase()) ||
        a.employeeCode.toLowerCase().includes(searchEmployeeKeyword.toLowerCase())

      const matchShift = !filterShiftId || String(a.shiftId) === filterShiftId

      return matchKeyword && matchShift
    })
  }, [assignments, searchEmployeeKeyword, filterShiftId])

  return (
    <div className="space-y-6" data-testid="admin-shift-management-view">
      {/* ── Tiêu đề trang & Tác vụ hàng đầu ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span>Quản Lý Ca Làm Việc & Phân Ca</span>
            {isAdjustmentLocked && (
              <span
                data-testid="shift-payroll-locked-badge"
                className="badge-warning inline-flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kỳ công đã khóa</span>
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            Định nghĩa khung giờ ca kíp và phân bổ lịch làm việc linh hoạt theo từng nhân viên
          </p>
        </div>

        {/* Nút hành động chính */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              void loadShifts()
              void loadAssignments()
            }}
            data-testid="refresh-shifts-btn"
            title="Làm mới dữ liệu"
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Làm mới
          </Button>

          {activeTab === 'shifts' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreateShiftDrawer}
              disabled={isAdjustmentLocked}
              data-testid="open-create-shift-drawer-btn"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Thêm Ca Mới
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenAssignDrawer}
              disabled={isAdjustmentLocked}
              data-testid="open-assign-shift-drawer-btn"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Phân Ca Nhân Sự
            </Button>
          )}
        </div>
      </div>

      {/* ── Cảnh báo Nghiệp vụ Kỳ công đã Khóa (UXD-WEB-006, SOL-WEB-008) ── */}
      {isAdjustmentLocked && (
        <div
          data-testid="payroll-locked-warning-banner"
          className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs"
        >
          <div className="p-1.5 rounded-lg bg-amber-200 text-amber-800 mt-0.5 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-bold">
              Kỳ công đang bị KHÓA điều chỉnh {selectedPeriod ? `(Kỳ ${selectedPeriod.periodMonth}/${selectedPeriod.periodYear})` : ''}
            </p>
            <p className="text-amber-800 leading-relaxed">
              Mọi hoạt động tạo ca, sửa ca và phân ca nhân sự tạm thời bị vô hiệu hóa để bảo toàn dữ liệu bảng công. Vui lòng liên hệ Quản trị viên (ADMIN) mở lại kỳ công nếu cần điều chỉnh.
            </p>
          </div>
        </div>
      )}

      {/* Thông báo thao tác */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notification.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Tabs Chuyển đổi Đồng bộ ── */}
      <div className="border-b border-border-subtle flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('shifts')}
          data-testid="tab-shifts-btn"
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 ${
            activeTab === 'shifts'
              ? 'text-indigo-600 border-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Danh Mục Ca Làm Việc</span>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
            activeTab === 'shifts' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {shifts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          data-testid="tab-assignments-btn"
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 ${
            activeTab === 'assignments'
              ? 'text-indigo-600 border-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Phân Ca Nhân Sự</span>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
            activeTab === 'assignments' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {assignments.length}
          </span>
        </button>
      </div>

      {/* ── Nội dung Tab 1: Danh mục Ca làm việc ── */}
      {activeTab === 'shifts' && (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Ca</th>
                  <th className="py-3 px-4">Tên Ca Làm Việc</th>
                  <th className="py-3 px-4">Giờ Bắt Đầu</th>
                  <th className="py-3 px-4">Giờ Kết Thúc</th>
                  <th className="py-3 px-4">Ân Hạn (Phút)</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isLoadingShifts ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                        <span>Đang tải danh mục ca...</span>
                      </div>
                    </td>
                  </tr>
                ) : shifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      Chưa có ca làm việc nào. Bấm "Thêm Ca Mới" để thiết lập.
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr
                      key={shift.id}
                      data-testid={`shift-row-${shift.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-primary text-xs">
                        {shift.shiftCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-text-primary text-xs">{shift.name}</td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                          <span>{shift.startTime}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                          <span>{shift.endTime}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-medium text-xs">
                        {shift.gracePeriodMinutes} phút
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${
                            shift.isActive
                              ? 'bg-emerald-50 text-status-success border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {shift.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-[#f8fafc] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditShiftDrawer(shift)}
                            disabled={isAdjustmentLocked}
                            data-testid={`edit-shift-btn-${shift.id}`}
                            title="Sửa thông tin ca"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-40"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleShiftActive(shift)}
                            disabled={isAdjustmentLocked}
                            data-testid={`toggle-shift-active-btn-${shift.id}`}
                            className={`px-2.5 py-1 rounded-lg text-2xs font-semibold border transition-all ${
                              shift.isActive
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-status-success hover:bg-emerald-50'
                            } disabled:opacity-40`}
                          >
                            {shift.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Nội dung Tab 2: Lịch Phân ca Nhân sự ── */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Thanh công cụ lọc & Chuyển đổi chế độ xem */}
          <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Toggle Chế độ xem: Bảng vs Lịch tuần */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-border-subtle shrink-0">
                <button
                  type="button"
                  onClick={() => setAssignmentViewMode('table')}
                  data-testid="view-mode-table"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    assignmentViewMode === 'table'
                      ? 'bg-white text-brand-primary shadow-2xs font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Dạng Bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentViewMode('weekly')}
                  data-testid="view-mode-weekly"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    assignmentViewMode === 'weekly'
                      ? 'bg-white text-brand-primary shadow-2xs font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Lịch Tuần</span>
                </button>
              </div>

              {/* Tìm kiếm theo tên / mã nhân viên */}
              {assignmentViewMode === 'table' && (
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchEmployeeKeyword}
                    onChange={(e) => setSearchEmployeeKeyword(e.target.value)}
                    data-testid="search-assigned-employee-input"
                    placeholder="Mã NV hoặc Họ tên..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Lọc theo ca làm việc */}
              {assignmentViewMode === 'table' && (
                <select
                  value={filterShiftId}
                  onChange={(e) => setFilterShiftId(e.target.value)}
                  data-testid="filter-assigned-shift-select"
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-auto"
                >
                  <option value="">Tất cả ca làm việc</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.shiftCode})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {assignmentViewMode === 'table' && (
              <span className="text-xs text-text-secondary self-end sm:self-auto font-medium">
                Hiển thị <span className="font-semibold text-text-primary">{filteredAssignments.length}</span> / <span className="font-semibold text-text-primary">{assignments.length}</span> lịch phân ca
              </span>
            )}
          </div>

          {/* Nội dung theo chế độ xem (Bảng danh sách vs Lịch tuần) */}
          {assignmentViewMode === 'weekly' ? (
            <WeeklyShiftScheduleView
              shifts={shifts}
              assignments={assignments}
              employees={employees}
              isAdjustmentLocked={isAdjustmentLocked}
              onQuickAssign={handleQuickAssign}
              onRemoveAssignment={handleRemoveAssignment}
            />
          ) : (
            /* Bảng danh sách phân ca */
            <div className="card-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Nhân Sự</th>
                      <th className="py-3 px-4">Ca Áp Dụng</th>
                      <th className="py-3 px-4">Khung Giờ</th>
                      <th className="py-3 px-4">Ngày Bắt Đầu</th>
                      <th className="py-3 px-4">Ngày Kết Thúc</th>
                      <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {isLoadingAssignments ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-muted">
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                            <span>Đang tải lịch phân ca...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-muted">
                          Không có lịch phân ca nào phù hợp. Bấm "Phân Ca Nhân Sự" để tạo lịch mới.
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map((item) => (
                        <tr
                          key={item.id}
                          data-testid={`assignment-row-${item.id}`}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-text-primary block text-xs">{item.fullName}</span>
                              <span className="text-2xs font-mono text-slate-400">
                                {item.employeeCode}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <span className="font-semibold text-text-secondary">{item.shiftName}</span>
                            <span className="ml-1 text-2xs font-mono text-indigo-600 font-bold">
                              ({item.shiftCode})
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary text-xs font-mono">
                            {shifts.find((s) => s.id === item.shiftId)
                              ? `${shifts.find((s) => s.id === item.shiftId)?.startTime} - ${
                                  shifts.find((s) => s.id === item.shiftId)?.endTime
                                }`
                              : 'Theo ca'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-text-secondary text-xs">
                            {item.effectiveStartDate}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-text-secondary text-xs">
                            {item.effectiveEndDate}
                          </td>
                          <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-[#f8fafc] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(item)}
                              disabled={isAdjustmentLocked}
                              data-testid={`remove-assignment-btn-${item.id}`}
                              title="Hủy lịch phân ca"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Tạo mới / Chỉnh sửa Ca làm việc (UXD-WEB-006) ── */}
      <Dialog
        open={isShiftDrawerOpen}
        onOpenChange={(open) => !open && setIsShiftDrawerOpen(false)}
      >
        <DialogContent
          data-testid="shift-drawer"
          hideCloseButton
          usePortal={false}
          className="p-0 max-w-lg border-0 bg-transparent shadow-none"
        >
          <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">
                    {editingShift ? 'Chỉnh Sửa Ca Làm Việc' : 'Tạo Mới Ca Làm Việc'}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {editingShift ? 'Cập nhật khung giờ & thời gian ân hạn' : 'Thiết lập khung giờ làm việc chuẩn cho tổ chức'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftDrawerOpen(false)}
                aria-label="Đóng"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSaveShift} className="p-6 space-y-4 flex-1 overflow-y-auto">
              {shiftFormError && (
                <div
                  data-testid="shift-form-error"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{shiftFormError}</span>
                </div>
              )}

              {/* Mã ca */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Mã ca làm việc <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  value={shiftFormData.shiftCode}
                  onChange={(e) =>
                    setShiftFormData((prev) => ({ ...prev, shiftCode: e.target.value.toUpperCase() }))
                  }
                  disabled={Boolean(editingShift)}
                  data-testid="input-shift-code"
                  placeholder="Ví dụ: CA_SANG, CA_TOI..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white disabled:bg-slate-50 disabled:text-text-muted uppercase font-mono"
                />
              </div>

              {/* Tên ca */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Tên ca làm việc <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  value={shiftFormData.name}
                  onChange={(e) => setShiftFormData((prev) => ({ ...prev, name: e.target.value }))}
                  data-testid="input-shift-name"
                  placeholder="Ví dụ: Ca Hành Chính, Ca Chiều..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
                />
              </div>

              {/* Khung giờ: Bắt đầu - Kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    Giờ bắt đầu <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="time"
                    value={shiftFormData.startTime}
                    onChange={(e) => setShiftFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    data-testid="input-shift-start-time"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    Giờ kết thúc <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="time"
                    value={shiftFormData.endTime}
                    onChange={(e) => setShiftFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    data-testid="input-shift-end-time"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                  />
                </div>
              </div>

              {/* Ân hạn */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Thời gian ân hạn đi muộn (Phút)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={shiftFormData.gracePeriodMinutes}
                  onChange={(e) =>
                    setShiftFormData((prev) => ({ ...prev, gracePeriodMinutes: Number(e.target.value) }))
                  }
                  data-testid="input-shift-grace-minutes"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
                />
                <span className="text-2xs text-text-muted">
                  Khoảng thời gian nhân viên đến trễ mà không bị tính vi phạm đi muộn (0 - 60 phút)
                </span>
              </div>

              {/* Kích hoạt trạng thái khi chỉnh sửa */}
              {editingShift && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="shift-is-active"
                    checked={shiftFormData.isActive}
                    onChange={(e) =>
                      setShiftFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    data-testid="input-shift-is-active"
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <label htmlFor="shift-is-active" className="text-xs font-semibold text-text-secondary">
                    Kích hoạt áp dụng ca làm việc này
                  </label>
                </div>
              )}
            </form>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsShiftDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border-subtle bg-white text-text-secondary hover:bg-slate-100 transition-colors shadow-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveShift}
                disabled={isSubmittingShift}
                data-testid="submit-shift-btn"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-hover shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmittingShift ? 'Đang lưu...' : editingShift ? 'Lưu Thay Đổi' : 'Tạo Ca'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Phân ca Nhân sự & Gợi ý Chồng lấn (SOL-WEB-007, UXD-WEB-006) ── */}
      <Dialog
        open={isAssignDrawerOpen}
        onOpenChange={(open) => !open && setIsAssignDrawerOpen(false)}
      >
        <DialogContent
          data-testid="assign-shift-drawer"
          hideCloseButton
          usePortal={false}
          className="p-0 max-w-lg border-0 bg-transparent shadow-none"
        >
          <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">Phân Ca Nhân Sự Theo Khoảng Ngày</h3>
                  <p className="text-xs text-text-muted">Gán ca làm việc cho nhân viên & kiểm tra xung đột ca</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignDrawerOpen(false)}
                aria-label="Đóng"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSaveAssign} className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Cảnh báo lỗi thông thường */}
              {assignFormError && (
                <div
                  data-testid="assign-form-error"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{assignFormError}</span>
                </div>
              )}

              {/* Hộp gợi ý khoảng trống khi trùng ca (BLD-WEB-019, SOL-WEB-007) */}
              {overlapConflict && (
                <div
                  data-testid="overlap-conflict-suggestion-box"
                  className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Gợi Ý Khoảng Trống Khả Dụng Tiếp Theo</span>
                  </div>
                  <p className="text-2xs text-indigo-800 leading-relaxed">
                    Hệ thống đã tự động tính toán khoảng thời gian trống không bị giao thoa cho nhân sự này:
                  </p>
                  <div className="flex items-center gap-2 font-mono font-semibold text-xs text-indigo-900 bg-white/80 p-2 rounded-lg border border-indigo-100">
                    <span>{overlapConflict.suggestedStartDate || '—'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{overlapConflict.suggestedEndDate || '—'}</span>
                  </div>
                  {overlapConflict.suggestedStartDate && (
                    <button
                      type="button"
                      onClick={handleApplySuggestedSlot}
                      data-testid="apply-suggested-slot-btn"
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Áp Dụng Khoảng Trống Này</span>
                    </button>
                  )}
                </div>
              )}

              {/* Chọn nhân viên */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Chọn nhân sự áp dụng <span className="text-status-danger">*</span>
                </label>
                <select
                  value={assignFormData.employeeId}
                  onChange={(e) =>
                    setAssignFormData((prev) => ({ ...prev, employeeId: Number(e.target.value) }))
                  }
                  data-testid="select-assign-employee"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
                >
                  <option value={0}>-- Chọn nhân sự --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn ca làm việc */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Chọn ca làm việc <span className="text-status-danger">*</span>
                </label>
                <select
                  value={assignFormData.shiftId}
                  onChange={(e) =>
                    setAssignFormData((prev) => ({ ...prev, shiftId: Number(e.target.value) }))
                  }
                  data-testid="select-assign-shift"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white"
                >
                  <option value={0}>-- Chọn ca làm việc --</option>
                  {shifts
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.shiftCode}) [{s.startTime} - {s.endTime}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Khoảng ngày hiệu lực */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    Từ ngày <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignFormData.effectiveStartDate}
                    onChange={(e) =>
                      setAssignFormData((prev) => ({ ...prev, effectiveStartDate: e.target.value }))
                    }
                    data-testid="input-assign-start-date"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    Đến ngày <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignFormData.effectiveEndDate}
                    onChange={(e) =>
                      setAssignFormData((prev) => ({ ...prev, effectiveEndDate: e.target.value }))
                    }
                    data-testid="input-assign-end-date"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white font-mono"
                  />
                </div>
              </div>
            </form>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsAssignDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border-subtle bg-white text-text-secondary hover:bg-slate-100 transition-colors shadow-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveAssign}
                disabled={isSubmittingAssign}
                data-testid="submit-assign-shift-btn"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-hover shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmittingAssign ? 'Đang phân ca...' : 'Xác Nhận Phân Ca'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
