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

import React, { useState } from "react";
import {
  ScanFace,
  Lock,
  Search,
  CalendarCheck,
  UserCheck,
  RotateCcw,
  X,
  Edit3,
} from "lucide-react";
import type { AttendanceRecord } from "@/types";

export interface LiveAttendanceTableProps {
  records: AttendanceRecord[];
  isLoading?: boolean;
  isConnected?: boolean;
  highlightedRecordId?: number | null;
  showFilters?: boolean;
  onEditRecord?: (record: AttendanceRecord) => void;
}

function formatTimeOnly(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

export const LiveAttendanceTable: React.FC<LiveAttendanceTableProps> = ({
  records,
  isLoading = false,
  highlightedRecordId = null,
  showFilters = true,
  onEditRecord,
}) => {
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Danh sách các phòng ban phân biệt
  const departments = Array.from(
    new Set(records.map((r) => r.department).filter(Boolean)),
  );

  // Lọc dữ liệu hiển thị
  const filteredRecords = records.filter((rec) => {
    if (filterKeyword) {
      const q = filterKeyword.toLowerCase();
      const matchCode = (rec.employeeCode || "").toLowerCase().includes(q);
      const matchName = (rec.fullName || "").toLowerCase().includes(q);
      if (!matchCode && !matchName) return false;
    }
    if (filterDepartment && rec.department !== filterDepartment) {
      return false;
    }
    if (filterStatus && rec.status !== filterStatus) {
      return false;
    }
    return true;
  });

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
            ({records.length} sự kiện gần nhất)
          </span>
        </div>

        {/* ── Bộ lọc nhanh ── */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-3 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                data-testid="live-search-input"
                aria-label="Tìm kiếm lượt điểm danh"
                placeholder="Tìm theo Mã NV, Họ tên..."
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg pl-8.5 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 w-44 sm:w-52 transition-all"
              />
              {filterKeyword && (
                <button
                  type="button"
                  onClick={() => setFilterKeyword("")}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-sm"
                >
                  <X size={13} />
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
                  setFilterKeyword("");
                  setFilterDepartment("");
                  setFilterStatus("");
                }}
                title="Đặt lại tất cả bộ lọc"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors shrink-0"
              >
                <RotateCcw size={12} />
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
              <th className="py-3 px-4">Giờ Quẹt</th>
              <th className="py-3 px-4">Mã NV</th>
              <th className="py-3 px-4">Họ và Tên</th>
              <th className="py-3 px-4">Phòng Ban</th>
              <th className="py-3 px-4">Loại Quẹt</th>
              <th className="py-3 px-4">Phương Thức</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4">Trạm Kiosk</th>
              {onEditRecord && (
                <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  Thao Tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading && records.length === 0 ? (
              <tr>
                <td
                  colSpan={onEditRecord ? 9 : 8}
                  className="py-16 text-center text-text-muted"
                >
                  <div className="inline-flex items-center gap-2.5">
                    <svg
                      className="animate-spin w-5 h-5 text-indigo-600"
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
                    <span className="text-xs font-semibold text-slate-600">
                      Đang nạp dữ liệu chấm công...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={onEditRecord ? 9 : 8}
                  className="py-16 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck size={24} strokeWidth={1.5} />
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
              filteredRecords.map((record) => {
                const isHighlighted = highlightedRecordId === record.recordId;

                return (
                  <tr
                    key={record.recordId}
                    data-testid={`attendance-row-${record.recordId}`}
                    className={`transition-colors duration-500 ${
                      isHighlighted
                        ? "bg-emerald-50/90 ring-2 ring-emerald-400 ring-inset animate-pulse"
                        : "hover:bg-indigo-50/25"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                      {formatTimeOnly(record.punchTimestamp)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-600 whitespace-nowrap">
                      {record.employeeCode}
                    </td>

                    <td className="py-3 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {record.fullName}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {record.department || "—"}
                    </td>

                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          record.punchType === "CHECK_IN"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/70"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {record.punchType === "CHECK_IN" ? "VÀO CA" : "RA CA"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                        {record.verificationMethod === "VERIFICATION_FACE" ||
                        record.verificationMethod === "FACE_MATCH" ? (
                          <>
                            <ScanFace size={15} className="text-indigo-600" />
                            <span>Khuôn mặt</span>
                          </>
                        ) : record.verificationMethod === "MANUAL_HR" ||
                          record.verificationMethod === "HR_OVERRIDE" ? (
                          <>
                            <UserCheck size={15} className="text-blue-600" />
                            <span>HR Điều chỉnh</span>
                          </>
                        ) : (
                          <>
                            <Lock size={15} className="text-amber-600" />
                            <span>Mã PIN</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {record.status === "ON_TIME" ? (
                        <span className="badge-success">Đúng giờ</span>
                      ) : record.status === "LATE" ? (
                        <span className="badge-warning">
                          Đi muộn ({record.lateMinutes}p)
                        </span>
                      ) : record.status === "EARLY_LEAVE" ? (
                        <span className="badge-danger">Về sớm</span>
                      ) : record.status === "OVERTIME" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Tăng ca
                        </span>
                      ) : record.status === "ANOMALOUS" ? (
                        <span className="badge-danger">Bất thường</span>
                      ) : (
                        <span className="badge-neutral">{record.status}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {record.kioskId}
                    </td>

                    {onEditRecord && (
                      <td className="py-3 px-4 text-xs whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        <button
                          type="button"
                          data-testid={`adjust-record-btn-${record.recordId}`}
                          aria-label={`Điều chỉnh bản ghi điểm danh của ${record.fullName}`}
                          onClick={() => onEditRecord(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          title="Điều chỉnh giờ công / trạng thái"
                        >
                          <Edit3 size={13} />
                          <span>Sửa</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
