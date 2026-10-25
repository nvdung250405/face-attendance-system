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
  KioskStatus,
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

export function adaptKioskItem(raw: unknown, index = 0): KioskItemResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      id: index + 1,
      kioskId: `KIOSK-${index + 1}`,
      name: `Trạm Kiosk ${index + 1}`,
      location: '—',
      status: 'OFFLINE',
    }
  }

  const item = raw as Record<string, unknown>
  const kioskId = String(item.kioskId || item.id || `KIOSK-${index + 1}`)

  const rawLoc = String(item.locationName || item.location || item.name || '')
  let name = String(item.name || '')
  let location = String(item.location || '')

  if (!name && !location && rawLoc) {
    if (rawLoc.includes(' - ')) {
      const parts = rawLoc.split(' - ')
      name = parts[0].trim()
      location = parts.slice(1).join(' - ').trim()
    } else {
      name = rawLoc
      location = rawLoc
    }
  } else if (!name && rawLoc) {
    name = rawLoc
  } else if (!location && rawLoc) {
    location = rawLoc
  }

  if (!name) name = `Trạm ${kioskId}`
  if (!location) location = 'Khu vực chưa cấu hình'

  const status: KioskStatus = (() => {
    if (typeof item.status === 'string' && ['ONLINE', 'OFFLINE', 'WARNING'].includes(item.status)) {
      return item.status as KioskStatus
    }
    const isActive = item.isActive !== false
    const isOnline = Boolean(item.isOnline)
    const lastPing = item.lastPingAt ? new Date(String(item.lastPingAt)).getTime() : 0
    const now = Date.now()
    const isStale = !lastPing || (now - lastPing > 5 * 60 * 1000)

    if (!isActive) {
      return 'OFFLINE'
    }
    if (isOnline && !isStale) {
      return 'ONLINE'
    }
    return 'WARNING'
  })()

  return {
    id: (item.id as number | string) || kioskId,
    kioskId,
    name,
    location,
    status,
    lastPingAt: item.lastPingAt ? String(item.lastPingAt) : undefined,
    ipAddress: item.ipAddress ? String(item.ipAddress) : undefined,
    appVersion: item.appVersion ? String(item.appVersion) : undefined,
    isActive: item.isActive !== false,
    isOnline: Boolean(item.isOnline),
    locationName: rawLoc || undefined,
  }
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
      let list: unknown[] = []
      if (Array.isArray(raw)) {
        list = raw
      } else if (raw && typeof raw === 'object' && 'content' in raw && Array.isArray((raw as { content: unknown }).content)) {
        list = (raw as { content: unknown[] }).content
      }
      return list.map((item, idx) => adaptKioskItem(item, idx))
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
      const untyped = data as unknown as Record<string, unknown>
      const payload = {
        id: data.kioskId || untyped.id,
        locationName: data.name && data.location ? `${data.name} - ${data.location}` : (data.location || data.name),
      }
      const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(
        '/api/v1/admin/kiosks',
        payload
      )
      const resData = response.data.data
      const secretToken = String(resData.secretToken || '')
      return {
        secretToken,
        kiosk: adaptKioskItem(resData.kiosk || resData, 0),
      }
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
      if (data.resetSecretToken) {
        const rotateRes = await apiClient.post<ApiResponse<Record<string, unknown>>>(
          `/api/v1/admin/kiosks/${id}/rotate-secret`
        )
        const rotData = rotateRes.data.data
        return {
          ...adaptKioskItem(rotData),
          secretToken: String(rotData.newSecretToken || rotData.secretToken || ''),
        }
      }

      const payload: Record<string, unknown> = {}
      if (data.location || data.name) {
        payload.locationName = data.name && data.location ? `${data.name} - ${data.location}` : (data.location || data.name)
      }
      if (data.isActive !== undefined) {
        payload.isActive = data.isActive
      }

      const response = await apiClient.patch<ApiResponse<unknown>>(
        `/api/v1/admin/kiosks/${id}`,
        payload
      )
      return adaptKioskItem(response.data.data)
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
