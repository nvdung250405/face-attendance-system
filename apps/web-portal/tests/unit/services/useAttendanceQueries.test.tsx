/**
 * Unit Tests cho useAttendanceQueries (F-TECH-01)
 */

import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'
import { useAttendanceStatsQuery, useAdminAttendanceQuery } from '@/services/hooks/useAttendanceQueries'
import { attendanceService } from '@/services/attendanceService'
import type { AttendanceStats, PaginatedResult, AttendanceRecord } from '@/types'

describe('useAttendanceQueries (F-TECH-01)', () => {
  let queryClient = createQueryClient()

  beforeEach(() => {
    queryClient = createQueryClient()
    vi.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('useAttendanceStatsQuery gọi attendanceService.getAttendanceStats và trả về data', async () => {
    const mockStats: AttendanceStats = {
      totalEmployees: 100,
      presentCount: 80,
      onTimeCount: 75,
      lateCount: 5,
      absentCount: 20,
    }
    vi.spyOn(attendanceService, 'getAttendanceStats').mockResolvedValue(mockStats)

    const { result } = renderHook(() => useAttendanceStatsQuery('2026-10-14'), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockStats)
    expect(attendanceService.getAttendanceStats).toHaveBeenCalledWith('2026-10-14')
  })

  it('useAdminAttendanceQuery gọi attendanceService.getAdminAttendance với params', async () => {
    const mockData: PaginatedResult<AttendanceRecord> = {
      content: [{ recordId: 1, fullName: 'Test User' } as AttendanceRecord],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 10,
      first: true,
      last: true,
    }
    vi.spyOn(attendanceService, 'getAdminAttendance').mockResolvedValue(mockData)

    const { result } = renderHook(() => useAdminAttendanceQuery({ page: 0, size: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData)
    expect(attendanceService.getAdminAttendance).toHaveBeenCalledWith({ page: 0, size: 10 })
  })
})
