/**
 * Hợp đồng dữ liệu Đơn Giải trình Công (Excuse Requests)
 * (FR-BE-014, FR-BE-015, API-BE-026, API-BE-027, API-BE-028, API-BE-029, APD-BE-015, APD-BE-016).
 */

export type ExcuseRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SubmitExcuseRequestPayload {
  attendanceLogId: number
  reason: string
  requestedPunchTimestamp?: string // ISO-8601
}

export interface DecideExcuseRequestPayload {
  status: 'APPROVED' | 'REJECTED'
  reviewNote?: string
  rejectionReason?: string
}

export interface ApproveExcuseRequestPayload {
  reviewNote?: string
}

export interface RejectExcuseRequestPayload {
  rejectionReason: string
}

export interface ExcuseRequestItem {
  id: number
  userId: number
  employeeCode: string
  fullName: string
  attendanceLogId: number
  originalPunchTimestamp: string | null
  requestedPunchTimestamp: string | null
  reason: string
  status: ExcuseRequestStatus
  decidedById: number | null
  decidedByName: string | null
  decidedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface ExcuseQueryParams {
  status?: ExcuseRequestStatus
  page?: number
  size?: number
  sort?: string
}
