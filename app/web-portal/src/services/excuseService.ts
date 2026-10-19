/**
 * Dịch vụ Tiêu thụ REST API Đơn Giải trình Công phía Nhân viên và Quản trị
 * (FR-BE-014, FR-BE-015, API-BE-026, API-BE-027, API-BE-028, API-BE-029, APD-BE-015, APD-BE-016).
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  PageResponse,
  ExcuseRequestItem,
  SubmitExcuseRequestPayload,
  DecideExcuseRequestPayload,
  ExcuseQueryParams,
} from '@/types'

export class ExcuseService {
  /**
   * Nhân viên nộp đơn giải trình công cho một lượt điểm danh (POST /api/v1/employee/excuse-requests - API-BE-026)
   */
  async submitExcuseRequest(payload: SubmitExcuseRequestPayload): Promise<ExcuseRequestItem> {
    try {
      const response = await apiClient.post<ApiResponse<ExcuseRequestItem>>(
        '/api/v1/employee/excuse-requests',
        payload
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Nhân viên tra cứu danh sách đơn giải trình của chính mình (GET /api/v1/employee/excuse-requests - API-BE-027)
   */
  async getMyExcuseRequests(params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<ExcuseRequestItem>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<ExcuseRequestItem>>>(
        '/api/v1/employee/excuse-requests',
        { params }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Quản trị viên / HR tra cứu danh sách đơn giải trình cần xử lý (GET /api/v1/admin/excuse-requests - API-BE-028)
   */
  async getAdminExcuseRequests(
    params?: ExcuseQueryParams
  ): Promise<PageResponse<ExcuseRequestItem>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<ExcuseRequestItem>>>(
        '/api/v1/admin/excuse-requests',
        { params }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Xem chi tiết một đơn giải trình công (GET /api/v1/admin/excuse-requests/{id})
   */
  async getExcuseRequestById(id: number): Promise<ExcuseRequestItem> {
    try {
      const response = await apiClient.get<ApiResponse<ExcuseRequestItem>>(
        `/api/v1/admin/excuse-requests/${id}`
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * HR / Admin ra quyết định duyệt hoặc từ chối đơn giải trình (PATCH /api/v1/admin/excuse-requests/{id} - API-BE-029)
   */
  async decideExcuseRequest(
    id: number,
    payload: DecideExcuseRequestPayload
  ): Promise<ExcuseRequestItem> {
    try {
      const response = await apiClient.patch<ApiResponse<ExcuseRequestItem>>(
        `/api/v1/admin/excuse-requests/${id}`,
        payload
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Phê duyệt đơn giải trình công (POST /api/v1/admin/excuse-requests/{id}/approve)
   */
  async approveExcuseRequest(id: number, reviewNote?: string): Promise<ExcuseRequestItem> {
    try {
      const response = await apiClient.post<ApiResponse<ExcuseRequestItem>>(
        `/api/v1/admin/excuse-requests/${id}/approve`,
        { reviewNote }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Từ chối đơn giải trình công (POST /api/v1/admin/excuse-requests/{id}/reject)
   */
  async rejectExcuseRequest(id: number, rejectionReason: string): Promise<ExcuseRequestItem> {
    try {
      const response = await apiClient.post<ApiResponse<ExcuseRequestItem>>(
        `/api/v1/admin/excuse-requests/${id}/reject`,
        { rejectionReason }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const excuseService = new ExcuseService()
