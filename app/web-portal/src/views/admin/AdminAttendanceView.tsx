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
  Pause,
} from 'lucide-react'
import { Button } from '@/components/common'
import { attendanceService } from '@/services/attendanceService'
import { reportExportService } from '@/services/reportExportService'
import { useLiveAttendance } from '@/services/hooks/useLiveAttendance'
import { LiveAttendanceTable } from '@/components/dashboard/LiveAttendanceTable'
import { ExportReportModal } from '@/components/report'
import { AdjustAttendanceModal } from '@/components/attendance/AdjustAttendanceModal'
import type { AttendanceRecord, AttendanceStatus, AttendanceStats } from '@/types'

export const AdminAttendanceView: React.FC = () => {
  // Dữ liệu bảng chấm công & Thống kê
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false)
  const [recordToAdjust, setRecordToAdjust] = useState<AttendanceRecord | null>(null)
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

  // Kiểm tra một bản ghi STOMP có khớp bộ lọc hiện hành hay không (đồng bộ với predicate REST)
  const recordMatchesFilters = useCallback(
    (rec: AttendanceRecord): boolean => {
      const kw = keyword.trim().toLowerCase()
      if (kw) {
        const matches =
          (rec.employeeCode || '').toLowerCase().includes(kw) ||
          (rec.fullName || '').toLowerCase().includes(kw)
        if (!matches) return false
      }
      if (department && rec.department !== department) return false
      if (status && rec.status !== status) return false

      const datePart = rec.punchTimestamp ? rec.punchTimestamp.slice(0, 10) : ''
      if (fromDate && datePart && datePart < fromDate) return false
      if (toDate && datePart && datePart > toDate) return false

      return true
    },
    [keyword, department, status, fromDate, toDate]
  )

  // Xử lý sự kiện điểm danh thời gian thực từ trạm Kiosk qua STOMP
  const handleStompRecordReceived = useCallback(
    (newRecord: AttendanceRecord) => {
      // 1. Tự động tăng bộ đếm thống kê (KPI hôm nay, độc lập với bộ lọc bảng)
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

      // 2. Nếu có bộ lọc active và bản ghi không khớp -> bỏ qua hoàn toàn (không chèn bảng/không tăng totalElements)
      if (!recordMatchesFilters(newRecord)) {
        return
      }

      // 3. Nếu chế độ Live đang Bật -> Chèn trực tiếp lên đầu bảng (Optimistic Prepend)
      if (isLiveEnabled) {
        setRecords((prev) => {
          const existingFiltered = prev.filter((r) => r.recordId !== newRecord.recordId)
          return [newRecord, ...existingFiltered].slice(0, 100)
        })
        setTotalElements((prev) => prev + 1)

        // Kích hoạt hiệu ứng Green Flash 3 giây trên dòng mới nhất (BLD-WEB-015)
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
    [isLiveEnabled, recordMatchesFilters]
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
          <div className="flex items-center gap-3">
            <h1 className="page-title flex items-center gap-3">
              <span>Bảng Chấm Công HR Trực Tiếp</span>
              <span data-testid="hr-stomp-status-badge" className="sr-only">
                {isConnected ? 'Kiosk Live' : 'Mất kết nối'}
              </span>
            </h1>
          </div>
          <p className="page-subtitle">
            Theo dõi sự kiện quét thẻ thời gian thực từ các trạm Kiosk và tra cứu lịch sử chấm công
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Nút bật/tắt Live Mode */}
          <Button
            type="button"
            onClick={handleToggleLiveMode}
            data-testid="toggle-live-mode-btn"
            variant={isLiveEnabled ? 'secondary' : 'ghost'}
            size="sm"
            leftIcon={
              isLiveEnabled ? (
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-slate-500" />
              )
            }
          >
            {isLiveEnabled ? 'Trực tiếp: BẬT' : 'Tạm dừng Live'}
          </Button>

          {/* Badge thông báo bản ghi chờ khi tạm dừng live */}
          {!isLiveEnabled && pendingLiveCount > 0 && (
            <button
              type="button"
              onClick={flushPendingRecords}
              data-testid="flush-pending-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50/90 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
              </span>
              <span>+{pendingLiveCount} bản ghi mới</span>
            </button>
          )}

          {/* Làm mới dữ liệu */}
          <Button
            type="button"
            onClick={fetchAttendanceData}
            data-testid="refresh-attendance-btn"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>

          {/* Nút xuất báo cáo Excel & PDF (TASK-WEB-020) */}
          <div className="flex items-center rounded-lg bg-indigo-600 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => handleExportReport()}
              disabled={isExporting}
              data-testid="export-attendance-report-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Đang xuất...' : 'Xuất Báo Cáo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              disabled={isExporting}
              data-testid="open-export-modal-btn"
              title="Tùy chọn xuất báo cáo Excel / PDF"
              className="px-2 py-2 text-white hover:bg-indigo-700 transition-colors border-l border-white/20"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Thanh 4 Thẻ Chỉ Số KPI Nhanh ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Lượt điểm danh */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Lượt quẹt hôm nay
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/15 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              <History className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div data-testid="kpi-today-punches" className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
              {stats?.presentCount ?? totalElements}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Ghi nhận từ các máy trạm biên</p>
          </div>
        </div>

        {/* Thẻ 2: Đúng giờ */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Đúng giờ
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/15 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div data-testid="kpi-today-ontime" className="text-2xl font-extrabold font-mono text-emerald-600 tracking-tight">
              {stats?.onTimeCount ?? '—'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Đúng khung giờ ca làm việc</p>
          </div>
        </div>

        {/* Thẻ 3: Đi muộn */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Đi muộn
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/15 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div data-testid="kpi-today-late" className="text-2xl font-extrabold font-mono text-amber-600 tracking-tight">
              {stats?.lateCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Lượt quẹt sau mốc bắt đầu ca</p>
          </div>
        </div>

        {/* Thẻ 4: Nhận diện khuôn mặt */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
              Xác thực khuôn mặt
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/15 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              <ScanFace className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div data-testid="kpi-face-ratio" className="text-2xl font-extrabold font-mono text-indigo-600 tracking-tight">
              {records.length > 0
                ? `${Math.round(
                    (records.filter((r) => r.verificationMethod === 'VERIFICATION_FACE').length /
                      records.length) *
                      100
                  )}%`
                : '100%'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Tỷ lệ xác thực sinh trắc ArcFace</p>
          </div>
        </div>
      </div>

      {/* ── Bộ Lọc Nâng Cao Đồng Bộ (Unified Filters) ── */}
      <div className="card-surface p-4 space-y-3">
        {/* Hàng 1: Ô tìm kiếm từ khóa & 3 Dropdown bộ lọc */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Ô tìm kiếm từ khóa */}
          <div className="flex-1 min-w-56 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              data-testid="filter-keyword-input"
              aria-label="Tìm kiếm lượt điểm danh"
              placeholder="Tìm theo Mã NV, Họ tên..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            />
          </div>

          {/* Lọc theo phòng ban */}
          <div className="w-full sm:w-44">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value)
                setPage(0)
              }}
              data-testid="filter-department-select"
              aria-label="Lọc theo phòng ban"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            >
              <option value="">Tất cả phòng ban</option>
              <option value="Phòng Kỹ thuật">Phòng Kỹ thuật</option>
              <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
              <option value="Phòng Nhân sự">Phòng Nhân sự</option>
              <option value="Phòng Tài chính">Phòng Tài chính</option>
            </select>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="w-full sm:w-38">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
              data-testid="filter-status-select"
              aria-label="Lọc theo trạng thái điểm danh"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ON_TIME">Đúng giờ</option>
              <option value="LATE">Đi muộn</option>
              <option value="EARLY_LEAVE">Về sớm</option>
            </select>
          </div>

          {/* Lọc theo phương thức xác thực */}
          <div className="w-full sm:w-44">
            <select
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              data-testid="filter-method-select"
              aria-label="Lọc theo phương thức xác thực"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
            >
              <option value="">Tất cả phương thức</option>
              <option value="VERIFICATION_FACE">Khuôn mặt (Face)</option>
              <option value="VERIFICATION_PIN">Mã PIN</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Khoảng ngày & Nút Xóa lọc */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 mr-1">Khoảng ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(0)
              }}
              data-testid="filter-from-date"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
              title="Từ ngày"
            />
            <span className="text-slate-400 text-xs font-medium">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(0)
              }}
              data-testid="filter-to-date"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all"
              title="Đến ngày"
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-center self-end sm:self-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={handleResetFilters}
                data-testid="reset-filters-btn"
                leftIcon={<X className="w-3.5 h-3.5" />}
                className="h-9 px-3 text-xs font-semibold text-rose-700 bg-rose-50/80 border-rose-200 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-800 shadow-2xs shrink-0 cursor-pointer"
              >
                Xóa tất cả lọc
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-sm font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs underline font-semibold hover:text-rose-900 ml-2"
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
          showFilters={false}
          onEditRecord={(record) => setRecordToAdjust(record)}
        />

        {/* ── Thanh Phân Trang (Chuẩn hóa theo EmployeeManagementView) ── */}
        <div className="card-surface p-4 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-900">{displayRecords.length}</span> /{' '}
            <span className="font-semibold text-slate-900">{totalElements}</span> lượt điểm danh
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              data-testid="page-size-select"
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value={20}>20 dòng / trang</option>
              <option value={50}>50 dòng / trang</option>
              <option value={100}>100 dòng / trang</option>
            </select>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              data-testid="prev-page-btn"
            >
              Trước
            </Button>

            <span className="px-2 font-semibold text-slate-700">Trang {page + 1}</span>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={(page + 1) * pageSize >= totalElements}
              onClick={() => setPage((p) => p + 1)}
              data-testid="next-page-btn"
            >
              Sau
            </Button>
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

      {/* ── Modal Điều Chỉnh Giờ Công & Trạng Thái (API-BE-048, API-WEB-021) ── */}
      <AdjustAttendanceModal
        isOpen={!!recordToAdjust}
        record={recordToAdjust}
        onClose={() => setRecordToAdjust(null)}
        onSuccess={() => {
          fetchAttendanceData()
        }}
      />
    </div>
  )
}
