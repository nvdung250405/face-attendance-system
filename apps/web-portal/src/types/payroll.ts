/**
 * Hợp đồng dữ liệu Quản lý Kỳ công & Khóa Kỳ (DATA-WEB-006, API-WEB-013).
 */

export type PayrollPeriodStatus = 'OPEN' | 'LOCKED'

export interface PayrollPeriod {
  readonly id: number
  readonly periodCode: string // YYYY-MM
  readonly status: PayrollPeriodStatus
  readonly lockedAt?: string
  readonly lockedBy?: string
}

export interface PayrollPeriodResponse {
  readonly id: number
  readonly periodYear: number
  readonly periodMonth: number
  readonly status: PayrollPeriodStatus
  readonly lockedById?: number | null
  readonly lockedByName?: string | null
  readonly lockedAt?: string | null
  readonly unlockedById?: number | null
  readonly unlockedByName?: string | null
  readonly unlockedAt?: string | null
  readonly unlockReason?: string | null
  readonly createdAt: string
  readonly updatedAt?: string
}

export interface UnlockPeriodRequest {
  reason: string
}
