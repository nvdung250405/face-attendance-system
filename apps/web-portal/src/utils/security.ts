/**
 * Tiện ích Bảo mật & Làm sạch Dữ liệu phía Web Portal
 * (SEC-001, CWE-1236, DD-WEB-017, TST-SYS-019, XSS-01).
 *
 * - Hàm phòng chống tấn công CSV/Excel Formula Injection (CWE-1236):
 *   Tự động thêm dấu nháy đơn ' trước các ký tự nguy hiểm: =, +, -, @
 * - Hàm phòng chống XSS (XSS-01):
 *   Làm sạch HTML/văn bản người dùng nhập bằng DOMPurify.
 */
import DOMPurify from 'dompurify'

export function sanitizeFormula(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`
  }
  return str
}

/**
 * Làm sạch nội dung văn bản / HTML do người dùng cung cấp trước khi hiển thị trên DOM.
 * Ngăn chặn tấn công Stored XSS và DOM-based XSS (XSS-01).
 *
 * @param content Chuỗi nội dung người dùng nhập cần làm sạch
 * @returns Chuỗi an toàn đã được bóc tách mã độc hại
 */
export function sanitizeUserContent(content?: string | null): string {
  if (!content) {
    return ''
  }
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['class'],
  })
}
