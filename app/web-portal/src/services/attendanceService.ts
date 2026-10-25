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
  PersonalAttendanceResponse,
  PersonalAttendanceDayRecord,
  AdjustAttendanceRequest,
} from '@/types'

/**
 * Làm sạch dữ liệu chống Formula Injection khi xuất file Excel/CSV (DD-WEB-017)
 * Tự động thêm dấu nháy đơn ' trước các ký tự nguy hiểm: =, +, -, @
 */
export function sanitizeFormulaValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`
  }
  return str
}

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

  /**
   * Điều chỉnh giờ công hoặc trạng thái điểm danh thủ công (PATCH /api/v1/admin/attendance/{id} - API-WEB-021)
   */
  async adjustAttendance(
    id: number,
    data: AdjustAttendanceRequest
  ): Promise<AttendanceRecord> {
    try {
      const response = await apiClient.patch<ApiResponse<AttendanceRecord>>(
        `/api/v1/admin/attendance/${id}`,
        data
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Tra cứu lịch sử chấm công cá nhân theo tháng (GET /api/v1/employee/attendance - API-WEB-005, ARC-018)
   */
  async getPersonalAttendance(params?: {
    month?: number
    year?: number
  }): Promise<PersonalAttendanceResponse> {
    try {
      const response = await apiClient.get<ApiResponse<PersonalAttendanceResponse>>(
        '/api/v1/employee/attendance',
        { params }
      )
      const data = response.data.data
      if (data && Array.isArray(data.records)) {
        return {
          ...data,
          records: data.records.map((r: any) => ({
            ...r,
            checkIn: r.checkIn || (r.checkInTime ? String(r.checkInTime) : null),
            checkOut: r.checkOut || (r.checkOutTime ? String(r.checkOutTime) : null),
            checkInLogId: r.checkInLogId ?? null,
            checkOutLogId: r.checkOutLogId ?? null,
          })),
        }
      }
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Tra cứu danh sách các lượt quẹt thẻ chi tiết của chính nhân viên (GET /api/v1/employee/attendance/logs)
   */
  async getPersonalAttendanceLogs(params?: {
    month?: number
    year?: number
    page?: number
    size?: number
  }): Promise<PaginatedResult<AttendanceRecord>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResult<AttendanceRecord>>>(
        '/api/v1/employee/attendance/logs',
        { params }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Xuất báo cáo bảng công cá nhân định dạng CSV có phòng chống Formula Injection (DD-WEB-017, BLD-WEB-008)
   */
  exportPersonalAttendanceCsv(
    month: number,
    year: number,
    records: PersonalAttendanceDayRecord[],
    employeeInfo: { fullName: string; employeeCode: string; department?: string }
  ): string {
    const headers = [
      'Ngày',
      'Thứ',
      'Giờ vào',
      'Giờ ra',
      'Trạng thái',
      'Số phút trễ',
      'Số giờ làm',
      'Mã ca',
      'Phương thức',
      'Trạm Kiosk',
    ]

    const statusLabels: Record<string, string> = {
      ON_TIME: 'Đúng giờ',
      LATE: 'Đi muộn',
      EARLY_LEAVE: 'Về sớm',
      ABSENT: 'Vắng mặt',
      REST_DAY: 'Nghỉ tuần',
      HOLIDAY: 'Nghỉ lễ',
      EXCUSE_PENDING: 'Chờ duyệt giải trình',
    }

    const rows = records.map((r) => [
      sanitizeFormulaValue(r.date),
      sanitizeFormulaValue(r.dayOfWeek || ''),
      sanitizeFormulaValue(r.checkIn || '--:--'),
      sanitizeFormulaValue(r.checkOut || '--:--'),
      sanitizeFormulaValue(statusLabels[r.status] || r.status),
      sanitizeFormulaValue(r.lateMinutes ? `${r.lateMinutes} phút` : '0'),
      sanitizeFormulaValue(r.workingHours != null ? `${r.workingHours}h` : ''),
      sanitizeFormulaValue(r.shiftCode || 'CA_HANH_CHINH'),
      sanitizeFormulaValue(
        r.verificationMethod === 'VERIFICATION_PIN' ? 'Mã PIN' : 'Khuôn mặt'
      ),
      sanitizeFormulaValue(r.kioskId || ''),
    ])

    const escapeCell = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const metaLines = [
      `BẢNG CHẤM CÔNG CÁ NHÂN THÁNG ${month}/${year}`,
      `Nhân viên: ${sanitizeFormulaValue(employeeInfo.fullName)} (${sanitizeFormulaValue(employeeInfo.employeeCode)})`,
      `Phòng ban: ${sanitizeFormulaValue(employeeInfo.department || 'Chung')}`,
      `Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}`,
      '',
    ]

    const csvContent =
      '\uFEFF' + // UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn
      metaLines.join('\n') +
      headers.map(escapeCell).join(',') +
      '\n' +
      rows.map((row) => row.map(escapeCell).join(',')).join('\n')

    if (typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const filename = `bang-cong-${employeeInfo.employeeCode}-${year}-${String(month).padStart(2, '0')}.csv`
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }

    return csvContent
  }
}

export const attendanceService = new AttendanceService()
