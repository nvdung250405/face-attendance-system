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

export type DataSubjectRequestType = 'ACCESS' | 'CORRECTION'
export type DataRequestType = DataSubjectRequestType | 'RECTIFICATION' | 'ERASURE' | 'EXPORT'

export type DataSubjectRequestStatus = 'RECEIVED' | 'IN_PROGRESS' | 'FULFILLED' | 'REJECTED'
export type DataRequestStatus = DataSubjectRequestStatus | 'PENDING' | 'COMPLETED'

export interface DataSubjectRequestItem {
  readonly id: number
  readonly employeeId?: number
  readonly employeeCode?: string
  readonly fullName?: string
  readonly requestType: DataSubjectRequestType | DataRequestType
  readonly detail?: string
  readonly details?: string
  readonly reason?: string
  readonly status: DataSubjectRequestStatus | DataRequestStatus
  readonly submittedAt?: string
  readonly createdAt?: string
  readonly requestedAt?: string
  readonly handledAt?: string | null
  readonly completedAt?: string | null
  readonly handledBy?: string | null
  readonly handledByName?: string | null
  readonly adminNote?: string | null
  readonly response?: string | null
  readonly responseSummary?: string | null
}

export interface CreateDataSubjectRequest {
  requestType: DataSubjectRequestType | DataRequestType
  detail?: string
  details?: string
}

export interface UpdateDataSubjectRequest {
  status: DataSubjectRequestStatus | DataRequestStatus
  response?: string
  adminNote?: string
}

export interface AuditLogItem {
  readonly id: number
  readonly action: string
  readonly actorId?: number
  readonly actorEmail?: string
  readonly actor?: string
  readonly actorUsername?: string
  readonly targetResource?: string
  readonly target?: string
  readonly resource?: string
  readonly oldValues?: Record<string, unknown> | null
  readonly newValues?: Record<string, unknown> | null
  readonly ipAddress?: string
  readonly createdAt?: string
  readonly timestamp?: string
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
