/**
 * Khung Xem trước & Quản lý Lịch Phân Ca Theo Tuần (Weekly Shift Schedule Preview)
 * (UI-WEB-007, UXD-WEB-006, BLD-WEB-023, TASK-WEB-028).
 *
 * Tính năng chính:
 * 1. Hiển thị ma trận phân ca 7 ngày trong tuần (Thứ Hai -> Chủ Nhật).
 * 2. Điều hướng tuần: Tuần trước, Tuần hiện tại, Tuần sau.
 * 3. Thẻ ca làm việc trực quan kèm khung giờ và nút hủy phân ca nhanh.
 * 4. Nút phân ca nhanh (+) trên ô trống mở Drawer phân ca với ngày và nhân viên điền sẵn.
 * 5. Tuân thủ khóa điều chỉnh isAdjustmentLocked khi kỳ công đã chốt.
 */

import React, { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Search,
} from 'lucide-react'
import type { ShiftItem, EmployeeShiftAssignment, EmployeeItem } from '@/types'

export interface WeeklyShiftScheduleViewProps {
  shifts: ShiftItem[]
  assignments: EmployeeShiftAssignment[]
  employees: EmployeeItem[]
  isAdjustmentLocked: boolean
  onQuickAssign: (employeeId: number, dateStr: string) => void
  onRemoveAssignment: (assignment: EmployeeShiftAssignment) => void
}

/**
 * Tính ngày Thứ Hai của tuần chứa mốc thời gian date
 */
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(date.setDate(diff))
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

function formatDateDisplay(d: Date): string {
  const date = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${date}/${month}`
}

const DAY_NAMES = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
]

export const WeeklyShiftScheduleView: React.FC<WeeklyShiftScheduleViewProps> = ({
  shifts,
  assignments,
  employees,
  isAdjustmentLocked,
  onQuickAssign,
  onRemoveAssignment,
}) => {
  // Mốc ngày Thứ Hai của tuần đang xem
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()))
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // 7 ngày trong tuần hiện tại
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday)
      d.setDate(currentMonday.getDate() + i)
      return {
        date: d,
        dateStr: formatDateISO(d),
        displayStr: formatDateDisplay(d),
        dayName: DAY_NAMES[i],
        isToday: formatDateISO(d) === formatDateISO(new Date()),
      }
    })
  }, [currentMonday])

  // Điều hướng tuần
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday)
    prev.setDate(prev.getDate() - 7)
    setCurrentMonday(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(currentMonday)
    next.setDate(next.getDate() + 7)
    setCurrentMonday(next)
  }

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()))
  }

  // Lọc nhân sự theo từ khóa
  const filteredEmployees = useMemo(() => {
    if (!searchKeyword.trim()) return employees
    const kw = searchKeyword.toLowerCase()
    return employees.filter(
      (emp) =>
        (emp.fullName || '').toLowerCase().includes(kw) ||
        (emp.employeeCode || '').toLowerCase().includes(kw) ||
        ((emp.department || '').toLowerCase().includes(kw))
    )
  }, [employees, searchKeyword])

  // Map ca làm việc theo ID để tra cứu nhanh
  const shiftMap = useMemo(() => {
    const map = new Map<number, ShiftItem>()
    shifts.forEach((s) => map.set(s.id, s))
    return map
  }, [shifts])

  // Nhãn khoảng ngày tuần hiện tại
  const weekRangeLabel = useMemo(() => {
    const firstDay = weekDays[0]
    const lastDay = weekDays[6]
    return `${firstDay?.displayStr} - ${lastDay?.displayStr}/${firstDay?.date.getFullYear()}`
  }, [weekDays])

  return (
    <div className="space-y-4" data-testid="weekly-shift-schedule-view">
      {/* ── Thanh điều khiển tuần & Tìm kiếm ── */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Bộ điều hướng tuần */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            data-testid="prev-week-btn"
            title="Tuần trước"
            className="p-2 rounded-xl border border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCurrentWeek}
            data-testid="current-week-btn"
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
          >
            Tuần này
          </button>

          <button
            type="button"
            onClick={handleNextWeek}
            data-testid="next-week-btn"
            title="Tuần sau"
            className="p-2 rounded-xl border border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 ml-2">
            <CalendarIcon className="w-4 h-4 text-brand-primary" />
            <span
              data-testid="week-range-label"
              className="text-xs font-bold text-text-primary font-mono"
            >
              {weekRangeLabel}
            </span>
          </div>
        </div>

        {/* Tìm kiếm nhân viên */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            data-testid="search-weekly-employee-input"
            aria-label="Tìm theo mã nhân viên hoặc họ tên"
            placeholder="Tìm theo Mã NV, Họ tên..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
      </div>

      {/* ── Lưới Lịch Tuần (Weekly Calendar Matrix) ── */}
      <div className="card-surface overflow-hidden p-4">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-xs"
            data-testid="weekly-schedule-table"
          >
            <thead>
              <tr className="border-b border-border-subtle bg-slate-50/80">
                {/* Cột cố định thông tin nhân sự */}
                <th className="py-3 px-4 text-left font-bold text-text-tertiary uppercase tracking-wider text-2xs w-60 min-w-55 sticky left-0 bg-slate-50/95 z-20 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">
                  Nhân Sự
                </th>

                {/* 7 ngày trong tuần */}
                {weekDays.map((d) => (
                  <th
                    key={d.dateStr}
                    data-testid={`week-col-${d.dateStr}`}
                    className={`py-3 px-3 text-center font-bold min-w-36 ${
                      d.isToday
                        ? 'bg-brand-50/80 text-brand-primary border-b-2 border-brand-primary'
                        : 'text-text-secondary'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="block text-2xs uppercase tracking-wider">
                        {d.dayName}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                          d.isToday ? 'bg-brand-primary text-white' : 'text-text-primary'
                        }`}
                      >
                        {d.displayStr}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  return (
                    <tr
                      key={emp.id}
                      data-testid={`weekly-emp-row-${emp.id}`}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Thông tin nhân viên (Sticky trái) */}
                      <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50/95 z-10 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-text-primary block truncate max-w-48">
                            {emp.fullName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xs font-mono font-bold text-brand-primary">
                              {emp.employeeCode}
                            </span>
                            <span className="text-2xs text-text-muted truncate max-w-32">
                              {emp.department || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 7 ô ngày trong tuần */}
                      {weekDays.map((d) => {
                        // Tìm lịch phân ca của nhân sự đang bao phủ ngày d.dateStr
                        const activeAssignment = assignments.find(
                          (a) =>
                            (a.employeeId === emp.id || a.userId === emp.id) &&
                            (a.effectiveStartDate || a.effectiveFrom || '') <= d.dateStr &&
                            d.dateStr <= (a.effectiveEndDate || a.effectiveTo || '9999-12-31')
                        )

                        const assignedShift = activeAssignment
                          ? shiftMap.get(activeAssignment.shiftId)
                          : null

                        return (
                          <td
                            key={d.dateStr}
                            data-testid={`cell-${emp.id}-${d.dateStr}`}
                            className={`p-2 align-top text-center border-l border-border-subtle/60 transition-colors ${
                              d.isToday ? 'bg-brand-50/20' : ''
                            }`}
                          >
                            {activeAssignment ? (
                              /* Card ca làm việc */
                              <div
                                data-testid={`shift-card-${activeAssignment.id}`}
                                className="group/card relative p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-left space-y-1 shadow-2xs hover:shadow-xs transition-all"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-xs text-emerald-900 truncate">
                                    {activeAssignment.shiftName}
                                  </span>
                                  {!isAdjustmentLocked && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveAssignment(activeAssignment)}
                                      title="Hủy phân ca"
                                      data-testid={`remove-weekly-shift-${activeAssignment.id}`}
                                      className="opacity-0 group-hover/card:opacity-100 p-1 rounded-md text-emerald-700 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-2xs font-mono text-emerald-800">
                                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>
                                    {assignedShift
                                      ? `${assignedShift.startTime} - ${assignedShift.endTime}`
                                      : 'Theo ca'}
                                  </span>
                                </div>

                                <div className="pt-0.5">
                                  <span className="inline-block px-1.5 py-0.2 rounded text-3xs font-mono font-bold bg-emerald-100 text-emerald-800">
                                    {activeAssignment.shiftCode}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              /* Ô trống kèm nút phân ca nhanh */
                              <div className="h-full min-h-16 flex items-center justify-center">
                                {!isAdjustmentLocked && (
                                  <button
                                    type="button"
                                    onClick={() => onQuickAssign(emp.id, d.dateStr)}
                                    data-testid={`quick-assign-btn-${emp.id}-${d.dateStr}`}
                                    title={`Phân ca nhanh ngày ${d.displayStr} cho ${emp.fullName}`}
                                    className="opacity-20 hover:opacity-100 p-2 rounded-lg border border-dashed border-border-subtle hover:border-brand-primary text-text-tertiary hover:text-brand-primary hover:bg-brand-50/50 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
