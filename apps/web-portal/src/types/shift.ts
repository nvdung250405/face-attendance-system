/**
 * Hợp đồng dữ liệu Ca làm việc và Phân ca Nhân sự (API-WEB-011, FR-SYS-018, APD-WEB-005).
 */

export interface ShiftItem {
  readonly id: number
  readonly shiftCode: string
  readonly name: string
  /** @deprecated Alias thừa thãi, sử dụng name theo chuẩn backend */
  readonly shiftName?: string
  readonly startTime: string // Định dạng HH:mm, ví dụ "08:00"
  readonly endTime: string // Định dạng HH:mm, ví dụ "17:30"
  readonly gracePeriodMinutes: number // 0-60 phút
  readonly isOvernight?: boolean
  readonly isActive: boolean
  readonly createdAt?: string
  readonly updatedAt?: string
}

export interface CreateShiftRequest {
  shiftCode?: string
  name: string
  /** @deprecated Alias thừa thãi, sử dụng name */
  shiftName?: string
  startTime: string
  endTime: string
  gracePeriodMinutes?: number
  isOvernight?: boolean
}

export interface UpdateShiftRequest {
  name?: string
  /** @deprecated Alias thừa thãi, sử dụng name */
  shiftName?: string
  startTime?: string
  endTime?: string
  gracePeriodMinutes?: number
  isOvernight?: boolean
  isActive?: boolean
}

export interface EmployeeShiftAssignment {
  readonly id: number
  readonly employeeId: number
  /** @deprecated Alias thừa thãi, sử dụng employeeId */
  readonly userId?: number
  readonly employeeCode: string
  readonly fullName: string
  readonly shiftId: number
  readonly shiftCode: string
  readonly shiftName: string
  readonly effectiveStartDate: string // YYYY-MM-DD
  readonly effectiveEndDate: string // YYYY-MM-DD
  /** @deprecated Alias thừa thãi, sử dụng effectiveStartDate */
  readonly effectiveFrom?: string
  /** @deprecated Alias thừa thãi, sử dụng effectiveEndDate */
  readonly effectiveTo?: string | null
  readonly createdAt?: string
}

export interface AssignShiftRequest {
  employeeId: number
  /** @deprecated Alias thừa thãi, sử dụng employeeId */
  userId?: number
  shiftId: number
  effectiveStartDate: string // YYYY-MM-DD
  effectiveEndDate: string // YYYY-MM-DD
  /** @deprecated Alias thừa thãi, sử dụng effectiveStartDate */
  effectiveFrom?: string
  /** @deprecated Alias thừa thãi, sử dụng effectiveEndDate */
  effectiveTo?: string
}

export interface OverlapConflictInfo {
  readonly conflictingAssignmentId?: number
  readonly suggestedStartDate?: string
  readonly suggestedEndDate?: string
  readonly message?: string
}
export interface BatchAssignShiftRequest {
  employeeIds: number[]
  shiftId: number
  effectiveStartDate: string
  effectiveEndDate: string
}

export interface BatchAssignResult {
  total: number
  successCount: number
  failedCount: number
  failures: Array<{
    employeeId: number
    employeeName?: string
    reason: string
  }>
  assignments: EmployeeShiftAssignment[]
}
