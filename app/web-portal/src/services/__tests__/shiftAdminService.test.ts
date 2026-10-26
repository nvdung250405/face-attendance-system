import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../apiClient'
import { shiftAdminService } from '../shiftAdminService'

describe('ShiftAdminService - Batch Assign Shifts (TASK-BE-042 / TASK-WEB-034)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. assignShiftBatch gọi POST /api/v1/admin/employee-shifts/batch với đúng payload và trả về kết quả tổng hợp', async () => {
    const mockBatchResponse = {
      total: 2,
      successCount: 1,
      failedCount: 1,
      failures: [
        {
          userId: 102,
          employeeCode: 'NV-102',
          fullName: 'Trần Văn Bình',
          reason: 'Nhân viên đã được phân ca trong khoảng thời gian này',
        },
      ],
      assignments: [
        {
          id: 501,
          userId: 101,
          employeeCode: 'NV-101',
          fullName: 'Nguyễn Văn Nam',
          shiftId: 1,
          shiftCode: 'CA_SANG',
          shiftName: 'Ca Sáng Hành Chính',
          effectiveFrom: '2026-03-01',
          effectiveTo: '2026-03-31',
          createdAt: '2026-03-01T08:00:00Z',
        },
      ],
    }

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        code: 'SHIFT_ASSIGN_BATCH_SUCCESS',
        message: 'Phân ca hàng loạt hoàn tất',
        data: mockBatchResponse,
      },
    })

    const onProgress = vi.fn()
    const employeeMap = new Map<number, string>([
      [101, 'Nguyễn Văn Nam'],
      [102, 'Trần Văn Bình'],
    ])

    const result = await shiftAdminService.assignShiftBatch(
      {
        employeeIds: [101, 102],
        shiftId: 1,
        effectiveStartDate: '2026-03-01',
        effectiveEndDate: '2026-03-31',
      },
      employeeMap,
      onProgress
    )

    expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/employee-shifts/batch', {
      userIds: [101, 102],
      shiftId: 1,
      effectiveFrom: '2026-03-01',
      effectiveTo: '2026-03-31',
    })

    expect(onProgress).toHaveBeenCalledWith(0, 2)
    expect(onProgress).toHaveBeenCalledWith(2, 2)

    expect(result.total).toBe(2)
    expect(result.successCount).toBe(1)
    expect(result.failedCount).toBe(1)
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]).toEqual({
      employeeId: 102,
      employeeName: 'Trần Văn Bình',
      reason: 'Nhân viên đã được phân ca trong khoảng thời gian này',
    })
    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0].id).toBe(501)
    expect(result.assignments[0].employeeCode).toBe('NV-101')
  })

  it('2. assignShiftBatch xử lý fallback employeeName từ employeeMap khi backend không trả về fullName', async () => {
    const mockBatchResponse = {
      total: 1,
      successCount: 0,
      failedCount: 1,
      failures: [
        {
          userId: 999,
          reason: 'Lỗi tài khoản',
        },
      ],
      assignments: [],
    }

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: mockBatchResponse,
      },
    })

    const employeeMap = new Map<number, string>([[999, 'Nhân viên Fallback']])

    const result = await shiftAdminService.assignShiftBatch(
      {
        employeeIds: [999],
        shiftId: 2,
        effectiveStartDate: '2026-04-01',
        effectiveEndDate: '2026-04-30',
      },
      employeeMap
    )

    expect(result.failedCount).toBe(1)
    expect(result.failures[0].employeeName).toBe('Nhân viên Fallback')
  })
})
