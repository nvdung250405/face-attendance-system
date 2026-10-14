/**
 * Hộp thoại Xuất Báo Cáo Bảng Công Excel/PDF (BLD-WEB-016, TASK-WEB-020, DD-WEB-017, SOL-WEB-005).
 *
 * Cho phép HR / Quản trị viên tùy chỉnh:
 * 1. Định dạng xuất: Excel Spreadsheet (.xlsx / .csv) hoặc Báo cáo PDF (.pdf).
 * 2. Tên công ty xuất hiện trên đầu tệp: mặc định "CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS".
 * 3. Tiêu đề báo cáo & Kỳ báo cáo (tháng/năm).
 * 4. Chống Formula Injection tự động và hỗ trợ in ấn trực tiếp.
 */

import React, { useState } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  Building2,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react'
import type { AttendanceReportItem } from '@/types'

export interface ExportReportModalProps {
  isOpen: boolean
  onClose: () => void
  recordsCount: number
  records: AttendanceReportItem[]
  currentPeriod?: string
  currentDepartment?: string
  onExport: (options: {
    format: 'xlsx' | 'pdf'
    companyName: string
    reportTitle: string
    period: string
  }) => Promise<void>
  onPrintPreview?: (options: {
    companyName: string
    reportTitle: string
    period: string
  }) => void
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  recordsCount,
  currentPeriod,
  onExport,
  onPrintPreview,
}) => {
  const now = new Date()
  const defaultPeriod =
    currentPeriod || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx')
  const [companyName, setCompanyName] = useState('CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS')
  const [reportTitle, setReportTitle] = useState('BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ')
  const [period, setPeriod] = useState(defaultPeriod)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!companyName.trim()) {
      setErrorMessage('Vui lòng nhập tên công ty hiển thị trên báo cáo.')
      return
    }

    try {
      setIsSubmitting(true)
      await onExport({
        format,
        companyName: companyName.trim(),
        reportTitle: reportTitle.trim() || 'BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ',
        period: period.trim() || defaultPeriod,
      })
      onClose()
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể xuất báo cáo. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    if (onPrintPreview) {
      onPrintPreview({
        companyName: companyName.trim(),
        reportTitle: reportTitle.trim() || 'BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ',
        period: period.trim() || defaultPeriod,
      })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="export-report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="card-surface w-full max-w-lg bg-white shadow-2xl rounded-3xl border border-slate-200/80 overflow-hidden space-y-5 p-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-primary flex items-center justify-center">
              {format === 'xlsx' ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              ) : (
                <FileText className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Xuất Báo Cáo Bảng Công</h3>
              <p className="text-2xs text-text-secondary">
                Định dạng chuẩn doanh nghiệp, mốc thời gian &amp; chống Formula Injection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div
            data-testid="export-modal-error"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Chọn định dạng */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">
              Định dạng tệp xuất <span className="text-status-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                data-testid="format-option-xlsx"
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-border-subtle hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="xlsx"
                  data-testid="export-format-xlsx"
                  checked={format === 'xlsx'}
                  onChange={() => setFormat('xlsx')}
                  className="sr-only"
                />
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">Excel Spreadsheet</div>
                  <div className="text-2xs text-text-secondary">Tệp .xlsx / .csv bảng tính</div>
                </div>
              </label>

              <label
                data-testid="format-option-pdf"
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  format === 'pdf'
                    ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                    : 'border-border-subtle hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  data-testid="export-format-pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="sr-only"
                />
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">Tài liệu PDF</div>
                  <div className="text-2xs text-text-secondary">Tệp .pdf / Bản in trang trọng</div>
                </div>
              </label>
            </div>
          </div>

          {/* Tên công ty */}
          <div className="space-y-1">
            <label
              htmlFor="export-company-name"
              className="text-xs font-semibold text-text-secondary flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-text-tertiary" />
              <span>Tên công ty / Cơ quan</span>
            </label>
            <input
              id="export-company-name"
              type="text"
              data-testid="export-company-name-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS..."
            />
          </div>

          {/* Tiêu đề báo cáo */}
          <div className="space-y-1">
            <label
              htmlFor="export-report-title"
              className="text-xs font-semibold text-text-secondary flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-text-tertiary" />
              <span>Tiêu đề báo cáo</span>
            </label>
            <input
              id="export-report-title"
              type="text"
              data-testid="export-report-title-input"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              placeholder="VD: BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ..."
            />
          </div>

          {/* Kỳ báo cáo */}
          <div className="space-y-1">
            <label
              htmlFor="export-period"
              className="text-xs font-semibold text-text-secondary flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
              <span>Kỳ báo cáo (Tháng/Năm)</span>
            </label>
            <input
              id="export-period"
              type="text"
              data-testid="export-period-input"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono"
              placeholder="YYYY-MM (VD: 2026-10)"
            />
          </div>

          {/* Thông tin số lượng bản ghi */}
          <div className="p-3 bg-slate-50 rounded-xl border border-border-subtle flex items-center justify-between text-2xs text-text-secondary">
            <span>Số lượng bản ghi sẵn sàng xuất:</span>
            <span className="font-bold font-mono text-text-primary text-xs" data-testid="export-records-count">
              {recordsCount} bản ghi
            </span>
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {onPrintPreview ? (
              <button
                type="button"
                onClick={handlePrint}
                data-testid="print-preview-btn"
                className="btn-secondary text-xs py-2.5 px-3 flex items-center gap-1.5"
                title="Xem trước &amp; In báo cáo"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xem bản in</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                data-testid="cancel-export-btn"
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="confirm-export-btn"
                className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang xuất tệp...' : 'Tải Xuống Báo Cáo'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
