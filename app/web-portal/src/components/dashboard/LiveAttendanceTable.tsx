/**
 * LiveAttendanceTable: Bảng Dữ Liệu Chấm Công Trực Tiếp Thời Gian Thực
 * (UXD-WEB-004, UI-WEB-003, DD-WEB-014, BLD-WEB-006, TASK-WEB-010).
 *
 * Tính năng chính:
 * 1. Tiêu đề dính (Sticky Header) hỗ trợ cuộn mượt mà.
 * 2. Hiệu ứng chớp sáng Green Flash (1.5s) trên dòng mới nhất khi nhận tin STOMP (DD-WEB-014).
 * 3. Hiển thị huy hiệu trạng thái: Đúng giờ (ON_TIME), Đi muộn (LATE kèm số phút trễ), Phương thức (Khuôn mặt / PIN).
 * 4. Bộ lọc nhanh cục bộ theo từ khóa (Mã NV, Họ tên), phòng ban và trạng thái.
 */

import React, { useState } from 'react'
import type { AttendanceRecord } from '@/types'

export interface LiveAttendanceTableProps {
  records: AttendanceRecord[]
  isLoading?: boolean
  isConnected?: boolean
  highlightedRecordId?: number | null
}

function formatTimeOnly(isoString?: string): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return isoString
  }
}

export const LiveAttendanceTable: React.FC<LiveAttendanceTableProps> = ({
  records,
  isLoading = false,
  isConnected = false,
  highlightedRecordId = null,
}) => {
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Danh sách các phòng ban phân biệt
  const departments = Array.from(
    new Set(records.map((r) => r.department).filter(Boolean))
  )

  // Lọc dữ liệu hiển thị
  const filteredRecords = records.filter((rec) => {
    if (filterKeyword) {
      const q = filterKeyword.toLowerCase()
      const matchCode = rec.employeeCode.toLowerCase().includes(q)
      const matchName = rec.fullName.toLowerCase().includes(q)
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

  return (
    <div className="card-surface overflow-hidden space-y-0" data-testid="live-attendance-card">
      {/* ── Header của Bảng ── */}
      <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary">
            Sự Kiện Điểm Danh Trực Tiếp
          </h2>
          <div
            data-testid="live-stomp-status-badge"
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-100 text-status-success'
                : 'bg-amber-100 text-status-warning'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isConnected ? 'Kiosk Live' : 'Mất kết nối'}</span>
          </div>
          <span className="text-xs text-text-muted">
            ({records.length} sự kiện gần nhất)
          </span>
        </div>

        {/* ── Bộ lọc nhanh ── */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            data-testid="live-search-input"
            placeholder="Tìm theo Mã NV, Họ tên..."
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            className="input-base text-xs h-8.5 w-44 sm:w-56"
          />

          {departments.length > 0 && (
            <select
              data-testid="live-filter-department"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="input-base text-xs h-8.5 w-36"
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-base text-xs h-8.5 w-32"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ON_TIME">Đúng giờ</option>
            <option value="LATE">Đi muộn</option>
            <option value="EARLY_LEAVE">Về sớm</option>
          </select>
        </div>
      </div>

      {/* ── Bảng Dữ liệu Điểm danh ── */}
      <div className="overflow-x-auto max-h-140 overflow-y-auto">
        <table
          className="w-full text-left text-sm"
          data-testid="live-attendance-table"
        >
          <thead>
            <tr className="table-sticky-header">
              <th className="py-3 px-4">Giờ Quẹt</th>
              <th className="py-3 px-4">Mã NV</th>
              <th className="py-3 px-4">Họ và Tên</th>
              <th className="py-3 px-4">Phòng Ban</th>
              <th className="py-3 px-4">Loại Quẹt</th>
              <th className="py-3 px-4">Phương Thức</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4">Trạm Kiosk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading && records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-muted">
                  <div className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin w-5 h-5 text-brand-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Đang nạp dữ liệu chấm công...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-muted">
                  <p className="font-semibold text-text-secondary">
                    Chưa có lượt điểm danh nào phù hợp
                  </p>
                  <p className="text-xs mt-1">
                    Dữ liệu sẽ xuất hiện tự động ngay khi có nhân viên quẹt thẻ tại Kiosk.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const isHighlighted = highlightedRecordId === record.recordId

                return (
                  <tr
                    key={record.recordId}
                    data-testid={`attendance-row-${record.recordId}`}
                    className={`transition-colors duration-700 ${
                      isHighlighted
                        ? 'bg-emerald-50 ring-2 ring-emerald-400 ring-inset animate-pulse'
                        : 'table-row-hover'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary whitespace-nowrap">
                      {formatTimeOnly(record.punchTimestamp)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-xs text-brand-primary whitespace-nowrap">
                      {record.employeeCode}
                    </td>

                    <td className="py-3 px-4 text-xs font-semibold text-text-primary whitespace-nowrap">
                      {record.fullName}
                    </td>

                    <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                      {record.department || '—'}
                    </td>

                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          record.punchType === 'CHECK_IN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {record.punchType === 'CHECK_IN' ? 'VÀO CA' : 'RA CA'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-text-secondary">
                        {record.verificationMethod === 'VERIFICATION_FACE' ? (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-brand-primary"
                            >
                              <circle cx="12" cy="8" r="4" />
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                            <span>Khuôn mặt</span>
                          </>
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-amber-600"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>Mã PIN</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {record.status === 'ON_TIME' ? (
                        <span className="badge-success">Đúng giờ</span>
                      ) : record.status === 'LATE' ? (
                        <span className="badge-warning">
                          Đi muộn ({record.lateMinutes}p)
                        </span>
                      ) : (
                        <span className="badge-danger">Về sớm</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-text-muted whitespace-nowrap">
                      {record.kioskId}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
