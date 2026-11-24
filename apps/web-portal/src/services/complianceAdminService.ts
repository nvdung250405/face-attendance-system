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
  DpoConsentWithdrawalItem,
  RetentionScheduleItem,
} from '@/types'

export interface KioskHeartbeatLog {
  timestamp: string
  latencyMs?: number
  status: 'SUCCESS' | 'MISSED' | 'TIMEOUT'
}

export interface KioskDiagnosticLog {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
}

export interface KioskHealthResponse {
  kioskId: string
  status: string
  lastPingAt?: string
  isStale: boolean
  macAddress?: string
  ipAddress?: string
  firmwareVersion?: string
  appVersion?: string
  cachedGalleryCount?: number
  heartbeatHistory?: KioskHeartbeatLog[]
  diagnosticLogs?: KioskDiagnosticLog[]
}

export interface UpdateKioskRequest {
  name?: string
  location?: string
  isActive?: boolean
  resetSecretToken?: boolean
}

export function adaptAuditLog(raw: unknown, index = 0): AuditLogItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: index + 1,
      action: 'UNKNOWN',
    }
  }

  const item = raw as Record<string, unknown>
  const id = Number(item.id ?? index + 1)
  const action = String(item.action ?? '')
  const actorId = item.actorId !== undefined && item.actorId !== null ? Number(item.actorId) : undefined
  const actorEmail = item.actorEmail ? String(item.actorEmail) : undefined

  let targetResource = item.targetResource ? String(item.targetResource) : undefined
  if (!targetResource && (item.entityType || item.entityId)) {
    targetResource = item.entityType && item.entityId
      ? `${item.entityType}:${item.entityId}`
      : String(item.entityType || item.entityId)
  }

  let oldValues: Record<string, unknown> | null = null
  if (item.oldValues && typeof item.oldValues === 'object') {
    oldValues = item.oldValues as Record<string, unknown>
  } else if (typeof item.beforeState === 'string' && item.beforeState.trim()) {
    try {
      oldValues = JSON.parse(item.beforeState) as Record<string, unknown>
    } catch {
      oldValues = { raw: item.beforeState }
    }
  }

  let newValues: Record<string, unknown> | null = null
  if (item.newValues && typeof item.newValues === 'object') {
    newValues = item.newValues as Record<string, unknown>
  } else if (typeof item.afterState === 'string' && item.afterState.trim()) {
    try {
      newValues = JSON.parse(item.afterState) as Record<string, unknown>
    } catch {
      newValues = { raw: item.afterState }
    }
  }

  return {
    id,
    action,
    actorId,
    actorEmail,
    actor: item.actor ? String(item.actor) : actorEmail,
    actorUsername: item.actorUsername ? String(item.actorUsername) : undefined,
    targetResource,
    target: item.target ? String(item.target) : targetResource,
    resource: item.resource ? String(item.resource) : targetResource,
    oldValues,
    newValues,
    ipAddress: item.ipAddress ? String(item.ipAddress) : undefined,
    createdAt: item.createdAt ? String(item.createdAt) : undefined,
    timestamp: item.timestamp ? String(item.timestamp) : (item.createdAt ? String(item.createdAt) : undefined),
  }
}

export function adaptDpoConsent(raw: unknown, index = 0): DpoConsentAuditItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: index + 1,
      employeeId: 0,
      employeeCode: '',
      fullName: '',
      agreedAt: '',
      ipAddress: '',
      consentVersion: 'v1.0',
      status: 'ACTIVE',
    }
  }

  const item = raw as Record<string, unknown>
  const id = Number(item.id ?? item.sessionId ?? index + 1)
  const employeeId = Number(item.employeeId ?? item.userId ?? 0)
  const employeeCode = String(item.employeeCode ?? '')
  const fullName = String(item.fullName ?? '')
  const consentVersion = String(item.consentVersion ?? 'v1.0')
  const agreedAt = String(item.agreedAt ?? item.consentSignedAt ?? '')
  const ipAddress = String(item.ipAddress ?? item.clientIp ?? '')
  const status = String(item.status ?? (item.isUsed !== false ? 'ACTIVE' : 'WITHDRAWN'))

  return {
    id,
    employeeId,
    employeeCode,
    fullName,
    consentVersion,
    agreedAt,
    ipAddress,
    status,
  }
}

export function adaptDpoConsentWithdrawal(raw: unknown, index = 0): DpoConsentWithdrawalItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: index + 1,
      employeeId: 0,
      employeeCode: '',
      fullName: '',
      withdrawnAt: '',
      biometricDisposalDueAt: '',
      status: 'PENDING_DISPOSAL',
      reason: null,
    }
  }

  const item = raw as Record<string, unknown>
  const id = Number(item.id ?? item.withdrawalId ?? index + 1)
  const employeeId = Number(item.employeeId ?? item.userId ?? 0)
  const employeeCode = String(item.employeeCode ?? '')
  const fullName = String(item.fullName ?? '')
  const withdrawnAt = String(item.withdrawnAt ?? item.createdAt ?? item.timestamp ?? '')
  const biometricDisposalDueAt = String(
    item.biometricDisposalDueAt ?? item.retentionDeadline ?? item.disposalDueAt ?? item.scheduledDestructionDate ?? ''
  )
  const status = String(item.status ?? 'PENDING_DISPOSAL')
  const reason = item.reason ? String(item.reason) : null

  return {
    id,
    employeeId,
    employeeCode,
    fullName,
    withdrawnAt,
    biometricDisposalDueAt,
    status,
    reason,
  }
}

export function adaptRetentionSchedule(raw: unknown, index = 0): RetentionScheduleItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: index + 1,
      employeeId: 0,
      employeeCode: '',
      fullName: '',
      scheduledDestructionDate: '',
      status: 'SCHEDULED',
    }
  }

  const item = raw as Record<string, unknown>
  const id = Number(item.id ?? item.sourceId ?? index + 1)
  const employeeId = Number(item.employeeId ?? item.sourceId ?? 0)
  const employeeCode = String(item.employeeCode ?? '')
  const fullName = String(item.fullName ?? '')
  const resignedAt = item.resignedAt ? String(item.resignedAt) : (item.triggerDate ? String(item.triggerDate) : null)
  const scheduledDestructionDate = String(item.scheduledDestructionDate ?? item.scheduledDisposalDate ?? '')
  const actualDestructionDate = item.actualDestructionDate ? String(item.actualDestructionDate) : (item.processedAt ? String(item.processedAt) : null)

  let status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' = 'SCHEDULED'
  if (item.status && ['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(String(item.status))) {
    status = item.status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  } else if (item.isDisposed) {
    status = 'COMPLETED'
  }

  return {
    id,
    employeeId,
    employeeCode,
    fullName,
    resignedAt,
    scheduledDestructionDate,
    actualDestructionDate,
    status,
  }
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
      const data = response.data.data
      const content = Array.isArray(data?.content)
        ? data.content.map((item, idx) => adaptAuditLog(item, idx))
        : []
      return {
        ...data,
        content,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Liệt kê danh sách các trạm Kiosk đã đăng ký (GET /api/v1/admin/kiosks)
   */
  async getKiosks(): Promise<KioskItemResponse[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<PaginatedResult<Record<string, unknown>> | Record<string, unknown>[]>
      >('/api/v1/admin/kiosks')
      const raw = response.data.data
      let list: Record<string, unknown>[] = []
      if (Array.isArray(raw)) {
        list = raw
      } else if (raw && typeof raw === 'object' && 'content' in raw && Array.isArray(raw.content)) {
        list = raw.content
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
      const locationName = data.locationName || (data.name && data.location ? `${data.name} - ${data.location}` : (data.location || data.name))
      const payload: { id?: string; locationName: string } = {
        locationName,
      }
      const kioskIdentifier = data.id || data.kioskId
      if (kioskIdentifier && kioskIdentifier.trim()) {
        payload.id = kioskIdentifier.trim()
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

      const response = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
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
      const response = await apiClient.get<ApiResponse<PaginatedResult<DpoConsentAuditItem> | DpoConsentAuditItem[]>>(
        '/api/v1/dpo/consents'
      )
      const data = response.data.data
      let list: unknown[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as PaginatedResult<DpoConsentAuditItem>).content)) {
        list = (data as PaginatedResult<DpoConsentAuditItem>).content
      }
      return list.map((item, idx) => adaptDpoConsent(item, idx))
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * DPO tra cứu lịch tiêu hủy dữ liệu sinh trắc nhân sự thôi việc (chỉ đọc) (GET /api/v1/dpo/retention-schedule)
   */
  async getDpoRetentionSchedule(): Promise<RetentionScheduleItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResult<RetentionScheduleItem> | RetentionScheduleItem[]>>(
        '/api/v1/dpo/retention-schedule'
      )
      const data = response.data.data
      let list: unknown[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as PaginatedResult<RetentionScheduleItem>).content)) {
        list = (data as PaginatedResult<RetentionScheduleItem>).content
      }
      return list.map((item, idx) => adaptRetentionSchedule(item, idx))
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * DPO tra cứu danh sách rút cam kết Informed Consent (chỉ đọc) (GET /api/v1/dpo/consent-withdrawals)
   */
  async getDpoConsentWithdrawals(): Promise<DpoConsentWithdrawalItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResult<DpoConsentWithdrawalItem> | DpoConsentWithdrawalItem[]>>(
        '/api/v1/dpo/consent-withdrawals'
      )
      const data = response.data.data
      let list: unknown[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as PaginatedResult<DpoConsentWithdrawalItem>).content)) {
        list = (data as PaginatedResult<DpoConsentWithdrawalItem>).content
      }
      return list.map((item, idx) => adaptDpoConsentWithdrawal(item, idx))
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const complianceAdminService = new ComplianceAdminService()
