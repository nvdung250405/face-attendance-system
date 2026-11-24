import { describe, it, expect } from 'vitest'
import { sanitizeUserContent, sanitizeFormula } from '@/utils/security'

describe('security utils - XSS-01 & CWE-1236 Sanitization', () => {
  describe('sanitizeUserContent (XSS-01)', () => {
    it('bóc tách thẻ script độc hại', () => {
      const malicious = '<script>alert("XSS")</script>Lý do nghỉ phép'
      const sanitized = sanitizeUserContent(malicious)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('</script>')
      expect(sanitized).toContain('Lý do nghỉ phép')
    })

    it('loại bỏ thuộc tính inline event handlers độc hại', () => {
      const malicious = '<img src="x" onerror="alert(1)">Sự cố máy bay trễ'
      const sanitized = sanitizeUserContent(malicious)
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('alert(1)')
      expect(sanitized).toContain('Sự cố máy bay trễ')
    })

    it('giữ nguyên văn bản thông thường an toàn', () => {
      const plainText = 'Tôi bị kẹt xe trên đường Nguyễn Trãi'
      expect(sanitizeUserContent(plainText)).toBe(plainText)
    })

    it('xử lý an toàn null, undefined và chuỗi rỗng', () => {
      expect(sanitizeUserContent(null)).toBe('')
      expect(sanitizeUserContent(undefined)).toBe('')
      expect(sanitizeUserContent('')).toBe('')
    })
  })

  describe('sanitizeFormula (CWE-1236)', () => {
    it('tiền tố dấu nháy đơn trước các công thức nguy hiểm', () => {
      expect(sanitizeFormula('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeFormula('+123')).toBe("'+123")
      expect(sanitizeFormula('-123')).toBe("'-123")
      expect(sanitizeFormula('@SUM')).toBe("'@SUM")
    })

    it('giữ nguyên văn bản không bắt đầu bằng ký tự nguy hiểm', () => {
      expect(sanitizeFormula('Nguyễn Văn A')).toBe('Nguyễn Văn A')
      expect(sanitizeFormula('123')).toBe('123')
    })
  })
})
