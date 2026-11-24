/**
 * AdminDashboardView: Bảng Điều Khiển Chấm Công Trực Tiếp & Thẻ KPI
 * (SOL-WEB-004, UI-WEB-003, UXD-WEB-003, UXD-WEB-004, DD-WEB-007, DD-WEB-014, BLD-WEB-006, TASK-WEB-010).
 *
 * Tính năng chính:
 * 1. Lưới 4 thẻ KPI nhảy số thời gian thực khi có lượt quẹt mới từ máy trạm Kiosk.
 * 2. Bảng Live Attendance Table cập nhật tức thời qua WebSocket STOMP (/topic/live-attendance).
 * 3. Hiệu ứng thị giác Green Flash 1.5s trên dòng mới nhất theo DD-WEB-014.
 * 4. Tải danh sách và thống kê khởi tạo từ Backend, tự động đồng bộ cache TanStack Query.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { normalizeApiError } from '@/services/errorNormalizer'
import { useAuthStore } from '@/store/authStore'
import { attendanceKeys } from '@/services/queryClient'
import {
  useAttendanceStatsQuery,
  useAdminAttendanceQuery,
} from '@/services/hooks/useAttendanceQueries'
import { useLiveAttendance } from '@/services/hooks/useLiveAttendance'
import { formatLocalDateISO } from '@/utils/date'
import { KpiCardsGrid } from '@/components/dashboard/KpiCardsGrid'
import { LiveAttendanceTable } from '@/components/dashboard/LiveAttendanceTable'
import type { AttendanceRecord, AttendanceStats } from '@/types'

const DEFAULT_STATS: AttendanceStats = {
  totalEmployees: 0,
  presentCount: 0,
  onTimeCount: 0,
  lateCount: 0,
  absentCount: 0,
}

export const AdminDashboardView: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  // Truy vấn dữ liệu khởi tạo bằng TanStack Query (F-TECH-01)
  const statsQuery = useAttendanceStatsQuery()
  const attendanceQuery = useAdminAttendanceQuery({ page: 0, size: 50 })

  const initialRecords = useMemo(
    () => attendanceQuery.data?.content ?? [],
    [attendanceQuery.data]
  )
  const stats = statsQuery.data ?? DEFAULT_STATS
  const isLoading = statsQuery.isFetching || attendanceQuery.isFetching
  const isRefreshing = statsQuery.isRefetching || attendanceQuery.isRefetching
  const errorMessage =
    statsQuery.isError && attendanceQuery.isError
      ? normalizeApiError(attendanceQuery.error || statsQuery.error).message ||
        'Không thể tải dữ liệu ban đầu cho bảng điều khiển.'
      : null

  // Hiệu ứng Green Flash 1.5s cho dòng mới nhất
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seenLiveIdsRef = useRef<Set<number>>(new Set())

  // Callback khi nhận sự kiện điểm danh STOMP
  const handleRecordReceived = useCallback(
    (record: AttendanceRecord) => {
      // 1. Kích hoạt hiệu ứng Green Flash 1.5s (DD-WEB-014)
      setHighlightedRecordId(record.recordId)
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedRecordId(null)
      }, 1500)

      // 2. Chống tăng trùng KPI nếu nhận lại cùng recordId hoặc đã được handleLiveAttendanceEvent cập nhật
      if (record.recordId != null && seenLiveIdsRef.current.has(record.recordId)) {
        return
      }
      if (record.recordId != null) {
        seenLiveIdsRef.current.add(record.recordId)
      }

      const liveCache = queryClient.getQueryData<AttendanceRecord[]>(attendanceKeys.live())
      const alreadyUpdatedByHook = Boolean(
        liveCache?.some((r) => r.recordId === record.recordId)
      )
      if (alreadyUpdatedByHook) {
        return
      }

      const today = formatLocalDateISO(new Date())
      queryClient.setQueryData<AttendanceStats>(attendanceKeys.stats(today), (prev) => {
        if (!prev) return prev
        const total = prev.totalEmployees ?? 0
        const newPresent = prev.presentCount + 1
        const newOnTime =
          record.status === 'ON_TIME' ? prev.onTimeCount + 1 : prev.onTimeCount
        const newLate = record.status === 'LATE' ? prev.lateCount + 1 : prev.lateCount
        const newAbsent = Math.max(0, total - newPresent)

        return {
          ...prev,
          presentCount: newPresent,
          onTimeCount: newOnTime,
          lateCount: newLate,
          absentCount: newAbsent,
        }
      })
    },
    [queryClient]
  )

  // Dọn dẹp timer khi component unmount để tránh rò rỉ bộ nhớ (EXP1-02)
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  // Hook STOMP lắng nghe kênh '/topic/live-attendance'
  const { latestEvents, isConnected, clearEvents } = useLiveAttendance({
    onRecordReceived: handleRecordReceived,
  })

  // Hàm làm mới dữ liệu (xóa buffer STOMP cũ và refetch TanStack Query) (F-TECH-01, F-TECH-02)
  const loadDashboardData = useCallback(() => {
    clearEvents()
    seenLiveIdsRef.current.clear()
    void Promise.all([statsQuery.refetch(), attendanceQuery.refetch()])
  }, [clearEvents, statsQuery, attendanceQuery])

  // Hợp nhất danh sách hiển thị: khử trùng lặp recordId giữa latestEvents và initialRecords (F-TECH-02)
  const mergedRecords = useMemo(() => {
    const seen = new Set<number>()
    const merged: AttendanceRecord[] = []

    for (const r of latestEvents) {
      if (!seen.has(r.recordId)) {
        seen.add(r.recordId)
        merged.push(r)
      }
    }
    for (const r of initialRecords) {
      if (!seen.has(r.recordId)) {
        seen.add(r.recordId)
        merged.push(r)
      }
    }
    return merged.slice(0, 50)
  }, [latestEvents, initialRecords])

  return (
    <div className="space-y-6" data-testid="admin-dashboard-view">
      {/* ── Tiêu đề trang & Thanh tác vụ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Chào mừng trở lại, {user?.fullName || 'Quản Trị Viên'}
          </h1>
          <p className="page-subtitle">
            Giám sát thời gian thực các trạm điểm danh biên, nhịp tim Kiosk và chỉ số chấm công toàn công ty
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            data-testid="refresh-dashboard-btn"
            variant="secondary"
            size="sm"
            onClick={loadDashboardData}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* ── Thông báo lỗi nếu có ── */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={loadDashboardData}
            className="text-xs underline font-semibold hover:text-rose-900"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Lưới 4 Thẻ KPI Chỉ Số Thời Gian Thực (UXD-WEB-003) ── */}
      <KpiCardsGrid stats={stats} isLoading={isLoading} />

      {/* ── Bảng Dữ Liệu Chấm Công Trực Tiếp (Live Attendance Table - UXD-WEB-004) ── */}
      <LiveAttendanceTable
        records={mergedRecords}
        isLoading={isLoading}
        isConnected={isConnected}
        highlightedRecordId={highlightedRecordId}
      />
    </div>
  )
}
