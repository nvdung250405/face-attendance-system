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
  PaginatedResult,
  WithdrawConsentRequest,
  WithdrawConsentResponse,
  DataSubjectRequestItem,
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  CreateDataSubjectRequest,
  UpdateDataSubjectRequest,
} from '@/types'

export function adaptDataSubjectRequest(raw: unknown): DataSubjectRequestItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      requestType: 'ACCESS',
      status: 'RECEIVED',
    }
  }

  const item = raw as Record<string, unknown>
  const detail = String(item.detail ?? item.details ?? item.reason ?? '')
  const response = item.response ? String(item.response) : (item.adminNote ? String(item.adminNote) : (item.responseSummary ? String(item.responseSummary) : undefined))
  const handledBy = item.handledByName ? String(item.handledByName) : (item.handledBy ? String(item.handledBy) : undefined)

  return {
    id: Number(item.id ?? 0),
    employeeId: item.userId ? Number(item.userId) : (item.employeeId ? Number(item.employeeId) : undefined),
    employeeCode: item.employeeCode ? String(item.employeeCode) : undefined,
    fullName: item.fullName ? String(item.fullName) : undefined,
    requestType: (item.requestType as DataSubjectRequestType) || 'ACCESS',
    detail,
    details: detail,
    reason: detail,
    status: (item.status as DataSubjectRequestStatus) || 'RECEIVED',
    submittedAt: item.createdAt ? String(item.createdAt) : (item.submittedAt ? String(item.submittedAt) : undefined),
    createdAt: item.createdAt ? String(item.createdAt) : undefined,
    requestedAt: item.createdAt ? String(item.createdAt) : undefined,
    handledAt: item.respondedAt ? String(item.respondedAt) : (item.handledAt ? String(item.handledAt) : undefined),
    completedAt: item.respondedAt ? String(item.respondedAt) : (item.completedAt ? String(item.completedAt) : undefined),
    handledBy,
    handledByName: handledBy,
    adminNote: response,
    response,
    responseSummary: response,
  }
}

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
   * Tra cứu lượt rút cam kết gần nhất của nhân viên (GET /api/v1/employee/consent/withdrawal)
   * Phục vụ theo dõi tiến trình tiêu hủy sinh trắc 20 ngày theo Nghị định 356/2025/NĐ-CP.
   */
  async getLatestWithdrawal(): Promise<WithdrawConsentResponse | null> {
    try {
      const response = await apiClient.get<ApiResponse<WithdrawConsentResponse | null>>(
        '/api/v1/employee/consent/withdrawal'
      )
      const data = response.data?.data
      if (!data) return null
      return {
        ...data,
        retentionDeadline: data.retentionDeadline || data.biometricDisposalDueAt || '',
        biometricDisposalDueAt: data.biometricDisposalDueAt || data.retentionDeadline || '',
      }
    } catch {
      return null
    }
  }

  /**
   * Nhân viên gửi yêu cầu về dữ liệu cá nhân (POST /api/v1/employee/data-requests)
   */
  async createEmployeeDataRequest(request: CreateDataSubjectRequest): Promise<DataSubjectRequestItem> {
    try {
      let requestType: DataSubjectRequestType = 'ACCESS'
      if (request.requestType === 'CORRECTION' || request.requestType === 'RECTIFICATION' || request.requestType === 'ERASURE') {
        requestType = 'CORRECTION'
      } else {
        requestType = 'ACCESS'
      }

      const detail = request.detail ?? request.details ?? ''

      const payload = {
        requestType,
        detail,
      }

      const response = await apiClient.post<ApiResponse<DataSubjectRequestItem>>(
        '/api/v1/employee/data-requests',
        payload
      )
      return adaptDataSubjectRequest(response.data.data)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Nhân viên tra cứu các yêu cầu dữ liệu của chính mình (GET /api/v1/employee/data-requests)
   */
  async getEmployeeDataRequests(): Promise<DataSubjectRequestItem[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<PaginatedResult<DataSubjectRequestItem> | DataSubjectRequestItem[]>
      >('/api/v1/employee/data-requests')
      const data = response.data.data
      let list: unknown[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as PaginatedResult<DataSubjectRequestItem>).content)) {
        list = (data as PaginatedResult<DataSubjectRequestItem>).content
      }
      return list.map((item) => adaptDataSubjectRequest(item))
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * DPO tra cứu toàn bộ danh sách yêu cầu dữ liệu cá nhân (GET /api/v1/dpo/data-requests)
   */
  async getDpoDataRequests(criteria?: { page?: number; size?: number }): Promise<DataSubjectRequestItem[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<PaginatedResult<DataSubjectRequestItem> | { items?: DataSubjectRequestItem[]; totalElements?: number; totalPages?: number } | DataSubjectRequestItem[]>
      >('/api/v1/dpo/data-requests', { params: criteria })
      const data = response.data.data
      let list: unknown[] = []
      let totalElements: number | undefined
      let totalPages: number | undefined

      if (Array.isArray(data)) {
        list = data
        totalElements = data.length
        totalPages = 1
      } else if (data && typeof data === 'object') {
        if ('content' in data && Array.isArray((data as PaginatedResult<DataSubjectRequestItem>).content)) {
          list = (data as PaginatedResult<DataSubjectRequestItem>).content
          totalElements = (data as PaginatedResult<DataSubjectRequestItem>).totalElements
          totalPages = (data as PaginatedResult<DataSubjectRequestItem>).totalPages
        } else if ('items' in data && Array.isArray((data as { items?: unknown[] }).items)) {
          list = (data as { items: unknown[] }).items
          totalElements = (data as { totalElements?: number }).totalElements ?? (data as { total?: number }).total ?? list.length
          totalPages = (data as { totalPages?: number }).totalPages ?? 1
        }
      }
      const mapped = list.map((item) => adaptDataSubjectRequest(item)) as DataSubjectRequestItem[] & {
        totalElements?: number
        totalPages?: number
        page?: number
        size?: number
      }
      mapped.totalElements = totalElements ?? mapped.length
      mapped.totalPages = totalPages ?? Math.max(1, Math.ceil(mapped.totalElements / (criteria?.size || 20)))
      mapped.page = criteria?.page ?? 0
      mapped.size = criteria?.size ?? 20
      return mapped
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  async getDataRequests(criteria?: { page?: number; size?: number }): Promise<DataSubjectRequestItem[]> {
    return this.getDpoDataRequests(criteria)
  }

  /**
   * DPO cập nhật trạng thái xử lý yêu cầu dữ liệu (PATCH /api/v1/dpo/data-requests/{id})
   */
  async updateDataRequestStatus(
    id: number,
    data: UpdateDataSubjectRequest
  ): Promise<DataSubjectRequestItem> {
    try {
      let status: DataSubjectRequestStatus = 'RECEIVED'
      if (data.status === 'RECEIVED' || data.status === 'PENDING') {
        status = 'RECEIVED'
      } else if (data.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS'
      } else if (data.status === 'FULFILLED' || data.status === 'COMPLETED') {
        status = 'FULFILLED'
      } else if (data.status === 'REJECTED') {
        status = 'REJECTED'
      }

      const responseText = data.response ?? data.adminNote ?? ''

      const payload = {
        status,
        response: responseText,
      }

      const response = await apiClient.patch<ApiResponse<DataSubjectRequestItem>>(
        `/api/v1/dpo/data-requests/${id}`,
        payload
      )
      return adaptDataSubjectRequest(response.data.data)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const dataSubjectService = new DataSubjectService()
