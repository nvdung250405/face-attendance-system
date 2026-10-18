/**
 * AdminAttendanceView: Màn hình Bảng Chấm Công HR Trực Tiếp & Lịch Sử Toàn Công Ty
 * (UXD-WEB-004, UI-WEB-003, SOL-WEB-004, DD-WEB-007, DD-WEB-014, BLD-WEB-015, TASK-WEB-019).
 *
 * Tính năng chính:
 * 1. Bảng dữ liệu chấm công thời gian thực (Live Table) kết nối STOMP qua hook useLiveAttendance.
 * 2. Tự động chèn dòng mới lên đầu mảng (Optimistic Prepend) kèm hiệu ứng Green Flash trong 3 giây.
 * 3. Bộ lọc đa chiều: Từ khóa (Mã NV, Họ tên), Phòng ban, Trạng thái, Phương thức xác thực, Khoảng ngày.
 * 4. Công tắc chuyển đổi Chế độ Trực Tiếp (Live Stream Mode On/Off) chống giật màn hình khi duyệt lịch sử.
 * 5. Thanh chỉ số KPI nhanh (Tổng lượt điểm danh, Đúng giờ, Đi muộn, Tỷ lệ nhận diện khuôn mặt).
 * 6. Tích hợp tải lại dữ liệu thủ công và nút xuất báo cáo bảng công.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  History,
  RotateCw,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  ScanFace,
  Radio,
  SlidersHorizontal,
  X,
  Play,
  Pause,
} from 'lucide-react'
import { attendanceService } from '@/services/attendanceService'
import { reportExportService } from '@/services/reportExportService'
import { useLiveAttendance } from '@/services/hooks/useLiveAttendance'
import { LiveAttendanceTable } from '@/components/dashboard/LiveAttendanceTable'
import { ExportReportModal } from '@/components/report'
import type { AttendanceRecord, AttendanceStatus, AttendanceStats } from '@/types'

export const AdminAttendanceView: React.FC = () => {
  // Dữ liệu bảng chấm công & Thống kê
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Hiệu ứng Green Flash trong 3 giây trên dòng mới nhất (BLD-WEB-015, DD-WEB-014)
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Chế độ nhận dữ liệu trực tiếp (Live Stream Mode)
  const [isLiveEnabled, setIsLiveEnabled] = useState<boolean>(true)
  const [pendingLiveCount, setPendingLiveCount] = useState<number>(0)
  const pendingRecordsRef = useRef<AttendanceRecord[]>([])

  // Bộ lọc tìm kiếm
  const [keyword, setKeyword] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [verificationMethod, setVerificationMethod] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Phân trang
  const [page, setPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalElements, setTotalElements] = useState<number>(0)

  // Tải dữ liệu từ REST API
  const fetchAttendanceData = useCallback(async () => {
    setErrorMessage(null)
    try {
      const [pageData, statsData] = await Promise.allSettled([
        attendanceService.getAdminAttendance({
          page,
          size: pageSize,
          keyword: keyword.trim() || undefined,
          department: department || undefined,
          status: (status as AttendanceStatus) || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
        attendanceService.getAttendanceStats(),
      ])

      if (pageData.status === 'fulfilled' && pageData.value) {
        setRecords(pageData.value.content || [])
        setTotalElements(pageData.value.totalElements || 0)
      } else if (pageData.status === 'rejected') {
        const err = pageData.reason as { message?: string }
        setErrorMessage(err.message || 'Không thể tải danh sách điểm danh.')
      }

      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value)
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, keyword, department, status, fromDate, toDate])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const [pageData, statsData] = await Promise.allSettled([
          attendanceService.getAdminAttendance({
            page,
            size: pageSize,
            keyword: keyword.trim() || undefined,
            department: department || undefined,
            status: (status as AttendanceStatus) || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          }),
          attendanceService.getAttendanceStats(),
        ])

        if (ignore) return

        if (pageData.status === 'fulfilled' && pageData.value) {
          setRecords(pageData.value.content || [])
          setTotalElements(pageData.value.totalElements || 0)
        } else if (pageData.status === 'rejected') {
          const err = pageData.reason as { message?: string }
          setErrorMessage(err.message || 'Không thể tải danh sách điểm danh.')
        }

        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats(statsData.value)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [page, pageSize, keyword, department, status, fromDate, toDate])

  // Xử lý sự kiện điểm danh thời gian thực từ trạm Kiosk qua STOMP
  const handleStompRecordReceived = useCallback(
    (newRecord: AttendanceRecord) => {
      // 1. Tự động tăng bộ đếm thống kê
      setStats((prev) => {
        if (!prev) return prev
        const total = prev.totalEmployees ?? 0
        const newPresent = prev.presentCount + 1
        const newOnTime =
          newRecord.status === 'ON_TIME' ? prev.onTimeCount + 1 : prev.onTimeCount
        const newLate =
          newRecord.status === 'LATE' ? prev.lateCount + 1 : prev.lateCount
        return {
          ...prev,
          presentCount: newPresent,
          onTimeCount: newOnTime,
          lateCount: newLate,
          absentCount: Math.max(0, total - newPresent),
        }
      })

      // 2. Nếu chế độ Live đang Bật -> Chèn trực tiếp lên đầu bảng (Optimistic Prepend)
      if (isLiveEnabled) {
        setRecords((prev) => {
          const existingFiltered = prev.filter((r) => r.recordId !== newRecord.recordId)
          return [newRecord, ...existingFiltered].slice(0, 100)
        })
        setTotalElements((prev) => prev + 1)

        // 3. Kích hoạt hiệu ứng Green Flash 3 giây trên dòng mới nhất (BLD-WEB-015)
        setHighlightedRecordId(newRecord.recordId)
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedRecordId((current) =>
            current === newRecord.recordId ? null : current
          )
        }, 3000)
      } else {
        // Nếu Live Mode đang Tắt -> Lưu vào danh sách chờ
        pendingRecordsRef.current = [newRecord, ...pendingRecordsRef.current]
        setPendingLiveCount((c) => c + 1)
      }
    },
    [isLiveEnabled]
  )

  // Kết nối WebSocket STOMP
  const { isConnected } = useLiveAttendance({
    onRecordReceived: handleStompRecordReceived,
  })

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  // Cập nhật các bản ghi đang chờ vào bảng khi bật lại Live Mode hoặc click badge
  const flushPendingRecords = useCallback(() => {
    if (pendingRecordsRef.current.length > 0) {
      const pending = [...pendingRecordsRef.current]
      pendingRecordsRef.current = []
      setPendingLiveCount(0)

      setRecords((prev) => {
        const map = new Map<number, AttendanceRecord>()
        for (const item of [...pending, ...prev]) {
          map.set(item.recordId, item)
        }
        return Array.from(map.values()).slice(0, 100)
      })

      // Highlight bản ghi mới nhất trong 3 giây
      if (pending[0]) {
        setHighlightedRecordId(pending[0].recordId)
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedRecordId(null)
        }, 3000)
      }
    }
  }, [])

  const handleToggleLiveMode = () => {
    if (!isLiveEnabled) {
      flushPendingRecords()
      setIsLiveEnabled(true)
    } else {
      setIsLiveEnabled(false)
    }
  }

  // Lọc cục bộ theo phương thức xác thực nếu có
  const displayRecords = useMemo(() => {
    if (!verificationMethod) return records
    return records.filter((r) => r.verificationMethod === verificationMethod)
  }, [records, verificationMethod])

  // Xuất báo cáo bảng công Excel/PDF (TASK-WEB-020, BLD-WEB-016, DD-WEB-017)
  const handleExportReport = async (options?: {
    format?: 'xlsx' | 'pdf'
    companyName?: string
    reportTitle?: string
    period?: string
  }) => {
    setIsExporting(true)
    const exportFormat = options?.format || 'xlsx'
    const now = new Date()
    const currentPeriod =
      options?.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const company = options?.companyName || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS'
    const title = options?.reportTitle || 'BÁO CÁO BẢNG CHẤM CÔNG NHÂN SỰ'

    try {
      const result = await reportExportService.exportTimesheetReport({
        period: currentPeriod,
        format: exportFormat,
        departmentId: department || undefined,
        keyword: keyword.trim() || undefined,
        status: status || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })
      reportExportService.triggerDownload(result.blob, result.filename)
    } catch {
      // Fallback xuất client-side nếu backend không trả file (DD-WEB-017)
      const clientItems = records.map((r) => ({
        recordId: r.recordId,
        employeeCode: r.employeeCode,
        fullName: r.fullName,
        department: r.department,
        punchTimestamp: r.punchTimestamp,
        punchType: r.punchType,
        status: r.status,
        lateMinutes: r.lateMinutes,
        kioskId: r.kioskId,
        verificationMethod: r.verificationMethod,
      }))

      const clientOptions = {
        companyName: company,
        reportTitle: title,
        period: currentPeriod,
        generatedAt: new Date().toLocaleString('vi-VN'),
        departmentName: department || 'Toàn bộ phòng ban',
        records: clientItems,
        stats: stats
          ? {
              totalEmployees: stats.totalEmployees,
              presentCount: stats.presentCount,
              onTimeCount: stats.onTimeCount,
              lateCount: stats.lateCount,
              absentCount: stats.absentCount,
              faceRecognitionRate:
                stats.presentCount > 0
                  ? Math.round((stats.onTimeCount / stats.presentCount) * 100)
                  : 100,
            }
          : undefined,
      }

      if (exportFormat === 'pdf') {
        const result = reportExportService.generateClientPdfReport(clientOptions)
        reportExportService.triggerDownload(result.blob, result.filename)
      } else {
        const result = reportExportService.generateClientExcelReport(clientOptions)
        reportExportService.triggerDownload(result.blob, result.filename)
      }
    } finally {
      setIsExporting(false)
    }
  }

  // Xem trước & In ấn báo cáo (TASK-WEB-020)
  const handlePrintPreview = (opts: {
    companyName: string
    reportTitle: string
    period: string
  }) => {
    const clientItems = records.map((r) => ({
      recordId: r.recordId,
      employeeCode: r.employeeCode,
      fullName: r.fullName,
      department: r.department,
      punchTimestamp: r.punchTimestamp,
      punchType: r.punchType,
      status: r.status,
      lateMinutes: r.lateMinutes,
      kioskId: r.kioskId,
      verificationMethod: r.verificationMethod,
    }))

    reportExportService.printReport({
      companyName: opts.companyName,
      reportTitle: opts.reportTitle,
      period: opts.period,
      generatedAt: new Date().toLocaleString('vi-VN'),
      departmentName: department || 'Toàn bộ phòng ban',
      records: clientItems,
      stats: stats
        ? {
            totalEmployees: stats.totalEmployees,
            presentCount: stats.presentCount,
            onTimeCount: stats.onTimeCount,
            lateCount: stats.lateCount,
            absentCount: stats.absentCount,
          }
        : undefined,
    })
  }

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setKeyword('')
    setDepartment('')
    setStatus('')
    setVerificationMethod('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  const hasActiveFilters = Boolean(
    keyword || department || status || verificationMethod || fromDate || toDate
  )

  return (
    <div className="space-y-6" data-testid="admin-attendance-view">
      {/* ── Tiêu đề trang & Thanh công cụ ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold text-text-primary flex items-center gap-3">
                <span>Bảng Chấm Công HR Trực Tiếp</span>
                {/* Badge STOMP Live */}
                <div
                  data-testid="hr-stomp-status-badge"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isConnected
                      ? 'bg-emerald-50 text-status-success border border-emerald-200'
                      : 'bg-amber-50 text-status-warning border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isConnected ? 'Kiosk Live' : 'Mất kết nối'}</span>
                </div>
              </h1>
              <p className="page-subtitle text-xs text-text-secondary mt-0.5">
                Theo dõi sự kiện quét thẻ thời gian thực từ các trạm Kiosk và tra cứu lịch sử chấm công
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Nút bật/tắt Live Mode */}
          <button
            type="button"
            onClick={handleToggleLiveMode}
            data-testid="toggle-live-mode-btn"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isLiveEnabled
                ? 'bg-emerald-50 text-status-success border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isLiveEnabled ? (
              <>
                <Radio className="w-3.5 h-3.5 animate-pulse text-status-success" />
                <span>Trực tiếp: BẬT</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-500" />
                <span>Tạm dừng Live</span>
              </>
            )}
          </button>

          {/* Badge thông báo bản ghi chờ khi tạm dừng live */}
          {!isLiveEnabled && pendingLiveCount > 0 && (
            <button
              type="button"
              onClick={flushPendingRecords}
              data-testid="flush-pending-btn"
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-brand-50 text-brand-primary border border-brand-200 hover:bg-brand-100 animate-bounce"
            >
              <Play className="w-3.5 h-3.5" />
              <span>+{pendingLiveCount} bản ghi mới</span>
            </button>
          )}

          {/* Làm mới dữ liệu */}
          <button
            type="button"
            onClick={fetchAttendanceData}
            data-testid="refresh-attendance-btn"
            title="Làm mới dữ liệu"
            className="p-2.5 rounded-xl border border-border-subtle bg-white text-text-secondary hover:text-text-primary hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nhóm nút xuất báo cáo Excel & PDF (TASK-WEB-020) */}
          <div className="flex items-center rounded-xl bg-brand-primary p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => handleExportReport()}
              disabled={isExporting}
              data-testid="export-attendance-report-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Đang xuất...' : 'Xuất Báo Cáo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              disabled={isExporting}
              data-testid="open-export-modal-btn"
              title="Tùy chọn xuất báo cáo Excel / PDF"
              className="px-2 py-2 text-white hover:bg-brand-hover rounded-lg transition-colors border-l border-white/20"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Thanh 4 Thẻ Chỉ Số KPI Nhanh ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Lượt điểm danh */}
        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-brand-50 text-brand-primary">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium">Lượt quẹt hôm nay</span>
            <div data-testid="kpi-today-punches" className="text-xl font-bold text-text-primary mt-0.5">
              {stats?.presentCount ?? totalElements}
            </div>
          </div>
        </div>

        {/* Thẻ 2: Đúng giờ */}
        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-status-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium">Đúng giờ</span>
            <div data-testid="kpi-today-ontime" className="text-xl font-bold text-status-success mt-0.5">
              {stats?.onTimeCount ?? '—'}
            </div>
          </div>
        </div>

        {/* Thẻ 3: Đi muộn */}
        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium">Đi muộn</span>
            <div data-testid="kpi-today-late" className="text-xl font-bold text-amber-700 mt-0.5">
              {stats?.lateCount ?? 0}
            </div>
          </div>
        </div>

        {/* Thẻ 4: Nhận diện khuôn mặt */}
        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
            <ScanFace className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium">Xác thực khuôn mặt</span>
            <div data-testid="kpi-face-ratio" className="text-xl font-bold text-indigo-700 mt-0.5">
              {records.length > 0
                ? `${Math.round(
                    (records.filter((r) => r.verificationMethod === 'VERIFICATION_FACE').length /
                      records.length) *
                      100
                  )}%`
                : '100%'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bộ Lọc Nâng Cao ── */}
      <div className="card-surface p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bộ Lọc Dữ Liệu Chấm Công</span>
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              data-testid="reset-filters-btn"
              className="text-xs text-status-danger hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Ô tìm kiếm từ khóa */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              data-testid="filter-keyword-input"
              placeholder="Mã NV hoặc Họ tên..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          {/* Lọc theo phòng ban */}
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value)
              setPage(0)
            }}
            data-testid="filter-department-select"
            className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-secondary"
          >
            <option value="">Tất cả phòng ban</option>
            <option value="Phòng Kỹ thuật">Phòng Kỹ thuật</option>
            <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
            <option value="Phòng Nhân sự">Phòng Nhân sự</option>
            <option value="Phòng Tài chính">Phòng Tài chính</option>
          </select>

          {/* Lọc theo trạng thái */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
            data-testid="filter-status-select"
            className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-secondary"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ON_TIME">Đúng giờ</option>
            <option value="LATE">Đi muộn</option>
            <option value="EARLY_LEAVE">Về sớm</option>
          </select>

          {/* Lọc theo phương thức xác thực */}
          <select
            value={verificationMethod}
            onChange={(e) => setVerificationMethod(e.target.value)}
            data-testid="filter-method-select"
            className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-text-secondary"
          >
            <option value="">Tất cả phương thức</option>
            <option value="VERIFICATION_FACE">Khuôn mặt (Face)</option>
            <option value="VERIFICATION_PIN">Mã PIN</option>
          </select>

          {/* Lọc theo ngày */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(0)
              }}
              data-testid="filter-from-date"
              className="w-full px-2 py-2 text-xs rounded-xl border border-border-subtle bg-white text-text-secondary"
            />
            <span className="text-xs text-text-muted">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(0)
              }}
              data-testid="filter-to-date"
              className="w-full px-2 py-2 text-xs rounded-xl border border-border-subtle bg-white text-text-secondary"
            />
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="underline font-semibold ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ── Bảng Dữ Liệu Live Attendance Table ── */}
      <div className="space-y-4">
        <LiveAttendanceTable
          records={displayRecords}
          isLoading={isLoading}
          isConnected={isConnected}
          highlightedRecordId={highlightedRecordId}
        />

        {/* ── Thanh Phân Trang ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-secondary px-2">
          <div>
            Hiển thị <strong>{displayRecords.length}</strong> / <strong>{totalElements}</strong> lượt điểm danh
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              data-testid="page-size-select"
              className="px-2 py-1 rounded-lg border border-border-subtle bg-white text-xs text-text-secondary"
            >
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
              <option value={100}>100 dòng / trang</option>
            </select>

            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              data-testid="prev-page-btn"
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-white text-xs font-semibold text-text-secondary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Trang trước
            </button>

            <span className="font-semibold text-text-primary px-1">
              Trang {page + 1}
            </span>

            <button
              type="button"
              disabled={(page + 1) * pageSize >= totalElements}
              onClick={() => setPage((p) => p + 1)}
              data-testid="next-page-btn"
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-white text-xs font-semibold text-text-secondary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Tùy chọn Xuất Báo Cáo Excel/PDF (TASK-WEB-020, BLD-WEB-016) ── */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        recordsCount={records.length}
        records={records.map((r) => ({
          recordId: r.recordId,
          employeeCode: r.employeeCode,
          fullName: r.fullName,
          department: r.department,
          punchTimestamp: r.punchTimestamp,
          punchType: r.punchType,
          status: r.status,
          lateMinutes: r.lateMinutes,
          kioskId: r.kioskId,
          verificationMethod: r.verificationMethod,
        }))}
        currentPeriod={fromDate ? fromDate.slice(0, 7) : undefined}
        currentDepartment={department}
        onExport={handleExportReport}
        onPrintPreview={handlePrintPreview}
      />
    </div>
  )
}
