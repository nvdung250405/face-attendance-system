import { describe, it, expect } from 'vitest'
import { sanitizeUserContent, sanitizePlainText, sanitizeFormula, isValidProofUrl } from '@/utils/security'

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

  describe('sanitizePlainText (F-TECH-11)', () => {
    it('loại bỏ toàn bộ các thẻ HTML bao gồm b, i, span', () => {
      const input = '<b>Nghỉ ốm</b> <i>sốt xuất huyết</i> <span>có giấy viện</span>'
      const sanitized = sanitizePlainText(input)
      expect(sanitized).toBe('Nghỉ ốm sốt xuất huyết có giấy viện')
      expect(sanitized).not.toContain('<b>')
      expect(sanitized).not.toContain('<i>')
      expect(sanitized).not.toContain('<span>')
    })

    it('bóc tách thẻ script độc hại cùng nội dung bên trong', () => {
      const malicious = '<script>alert("XSS")</script>Lý do nghỉ phép'
      const sanitized = sanitizePlainText(malicious)
      expect(sanitized).toBe('Lý do nghỉ phép')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert("XSS")')
    })

    it('loại bỏ nội dung script xen kẽ thẻ HTML và giải mã HTML entities để tránh double-escape (F-TECH-11)', () => {
      expect(sanitizePlainText('<b>Sick</b><script>alert(1)</script>')).toBe('Sick')
      expect(sanitizePlainText('<b>Tom & Jerry</b> < 5')).toBe('Tom & Jerry < 5')
      expect(sanitizePlainText('Tom &amp; Jerry')).toBe('Tom & Jerry')
    })

    it('xử lý an toàn null, undefined và chuỗi rỗng', () => {
      expect(sanitizePlainText(null)).toBe('')
      expect(sanitizePlainText(undefined)).toBe('')
      expect(sanitizePlainText('')).toBe('')
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

  describe('isValidProofUrl (F-SPEC-13, F-TECH-10)', () => {
    it('cho phép URL hợp lệ sử dụng https:// hoặc http://', () => {
      expect(isValidProofUrl('https://storage.company.com/proofs/doc1.png')).toBe(true)
      expect(isValidProofUrl('http://example.com/image.jpg')).toBe(true)
    })

    it('cho phép đường dẫn tương đối an toàn /api/v1/', () => {
      expect(isValidProofUrl('/api/v1/excuses/attachments/42')).toBe(true)
    })

    it('từ chối URL chứa javascript: hoặc các scheme độc hại', () => {
      expect(isValidProofUrl('javascript:alert(1)')).toBe(false)
      expect(isValidProofUrl('javascript:void(0)')).toBe(false)
      expect(isValidProofUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false)
      expect(isValidProofUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isValidProofUrl('vbscript:msgbox(1)')).toBe(false)
      expect(isValidProofUrl('file:///etc/passwd')).toBe(false)
    })

    it('từ chối URL null, undefined, rỗng hoặc đường dẫn không hợp lệ', () => {
      expect(isValidProofUrl(null)).toBe(false)
      expect(isValidProofUrl(undefined)).toBe(false)
      expect(isValidProofUrl('')).toBe(false)
      expect(isValidProofUrl('   ')).toBe(false)
      expect(isValidProofUrl('relative/path/without/api.png')).toBe(false)
    })
  })
})
