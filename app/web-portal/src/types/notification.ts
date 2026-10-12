/**
 * Hợp đồng dữ liệu Thông báo Trong ứng dụng (DATA-WEB-005, API-WEB-016).
 */

export type NotificationEventType =
  | 'ATTENDANCE_PUNCH'
  | 'CONSENT_SIGNED'
  | 'ENROLLMENT_COMPLETED'
  | 'SHIFT_ASSIGNED'
  | 'PAYROLL_LOCKED'
  | 'SECURITY_ALERT'

export interface NotificationItem {
  readonly id: number
  readonly userId?: number
  readonly eventType: NotificationEventType | string
  readonly title: string
  readonly message: string
  readonly isRead: boolean
  readonly createdAt: string
}

export interface NotificationResponse {
  readonly id: number
  readonly userId: number
  readonly eventType: NotificationEventType | string
  readonly title: string
  readonly body: string
  readonly referenceType?: string
  readonly referenceId?: string
  readonly readAt?: string | null
  readonly createdAt: string
}
