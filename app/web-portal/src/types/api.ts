/**
 * Chuẩn hóa cấu trúc bao bọc phản hồi API và phân trang theo Backend FAS REST API
 * (APD-BE-002, APD-BE-004, DATA-WEB-004).
 */

export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
  timestamp: string // ISO-8601 kèm múi giờ (+07:00)
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type PaginatedResult<T> = PageResponse<T>

export interface ApiError {
  success: false
  code: string
  message: string
  timestamp: string
  details?: Record<string, string>
}
