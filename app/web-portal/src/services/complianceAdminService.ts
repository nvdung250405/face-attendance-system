/**
 * Dịch vụ Kiểm toán & Tuân thủ DPO Phía Quản trị (ComplianceAdminService - APD-WEB-011, API-WEB-017, DD-WEB-019).
 *
 * Tra cứu audit logs (chỉ đọc), quản lý trạm Kiosk (Secret Token chỉ hiển thị 1 lần, không lưu storage),
 * và tra cứu thông tin tuân thủ cho vai trò DPO (consents, lịch tiêu hủy retention schedule).
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  PaginatedResult,
  AuditLogItem,
  AuditLogQueryCriteria,
  KioskItemResponse,
  RegisterKioskRequest,
  RegisterKioskResponse,
  DpoConsentAuditItem,
  RetentionScheduleItem,
} from '@/types'

export interface KioskHealthResponse {
  kioskId: string
  status: string
  lastPingAt?: string
  isStale: boolean
}

export interface UpdateKioskRequest {
  name?: string
  location?: string
  isActive?: boolean
  resetSecretToken?: boolean
}

export class ComplianceAdminService {
  /**
   * Tra cứu nhật ký kiểm toán hệ thống (chỉ đọc) (GET /api/v1/admin/audit-logs)
   */
  async getAuditLogs(criteria?: AuditLogQueryCriteria): Promise<PaginatedResult<AuditLogItem>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResult<AuditLogItem>>>(
        '/api/v1/admin/audit-logs',
        { params: criteria }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Liệt kê danh sách các trạm Kiosk đã đăng ký (GET /api/v1/admin/kiosks)
   */
  async getKiosks(): Promise<KioskItemResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>('/api/v1/admin/kiosks')
      const raw = response.data.data
      if (Array.isArray(raw)) return raw as KioskItemResponse[]
      if (raw && typeof raw === 'object' && 'content' in raw && Array.isArray((raw as { content: unknown }).content)) {
        return (raw as { content: KioskItemResponse[] }).content
      }
      return []
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Đăng ký trạm Kiosk mới (POST /api/v1/admin/kiosks)
   * Trả về Secret Token hiển thị DUY NHẤT một lần trên RAM; không lưu vào storage.
   */
  async registerKiosk(data: RegisterKioskRequest): Promise<RegisterKioskResponse> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterKioskResponse>>(
        '/api/v1/admin/kiosks',
        data
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Cập nhật thông tin hoặc cấp lại Secret Token cho trạm Kiosk (PATCH /api/v1/admin/kiosks/{id})
   */
  async updateKiosk(
    id: number | string,
    data: UpdateKioskRequest
  ): Promise<KioskItemResponse & { secretToken?: string }> {
    try {
      const response = await apiClient.patch<ApiResponse<KioskItemResponse & { secretToken?: string }>>(
        `/api/v1/admin/kiosks/${id}`,
        data
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Kiểm tra tình trạng kết nối & nhịp tim của trạm Kiosk (GET /api/v1/admin/kiosks/{id}/health)
   */
  async getKioskHealth(id: number | string): Promise<KioskHealthResponse> {
    try {
      const response = await apiClient.get<ApiResponse<KioskHealthResponse>>(
        `/api/v1/admin/kiosks/${id}/health`
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * DPO tra cứu dữ liệu ký cam kết Informed Consent (chỉ đọc) (GET /api/v1/dpo/consents)
   */
  async getDpoConsents(): Promise<DpoConsentAuditItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>('/api/v1/dpo/consents')
      const raw = response.data.data
      if (Array.isArray(raw)) return raw as DpoConsentAuditItem[]
      if (raw && typeof raw === 'object' && 'content' in raw && Array.isArray((raw as { content: unknown }).content)) {
        return (raw as { content: DpoConsentAuditItem[] }).content
      }
      return []
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * DPO tra cứu lịch tiêu hủy dữ liệu sinh trắc nhân sự thôi việc (chỉ đọc) (GET /api/v1/dpo/retention-schedule)
   */
  async getDpoRetentionSchedule(): Promise<RetentionScheduleItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<unknown>>(
        '/api/v1/dpo/retention-schedule'
      )
      const raw = response.data.data
      if (Array.isArray(raw)) return raw as RetentionScheduleItem[]
      if (raw && typeof raw === 'object' && 'content' in raw && Array.isArray((raw as { content: unknown }).content)) {
        return (raw as { content: RetentionScheduleItem[] }).content
      }
      return []
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const complianceAdminService = new ComplianceAdminService()
