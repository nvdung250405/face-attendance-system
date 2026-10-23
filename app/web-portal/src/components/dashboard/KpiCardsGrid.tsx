/**
 * KpiCardsGrid: Lưới 4 Thẻ Chỉ Số KPI Chấm Công Thời Gian Thực
 * (UXD-WEB-003, UI-WEB-003, DD-WEB-014, BLD-WEB-006, TASK-WEB-010).
 *
 * Tính năng chính:
 * 1. 4 thẻ KPI bo góc 12px chuẩn thiết kế Indigo Clean SaaS:
 *    - Tổng nhân sự (Total Employees)
 *    - Đã có mặt hôm nay (Present Employees + %)
 *    - Đi muộn (Late Arrivals)
 *    - Chưa đến / Vắng mặt (Absent Employees)
 * 2. Nhảy số thời gian thực khi có sự kiện STOMP đẩy từ Kiosk biên.
 */

import React from 'react'
import { Users, CheckCircle2, Clock, UserX } from 'lucide-react'
import type { AttendanceStats } from '@/types'

export interface KpiCardsGridProps {
  stats: AttendanceStats
  isLoading?: boolean
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ stats, isLoading = false }) => {
  const totalEmployees = stats.totalEmployees ?? 0
  const presentCount = stats.presentCount ?? 0
  const lateCount = stats.lateCount ?? 0
  const onTimeCount = stats.onTimeCount ?? (presentCount - lateCount)
  const absentCount =
    stats.absentCount ?? Math.max(0, totalEmployees - presentCount)

  const presentPercentage =
    totalEmployees > 0
      ? Math.round((presentCount / totalEmployees) * 100)
      : 0

  return (
    <div
      data-testid="kpi-cards-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {/* ── Thẻ 1: Tổng Nhân Sự ── */}
      <div className="card-surface p-5.5 space-y-3.5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-0.5 border border-slate-200/80 bg-white rounded-2xl group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400" />
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/15 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tổng số nhân sự
          </span>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20 shadow-xs flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-108">
            <Users size={20} strokeWidth={2} />
          </div>
        </div>

        <div>
          <div
            data-testid="kpi-total-employees"
            className="text-3xl font-black font-mono text-slate-900 tracking-tight"
          >
            {isLoading ? '...' : totalEmployees}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Toàn bộ nhân sự thuộc hệ thống</p>
        </div>
      </div>

      {/* ── Thẻ 2: Đã Có Mặt (Tỷ lệ %) ── */}
      <div className="card-surface p-5.5 space-y-3.5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-0.5 border border-slate-200/80 bg-white rounded-2xl group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/15 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Đã có mặt
          </span>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 shadow-xs flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-108">
            <CheckCircle2 size={20} strokeWidth={2} />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2.5">
            <span
              data-testid="kpi-present-count"
              className="text-3xl font-black font-mono text-emerald-600 tracking-tight"
            >
              {isLoading ? '...' : presentCount}
            </span>
            <span
              data-testid="kpi-present-percentage"
              className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs"
            >
              {presentPercentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Đúng giờ: <span className="font-semibold text-slate-800">{onTimeCount}</span> lượt
          </p>
        </div>
      </div>

      {/* ── Thẻ 3: Đi Muộn ── */}
      <div className="card-surface p-5.5 space-y-3.5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-0.5 border border-slate-200/80 bg-white rounded-2xl group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/5 blur-2xl group-hover:bg-amber-500/15 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Đi muộn
          </span>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/20 shadow-xs flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-108">
            <Clock size={20} strokeWidth={2} />
          </div>
        </div>

        <div>
          <div
            data-testid="kpi-late-count"
            className="text-3xl font-black font-mono text-amber-600 tracking-tight"
          >
            {isLoading ? '...' : lateCount}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Quẹt thẻ sau mốc bắt đầu ca làm việc
          </p>
        </div>
      </div>

      {/* ── Thẻ 4: Chưa Đến / Vắng Mặt ── */}
      <div className="card-surface p-5.5 space-y-3.5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-0.5 border border-slate-200/80 bg-white rounded-2xl group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-400" />
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/15 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            Chưa đến
          </span>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/20 shadow-xs flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-108">
            <UserX size={20} strokeWidth={2} />
          </div>
        </div>

        <div>
          <div
            data-testid="kpi-absent-count"
            className="text-3xl font-black font-mono text-rose-600 tracking-tight"
          >
            {isLoading ? '...' : absentCount}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Chưa ghi nhận lượt quẹt nào hôm nay
          </p>
        </div>
      </div>
    </div>
  )
}
