/**
 * Hợp đồng dữ liệu Ca làm việc và Phân ca Nhân sự (API-WEB-011, FR-SYS-018, APD-WEB-005).
 */

export interface ShiftItem {
  readonly id: number
  readonly shiftCode: string
  readonly name: string
  readonly shiftName?: string
  readonly startTime: string // Định dạng HH:mm, ví dụ "08:00"
  readonly endTime: string // Định dạng HH:mm, ví dụ "17:30"
  readonly gracePeriodMinutes: number // 0-60 phút
  readonly isActive: boolean
  readonly createdAt?: string
  readonly updatedAt?: string
}

export interface CreateShiftRequest {
  shiftCode: string
  name: string
  shiftName?: string
  startTime: string
  endTime: string
  gracePeriodMinutes?: number
}

export interface UpdateShiftRequest {
  name?: string
  shiftName?: string
  startTime?: string
  endTime?: string
  gracePeriodMinutes?: number
  isActive?: boolean
}

export interface EmployeeShiftAssignment {
  readonly id: number
  readonly employeeId: number
  readonly userId?: number
  readonly employeeCode: string
  readonly fullName: string
  readonly shiftId: number
  readonly shiftCode: string
  readonly shiftName: string
  readonly effectiveStartDate: string // YYYY-MM-DD
  readonly effectiveEndDate: string // YYYY-MM-DD
  readonly effectiveFrom?: string
  readonly effectiveTo?: string
  readonly createdAt?: string
}

export interface AssignShiftRequest {
  employeeId: number
  userId?: number
  shiftId: number
  effectiveStartDate: string // YYYY-MM-DD
  effectiveEndDate: string // YYYY-MM-DD
  effectiveFrom?: string
  effectiveTo?: string
}

export interface OverlapConflictInfo {
  readonly conflictingAssignmentId?: number
  readonly suggestedStartDate?: string
  readonly suggestedEndDate?: string
  readonly message?: string
}
