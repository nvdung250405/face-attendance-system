/**
 * Dịch vụ Quản lý Ca & Phân ca Nhân sự Phía Quản trị (ShiftAdminService - APD-WEB-005, API-WEB-011, DD-WEB-001).
 *
 * Quản lý danh mục ca và lịch phân ca theo khoảng ngày hiệu lực.
 * Chuẩn hóa lỗi 409 chồng lấn ca và gợi ý khoảng trống thời gian hợp lệ cho UI.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  ShiftItem,
  CreateShiftRequest,
  UpdateShiftRequest,
  EmployeeShiftAssignment,
  AssignShiftRequest,
  BatchAssignShiftRequest,
  BatchAssignResult,
} from '@/types'

export interface ShiftQueryCriteria {
  activeOnly?: boolean
}

export interface EmployeeShiftQueryCriteria {
  employeeId?: number
  shiftId?: number
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
}

interface BackendShiftResponse {
  id: number
  shiftCode: string
  shiftName?: string
  name?: string
  startTime: string
  endTime: string
  gracePeriodMinutes?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

interface BackendEmployeeShiftResponse {
  id: number
  userId?: number
  employeeId?: number
  employeeCode?: string
  fullName?: string
  shiftId: number
  shiftCode?: string
  shiftName?: string
  effectiveFrom?: string
  effectiveTo?: string | null
  effectiveStartDate?: string
  effectiveEndDate?: string | null
  createdAt?: string
}

interface BackendBatchFailure {
  userId: number
  employeeCode?: string
  fullName?: string
  reason: string
}

interface BackendBatchAssignResponse {
  total: number
  successCount: number
  failedCount: number
  failures: BackendBatchFailure[]
  assignments: BackendEmployeeShiftResponse[]
}

export class ShiftAdminService {
  private mapShiftResponse(s: BackendShiftResponse): ShiftItem {
    const rawStart = s.startTime || ''
    const rawEnd = s.endTime || ''
    const startTime = typeof rawStart === 'string' && rawStart.length > 5 ? rawStart.substring(0, 5) : rawStart
    const endTime = typeof rawEnd === 'string' && rawEnd.length > 5 ? rawEnd.substring(0, 5) : rawEnd
    const shiftName = s.shiftName || s.name || ''

    return {
      id: s.id,
      shiftCode: s.shiftCode,
      name: shiftName,
      shiftName,
      startTime,
      endTime,
      gracePeriodMinutes: s.gracePeriodMinutes ?? 0,
      isActive: Boolean(s.isActive),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }
  }

  private mapEmployeeShiftResponse(item: BackendEmployeeShiftResponse): EmployeeShiftAssignment {
    const userId = item.userId ?? item.employeeId ?? 0
    const start = item.effectiveFrom ?? item.effectiveStartDate ?? ''
    const end = item.effectiveTo ?? item.effectiveEndDate ?? ''

    return {
      id: item.id,
      employeeId: userId,
      userId,
      employeeCode: item.employeeCode || '',
      fullName: item.fullName || '',
      shiftId: item.shiftId,
      shiftCode: item.shiftCode || '',
      shiftName: item.shiftName || '',
      effectiveStartDate: start,
      effectiveEndDate: end,
      effectiveFrom: start,
      effectiveTo: end,
      createdAt: item.createdAt,
    }
  }

  /**
   * Lấy danh sách danh mục ca làm việc (GET /api/v1/admin/shifts)
   */
  async getShifts(criteria?: ShiftQueryCriteria): Promise<ShiftItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<BackendShiftResponse[]>>(
        '/api/v1/admin/shifts',
        { params: criteria }
      )
      return (response.data.data || []).map((s) => this.mapShiftResponse(s))
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Tạo ca làm việc mới (POST /api/v1/admin/shifts)
   */
  async createShift(data: CreateShiftRequest): Promise<ShiftItem> {
    try {
      const startTime = data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime
      const endTime = data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime
      const shiftName = data.name || data.shiftName || ''

      const payload = {
        shiftCode: data.shiftCode,
        shiftName,
        startTime,
        endTime,
        gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
      }

      const response = await apiClient.post<ApiResponse<BackendShiftResponse>>(
        '/api/v1/admin/shifts',
        payload
      )
      return this.mapShiftResponse(response.data.data)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Cập nhật thông tin ca làm việc (PATCH /api/v1/admin/shifts/{id})
   */
  async updateShift(id: number, data: UpdateShiftRequest): Promise<ShiftItem> {
    try {
      // Trường hợp chỉ kích hoạt hoặc tạm dừng ca (không truyền lại thông tin giờ)
      if (
        data.isActive !== undefined &&
        !data.name &&
        !data.shiftName &&
        !data.startTime &&
        !data.endTime
      ) {
        if (data.isActive) {
          await this.activateShift(id)
        } else {
          await this.deactivateShift(id)
        }
        return {
          id,
          shiftCode: '',
          name: '',
          shiftName: '',
          startTime: '',
          endTime: '',
          gracePeriodMinutes: 0,
          isActive: data.isActive,
        }
      }

      const payload: Record<string, unknown> = {
        shiftName: data.name || data.shiftName,
        startTime: data.startTime && data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime,
        endTime: data.endTime && data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime,
        gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
      }
      if (data.isActive !== undefined) {
        payload.isActive = data.isActive
      }

      const response = await apiClient.patch<ApiResponse<BackendShiftResponse>>(
        `/api/v1/admin/shifts/${id}`,
        payload
      )
      return this.mapShiftResponse(response.data.data)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Kích hoạt ca làm việc (POST /api/v1/admin/shifts/{id}/activate)
   */
  async activateShift(id: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/admin/shifts/${id}/activate`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Vô hiệu hóa ca làm việc (POST /api/v1/admin/shifts/{id}/deactivate)
   */
  async deactivateShift(id: number): Promise<void> {
    try {
      await apiClient.post(`/api/v1/admin/shifts/${id}/deactivate`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Tra cứu lịch phân ca theo nhân viên và khoảng ngày (GET /api/v1/admin/employee-shifts)
   */
  async getEmployeeShifts(criteria?: EmployeeShiftQueryCriteria): Promise<EmployeeShiftAssignment[]> {
    try {
      const params: Record<string, string | number> = {}
      if (criteria?.employeeId) params.userId = criteria.employeeId
      if (criteria?.shiftId) params.shiftId = criteria.shiftId
      if (criteria?.startDate) params.fromDate = criteria.startDate
      if (criteria?.endDate) params.toDate = criteria.endDate

      const response = await apiClient.get<ApiResponse<BackendEmployeeShiftResponse[]>>(
        '/api/v1/admin/employee-shifts',
        { params }
      )
      return (response.data.data || []).map((item) => this.mapEmployeeShiftResponse(item))
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Phân ca cho nhân sự theo khoảng ngày hiệu lực (POST /api/v1/admin/employee-shifts)
   * Khi chồng lấn khoảng ngày, bắt lỗi 409 và bóc tách overlapConflict gợi ý khoảng trống.
   */
  async assignShift(data: AssignShiftRequest): Promise<EmployeeShiftAssignment> {
    try {
      const payload = {
        userId: data.employeeId ?? data.userId,
        shiftId: data.shiftId,
        effectiveFrom: data.effectiveStartDate ?? data.effectiveFrom,
        effectiveTo: data.effectiveEndDate || data.effectiveTo || null,
      }

      const response = await apiClient.post<ApiResponse<BackendEmployeeShiftResponse>>(
        '/api/v1/admin/employee-shifts',
        payload
      )
      return this.mapEmployeeShiftResponse(response.data.data)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Phân ca hàng loạt cho nhiều nhân sự (Batch Assignment)
   * Hỗ trợ cập nhật tiến trình phân ca và tổng hợp báo cáo thành công / thất bại.
   */
  async assignShiftBatch(
    data: BatchAssignShiftRequest,
    employeeMap?: Map<number, string>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchAssignResult> {
    try {
      const payload = {
        userIds: data.employeeIds,
        shiftId: data.shiftId,
        effectiveFrom: data.effectiveStartDate,
        effectiveTo: data.effectiveEndDate || null,
      }

      onProgress?.(0, data.employeeIds.length)

      const response = await apiClient.post<ApiResponse<BackendBatchAssignResponse>>(
        '/api/v1/admin/employee-shifts/batch',
        payload
      )

      const result = response.data.data
      onProgress?.(result.total, result.total)

      const failures = (result.failures || []).map((f) => ({
        employeeId: f.userId,
        employeeName: f.fullName || employeeMap?.get(f.userId) || `ID #${f.userId}`,
        reason: f.reason,
      }))

      const assignments = (result.assignments || []).map((item) =>
        this.mapEmployeeShiftResponse(item)
      )

      return {
        total: result.total,
        successCount: result.successCount,
        failedCount: result.failedCount,
        failures,
        assignments,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Gỡ phân ca của nhân sự (DELETE /api/v1/admin/employee-shifts/{id})
   */
  async removeShiftAssignment(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/employee-shifts/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const shiftAdminService = new ShiftAdminService()
