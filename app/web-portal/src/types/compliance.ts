/**
 * Hợp đồng dữ liệu Quyền Chủ thể Dữ liệu, Kiểm toán & Tuân thủ (API-WEB-014, API-WEB-017, APD-WEB-008, APD-WEB-011).
 */

export interface WithdrawConsentRequest {
  reason?: string
}

export interface WithdrawConsentResponse {
  readonly withdrawnAt: string
  readonly retentionDeadline: string // 7 ngày tiêu hủy dữ liệu sinh trắc
  readonly message: string
}

export type DataRequestType = 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'EXPORT'
export type DataRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'

export interface DataSubjectRequestItem {
  readonly id: number
  readonly employeeId: number
  readonly employeeCode?: string
  readonly fullName?: string
  readonly requestType: DataRequestType
  readonly details: string
  readonly status: DataRequestStatus
  readonly submittedAt: string
  readonly handledAt?: string | null
  readonly handledBy?: string | null
  readonly adminNote?: string | null
}

export interface CreateDataSubjectRequest {
  requestType: DataRequestType
  details: string
}

export interface UpdateDataSubjectRequest {
  status: DataRequestStatus
  adminNote?: string
}

export interface AuditLogItem {
  readonly id: number
  readonly action: string
  readonly actorId: number
  readonly actorEmail: string
  readonly targetResource: string
  readonly oldValues?: Record<string, unknown> | null
  readonly newValues?: Record<string, unknown> | null
  readonly ipAddress?: string
  readonly createdAt: string
}

export interface AuditLogQueryCriteria {
  page?: number
  size?: number
  action?: string
  actorEmail?: string
  targetResource?: string
  startDate?: string
  endDate?: string
}

export interface DpoConsentAuditItem {
  readonly id: number
  readonly employeeId: number
  readonly employeeCode: string
  readonly fullName: string
  readonly agreedAt: string
  readonly ipAddress: string
  readonly consentVersion: string
  readonly status: string
}

export interface RetentionScheduleItem {
  readonly id: number
  readonly employeeId: number
  readonly employeeCode: string
  readonly fullName: string
  readonly resignedAt?: string | null
  readonly scheduledDestructionDate: string
  readonly actualDestructionDate?: string | null
  readonly status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
}
