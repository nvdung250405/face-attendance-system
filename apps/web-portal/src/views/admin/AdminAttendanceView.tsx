/**
 * AdminAttendanceView: Màn hình Bảng Chấm Công HR Trực Tiếp & Lịch Sử Toàn Công Ty
 * (UXD-WEB-004, UI-WEB-003, SOL-WEB-004, DD-WEB-007, DD-WEB-014, BLD-WEB-015, TASK-WEB-019).
 *
 * Tối ưu hóa (EXP1-01, EXP1-09, EXP1-15, EXP3-02, EXP3-08, EXP3-11, EXP3-16, ARCH-02):
 * 1. ARCH-02: Đóng gói STOMP buffer và WebSocket handling vào hook useLiveAttendanceBuffer.
 * 2. ARCH-02: Tách thanh bộ lọc đa chiều thành AttendanceFilterToolbar và phân trang thành AttendancePaginationBar.
 * 3. EXP1-01: Dùng filterPredicateRef tránh WebSocket re-subscription storm khi gõ phím.
 * 4. EXP1-09: useMemo cho exportableRecords và chỉ render ExportReportModal khi mở.
 * 5. EXP1-15, EXP3-08: Tái sử dụng fetchAttendanceData trực tiếp trong useEffect.
 * 6. EXP3-02: Memoize các phép tính KPI, filter calculations và kiểm soát giới hạn phân trang.
 * 7. EXP3-11: Khai báo status & verificationMethod theo Union Type chuẩn.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  History,
  RotateCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  ScanFace,
  Radio,
  SlidersHorizontal,
  Pause,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { useDebounce } from '@/hooks'
import { attendanceService } from '@/services/attendanceService'
import { reportExportService } from '@/services/reportExportService'
import { LiveAttendanceTable } from '@/components/dashboard/LiveAttendanceTable'
import { ExportReportModal } from '@/components/report'
import {
  AdjustAttendanceModal,
  BulkAdjustAttendanceModal,
  AttendanceFilterToolbar,
  useLiveAttendanceBuffer,
} from '@/components/attendance'
import type { AttendanceRecord, AttendanceStatus, AttendanceStats, VerificationMethod } from '@/types'

export const AdminAttendanceView: React.FC = () => {
  // Dữ liệu bảng chấm công & Thống kê
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false)
  const [recordToAdjust, setRecordToAdjust] = useState<AttendanceRecord | null>(null)
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([])
  const [isBulkAdjustModalOpen, setIsBulkAdjustModalOpen] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Bộ lọc tìm kiếm (EXP3-11: Union Types, STAB-004: useDebounce 350ms)
  const [keyword, setKeyword] = useState<string>('')
  const debouncedKeyword = useDebounce(keyword, 350)
  const [department, setDepartment] = useState<string>('')
  const [status, setStatus] = useState<AttendanceStatus | ''>('')
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod | ''>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Phân trang
  const [page, setPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalElements, setTotalElements] = useState<number>(0)

  // Kiểm tra một bản ghi STOMP có khớp bộ lọc hiện hành hay không (WEB-F-11: PERF-003 dùng debouncedKeyword)
  const recordMatchesFilters = useCallback(
    (rec: AttendanceRecord): boolean => {
      const kw = debouncedKeyword.trim().toLowerCase()
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
    [debouncedKeyword, department, status, fromDate, toDate]
  )

  // Callback tăng KPI khi có lượt quẹt mới
  const handleStatsIncrement = useCallback((newRecord: AttendanceRecord) => {
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
  }, [])

  const handleRecordAdded = useCallback(() => {
    setTotalElements((prev) => prev + 1)
  }, [])

  // Hook buffer STOMP thời gian thực (ARCH-02)
  const {
    records,
    setRecords,
    isLiveEnabled,
    pendingLiveCount,
    flushPendingRecords,
    handleToggleLiveMode,
    highlightedRecordId,
    isConnected,
  } = useLiveAttendanceBuffer({
    filterPredicate: recordMatchesFilters,
    onStatsIncrement: handleStatsIncrement,
    onRecordAdded: handleRecordAdded,
  })

  // Tải dữ liệu từ REST API
  const fetchAttendanceData = useCallback(async () => {
    try {
      const [pageData, statsData] = await Promise.allSettled([
        attendanceService.getAdminAttendance({
          page,
          size: pageSize,
          keyword: debouncedKeyword.trim() || undefined,
          department: department || undefined,
          status: status || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
        attendanceService.getAttendanceStats(),
      ])

      setErrorMessage(null)
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
  }, [page, pageSize, debouncedKeyword, department, status, fromDate, toDate, setRecords])

  // Tái sử dụng fetchAttendanceData trực tiếp trong useEffect (EXP1-15, EXP3-08, PERF-03)
  useEffect(() => {
    void fetchAttendanceData()
  }, [fetchAttendanceData])

  // Lọc cục bộ theo phương thức xác thực nếu có (EXP3-02: Memoized)
  const displayRecords = useMemo(() => {
    if (!verificationMethod) return records
    return records.filter((r) => r.verificationMethod === verificationMethod)
  }, [records, verificationMethod])

  // Memoize danh sách bản ghi xuất báo cáo (EXP1-09)
  const exportableRecords = useMemo(() => {
    return records.map((r) => ({
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
  }, [records])

  // Memoize tỷ lệ xác thực khuôn mặt (EXP3-02)
  const faceRecognitionRatio = useMemo(() => {
    if (records.length === 0) return '100%'
    const faceCount = records.filter(
      (r) => r.verificationMethod === 'VERIFICATION_FACE' || r.verificationMethod === 'FACE_MATCH'
    ).length
    return `${Math.round((faceCount / records.length) * 100)}%`
  }, [records])

  // Xử lý giới hạn trang an toàn (EXP3-02: Pagination boundary handling)
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalElements / pageSize))
  }, [totalElements, pageSize])

  // Phân tách điều chỉnh giới hạn trang khỏi fetchAttendanceData để chống re-render phân trang (RCT-01)
  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1)
    if (page > maxPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(maxPage)
    }
  }, [page, totalPages, totalElements])

  // Xử lý chọn nhiều dòng chấm công để chỉnh sửa hàng loạt (BIZ-01)
  const handleToggleSelectRecord = useCallback((recordId: number) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    )
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    setSelectedRecordIds((prev) => {
      const currentDisplayIds = displayRecords.map((r) => r.recordId)
      const allSelected =
        currentDisplayIds.length > 0 && currentDisplayIds.every((id) => prev.includes(id))
      if (allSelected) {
        return prev.filter((id) => !currentDisplayIds.includes(id))
      }
      return Array.from(new Set([...prev, ...currentDisplayIds]))
    })
  }, [displayRecords])

  const selectedRecords = useMemo(() => {
    return records.filter((r) => selectedRecordIds.includes(r.recordId))
  }, [records, selectedRecordIds])

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
      const clientOptions = {
        companyName: company,
        reportTitle: title,
        period: currentPeriod,
        generatedAt: new Date().toLocaleString('vi-VN'),
        departmentName: department || 'Toàn bộ phòng ban',
        records: exportableRecords,
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
    reportExportService.printReport({
      companyName: opts.companyName,
      reportTitle: opts.reportTitle,
      period: opts.period,
      generatedAt: new Date().toLocaleString('vi-VN'),
      departmentName: department || 'Toàn bộ phòng ban',
      records: exportableRecords,
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
  const handleResetFilters = useCallback(() => {
    setKeyword('')
    setDepartment('')
    setStatus('')
    setVerificationMethod('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return Boolean(keyword || department || status || verificationMethod || fromDate || toDate)
  }, [keyword, department, status, verificationMethod, fromDate, toDate])

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
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600 shrink-0" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50/90 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
              </span>
              <span>+{pendingLiveCount} bản ghi mới</span>
            </button>
          )}

          {/* Nút Chỉnh sửa hàng loạt (BIZ-01) */}
          {selectedRecordIds.length > 0 && (
            <Button
              type="button"
              onClick={() => setIsBulkAdjustModalOpen(true)}
              data-testid="bulk-adjust-trigger-btn"
              variant="primary"
              size="sm"
              leftIcon={<Users className="w-3.5 h-3.5 shrink-0" />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Chỉnh sửa hàng loạt ({selectedRecordIds.length})
            </Button>
          )}

          {/* Làm mới dữ liệu */}
          <Button
            type="button"
            onClick={fetchAttendanceData}
            data-testid="refresh-attendance-btn"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>

          {/* Nút xuất báo cáo Excel & PDF (TASK-WEB-020) */}
          <div className="flex items-center rounded-lg bg-indigo-600 shadow-xs overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => handleExportReport()}
              disabled={isExporting}
              data-testid="export-attendance-report-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{isExporting ? 'Đang xuất...' : 'Xuất Báo Cáo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              disabled={isExporting}
              data-testid="open-export-modal-btn"
              title="Tùy chọn xuất báo cáo Excel / PDF"
              className="px-2 py-2 text-white hover:bg-indigo-700 transition-colors border-l border-white/20 shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
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
              <History className="w-4.5 h-4.5 shrink-0" />
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
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
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
              <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
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
              <ScanFace className="w-4.5 h-4.5 shrink-0" />
            </div>
          </div>
          <div>
            <div data-testid="kpi-face-ratio" className="text-2xl font-extrabold font-mono text-indigo-600 tracking-tight">
              {faceRecognitionRatio}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Tỷ lệ xác thực sinh trắc ArcFace</p>
          </div>
        </div>
      </div>

      {/* ── Bộ Lọc Nâng Cao Đồng Bộ (ARCH-02: Modularized AttendanceFilterToolbar) ── */}
      <AttendanceFilterToolbar
        keyword={keyword}
        department={department}
        status={status}
        verificationMethod={verificationMethod}
        fromDate={fromDate}
        toDate={toDate}
        hasActiveFilters={hasActiveFilters}
        onKeywordChange={(val) => {
          setKeyword(val)
          setPage(0)
        }}
        onDepartmentChange={(val) => {
          setDepartment(val)
          setPage(0)
        }}
        onStatusChange={(val) => {
          setStatus(val)
          setPage(0)
        }}
        onVerificationMethodChange={(val) => setVerificationMethod(val)}
        onFromDateChange={(val) => {
          setFromDate(val)
          setPage(0)
        }}
        onToDateChange={(val) => {
          setToDate(val)
          setPage(0)
        }}
        onResetFilters={handleResetFilters}
      />

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
          selectedRecordIds={selectedRecordIds}
          onToggleSelectRecord={handleToggleSelectRecord}
          onToggleSelectAll={handleToggleSelectAll}
        />

        {/* ── Thanh Phân Trang Chuẩn Hóa (Global PaginationBar) ── */}
        <PaginationBar
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(0)
          }}
          pageSizeOptions={[20, 50, 100]}
          itemLabel="lượt điểm danh"
        />
      </div>

      {/* ── Modal Tùy chọn Xuất Báo Cáo Excel/PDF (EXP1-09: conditional mount & memoized records) ── */}
      {isExportModalOpen && (
        <ExportReportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          recordsCount={records.length}
          records={exportableRecords}
          currentPeriod={fromDate ? fromDate.slice(0, 7) : undefined}
          currentDepartment={department}
          onExport={handleExportReport}
          onPrintPreview={handlePrintPreview}
        />
      )}

      {/* ── Modal Điều Chỉnh Giờ Công & Trạng Thái (API-BE-048, API-WEB-021) ── */}
      <AdjustAttendanceModal
        isOpen={!!recordToAdjust}
        record={recordToAdjust}
        onClose={() => setRecordToAdjust(null)}
        onSuccess={() => {
          fetchAttendanceData()
        }}
      />

      {/* ── Modal Chỉnh Sửa Hàng Loạt (BIZ-01, RFC-02) ── */}
      {isBulkAdjustModalOpen && (
        <BulkAdjustAttendanceModal
          isOpen={isBulkAdjustModalOpen}
          selectedRecords={selectedRecords}
          onClose={() => setIsBulkAdjustModalOpen(false)}
          onSuccess={() => {
            setSelectedRecordIds([])
            void fetchAttendanceData()
          }}
        />
      )}
    </div>
  )
}
