/**
 * Dịch vụ Quyền Chủ thể Dữ liệu & Rút Consent (DataSubjectService - APD-WEB-008, API-WEB-014, DD-WEB-015).
 *
 * Cho phép nhân viên rút Informed Consent (nhận hạn tiêu hủy dữ liệu sinh trắc 7 ngày),
 * gửi yêu cầu về dữ liệu cá nhân, và cho phép vai trò DPO tra cứu/xử lý yêu cầu.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  WithdrawConsentRequest,
  WithdrawConsentResponse,
  DataSubjectRequestItem,
  CreateDataSubjectRequest,
  UpdateDataSubjectRequest,
} from '@/types'

export class DataSubjectService {
  /**
   * Nhân viên rút lại cam kết Informed Consent (POST /api/v1/employee/consent/withdraw)
   * Trả về thời điểm hiệu lực và hạn tiêu hủy dữ liệu sinh trắc (7 ngày).
   */
  async withdrawConsent(request?: WithdrawConsentRequest): Promise<WithdrawConsentResponse> {
    try {
      const response = await apiClient.post<ApiResponse<WithdrawConsentResponse>>(
        '/api/v1/employee/consent/withdraw',
        request || {}
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Nhân viên gửi yêu cầu về dữ liệu cá nhân (POST /api/v1/employee/data-requests)
   */
  async createEmployeeDataRequest(request: CreateDataSubjectRequest): Promise<DataSubjectRequestItem> {
    try {
      const response = await apiClient.post<ApiResponse<DataSubjectRequestItem>>(
        '/api/v1/employee/data-requests',
        request
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Nhân viên tra cứu các yêu cầu dữ liệu của chính mình (GET /api/v1/employee/data-requests)
   */
  async getEmployeeDataRequests(): Promise<DataSubjectRequestItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<DataSubjectRequestItem[]>>(
        '/api/v1/employee/data-requests'
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * DPO tra cứu toàn bộ danh sách yêu cầu dữ liệu cá nhân (GET /api/v1/dpo/data-requests)
   */
  async getDpoDataRequests(): Promise<DataSubjectRequestItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<DataSubjectRequestItem[]>>(
        '/api/v1/dpo/data-requests'
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * DPO cập nhật trạng thái xử lý yêu cầu dữ liệu (PATCH /api/v1/dpo/data-requests/{id})
   */
  async updateDataRequestStatus(
    id: number,
    data: UpdateDataSubjectRequest
  ): Promise<DataSubjectRequestItem> {
    try {
      const response = await apiClient.patch<ApiResponse<DataSubjectRequestItem>>(
        `/api/v1/dpo/data-requests/${id}`,
        data
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const dataSubjectService = new DataSubjectService()
