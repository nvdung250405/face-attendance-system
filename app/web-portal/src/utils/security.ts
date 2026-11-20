/**
 * Tiện ích Bảo mật & Làm sạch Dữ liệu phía Web Portal
 * (SEC-001, CWE-1236, DD-WEB-017, TST-SYS-019).
 *
 * Hàm phòng chống tấn công CSV/Excel Formula Injection (CWE-1236):
 * Tự động thêm dấu nháy đơn ' trước các ký tự nguy hiểm: =, +, -, @
 */
export function sanitizeFormula(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`
  }
  return str
}
