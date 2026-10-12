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

export class ShiftAdminService {
  /**
   * Lấy danh sách danh mục ca làm việc (GET /api/v1/admin/shifts)
   */
  async getShifts(criteria?: ShiftQueryCriteria): Promise<ShiftItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<ShiftItem[]>>(
        '/api/v1/admin/shifts',
        { params: criteria }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Tạo ca làm việc mới (POST /api/v1/admin/shifts)
   */
  async createShift(data: CreateShiftRequest): Promise<ShiftItem> {
    try {
      const response = await apiClient.post<ApiResponse<ShiftItem>>(
        '/api/v1/admin/shifts',
        data
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Cập nhật thông tin ca làm việc (PATCH /api/v1/admin/shifts/{id})
   */
  async updateShift(id: number, data: UpdateShiftRequest): Promise<ShiftItem> {
    try {
      const response = await apiClient.patch<ApiResponse<ShiftItem>>(
        `/api/v1/admin/shifts/${id}`,
        data
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Tra cứu lịch phân ca theo nhân viên và khoảng ngày (GET /api/v1/admin/employee-shifts)
   */
  async getEmployeeShifts(criteria?: EmployeeShiftQueryCriteria): Promise<EmployeeShiftAssignment[]> {
    try {
      const response = await apiClient.get<ApiResponse<EmployeeShiftAssignment[]>>(
        '/api/v1/admin/employee-shifts',
        { params: criteria }
      )
      return response.data.data
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
      const response = await apiClient.post<ApiResponse<EmployeeShiftAssignment>>(
        '/api/v1/admin/employee-shifts',
        data
      )
      return response.data.data
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
