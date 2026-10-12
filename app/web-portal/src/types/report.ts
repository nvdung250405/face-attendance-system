/**
 * Hợp đồng dữ liệu Kết xuất Báo cáo Bảng công (API-WEB-018, APD-WEB-012, FR-WEB-006).
 */

export interface ExportReportParams {
  period: string // YYYY-MM
  departmentId?: string | number
  format?: 'xlsx' | 'csv'
}

export interface ExportReportResult {
  blob: Blob
  filename: string
}
