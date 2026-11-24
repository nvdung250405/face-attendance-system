/**
 * React Query hooks chuẩn hóa cho dữ liệu chấm công & thống kê KPI
 * (F-TECH-01, DATA-WEB-004, DD-WEB-006, DD-WEB-007).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { attendanceService } from '@/services/attendanceService'
import { attendanceKeys, CACHE_POLICIES } from '@/services/queryClient'
import { formatLocalDateISO } from '@/utils/date'
import type { AttendanceRecord, AttendanceQueryParams, AttendanceStats, PaginatedResult } from '@/types'

/**
 * Hook truy vấn thống kê KPI điểm danh trong ngày
 */
export function useAttendanceStatsQuery(
  date?: string,
  options?: Omit<
    UseQueryOptions<AttendanceStats, Error, AttendanceStats, ReturnType<typeof attendanceKeys.stats>>,
    'queryKey' | 'queryFn'
  >
) {
  const queryDate = date || formatLocalDateISO(new Date())
  return useQuery({
    queryKey: attendanceKeys.stats(queryDate),
    queryFn: () => attendanceService.getAttendanceStats(queryDate),
    staleTime: CACHE_POLICIES.liveAttendance.staleTime,
    gcTime: CACHE_POLICIES.liveAttendance.gcTime,
    ...options,
  })
}

/**
 * Hook truy vấn danh sách điểm danh quản trị có phân trang và bộ lọc
 */
export function useAdminAttendanceQuery(
  params?: Partial<AttendanceQueryParams>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResult<AttendanceRecord>,
      Error,
      PaginatedResult<AttendanceRecord>,
      ReturnType<typeof attendanceKeys.history>
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: attendanceKeys.history(params as AttendanceQueryParams | undefined),
    queryFn: () => attendanceService.getAdminAttendance(params),
    staleTime: CACHE_POLICIES.historyAttendance.staleTime,
    gcTime: CACHE_POLICIES.historyAttendance.gcTime,
    ...options,
  })
}
