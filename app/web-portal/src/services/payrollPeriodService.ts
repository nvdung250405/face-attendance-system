/**
 * Dịch vụ Quản lý Kỳ công & Khóa Kỳ Phía Quản trị (PayrollPeriodService - APD-WEB-007, API-WEB-013, DD-WEB-006).
 *
 * Tra cứu danh sách kỳ công, thực hiện chốt kỳ (LOCKED) và mở lại kỳ (OPEN kèm lý do).
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  PayrollPeriodResponse,
  UnlockPeriodRequest,
} from '@/types'

export interface PayrollPeriodQueryCriteria {
  year?: number
}

export class PayrollPeriodService {
  /**
   * Lấy danh sách kỳ công theo năm (GET /api/v1/admin/payroll-periods)
   */
  async getPayrollPeriods(criteria?: PayrollPeriodQueryCriteria): Promise<PayrollPeriodResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>(
        '/api/v1/admin/payroll-periods',
        { params: criteria }
      )
      const raw = response.data.data
      if (Array.isArray(raw)) return raw as PayrollPeriodResponse[]
      if (raw && typeof raw === 'object' && 'content' in raw && Array.isArray((raw as { content: unknown }).content)) {
        return (raw as { content: PayrollPeriodResponse[] }).content
      }
      return []
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Chốt kỳ công (POST /api/v1/admin/payroll-periods/{period}/lock)
   * Chuyển trạng thái sang LOCKED, vô hiệu hóa các nút duyệt đơn/điều chỉnh trên toàn giao diện.
   */
  async lockPeriod(period: string): Promise<PayrollPeriodResponse> {
    try {
      const response = await apiClient.post<ApiResponse<PayrollPeriodResponse>>(
        `/api/v1/admin/payroll-periods/${period}/lock`
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Mở lại kỳ công (POST /api/v1/admin/payroll-periods/{period}/unlock)
   * Yêu cầu role ADMIN và bắt buộc có lý do mở khóa; ghi log kiểm toán.
   */
  async unlockPeriod(period: string, request: UnlockPeriodRequest): Promise<PayrollPeriodResponse> {
    try {
      const response = await apiClient.post<ApiResponse<PayrollPeriodResponse>>(
        `/api/v1/admin/payroll-periods/${period}/unlock`,
        request
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const payrollPeriodService = new PayrollPeriodService()
