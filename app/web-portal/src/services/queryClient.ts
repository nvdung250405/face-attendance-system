/**
 * TanStack Query Client & Cache Factory
 * (DATA-WEB-004, DD-WEB-006, DD-WEB-007, BLD-WEB-003, TASK-WEB-007).
 *
 * Cung cấp:
 * - Query Keys Factory tập trung (attendanceKeys, employeeKeys, notificationKeys, payrollKeys, kioskKeys).
 * - Chính sách Cache Policies tối ưu (staleTime, gcTime).
 * - Hàm xử lý cập nhật thời gian thực từ STOMP (Optimistic Prepend tối đa 50 bản ghi và cập nhật KPI).
 * - Singleton QueryClient và Factory createQueryClient.
 */

import { QueryClient } from '@tanstack/react-query'
import type { AttendanceRecord, AttendanceQueryParams, AttendanceStats } from '@/types'

/**
 * Chính sách thời gian lưu và dọn rác bộ đệm (DD-WEB-006)
 */
export const CACHE_POLICIES = {
  liveAttendance: {
    staleTime: 0, // Luôn mới (0 ms)
    gcTime: 5 * 60 * 1000, // 5 phút
  },
  historyAttendance: {
    staleTime: 60 * 1000, // 60 giây
    gcTime: 10 * 60 * 1000, // 10 phút
  },
  personalAttendance: {
    staleTime: 120 * 1000, // 120 giây
    gcTime: 15 * 60 * 1000, // 15 phút
  },
  employees: {
    staleTime: 300 * 1000, // 300 giây (5 phút)
    gcTime: 30 * 60 * 1000, // 30 phút
  },
  notifications: {
    staleTime: 30 * 1000, // 30 giây
    gcTime: 10 * 60 * 1000, // 10 phút
  },
} as const

/**
 * Factory tập trung tạo Khóa Truy vấn (Query Keys Factory) (DD-WEB-006)
 */
export const attendanceKeys = {
  all: ['attendance'] as const,
  live: () => [...attendanceKeys.all, 'live'] as const,
  history: (params?: AttendanceQueryParams) =>
    params
      ? ([...attendanceKeys.all, 'history', params] as const)
      : ([...attendanceKeys.all, 'history'] as const),
  personal: (month: number, year: number) =>
    [...attendanceKeys.all, 'personal', { month, year }] as const,
  stats: (date: string) => [...attendanceKeys.all, 'stats', date] as const,
}

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params?: Record<string, unknown>) =>
    params
      ? ([...employeeKeys.all, 'list', params] as const)
      : ([...employeeKeys.all, 'list'] as const),
  detail: (id: number) => [...employeeKeys.all, 'detail', id] as const,
}

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
}

export const payrollKeys = {
  all: ['payroll'] as const,
  periods: () => [...payrollKeys.all, 'periods'] as const,
  current: () => [...payrollKeys.all, 'current'] as const,
}

export const kioskKeys = {
  all: ['kiosks'] as const,
  list: () => [...kioskKeys.all, 'list'] as const,
  detail: (id: string) => [...kioskKeys.all, 'detail', id] as const,
}

/**
 * Khởi tạo QueryClient với các cấu hình tối ưu mặc định
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 60s
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

/**
 * Singleton QueryClient cho toàn bộ ứng dụng
 */
export const queryClient = createQueryClient()

/**
 * Cơ chế đồng bộ cache thời gian thực từ STOMP (DD-WEB-007, DATA-WEB-004)
 * - 1. Chèn bản ghi mới lên đầu danh sách Live Table (giữ tối đa 50 bản ghi mới nhất không giật màn hình).
 * - 2. Tăng bộ đếm KPI trên Dashboard (Đã đến +1, Đúng giờ / Muộn +1).
 * - 3. Đánh dấu danh sách lịch sử đã cũ (Stale) để tự động refetch khi HR đổi màn hình.
 */
/**
 * Trả về ngày hôm nay theo múi giờ địa phương (YYYY-MM-DD), tránh lệch ngày khi dùng toISOString (UTC).
 */
export function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function handleLiveAttendanceEvent(
  newRecord: AttendanceRecord,
  qc: QueryClient = queryClient,
  customDate?: string
): void {
  const today = customDate ?? getLocalDateString()

  // 1. Chèn bản ghi mới lên đầu danh sách Live Table (tối đa 50 bản ghi)
  qc.setQueryData<AttendanceRecord[]>(attendanceKeys.live(), (oldData = []) => {
    return [newRecord, ...oldData.slice(0, 49)]
  })

  // 2. Tăng bộ đếm KPI trên Dashboard
  qc.setQueryData<AttendanceStats>(attendanceKeys.stats(today), (oldStats) => {
    if (!oldStats) return oldStats
    return {
      ...oldStats,
      presentCount: oldStats.presentCount + 1,
      onTimeCount:
        newRecord.status === 'ON_TIME' ? oldStats.onTimeCount + 1 : oldStats.onTimeCount,
      lateCount: newRecord.status === 'LATE' ? oldStats.lateCount + 1 : oldStats.lateCount,
    }
  })

  // 3. Đánh dấu danh sách lịch sử đã cũ (Stale)
  qc.invalidateQueries({ queryKey: attendanceKeys.all })
}
