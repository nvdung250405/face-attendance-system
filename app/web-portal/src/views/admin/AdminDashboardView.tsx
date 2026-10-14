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

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { attendanceService } from '@/services/attendanceService'
import { useLiveAttendance } from '@/services/hooks/useLiveAttendance'
import { KpiCardsGrid } from '@/components/dashboard/KpiCardsGrid'
import { LiveAttendanceTable } from '@/components/dashboard/LiveAttendanceTable'
import type { AttendanceRecord, AttendanceStats } from '@/types'

const DEFAULT_STATS: AttendanceStats = {
  totalEmployees: 128,
  presentCount: 0,
  onTimeCount: 0,
  lateCount: 0,
  absentCount: 128,
}

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuthStore()

  // Dữ liệu khởi tạo từ REST
  const [initialRecords, setInitialRecords] = useState<AttendanceRecord[]>([])
  const [stompRecords, setStompRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Hiệu ứng Green Flash 1.5s cho dòng mới nhất
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null)

  // Callback khi nhận sự kiện điểm danh STOMP
  const handleRecordReceived = useCallback((record: AttendanceRecord) => {
    // 1. Kích hoạt hiệu ứng Green Flash 1.5s (DD-WEB-014)
    setHighlightedRecordId(record.recordId)
    const timer = setTimeout(() => {
      setHighlightedRecordId(null)
    }, 1500)

    // 2. Chèn bản ghi mới lên đầu danh sách sự kiện trực tiếp
    setStompRecords((prev) => [
      record,
      ...prev.filter((r) => r.recordId !== record.recordId).slice(0, 49),
    ])

    // 3. Tự động tăng bộ đếm KPI thời gian thực
    setStats((prev) => {
      const total = prev.totalEmployees ?? 128
      const newPresent = prev.presentCount + 1
      const newOnTime =
        record.status === 'ON_TIME' ? prev.onTimeCount + 1 : prev.onTimeCount
      const newLate =
        record.status === 'LATE' ? prev.lateCount + 1 : prev.lateCount
      const newAbsent = Math.max(0, total - newPresent)

      return {
        ...prev,
        presentCount: newPresent,
        onTimeCount: newOnTime,
        lateCount: newLate,
        absentCount: newAbsent,
      }
    })

    return () => clearTimeout(timer)
  }, [])

  // Hook STOMP lắng nghe kênh '/topic/live-attendance'
  const { latestEvents, isConnected } = useLiveAttendance({
    onRecordReceived: handleRecordReceived,
  })

  // Hàm làm mới dữ liệu thủ công từ nút bấm
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      const [statsData, attendanceData] = await Promise.allSettled([
        attendanceService.getAttendanceStats(),
        attendanceService.getAdminAttendance({ page: 0, size: 50 }),
      ])

      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value)
      }

      if (attendanceData.status === 'fulfilled' && attendanceData.value?.content) {
        setInitialRecords(attendanceData.value.content)
      }
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải dữ liệu ban đầu cho bảng điều khiển.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const fetchData = async () => {
      try {
        const [statsData, attendanceData] = await Promise.allSettled([
          attendanceService.getAttendanceStats(),
          attendanceService.getAdminAttendance({ page: 0, size: 50 }),
        ])
        if (ignore) return

        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats(statsData.value)
        }

        if (attendanceData.status === 'fulfilled' && attendanceData.value?.content) {
          setInitialRecords(attendanceData.value.content)
        }
      } catch (err) {
        if (!ignore) {
          const error = err as { message?: string }
          setErrorMessage(error.message || 'Không thể tải dữ liệu ban đầu cho bảng điều khiển.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [])

  // Hợp nhất danh sách hiển thị: latestEvents & stompRecords chèn lên đầu initialRecords
  const mergedRecords = useMemo(() => {
    const map = new Map<number, AttendanceRecord>()

    // Ưu tiên các sự kiện mới nhất từ STOMP
    latestEvents.forEach((rec) => {
      map.set(rec.recordId, rec)
    })
    stompRecords.forEach((rec) => {
      map.set(rec.recordId, rec)
    })

    // Ghép thêm dữ liệu khởi tạo ban đầu nếu chưa có trong map
    initialRecords.forEach((rec) => {
      if (!map.has(rec.recordId)) {
        map.set(rec.recordId, rec)
      }
    })

    // Sắp xếp giảm dần theo thời gian quẹt, tối đa 50 bản ghi
    return Array.from(map.values())
      .sort(
        (a, b) =>
          new Date(b.punchTimestamp).getTime() - new Date(a.punchTimestamp).getTime()
      )
      .slice(0, 50)
  }, [latestEvents, stompRecords, initialRecords])

  return (
    <div className="space-y-6" data-testid="admin-dashboard-view">
      {/* ── Tiêu đề trang & Thanh tác vụ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand-primary mb-2">
            <span>Không gian Quản trị HR &amp; Vận hành</span>
          </div>
          <h1 className="page-title">
            Chào mừng trở lại, {user?.fullName || 'Quản Trị Viên'}
          </h1>
          <p className="page-subtitle">
            Giám sát thời gian thực các trạm điểm danh biên, nhịp tim Kiosk và chỉ số chấm công toàn công ty (DD-WEB-014)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="refresh-dashboard-btn"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── Thông báo lỗi nếu có ── */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
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
