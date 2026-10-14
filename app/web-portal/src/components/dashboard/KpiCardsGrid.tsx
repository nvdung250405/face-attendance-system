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
import type { AttendanceStats } from '@/types'

export interface KpiCardsGridProps {
  stats: AttendanceStats
  isLoading?: boolean
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ stats, isLoading = false }) => {
  const totalEmployees = stats.totalEmployees ?? 128
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* ── Thẻ 1: Tổng Nhân Sự ── */}
      <div className="card-surface p-5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Tổng số nhân sự
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        <div>
          <div
            data-testid="kpi-total-employees"
            className="text-3xl font-extrabold font-mono text-text-primary tracking-tight"
          >
            {isLoading ? '...' : totalEmployees}
          </div>
          <p className="text-xs text-text-muted mt-1">Toàn bộ nhân sự thuộc hệ thống</p>
        </div>
      </div>

      {/* ── Thẻ 2: Đã Có Mặt (Tỷ lệ %) ── */}
      <div className="card-surface p-5 space-y-3 relative overflow-hidden border-l-4 border-l-status-success transition-all duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-status-success uppercase tracking-wider">
            Đã có mặt
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-status-success flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="kpi-present-count"
              className="text-3xl font-extrabold font-mono text-status-success tracking-tight"
            >
              {isLoading ? '...' : presentCount}
            </span>
            <span
              data-testid="kpi-present-percentage"
              className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-status-success"
            >
              {presentPercentage}%
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Đúng giờ: <span className="font-semibold text-text-primary">{onTimeCount}</span> lượt
          </p>
        </div>
      </div>

      {/* ── Thẻ 3: Đi Muộn ── */}
      <div className="card-surface p-5 space-y-3 relative overflow-hidden border-l-4 border-l-status-warning transition-all duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-status-warning uppercase tracking-wider">
            Đi muộn
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-status-warning flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div>
          <div
            data-testid="kpi-late-count"
            className="text-3xl font-extrabold font-mono text-status-warning tracking-tight"
          >
            {isLoading ? '...' : lateCount}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Quẹt thẻ sau mốc bắt đầu ca làm việc
          </p>
        </div>
      </div>

      {/* ── Thẻ 4: Chưa Đến / Vắng Mặt ── */}
      <div className="card-surface p-5 space-y-3 relative overflow-hidden border-l-4 border-l-status-danger transition-all duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-status-danger uppercase tracking-wider">
            Chưa đến
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-status-danger flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="8" x2="23" y2="14" />
              <line x1="23" y1="8" x2="17" y2="14" />
            </svg>
          </div>
        </div>

        <div>
          <div
            data-testid="kpi-absent-count"
            className="text-3xl font-extrabold font-mono text-status-danger tracking-tight"
          >
            {isLoading ? '...' : absentCount}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Chưa ghi nhận lượt quẹt nào hôm nay
          </p>
        </div>
      </div>
    </div>
  )
}
