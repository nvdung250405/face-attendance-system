/**
 * Unit Tests cho TanStack Query Client & Cache Factory
 * (DATA-WEB-004, DD-WEB-006, DD-WEB-007, BLD-WEB-003, TASK-WEB-007).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createQueryClient,
  queryClient,
  CACHE_POLICIES,
  attendanceKeys,
  employeeKeys,
  notificationKeys,
  payrollKeys,
  kioskKeys,
  handleLiveAttendanceEvent,
} from '../queryClient'
import type { AttendanceRecord, AttendanceStats } from '@/types'

describe('TanStack Query & Cache Factory (TASK-WEB-007)', () => {
  beforeEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  describe('1. Cấu hình Cache Policies (DD-WEB-006)', () => {
    it('đáp ứng đúng thông số staleTime và gcTime cho từng nhóm truy vấn', () => {
      expect(CACHE_POLICIES.liveAttendance.staleTime).toBe(0)
      expect(CACHE_POLICIES.liveAttendance.gcTime).toBe(5 * 60 * 1000)

      expect(CACHE_POLICIES.historyAttendance.staleTime).toBe(60 * 1000)
      expect(CACHE_POLICIES.historyAttendance.gcTime).toBe(10 * 60 * 1000)

      expect(CACHE_POLICIES.personalAttendance.staleTime).toBe(120 * 1000)
      expect(CACHE_POLICIES.personalAttendance.gcTime).toBe(15 * 60 * 1000)

      expect(CACHE_POLICIES.employees.staleTime).toBe(300 * 1000)
      expect(CACHE_POLICIES.employees.gcTime).toBe(30 * 60 * 1000)

      expect(CACHE_POLICIES.notifications.staleTime).toBe(30 * 1000)
      expect(CACHE_POLICIES.notifications.gcTime).toBe(10 * 60 * 1000)
    })
  })

  describe('2. Query Keys Factory (DD-WEB-006)', () => {
    it('attendanceKeys tạo mảng khóa phân cấp chính xác', () => {
      expect(attendanceKeys.all).toEqual(['attendance'])
      expect(attendanceKeys.live()).toEqual(['attendance', 'live'])
      expect(attendanceKeys.stats('2026-10-12')).toEqual(['attendance', 'stats', '2026-10-12'])
      expect(attendanceKeys.personal(10, 2026)).toEqual([
        'attendance',
        'personal',
        { month: 10, year: 2026 },
      ])

      const queryParams = { page: 1, size: 20, department: 'IT' }
      expect(attendanceKeys.history(queryParams)).toEqual(['attendance', 'history', queryParams])
      expect(attendanceKeys.history()).toEqual(['attendance', 'history'])
    })

    it('employeeKeys tạo mảng khóa phân cấp chính xác', () => {
      expect(employeeKeys.all).toEqual(['employees'])
      expect(employeeKeys.list()).toEqual(['employees', 'list'])
      expect(employeeKeys.list({ role: 'EMPLOYEE' })).toEqual([
        'employees',
        'list',
        { role: 'EMPLOYEE' },
      ])
      expect(employeeKeys.detail(1042)).toEqual(['employees', 'detail', 1042])
    })

    it('notificationKeys tạo mảng khóa phân cấp chính xác', () => {
      expect(notificationKeys.all).toEqual(['notifications'])
      expect(notificationKeys.unreadCount()).toEqual(['notifications', 'unread-count'])
      expect(notificationKeys.list()).toEqual(['notifications', 'list'])
    })

    it('payrollKeys và kioskKeys tạo mảng khóa phân cấp chính xác', () => {
      expect(payrollKeys.all).toEqual(['payroll'])
      expect(payrollKeys.periods()).toEqual(['payroll', 'periods'])
      expect(payrollKeys.current()).toEqual(['payroll', 'current'])

      expect(kioskKeys.all).toEqual(['kiosks'])
      expect(kioskKeys.list()).toEqual(['kiosks', 'list'])
      expect(kioskKeys.detail('KSK-01')).toEqual(['kiosks', 'detail', 'KSK-01'])
    })
  })

  describe('3. QueryClient Factory & Singleton', () => {
    it('createQueryClient khởi tạo instance với defaultOptions chuẩn', () => {
      const qc = createQueryClient()
      const defaults = qc.getDefaultOptions()

      expect(defaults.queries?.staleTime).toBe(60 * 1000)
      expect(defaults.queries?.gcTime).toBe(10 * 60 * 1000)
      expect(defaults.queries?.retry).toBe(1)
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
    })

    it('queryClient singleton hoạt động đồng nhất', () => {
      expect(queryClient).toBeDefined()
      expect(queryClient.getDefaultOptions().queries?.retry).toBe(1)
    })
  })

  describe('4. Cập nhật Thời gian thực từ STOMP (DD-WEB-007, DATA-WEB-004)', () => {
    const mockRecord1: AttendanceRecord = {
      recordId: 101,
      employeeId: 1042,
      employeeCode: 'NV-1042',
      fullName: 'Ngô Văn Dũng',
      department: 'Phòng Kỹ thuật',
      punchTimestamp: '2026-10-12T08:00:00+07:00',
      punchType: 'CHECK_IN',
      verificationMethod: 'VERIFICATION_FACE',
      status: 'ON_TIME',
      lateMinutes: 0,
      kioskId: 'KSK-01',
    }

    const mockRecord2: AttendanceRecord = {
      recordId: 102,
      employeeId: 1043,
      employeeCode: 'NV-1043',
      fullName: 'Trần Thị Mai',
      department: 'Phòng Kế toán',
      punchTimestamp: '2026-10-12T08:15:00+07:00',
      punchType: 'CHECK_IN',
      verificationMethod: 'VERIFICATION_FACE',
      status: 'LATE',
      lateMinutes: 15,
      kioskId: 'KSK-01',
    }

    it('chèn bản ghi mới lên đầu Live Table cache khi nhận STOMP event', () => {
      const qc = createQueryClient()

      handleLiveAttendanceEvent(mockRecord1, qc, '2026-10-12')

      const liveData = qc.getQueryData<AttendanceRecord[]>(attendanceKeys.live())
      expect(liveData).toHaveLength(1)
      expect(liveData?.[0].recordId).toBe(101)

      handleLiveAttendanceEvent(mockRecord2, qc, '2026-10-12')

      const updatedLiveData = qc.getQueryData<AttendanceRecord[]>(attendanceKeys.live())
      expect(updatedLiveData).toHaveLength(2)
      expect(updatedLiveData?.[0].recordId).toBe(102) // Chèn lên đầu (Prepend)
      expect(updatedLiveData?.[1].recordId).toBe(101)
    })

    it('giới hạn tối đa 50 bản ghi trong Live Table cache (chống quá tải bộ nhớ)', () => {
      const qc = createQueryClient()

      // Khởi tạo trước 50 bản ghi giả định
      const existingRecords: AttendanceRecord[] = Array.from({ length: 50 }, (_, i) => ({
        ...mockRecord1,
        recordId: 1000 + i,
      }))
      qc.setQueryData(attendanceKeys.live(), existingRecords)

      // Chèn bản ghi mới
      handleLiveAttendanceEvent(mockRecord2, qc, '2026-10-12')

      const liveData = qc.getQueryData<AttendanceRecord[]>(attendanceKeys.live())
      expect(liveData).toHaveLength(50)
      expect(liveData?.[0].recordId).toBe(102) // Bản ghi mới nhất ở đầu
      expect(liveData?.[49].recordId).toBe(1048) // Bản ghi thứ 50 bị đẩy ra khỏi mảng
    })

    it('tăng chính xác bộ đếm KPI stats khi có sự kiện chấm công ON_TIME', () => {
      const qc = createQueryClient()
      const initialStats: AttendanceStats = {
        presentCount: 20,
        onTimeCount: 18,
        lateCount: 2,
      }
      qc.setQueryData(attendanceKeys.stats('2026-10-12'), initialStats)

      handleLiveAttendanceEvent(mockRecord1, qc, '2026-10-12')

      const updatedStats = qc.getQueryData<AttendanceStats>(attendanceKeys.stats('2026-10-12'))
      expect(updatedStats?.presentCount).toBe(21)
      expect(updatedStats?.onTimeCount).toBe(19)
      expect(updatedStats?.lateCount).toBe(2)
    })

    it('tăng chính xác bộ đếm KPI stats khi có sự kiện chấm công LATE', () => {
      const qc = createQueryClient()
      const initialStats: AttendanceStats = {
        presentCount: 20,
        onTimeCount: 18,
        lateCount: 2,
      }
      qc.setQueryData(attendanceKeys.stats('2026-10-12'), initialStats)

      handleLiveAttendanceEvent(mockRecord2, qc, '2026-10-12')

      const updatedStats = qc.getQueryData<AttendanceStats>(attendanceKeys.stats('2026-10-12'))
      expect(updatedStats?.presentCount).toBe(21)
      expect(updatedStats?.onTimeCount).toBe(18)
      expect(updatedStats?.lateCount).toBe(3)
    })

    it('đánh dấu invalidate truy vấn lịch sử attendance', () => {
      const qc = createQueryClient()
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

      handleLiveAttendanceEvent(mockRecord1, qc, '2026-10-12')

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: attendanceKeys.all })
    })
  })
})
