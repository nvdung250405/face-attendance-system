/**
 * Dịch vụ Kết xuất Báo cáo Bảng công (ReportExportService - APD-WEB-012, API-WEB-018, DD-WEB-017, FR-WEB-006).
 *
 * Gửi yêu cầu tải file bảng công định dạng Excel (.xlsx), trích xuất blob dữ liệu và kích hoạt tải về.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type { ExportReportParams, ExportReportResult } from '@/types'

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
