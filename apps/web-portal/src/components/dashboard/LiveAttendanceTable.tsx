/**
 * LiveAttendanceTable: Bảng Dữ Liệu Chấm Công Trực Tiếp Thời Gian Thực
 * (UXD-WEB-004, UI-WEB-003, DD-WEB-014, BLD-WEB-006, TASK-WEB-010).
 *
 * Tối ưu hóa (EXP2-08, EXP3-09, EXP3-10):
 * 1. Dùng useMemo cho departments và filteredRecords để tránh tính toán lại trên mọi render.
 * 2. Tái sử dụng formatTime từ @/utils/date.
 * 3. Chuẩn hóa hiển thị huy hiệu trạng thái qua AttendanceStatusBadge (dùng Badge từ @/components/ui/badge).
 * 4. Tách và memoize AttendanceRowItem để giữ tính ổn định khi render dòng bảng.
 */

import React, { useState, useMemo } from 'react'
import { TableSkeleton } from '@/components/ui'
import { AttendanceStatusBadge } from '@/components/attendance'
import { formatTime } from '@/utils/date'
import { useDebounce } from '@/hooks'
import {
  ScanFace,
  Lock,
  Search,
  CalendarCheck,
  UserCheck,
  RotateCcw,
  X,
  Edit3,
} from 'lucide-react'
import type { AttendanceRecord } from '@/types'

export interface LiveAttendanceTableProps {
  records: AttendanceRecord[]
  isLoading?: boolean
  isConnected?: boolean
  highlightedRecordId?: number | null
  showFilters?: boolean
  onEditRecord?: (record: AttendanceRecord) => void
  selectedRecordIds?: number[]
  onToggleSelectRecord?: (recordId: number) => void
  onToggleSelectAll?: () => void
  showTelemetryColumns?: boolean
}

export { AttendanceStatusBadge } from '@/components/attendance'

const formatConfidence = (score?: number | null): string => {
  if (score == null) return ''
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score)
  return `${pct}%`
}

interface AttendanceRowItemProps {
  record: AttendanceRecord
  isHighlighted: boolean
  onEditRecord?: (record: AttendanceRecord) => void
  isSelected?: boolean
  onToggleSelectRecord?: (recordId: number) => void
  showTelemetryColumns?: boolean
}

const AttendanceRowItem: React.FC<AttendanceRowItemProps> = React.memo(
  ({
    record,
    isHighlighted,
    onEditRecord,
    isSelected,
    onToggleSelectRecord,
    showTelemetryColumns = false,
  }) => {
    return (
      <tr
        data-testid={`attendance-row-${record.recordId}`}
        className={`transition-colors duration-500 group ${
          isHighlighted
            ? 'bg-emerald-50/90 ring-2 ring-emerald-400 ring-inset animate-pulse'
            : isSelected
              ? 'bg-indigo-50/50'
              : 'hover:bg-indigo-50/25'
        }`}
      >
        {onToggleSelectRecord && (
          <td className="py-3 px-3 text-center whitespace-nowrap">
            <input
              type="checkbox"
              data-testid={`select-record-checkbox-${record.recordId}`}
              aria-label={`Chọn bản ghi của ${record.fullName}`}
              checked={Boolean(isSelected)}
              onChange={() => onToggleSelectRecord(record.recordId)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </td>
        )}

        <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900 whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">
          {formatTime(record.punchTimestamp)}
        </td>

        <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-600 whitespace-nowrap">
          <span className="truncate max-w-[200px] block" title={record.employeeCode}>
            {record.employeeCode}
          </span>
        </td>

        <td className="py-3 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
          <span className="truncate max-w-[200px] block" title={record.fullName}>
            {record.fullName}
          </span>
        </td>

        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
          <span className="truncate max-w-[200px] block" title={record.department || '—'}>
            {record.department || '—'}
          </span>
        </td>

        <td className="py-3 px-4 text-xs whitespace-nowrap">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
              record.punchType === 'CHECK_IN'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {record.punchType === 'CHECK_IN' ? 'VÀO CA' : 'RA CA'}
          </span>
        </td>

        <td className="py-3 px-4 text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              {record.verificationMethod === 'VERIFICATION_FACE' ||
              record.verificationMethod === 'FACE_MATCH' ? (
                <>
                  <ScanFace size={15} className="text-indigo-600 shrink-0" />
                  <span>Khuôn mặt</span>
                </>
              ) : record.verificationMethod === 'MANUAL_HR' ||
                record.verificationMethod === 'HR_OVERRIDE' ? (
                <>
                  <UserCheck size={15} className="text-blue-600 shrink-0" />
                  <span>HR Điều chỉnh</span>
                </>
              ) : (
                <>
                  <Lock size={15} className="text-amber-600 shrink-0" />
                  <span>Mã PIN</span>
                </>
              )}
            </span>
            {!showTelemetryColumns && record.confidenceScore != null && (
              <span
                data-testid={`confidence-badge-${record.recordId}`}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                  (record.confidenceScore <= 1 ? record.confidenceScore : record.confidenceScore / 100) >= 0.8
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                title={`Độ tin cậy nhận diện: ${formatConfidence(record.confidenceScore)}`}
              >
                {formatConfidence(record.confidenceScore)}
              </span>
            )}
          </div>
        </td>

        {showTelemetryColumns && (
          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
            {record.confidenceScore != null ? (
              <span
                data-testid={`confidence-badge-${record.recordId}`}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                  (record.confidenceScore <= 1 ? record.confidenceScore : record.confidenceScore / 100) >= 0.8
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                title={`Độ tin cậy nhận diện: ${formatConfidence(record.confidenceScore)}`}
              >
                {formatConfidence(record.confidenceScore)}
              </span>
            ) : (
              <span className="text-slate-400 font-mono">—</span>
            )}
          </td>
        )}

        <td className="py-3 px-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <AttendanceStatusBadge status={record.status} lateMinutes={record.lateMinutes} />
            {!showTelemetryColumns && record.overtimeMinutes != null && record.overtimeMinutes > 0 && (
              <span
                data-testid={`overtime-badge-${record.recordId}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                title={`Tăng ca +${record.overtimeMinutes} phút`}
              >
                +{record.overtimeMinutes}m OT
              </span>
            )}
          </div>
        </td>

        {showTelemetryColumns && (
          <td className="py-3 px-4 text-xs whitespace-nowrap">
            {record.overtimeMinutes != null && record.overtimeMinutes > 0 ? (
              <span
                data-testid={`overtime-badge-${record.recordId}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                title={`Tăng ca +${record.overtimeMinutes} phút`}
              >
                +{record.overtimeMinutes}m OT
              </span>
            ) : (
              <span className="text-slate-400 font-mono">—</span>
            )}
          </td>
        )}

        <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
          <span className="truncate max-w-[200px] block" title={record.kioskId}>
            {record.kioskId}
          </span>
        </td>

        {onEditRecord && (
          <td className="py-3 px-4 text-xs whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              data-testid={`adjust-record-btn-${record.recordId}`}
              aria-label={`Điều chỉnh bản ghi điểm danh của ${record.fullName}`}
              onClick={() => onEditRecord(record)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer shrink-0"
              title="Điều chỉnh giờ công / trạng thái"
            >
              <Edit3 size={13} className="shrink-0" />
              <span>Sửa</span>
            </button>
          </td>
        )}
      </tr>
    )
  }
)

AttendanceRowItem.displayName = 'AttendanceRowItem'

export const LiveAttendanceTable: React.FC<LiveAttendanceTableProps> = ({
  records,
  isLoading = false,
  highlightedRecordId = null,
  showFilters = true,
  onEditRecord,
  selectedRecordIds,
  onToggleSelectRecord,
  onToggleSelectAll,
  showTelemetryColumns = false,
}) => {
  const [filterKeyword, setFilterKeyword] = useState('')
  const debouncedKeyword = useDebounce(filterKeyword, 350)
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const totalColumns =
    (onEditRecord ? 9 : 8) +
    (onToggleSelectRecord ? 1 : 0) +
    (showTelemetryColumns ? 2 : 0)

  // Danh sách các phòng ban phân biệt (EXP2-08: Memoized)
  const departments = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.department).filter(Boolean)))
  }, [records])

  // Lọc dữ liệu hiển thị (EXP2-08: Memoized, DEF-SAFE-01: useDebounce 350ms)
  const filteredRecords = useMemo(() => {
    const q = debouncedKeyword.toLowerCase().trim()
    return records.filter((rec) => {
      if (q) {
        const matchCode = (rec.employeeCode || '').toLowerCase().includes(q)
        const matchName = (rec.fullName || '').toLowerCase().includes(q)
        if (!matchCode && !matchName) return false
      }
      if (filterDepartment && rec.department !== filterDepartment) {
        return false
      }
      if (filterStatus && rec.status !== filterStatus) {
        return false
      }
      return true
    })
  }, [records, debouncedKeyword, filterDepartment, filterStatus])

  // Giữ slice ổn định (Slice stability)
  const displayRows = useMemo(() => {
    return filteredRecords.slice(0, 100)
  }, [filteredRecords])

  const isFiltering = Boolean(filterKeyword || filterDepartment || filterStatus)

  return (
    <div
      className="card-surface overflow-hidden space-y-0 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]"
      data-testid="live-attendance-card"
    >
      {/* ── Header của Bảng ── */}
      <div className="px-6 py-4.5 border-b border-slate-200/80 bg-linear-to-r from-slate-50/90 via-white to-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Sự Kiện Điểm Danh Trực Tiếp
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {isFiltering
              ? `(${filteredRecords.length} / ${records.length} sự kiện)`
              : `(${records.length} sự kiện gần nhất)`}
          </span>
        </div>

        {/* ── Bộ lọc nhanh ── */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-3 text-slate-400 pointer-events-none shrink-0"
              />
              <input
                type="text"
                data-testid="live-search-input"
                aria-label="Tìm kiếm lượt điểm danh"
                placeholder="Tìm theo Mã NV, Họ tên..."
                maxLength={100}
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg pl-8.5 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-48 sm:w-60 focus:w-68 transition-all"
              />
              {filterKeyword && (
                <button
                  type="button"
                  onClick={() => setFilterKeyword('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-sm shrink-0"
                >
                  <X size={13} className="shrink-0" />
                </button>
              )}
            </div>

            {departments.length > 0 && (
              <select
                data-testid="live-filter-department"
                aria-label="Lọc theo phòng ban"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              >
                <option value="">Tất cả phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}

            <select
              data-testid="live-filter-status"
              aria-label="Lọc theo trạng thái điểm danh"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ON_TIME">Đúng giờ</option>
              <option value="LATE">Đi muộn</option>
              <option value="EARLY_LEAVE">Về sớm</option>
              <option value="OVERTIME">Tăng ca</option>
              <option value="ANOMALOUS">Bất thường</option>
            </select>

            {(filterKeyword || filterDepartment || filterStatus) && (
              <button
                type="button"
                data-testid="live-clear-filters-btn"
                onClick={() => {
                  setFilterKeyword('')
                  setFilterDepartment('')
                  setFilterStatus('')
                }}
                title="Đặt lại tất cả bộ lọc"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors shrink-0"
              >
                <RotateCcw size={12} className="shrink-0" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Bảng Dữ liệu Điểm danh ── */}
      <div className="overflow-x-auto max-h-140 overflow-y-auto">
        <table
          className="w-full text-left text-sm"
          data-testid="live-attendance-table"
        >
          <thead>
            <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {onToggleSelectRecord && (
                <th scope="col" className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    data-testid="select-all-attendance-checkbox"
                    aria-label="Chọn tất cả bản ghi"
                    checked={
                      displayRows.length > 0 &&
                      displayRows.every((r) => selectedRecordIds?.includes(r.recordId))
                    }
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
              )}
              <th scope="col" className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">
                Giờ Quẹt
              </th>
              <th scope="col" className="py-3 px-4">Mã NV</th>
              <th scope="col" className="py-3 px-4">Họ và Tên</th>
              <th scope="col" className="py-3 px-4">Phòng Ban</th>
              <th scope="col" className="py-3 px-4">Loại Quẹt</th>
              <th scope="col" className="py-3 px-4">Phương Thức</th>
              {showTelemetryColumns && (
                <th scope="col" className="py-3 px-4">Độ Tin Cậy</th>
              )}
              <th scope="col" className="py-3 px-4">Trạng Thái</th>
              {showTelemetryColumns && (
                <th scope="col" className="py-3 px-4">Tăng Ca</th>
              )}
              <th scope="col" className="py-3 px-4">Trạm Kiosk</th>
              {onEditRecord && (
                <th scope="col" className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-20">
                  Thao Tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading && records.length === 0 ? (
              <TableSkeleton
                columns={totalColumns}
                rows={6}
                hasActionColumn={Boolean(onEditRecord)}
                ariaLabel="Đang nạp dữ liệu chấm công..."
              />
            ) : displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="py-16 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck size={24} strokeWidth={1.5} className="shrink-0" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">
                    Chưa có lượt điểm danh nào phù hợp
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Dữ liệu sẽ xuất hiện tự động ngay khi có nhân viên quẹt thẻ
                    tại Kiosk.
                  </p>
                </td>
              </tr>
            ) : (
              displayRows.map((record) => (
                <AttendanceRowItem
                  key={record.recordId}
                  record={record}
                  isHighlighted={highlightedRecordId === record.recordId}
                  onEditRecord={onEditRecord}
                  isSelected={selectedRecordIds?.includes(record.recordId)}
                  onToggleSelectRecord={onToggleSelectRecord}
                  showTelemetryColumns={showTelemetryColumns}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
