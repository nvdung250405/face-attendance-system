/**
 * Dịch vụ Điểm danh & Thống kê Chấm công (API-WEB-004, DATA-WEB-004, SOL-WEB-004).
 * Cung cấp các API truy vấn lịch sử chấm công quản trị và thống kê KPI thời gian thực.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  PaginatedResult,
  AttendanceRecord,
  AttendanceQueryParams,
  AttendanceStats,
} from '@/types'

export class AttendanceService {
  /**
   * Tra cứu danh sách điểm danh quản trị toàn công ty (GET /api/v1/admin/attendance)
   */
  async getAdminAttendance(
    params?: Partial<AttendanceQueryParams>
  ): Promise<PaginatedResult<AttendanceRecord>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResult<AttendanceRecord>>>(
        '/api/v1/admin/attendance',
        { params }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Lấy thống kê KPI điểm danh trong ngày (GET /api/v1/admin/attendance/stats)
   */
  async getAttendanceStats(date?: string): Promise<AttendanceStats> {
    try {
      const response = await apiClient.get<ApiResponse<AttendanceStats>>(
        '/api/v1/admin/attendance/stats',
        { params: { date } }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const attendanceService = new AttendanceService()
