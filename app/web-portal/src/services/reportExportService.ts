/**
 * Dịch vụ Kết xuất Báo cáo Bảng công (ReportExportService - APD-WEB-012, API-WEB-018, DD-WEB-017, FR-WEB-006, TASK-WEB-020).
 *
 * Tính năng chính:
 * 1. exportTimesheetReport: Gọi REST API backend GET /api/v1/admin/reports/export (Excel .xlsx / .csv / .pdf).
 * 2. sanitizeFormula: Phòng chống Formula Injection (CWE-1236, chèn dấu ' trước =, +, -, @).
 * 3. generateClientExcelReport: Kết xuất báo cáo bảng công định dạng CSV/Excel (.csv) có UTF-8 BOM, tiêu đề, mốc thời gian, tên công ty và số liệu chấm công.
 * 4. generateClientPdfReport: Kết xuất báo cáo PDF chuẩn (%PDF-1.4) có tiêu đề công ty, mốc thời gian, số liệu thống kê KPI và bảng chi tiết.
 * 5. generatePrintableHtml & printReport: Trình bày báo cáo in ấn chuyên nghiệp với giao diện doanh nghiệp đầy đủ chữ ký.
 * 6. triggerDownload: Kích hoạt tải tệp nhị phân xuống trình duyệt an toàn.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ExportReportParams,
  ExportReportResult,
  ClientReportOptions,
} from '@/types'

/**
 * Phòng chống mã độc chèn công thức Excel (Anti-Formula Injection / CWE-1236, DD-WEB-017, TST-SYS-019).
 * Nếu chuỗi văn bản bắt đầu bằng =, +, -, @ thì tự động chèn dấu nháy đơn ' ở đầu.
 */
export function sanitizeFormula(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`
  }
  return str
}

/**
 * Loại bỏ dấu tiếng Việt để xuất văn bản ASCII an toàn cho PDF Type1 Helvetica
 */
export function stripVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Tạo tài liệu PDF chuẩn 1.4 tối giản hỗ trợ hiển thị bảng dữ liệu và tiêu đề doanh nghiệp
 */
function createMinimalPdf(lines: string[]): Uint8Array {
  const contentStream = [
    'BT',
    '/F1 9 Tf',
    '40 800 Td',
    '12 TL',
  ]

  lines.forEach((line) => {
    const escaped = line
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
    contentStream.push(`(${escaped}) Tj T*`)
  })

  contentStream.push('ET')
  const streamBody = contentStream.join('\n')
  const streamLength = streamBody.length

  const objects: string[] = []
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  objects[3] =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n'
  objects[4] =
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  objects[5] = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamBody}\nendstream\nendobj\n`

  let pdf = '%PDF-1.4\n'
  let offset = pdf.length

  const xref: number[] = [0]
  for (let i = 1; i <= 5; i++) {
    xref[i] = offset
    pdf += objects[i]
    offset = pdf.length
  }

  const startxref = offset
  pdf += 'xref\n0 6\n'
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= 5; i++) {
    pdf += String(xref[i]).padStart(10, '0') + ' 00000 n \n'
  }
  pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n'

  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff
  }
  return bytes
}

export class ReportExportService {
  /**
   * Kết xuất báo cáo bảng công từ Backend dạng file nhị phân Blob (GET /api/v1/admin/reports/export)
   */
  async exportTimesheetReport(params: ExportReportParams): Promise<ExportReportResult> {
    try {
      const response = await apiClient.get<Blob>('/api/v1/admin/reports/export', {
        params: {
          period: params.period,
          departmentId: params.departmentId,
          keyword: params.keyword,
          status: params.status,
          fromDate: params.fromDate,
          toDate: params.toDate,
          format: params.format || 'xlsx',
        },
        responseType: 'blob',
      })

      // Trích xuất tên tệp từ header Content-Disposition nếu có
      let filename = `attendance-report-${params.period}.${params.format || 'xlsx'}`
      const disposition = response.headers?.['content-disposition']
      if (disposition && typeof disposition === 'string') {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '').trim()
        }
      }

      return {
        blob: response.data,
        filename,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Khử mã độc công thức Excel (Anti-Formula Injection)
   */
  sanitizeFormula(value: unknown): string {
    return sanitizeFormula(value)
  }

  /**
   * Tạo báo cáo Excel/CSV từ dữ liệu bảng hiện tại ở phía Client (DD-WEB-017, TASK-WEB-020).
   * Bao gồm: Tên công ty, Tiêu đề, Mốc thời gian, Thống kê KPI, và Chi tiết chấm công có phòng chống Formula Injection.
   */
  generateClientExcelReport(options: ClientReportOptions): ExportReportResult {
    const companyName = options.companyName || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS'
    const reportTitle = options.reportTitle || 'BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ'
    const generatedAt = options.generatedAt || new Date().toLocaleString('vi-VN')
    const period = options.period || 'Hiện tại'
    const departmentName = options.departmentName || 'Toàn bộ phòng ban'

    const escapeCell = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const metaLines = [
      `TÊN CÔNG TY,${escapeCell(sanitizeFormula(companyName))}`,
      `TIÊU ĐỀ BÁO CÁO,${escapeCell(sanitizeFormula(reportTitle))}`,
      `MỐC THỜI GIAN XUẤT,${escapeCell(sanitizeFormula(generatedAt))}`,
      `KỲ BÁO CÁO,${escapeCell(sanitizeFormula(period))}`,
      `PHÒNG BAN ÁP DỤNG,${escapeCell(sanitizeFormula(departmentName))}`,
      '',
    ]

    // Khối tóm tắt thống kê KPI (nếu có)
    if (options.stats) {
      metaLines.push(
        'TỔNG QUAN CHỈ SỐ KPI CHẤM CÔNG',
        `Tổng lượt điểm danh,${options.stats.totalEmployees ?? options.records.length}`,
        `Đúng giờ,${options.stats.onTimeCount ?? 0}`,
        `Đi muộn,${options.stats.lateCount ?? 0}`,
        `Vắng mặt,${options.stats.absentCount ?? 0}`,
        `Tỷ lệ nhận diện khuôn mặt,${options.stats.faceRecognitionRate ? `${options.stats.faceRecognitionRate}%` : 'N/A'}`,
        ''
      )
    }

    const headers = [
      'STT',
      'Mã nhân viên',
      'Họ và tên',
      'Phòng ban',
      'Thời gian điểm danh',
      'Loại điểm danh',
      'Trạng thái',
      'Đi muộn (phút)',
      'Trạm Kiosk',
      'Phương thức xác thực',
    ]

    const statusLabels: Record<string, string> = {
      ON_TIME: 'Đúng giờ',
      LATE: 'Đi muộn',
      EARLY_LEAVE: 'Về sớm',
      ABSENT: 'Vắng mặt',
      REST_DAY: 'Nghỉ tuần',
      HOLIDAY: 'Nghỉ lễ',
      EXCUSE_PENDING: 'Chờ duyệt giải trình',
    }

    const methodLabels: Record<string, string> = {
      VERIFICATION_FACE: 'Khuôn mặt',
      VERIFICATION_PIN: 'Mã PIN',
      MANUAL: 'Điều chỉnh thủ công',
    }

    const typeLabels: Record<string, string> = {
      CHECK_IN: 'Vào ca',
      CHECK_OUT: 'Tan ca',
    }

    const rows = options.records.map((r, idx) => [
      String(idx + 1),
      sanitizeFormula(r.employeeCode),
      sanitizeFormula(r.fullName),
      sanitizeFormula(r.department || 'Chung'),
      sanitizeFormula(r.punchTimestamp),
      sanitizeFormula(typeLabels[r.punchType || ''] || r.punchType || 'CHECK_IN'),
      sanitizeFormula(statusLabels[r.status] || r.status),
      sanitizeFormula(r.lateMinutes ? `${r.lateMinutes}` : '0'),
      sanitizeFormula(r.kioskId || 'N/A'),
      sanitizeFormula(methodLabels[r.verificationMethod || ''] || r.verificationMethod || 'Khuôn mặt'),
    ])

    const csvContent =
      '\uFEFF' + // UTF-8 BOM
      metaLines.join('\n') +
      headers.map(escapeCell).join(',') +
      '\n' +
      rows.map((row) => row.map(escapeCell).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const cleanPeriod = period.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `bang-cham-cong-${cleanPeriod}-${Date.now()}.csv`

    return { blob, filename }
  }

  /**
   * Tạo báo cáo PDF chuẩn (%PDF-1.4) có tiêu đề công ty, mốc thời gian, số liệu chấm công (DD-WEB-017, TASK-WEB-020).
   */
  generateClientPdfReport(options: ClientReportOptions): ExportReportResult {
    const companyName = options.companyName || 'CONG TY CO PHAN CONG NGHE FAS'
    const reportTitle = options.reportTitle || 'BAO CAO BANG CHAM CONG NHAN SU'
    const generatedAt = options.generatedAt || new Date().toLocaleString('vi-VN')
    const period = options.period || 'Hien tai'
    const departmentName = options.departmentName || 'Toan bo'

    const lines: string[] = [
      stripVietnameseDiacritics(companyName).toUpperCase(),
      'HE THONG DIEM DANH SINH TRAC HOC KIOSK FAS',
      '--------------------------------------------------------------------------------',
      stripVietnameseDiacritics(reportTitle).toUpperCase(),
      `Thoi diem xuat: ${stripVietnameseDiacritics(generatedAt)}   |   Ky: ${stripVietnameseDiacritics(period)}`,
      `Phong ban: ${stripVietnameseDiacritics(departmentName)}`,
      '--------------------------------------------------------------------------------',
    ]

    if (options.stats) {
      lines.push(
        `TONG QUAN: Tong ban ghi: ${options.records.length} | Dung gio: ${options.stats.onTimeCount ?? 0} | Di muon: ${options.stats.lateCount ?? 0} | Vang: ${options.stats.absentCount ?? 0}`,
        '--------------------------------------------------------------------------------'
      )
    }

    lines.push(
      'STT | MA NV      | HO VA TEN             | PHONG BAN        | GIO QUET  | TRANG THAI | PHUONG THUC',
      '----+------------+-----------------------+------------------+-----------+------------+------------'
    )

    const statusAscii: Record<string, string> = {
      ON_TIME: 'Dung gio',
      LATE: 'Di muon',
      EARLY_LEAVE: 'Ve som',
      ABSENT: 'Vang mat',
      REST_DAY: 'Nghi tuan',
      HOLIDAY: 'Nghi le',
      EXCUSE_PENDING: 'Cho duyet',
    }

    options.records.slice(0, 35).forEach((r, idx) => {
      const stt = String(idx + 1).padEnd(3, ' ')
      const code = stripVietnameseDiacritics(r.employeeCode).padEnd(10, ' ').slice(0, 10)
      const name = stripVietnameseDiacritics(r.fullName).padEnd(21, ' ').slice(0, 21)
      const dept = stripVietnameseDiacritics(r.department || 'Chung').padEnd(16, ' ').slice(0, 16)
      const time = (r.punchTimestamp.slice(11, 19) || '--:--:--').padEnd(9, ' ')
      const st = (statusAscii[r.status] || r.status).padEnd(10, ' ').slice(0, 10)
      const method = r.verificationMethod === 'VERIFICATION_PIN' ? 'PIN' : 'Face'
      lines.push(`${stt} | ${code} | ${name} | ${dept} | ${time} | ${st} | ${method}`)
    })

    if (options.records.length > 35) {
      lines.push(`... va con ${options.records.length - 35} ban ghi khac trong danh sach.`)
    }

    lines.push(
      '--------------------------------------------------------------------------------',
      '',
      'NGUOI LAP BIEU                              TRUONG PHONG NHAN SU',
      '(Ky va ghi ro ho ten)                       (Ky va ghi ro ho ten)'
    )

    const pdfBytes = createMinimalPdf(lines)
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    const cleanPeriod = period.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `bang-cham-cong-${cleanPeriod}-${Date.now()}.pdf`

    return { blob, filename }
  }

  /**
   * Tạo mã HTML in ấn báo cáo chuẩn trang trọng (doanh nghiệp)
   */
  generatePrintableHtml(options: ClientReportOptions): string {
    const companyName = options.companyName || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS'
    const reportTitle = options.reportTitle || 'BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ'
    const generatedAt = options.generatedAt || new Date().toLocaleString('vi-VN')
    const period = options.period || 'Hiện tại'
    const departmentName = options.departmentName || 'Toàn bộ phòng ban'

    const statusLabels: Record<string, { label: string; color: string }> = {
      ON_TIME: { label: 'Đúng giờ', color: '#10b981' },
      LATE: { label: 'Đi muộn', color: '#f59e0b' },
      EARLY_LEAVE: { label: 'Về sớm', color: '#f97316' },
      ABSENT: { label: 'Vắng mặt', color: '#ef4444' },
      REST_DAY: { label: 'Nghỉ tuần', color: '#64748b' },
      HOLIDAY: { label: 'Nghỉ lễ', color: '#8b5cf6' },
      EXCUSE_PENDING: { label: 'Chờ duyệt', color: '#3b82f6' },
    }

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${reportTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 12px; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company-title { font-size: 14px; font-weight: 800; color: #0284c7; text-transform: uppercase; }
    .report-title { font-size: 18px; font-weight: 800; text-align: center; margin: 15px 0 5px; color: #0f172a; text-transform: uppercase; }
    .meta { font-size: 11px; color: #64748b; text-align: center; margin-bottom: 20px; }
    .kpi-grid { display: flex; gap: 12px; margin-bottom: 20px; }
    .kpi-card { flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; }
    .kpi-value { font-size: 16px; font-weight: 700; color: #0f172a; }
    .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; }
    td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #fff; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; page-break-inside: avoid; }
    .sign-box { width: 220px; }
    @media print {
      body { margin: 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">${companyName}</div>
      <div style="font-size: 10px; color: #64748b;">Hệ Thống Điểm Danh Sinh Trắc Học FAS Enterprise</div>
    </div>
    <div style="text-align: right; font-size: 10px; color: #64748b;">
      <div>Thời điểm xuất: ${generatedAt}</div>
      <div>Phòng ban: ${departmentName}</div>
    </div>
  </div>

  <div class="report-title">${reportTitle}</div>
  <div class="meta">Kỳ báo cáo: <strong>${period}</strong> &bull; Tổng số lượt: <strong>${options.records.length}</strong></div>

  ${
    options.stats
      ? `<div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-value">${options.records.length}</div><div class="kpi-label">Tổng lượt quét</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color: #10b981;">${options.stats.onTimeCount ?? 0}</div><div class="kpi-label">Đúng giờ</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color: #f59e0b;">${options.stats.lateCount ?? 0}</div><div class="kpi-label">Đi muộn</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color: #0284c7;">${options.stats.faceRecognitionRate ? `${options.stats.faceRecognitionRate}%` : '100%'}</div><div class="kpi-label">Tỷ lệ quét mặt</div></div>
  </div>`
      : ''
  }

  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">STT</th>
        <th>Mã NV</th>
        <th>Họ và tên</th>
        <th>Phòng ban</th>
        <th>Thời gian quét</th>
        <th>Loại</th>
        <th>Trạng thái</th>
        <th>Trạm Kiosk</th>
        <th>Phương thức</th>
      </tr>
    </thead>
    <tbody>
      ${options.records
        .map(
          (r, idx) => `<tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: 700;">${r.employeeCode}</td>
        <td>${r.fullName}</td>
        <td>${r.department || 'Chung'}</td>
        <td style="font-family: monospace;">${r.punchTimestamp.slice(0, 19).replace('T', ' ')}</td>
        <td>${r.punchType === 'CHECK_OUT' ? 'Tan ca' : 'Vào ca'}</td>
        <td><span class="badge" style="background: ${statusLabels[r.status]?.color || '#64748b'};">${statusLabels[r.status]?.label || r.status}</span></td>
        <td>${r.kioskId || 'Kiosk'}</td>
        <td>${r.verificationMethod === 'VERIFICATION_PIN' ? 'Mã PIN' : 'Khuôn mặt'}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <div class="sign-box">
      <strong>NGƯỜI LẬP BIỂU</strong>
      <div style="height: 60px;"></div>
      <div>(Ký và ghi rõ họ tên)</div>
    </div>
    <div class="sign-box">
      <strong>TRƯỞNG PHÒNG NHÂN SỰ</strong>
      <div style="height: 60px;"></div>
      <div>(Ký và ghi rõ họ tên)</div>
    </div>
  </div>
</body>
</html>`
  }

  /**
   * Mở cửa sổ in ấn báo cáo chuyên nghiệp
   */
  printReport(options: ClientReportOptions): void {
    if (typeof window === 'undefined') return
    const html = this.generatePrintableHtml(options)
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 300)
    }
  }

  /**
   * Kích hoạt trình duyệt tải xuống tệp nhị phân
   */
  triggerDownload(blob: Blob, filename: string): void {
    if (typeof window === 'undefined') return
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(url)
  }
}

export const reportExportService = new ReportExportService()
