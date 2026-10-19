/**
 * PersonalAttendanceCalendar: Lưới Lịch Chấm công Cá nhân 7 Cột (UI-WEB-005, UXD-WEB-005, DD-WEB-017, BLD-WEB-008, TASK-WEB-012).
 *
 * Tính năng chính:
 * 1. Calendar Grid 7 cột tương ứng thứ 2 đến Chủ Nhật.
 * 2. Tô màu ô ngày phân biệt: Xanh lá (Đúng giờ), Vàng (Đi muộn kèm phút), Đỏ (Vắng), Xám (Nghỉ tuần/Lễ).
 * 3. Mở Drawer chi tiết ngày 420px trượt từ bên phải khi nhấp chuột vào ô ngày.
 * 4. Nút xuất file Excel/CSV bảng công có phòng chống Formula Injection (=, +, -, @).
 * 5. Điều hướng chuyển đổi tháng linh hoạt kèm thanh tổng kết ngày công.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  RotateCw,
  Loader2,
} from 'lucide-react'
import { attendanceService } from '@/services/attendanceService'
import { useAuthStore } from '@/store/authStore'
import { AttendanceDayDetailDrawer } from './AttendanceDayDetailDrawer'
import { SubmitExcuseModal } from '@/components/excuse/SubmitExcuseModal'
import type { PersonalAttendanceDayRecord, PersonalAttendanceResponse } from '@/types'

const WEEKDAYS = [
  { key: 1, label: 'Thứ 2', short: 'T2' },
  { key: 2, label: 'Thứ 3', short: 'T3' },
  { key: 3, label: 'Thứ 4', short: 'T4' },
  { key: 4, label: 'Thứ 5', short: 'T5' },
  { key: 5, label: 'Thứ 6', short: 'T6' },
  { key: 6, label: 'Thứ 7', short: 'T7' },
  { key: 0, label: 'Chủ Nhật', short: 'CN' },
]

export interface PersonalAttendanceCalendarProps {
  initialMonth?: number
  initialYear?: number
  onExport?: (month: number, year: number) => void
}

export const PersonalAttendanceCalendar: React.FC<PersonalAttendanceCalendarProps> = ({
  initialMonth,
  initialYear,
  onExport,
}) => {
  const { user } = useAuthStore()

  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState<number>(initialYear || today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth || today.getMonth() + 1)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [attendanceData, setAttendanceData] = useState<PersonalAttendanceResponse | null>(null)
  const [selectedDay, setSelectedDay] = useState<PersonalAttendanceDayRecord | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState<boolean>(false)

  // Tải dữ liệu bảng công theo tháng
  const fetchAttendance = useCallback((m: number, y: number) => {
    setIsLoading(true)
    attendanceService
      .getPersonalAttendance({ month: m, year: y })
      .then((data) => {
        setAttendanceData(data)
      })
      .catch(() => {
        setAttendanceData({
          month: m,
          year: y,
          totalWorkDays: 0,
          totalOnTimeDays: 0,
          totalLateDays: 0,
          records: [],
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    let ignore = false

    attendanceService
      .getPersonalAttendance({ month: currentMonth, year: currentYear })
      .then((data) => {
        if (!ignore) {
          setAttendanceData(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!ignore) {
          setAttendanceData({
            month: currentMonth,
            year: currentYear,
            totalWorkDays: 0,
            totalOnTimeDays: 0,
            totalLateDays: 0,
            records: [],
          })
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [currentMonth, currentYear])

  // Điều hướng chuyển tháng
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleCurrentMonth = () => {
    setCurrentMonth(today.getMonth() + 1)
    setCurrentYear(today.getFullYear())
  }

  // Tra cứu bản ghi theo ngày (YYYY-MM-DD)
  const recordMap = useMemo(() => {
    const map = new Map<string, PersonalAttendanceDayRecord>()
    if (attendanceData?.records) {
      for (const rec of attendanceData.records) {
        map.set(rec.date, rec)
      }
    }
    return map
  }, [attendanceData])

  // Tính toán lưới các ngày trong tháng (bắt đầu từ Thứ 2)
  const calendarDays = useMemo(() => {
    // Ngày đầu tiên của tháng
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    // Ngày cuối cùng của tháng
    const lastDay = new Date(currentYear, currentMonth, 0)
    const daysInMonth = lastDay.getDate()

    // Chuyển getDay (0: CN, 1: T2, ..., 6: T7) sang hệ bắt đầu từ T2 (0: T2, ..., 6: CN)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7

    const days: Array<{
      dateStr: string
      dayNum: number
      isCurrentMonth: boolean
      isToday: boolean
      isWeekend: boolean
      record?: PersonalAttendanceDayRecord
    }> = []

    // Padding các ngày trống đầu tuần
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        dateStr: `prev-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false,
      })
    }

    // Các ngày thực tế trong tháng
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dateObj = new Date(currentYear, currentMonth - 1, day)
      const dayOfWeek = dateObj.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend,
        record: recordMap.get(dateStr),
      })
    }

    return days
  }, [currentYear, currentMonth, recordMap, today])

  // Mở Drawer chi tiết ngày
  const handleSelectDay = (dayRecord?: PersonalAttendanceDayRecord, dateStr?: string) => {
    if (dayRecord) {
      setSelectedDay(dayRecord)
    } else if (dateStr) {
      // Dự phòng bản ghi trống cho ngày nghỉ/chưa có lượt quẹt
      setSelectedDay({
        date: dateStr,
        status: 'REST_DAY',
        checkIn: null,
        checkOut: null,
      })
    }
    setIsDrawerOpen(true)
  }

  // Xuất báo cáo bảng công cá nhân (Excel/CSV có phòng chống Formula Injection - DD-WEB-017)
  const handleExportCsv = () => {
    if (onExport) {
      onExport(currentMonth, currentYear)
      return
    }

    const recordsToExport = attendanceData?.records || []
    attendanceService.exportPersonalAttendanceCsv(
      currentMonth,
      currentYear,
      recordsToExport,
      {
        fullName: user?.fullName || 'Nhân Viên',
        employeeCode: user?.employeeCode || 'NV-0000',
        department: user?.department,
      }
    )
  }

  // Huy hiệu trạng thái trên từng ô ngày
  const renderCellStatus = (rec?: PersonalAttendanceDayRecord, isWeekend = false) => {
    if (!rec) {
      if (isWeekend) {
        return (
          <span className="text-2xs text-text-muted font-medium bg-slate-100 px-1.5 py-0.5 rounded-sm">
            Nghỉ tuần
          </span>
        )
      }
      return null
    }

    switch (rec.status) {
      case 'ON_TIME':
        return (
          <span
            data-testid="cell-status-on-time"
            className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200/60"
          >
            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
            <span>Đúng giờ</span>
          </span>
        )
      case 'LATE':
        return (
          <span
            data-testid="cell-status-late"
            className="inline-flex items-center gap-1 text-2xs font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200"
          >
            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
            <span>Muộn {rec.lateMinutes ? `${rec.lateMinutes}p` : ''}</span>
          </span>
        )
      case 'EARLY_LEAVE':
        return (
          <span className="text-2xs font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-sm border border-orange-200">
            Về sớm
          </span>
        )
      case 'ABSENT':
        return (
          <span
            data-testid="cell-status-absent"
            className="text-2xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-sm border border-rose-200"
          >
            Vắng mặt
          </span>
        )
      case 'REST_DAY':
        return (
          <span className="text-2xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded-sm">
            Nghỉ tuần
          </span>
        )
      case 'HOLIDAY':
        return (
          <span className="text-2xs font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-sm border border-purple-200">
            Nghỉ lễ
          </span>
        )
      default:
        return (
          <span className="text-2xs text-text-tertiary bg-slate-100 px-1.5 py-0.5 rounded-sm">
            {rec.status}
          </span>
        )
    }
  }

  // Thống kê nhanh
  const totalWorkDays = attendanceData?.totalWorkDays ?? 0
  const totalOnTime = attendanceData?.totalOnTimeDays ?? 0
  const totalLate = attendanceData?.totalLateDays ?? 0
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

  return (
    <div
      data-testid="personal-attendance-calendar"
      className="card-surface p-5 sm:p-6 space-y-5"
    >
      {/* ── Toolbar Lịch & Nút Chức năng ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Bảng Công Cá Nhân Tháng {currentMonth}/{currentYear}
            </h2>
            <p className="text-xs text-text-secondary">
              Theo dõi lịch sử chấm công, giờ vào ra và chi tiết từng ngày
            </p>
          </div>
        </div>

        {/* Cụm điều hướng tháng & xuất báo cáo */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center rounded-xl border border-border-subtle bg-white shadow-2xs p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              data-testid="calendar-prev-month-btn"
              title="Tháng trước"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              data-testid="calendar-today-btn"
              className="px-2.5 py-1 text-xs font-semibold text-text-secondary hover:text-brand-600 transition-colors"
            >
              Hôm nay
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              data-testid="calendar-next-month-btn"
              title="Tháng sau"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchAttendance(currentMonth, currentYear)}
            data-testid="calendar-refresh-btn"
            title="Tải lại dữ liệu"
            className="p-2 rounded-xl border border-border-subtle bg-white text-text-secondary hover:text-text-primary hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            data-testid="calendar-export-csv-btn"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-2xs transition-all shadow-brand-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo (.CSV)</span>
          </button>
        </div>
      </div>

      {/* ── Thanh Tóm Tắt Chỉ Số Tháng (Summary Bar) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-border-subtle flex flex-col justify-between">
          <span className="text-xs text-text-secondary font-medium">Tổng ngày công</span>
          <span data-testid="kpi-total-work-days" className="text-xl font-bold text-text-primary mt-1">
            {isLoading ? '...' : totalWorkDays}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
          <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            <span>Đúng giờ</span>
          </span>
          <span data-testid="kpi-total-ontime-days" className="text-xl font-bold text-status-success mt-1">
            {isLoading ? '...' : totalOnTime}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
          <span className="text-xs text-amber-800 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Đi muộn</span>
          </span>
          <span data-testid="kpi-total-late-days" className="text-xl font-bold text-amber-700 mt-1">
            {isLoading ? '...' : totalLate}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-border-subtle flex flex-col justify-between">
          <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
            <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Nghỉ tuần / Lễ</span>
          </span>
          <span className="text-xl font-bold text-slate-700 mt-1">
            {isLoading ? '...' : Math.max(0, daysInMonth - totalWorkDays)}
          </span>
        </div>
      </div>

      {/* ── Lưới Lịch 7 Cột (Calendar Grid 7 Columns) ── */}
      <div className="space-y-2">
        {/* Tiêu đề 7 thứ trong tuần */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {WEEKDAYS.map((w) => (
            <div
              key={w.key}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg ${
                w.key === 0 || w.key === 6
                  ? 'text-slate-400 bg-slate-50'
                  : 'text-text-secondary bg-slate-100/70'
              }`}
            >
              <span className="hidden sm:inline">{w.label}</span>
              <span className="sm:hidden">{w.short}</span>
            </div>
          ))}
        </div>

        {/* Lưới các ô ngày */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-text-tertiary">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="text-sm">Đang tải lịch chấm công...</span>
          </div>
        ) : (
          <div
            data-testid="calendar-grid-cells"
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
          >
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[92px] sm:min-h-[105px] rounded-xl bg-slate-50/40 border border-transparent"
                  />
                )
              }

              const rec = cell.record
              const isSelected = selectedDay?.date === cell.dateStr

              return (
                <div
                  key={cell.dateStr}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectDay(rec, cell.dateStr)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectDay(rec, cell.dateStr)
                    }
                  }}
                  data-testid={`calendar-day-cell-${cell.dateStr}`}
                  className={`min-h-[92px] sm:min-h-[105px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/30'
                      : cell.isToday
                        ? 'border-brand-300 ring-1 ring-brand-400 bg-white shadow-xs'
                        : cell.isWeekend
                          ? 'border-border-subtle bg-slate-50/70 hover:bg-slate-100/80'
                          : 'border-border-subtle bg-white hover:border-brand-200 hover:shadow-xs'
                  }`}
                >
                  {/* Hàng ngày & chỉ báo Hôm nay */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                        cell.isToday
                          ? 'bg-brand-600 text-white'
                          : cell.isWeekend
                            ? 'text-slate-400'
                            : 'text-text-primary'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {cell.isToday && (
                      <span className="text-2xs font-semibold text-brand-600 hidden sm:inline">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {/* Huy hiệu trạng thái ngày */}
                  <div className="my-1">{renderCellStatus(rec, cell.isWeekend)}</div>

                  {/* Giờ vào & giờ ra rút gọn */}
                  <div className="space-y-0.5 text-2xs font-mono">
                    {rec?.checkIn ? (
                      <div className="text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{rec.checkIn.slice(0, 5)}</span>
                      </div>
                    ) : null}

                    {rec?.checkOut ? (
                      <div className="text-blue-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">{rec.checkOut.slice(0, 5)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Drawer Chi Tiết Ngày (420px Sliding Drawer) ── */}
      <AttendanceDayDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={selectedDay}
        onOpenExcuseModal={() => {
          setIsExcuseModalOpen(true)
        }}
      />

      {/* ── Modal Nộp Đơn Giải Trình Công ── */}
      <SubmitExcuseModal
        isOpen={isExcuseModalOpen}
        onClose={() => setIsExcuseModalOpen(false)}
        attendanceLogId={selectedDay?.checkOutLogId ?? selectedDay?.checkInLogId ?? undefined}
        attendanceDate={selectedDay?.date}
        currentPunchTime={selectedDay?.checkIn || undefined}
        onSuccess={() => {
          fetchAttendance(currentMonth, currentYear)
        }}
      />
    </div>
  )
}
