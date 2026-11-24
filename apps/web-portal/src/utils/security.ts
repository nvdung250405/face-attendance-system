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

/**
 * Làm sạch văn bản thuần túy, loại bỏ toàn bộ thẻ HTML và thuộc tính để hiển thị an toàn trong bảng dữ liệu hoặc thuộc tính HTML (title, aria-label) (F-TECH-11).
 */
export function sanitizePlainText(content?: string | null): string {
  if (!content) {
    return ''
  }
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser()
    const rawDoc = parser.parseFromString(content, 'text/html')
    rawDoc
      .querySelectorAll('script, style, iframe, object, embed, noscript, template')
      .forEach((el) => el.remove())
    const purified = DOMPurify.sanitize(rawDoc.body?.innerHTML ?? '', {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div', 'u', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    })
    const cleanDoc = parser.parseFromString(
      typeof purified === 'string' ? purified : '',
      'text/html'
    )
    return cleanDoc.body?.textContent ?? ''
  }
  const purified = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: false,
  })
  return typeof purified === 'string' ? purified.replace(/<[^>]*>/g, '') : ''
}

/**
 * Kiểm tra giao thức URL minh chứng giải trình theo danh sách cho phép (F-SPEC-13, F-TECH-10).
 * Chỉ cho phép http://, https:// hoặc đường dẫn nội bộ /api/v1/.
 * Ngăn chặn tuyệt đối các URL chứa scheme độc hại như javascript:, data:, vbscript:, v.v.
 */
export function isValidProofUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  const trimmed = url.trim()
  if (!trimmed) {
    return false
  }
  return /^(https?:\/\/|\/api\/v1\/)/i.test(trimmed)
}
