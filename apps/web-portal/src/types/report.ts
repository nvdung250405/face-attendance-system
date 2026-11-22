/**
 * Hợp đồng dữ liệu Kết xuất Báo cáo Bảng công (API-WEB-018, APD-WEB-012, FR-WEB-006).
 */

export interface ExportReportParams {
  period: string // YYYY-MM
  departmentId?: string | number
  format?: 'xlsx' | 'csv' | 'pdf'
  keyword?: string
  status?: string
  fromDate?: string
  toDate?: string
}

export interface ExportReportResult {
  blob: Blob
  filename: string
}

export interface AttendanceReportItem {
  recordId?: number | string
  employeeCode: string
  fullName: string
  department?: string
  punchTimestamp: string
  punchType?: string
  status: string
  lateMinutes?: number
  kioskId?: string
  verificationMethod?: string
}

export interface ClientReportOptions {
  companyName?: string
  reportTitle?: string
  period?: string
  generatedAt?: string
  departmentName?: string
  records: AttendanceReportItem[]
  stats?: {
    totalEmployees?: number
    presentCount?: number
    onTimeCount?: number
    lateCount?: number
    absentCount?: number
    faceRecognitionRate?: number
  }
}
