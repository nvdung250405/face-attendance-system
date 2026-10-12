/**
 * Hợp đồng dữ liệu Trạm Kiosk & Tuân thủ (DATA-WEB-007, API-WEB-017).
 */

export type KioskStatus = 'ONLINE' | 'OFFLINE' | 'WARNING'

export interface KioskItemResponse {
  readonly id: number
  readonly kioskId: string
  readonly name: string
  readonly location: string
  readonly status: KioskStatus
  readonly lastPingAt?: string
  readonly ipAddress?: string
  readonly appVersion?: string
}

export interface RegisterKioskRequest {
  kioskId: string
  name: string
  location: string
}

export interface RegisterKioskResponse {
  kiosk: KioskItemResponse
  secretToken: string // Chỉ hiển thị một lần trong RAM
}
