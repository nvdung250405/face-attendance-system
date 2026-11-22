import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../apiClient'
import { excuseService } from '../excuseService'

describe('ExcuseService (API-BE-026, API-BE-027, API-BE-028, API-BE-029)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. submitExcuseRequest gọi POST /api/v1/employee/excuse-requests đúng payload', async () => {
    const mockCreated = {
      id: 101,
      userId: 1042,
      employeeCode: 'NV-1042',
      fullName: 'Ngô Văn Dũng',
      attendanceLogId: 98231,
      originalPunchTimestamp: '2026-10-18T08:35:00Z',
      requestedPunchTimestamp: '2026-10-18T08:00:00Z',
      reason: 'Sự cố kẹt xe tuyến đường Nguyễn Trãi',
      status: 'PENDING',
      decidedById: null,
      decidedByName: null,
      decidedAt: null,
      rejectionReason: null,
      createdAt: '2026-10-18T09:00:00Z',
      updatedAt: '2026-10-18T09:00:00Z',
    }

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        code: 'EXCUSE_REQUEST_SUBMITTED',
        message: 'Nộp đơn giải trình công thành công',
        data: mockCreated,
      },
    })

    const payload = {
      attendanceLogId: 98231,
      reason: 'Sự cố kẹt xe tuyến đường Nguyễn Trãi',
      requestedPunchTimestamp: '2026-10-18T08:00:00Z',
    }

    const res = await excuseService.submitExcuseRequest(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/employee/excuse-requests', payload)
    expect(res.id).toBe(101)
    expect(res.status).toBe('PENDING')
  })

  it('2. getMyExcuseRequests gọi GET /api/v1/employee/excuse-requests kèm phân trang', async () => {
    const mockPage = {
      content: [
        {
          id: 101,
          userId: 1042,
          employeeCode: 'NV-1042',
          fullName: 'Ngô Văn Dũng',
          attendanceLogId: 98231,
          originalPunchTimestamp: '2026-10-18T08:35:00Z',
          requestedPunchTimestamp: '2026-10-18T08:00:00Z',
          reason: 'Kẹt xe',
          status: 'PENDING',
          decidedById: null,
          decidedByName: null,
          decidedAt: null,
          rejectionReason: null,
          createdAt: '2026-10-18T09:00:00Z',
          updatedAt: '2026-10-18T09:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      page: 0,
      first: true,
      last: true,
    }

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        code: 'EMPLOYEE_EXCUSES_FETCHED',
        data: mockPage,
      },
    })

    const res = await excuseService.getMyExcuseRequests({ page: 0, size: 20 })
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/employee/excuse-requests', {
      params: { page: 0, size: 20 },
    })
    expect(res.content.length).toBe(1)
  })

  it('3. getAdminExcuseRequests gọi GET /api/v1/admin/excuse-requests kèm bộ lọc status', async () => {
    const mockPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      page: 0,
      first: true,
      last: true,
    }

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        code: 'EXCUSE_REQUEST_LIST_FETCHED',
        data: mockPage,
      },
    })

    const res = await excuseService.getAdminExcuseRequests({ status: 'PENDING', page: 0, size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/excuse-requests', {
      params: { status: 'PENDING', page: 0, size: 10 },
    })
    expect(res.content).toEqual([])
  })

  it('4. decideExcuseRequest gọi PATCH /api/v1/admin/excuse-requests/{id} với APPROVED', async () => {
    const mockApproved = {
      id: 101,
      status: 'APPROVED',
      decidedByName: 'HR Manager',
      decidedAt: '2026-10-18T10:00:00Z',
    }

    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        success: true,
        code: 'EXCUSE_REQUEST_APPROVED',
        data: mockApproved,
      },
    })

    const res = await excuseService.decideExcuseRequest(101, {
      status: 'APPROVED',
      reviewNote: 'Duyệt điều chỉnh',
    })

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/admin/excuse-requests/101', {
      status: 'APPROVED',
      reviewNote: 'Duyệt điều chỉnh',
    })
    expect(res.status).toBe('APPROVED')
  })

  it('5. approveExcuseRequest gọi POST /api/v1/admin/excuse-requests/{id}/approve', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        code: 'EXCUSE_REQUEST_APPROVED',
        data: { id: 101, status: 'APPROVED' },
      },
    })

    const res = await excuseService.approveExcuseRequest(101, 'Đồng ý duyệt')
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/admin/excuse-requests/101/approve', {
      reviewNote: 'Đồng ý duyệt',
    })
    expect(res.status).toBe('APPROVED')
  })

  it('6. rejectExcuseRequest gọi POST /api/v1/admin/excuse-requests/{id}/reject', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        code: 'EXCUSE_REQUEST_REJECTED',
        data: { id: 101, status: 'REJECTED', rejectionReason: 'Không có minh chứng' },
      },
    })

    const res = await excuseService.rejectExcuseRequest(101, 'Không có minh chứng')
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/admin/excuse-requests/101/reject', {
      rejectionReason: 'Không có minh chứng',
    })
    expect(res.status).toBe('REJECTED')
  })
})
