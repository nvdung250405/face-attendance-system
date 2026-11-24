/**
 * Shared date & time utilities for web-portal
 * (EXP3-09: Standardized date/time formatting across components)
 */

export function formatTime(isoString?: string | null): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return isoString
  }
}

export const formatTimeOnly = formatTime

export function formatDate(isoString?: string | null): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return isoString
  }
}

export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return `${Math.max(1, diffSec)} giây trước`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} giờ trước`
    const diffDay = Math.floor(diffHour / 24)
    return `${diffDay} ngày trước`
  } catch {
    return isoString
  }
}

export function formatLocalDateISO(d: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Kiểm tra xem ca làm việc có phải là ca đêm (vắt qua nửa đêm) hay không.
 * Ca đêm khi giờ kết thúc nhỏ hơn giờ bắt đầu (ví dụ: 22:00 -> 06:00).
 */
export function isOvernightShift(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return false
  const parseMinutes = (timeStr: string) => {
    const parts = timeStr.trim().split(':')
    if (parts.length < 2) return null
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (isNaN(h) || isNaN(m)) return null
    return h * 60 + m
  }
  const startM = parseMinutes(startTime)
  const endM = parseMinutes(endTime)
  if (startM === null || endM === null) return false
  return endM < startM
}
