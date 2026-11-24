/**
 * Màn hình Quản lý Kỳ công & Chốt Kỳ Công Phía Quản trị
 * (SOL-WEB-008, BLD-WEB-019, UXD-WEB-006, FR-WEB-010, TASK-WEB-025).
 *
 * - Tra cứu danh mục kỳ công theo năm.
 * - Chốt kỳ công (LOCKED): Khóa điều chỉnh và lan tỏa cờ isAdjustmentLocked qua PayrollPeriodStore.
 * - Mở lại kỳ công (OPEN): Dành cho vai trò ADMIN, bắt buộc ghi rõ lý do mở khóa và ghi log kiểm toán.
 * - Cảnh báo nghiệp vụ UXD-WEB-006 hiển thị trực tiếp trên đầu bảng.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Lock,
  Unlock,
  Calendar,
  RotateCw,
  Download,
} from 'lucide-react'
import { Button, PaginationBar, TableSkeleton, toast } from '@/components/ui'
import { LockPayrollModal, UnlockPayrollModal } from '@/components/payroll'
import { payrollPeriodService } from '@/services/payrollPeriodService'
import { reportExportService } from '@/services/reportExportService'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { useAuthStore } from '@/store/authStore'
import type { PayrollPeriodResponse } from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

export const AdminPayrollPeriodView: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user)
  const isAdmin = currentUser?.role === 'ADMIN'

  // Store trạng thái kỳ công qua atomic selectors
  const periods = usePayrollPeriodStore((state) => state.periods)
  const selectedPeriod = usePayrollPeriodStore((state) => state.selectedPeriod)
  const isAdjustmentLocked = usePayrollPeriodStore((state) => state.isAdjustmentLocked)
  const setPeriods = usePayrollPeriodStore((state) => state.setPeriods)
  const setSelectedPeriod = usePayrollPeriodStore((state) => state.setSelectedPeriod)
  const updatePeriodStatus = usePayrollPeriodStore((state) => state.updatePeriodStatus)

  // Memoize danh sách kỳ công cùng các cờ khóa điều chỉnh
  const memoizedPeriods = useMemo(() => {
    return periods.map((period) => ({
      ...period,
      isPeriodLocked: period.status === 'LOCKED',
      isCurrentSelected: selectedPeriod?.id === period.id,
    }))
  }, [periods, selectedPeriod?.id])

  // Năm tra cứu
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Phân trang
  const [page, setPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(10)

  const totalElements = memoizedPeriods.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const safePage = Math.min(Math.max(0, page), totalPages - 1)
  const paginatedPeriods = useMemo(() => {
    const start = safePage * pageSize
    return memoizedPeriods.slice(start, start + pageSize)
  }, [memoizedPeriods, safePage, pageSize])

  // Modal Chốt kỳ công (Lock Modal)
  const [periodToLock, setPeriodToLock] = useState<PayrollPeriodResponse | null>(null)
  const [isLocking, setIsLocking] = useState<boolean>(false)

  // Modal Mở lại kỳ công (Unlock Modal)
  const [periodToUnlock, setPeriodToUnlock] = useState<PayrollPeriodResponse | null>(null)
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false)

  // Tải danh sách kỳ công
  const loadPayrollPeriods = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await payrollPeriodService.getPayrollPeriods({ year: selectedYear })
      setPeriods(data || [])
    } catch (err) {
      const error = err as NormalizedApiError
      toast.error(error.message || 'Không thể tải danh sách kỳ công.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear, setPeriods])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPayrollPeriods()
  }, [loadPayrollPeriods])

  // ── Thao tác Chốt Kỳ Công (Lock) ──────────────────────────────────────────

  const handleOpenLockModal = (period: PayrollPeriodResponse) => {
    setPeriodToLock(period)
  }

  const handleConfirmLockPeriod = async () => {
    if (!periodToLock) return
    const periodCode = `${periodToLock.periodYear}-${String(periodToLock.periodMonth).padStart(2, '0')}`

    try {
      setIsLocking(true)
      const updated = await payrollPeriodService.lockPeriod(periodCode)
      // Cập nhật trạng thái vào Store tập trung (lan tỏa isAdjustmentLocked)
      updatePeriodStatus(periodToLock.id, 'LOCKED', {
        lockedByName: updated.lockedByName || currentUser?.fullName || 'Quản trị viên Nhân sự',
        lockedAt: updated.lockedAt || new Date().toISOString(),
      })
      toast.success(
        `Đã chốt thành công kỳ công ${periodToLock.periodMonth}/${periodToLock.periodYear}. Toàn bộ chức năng điều chỉnh công của kỳ này đã được khóa.`
      )
      setPeriodToLock(null)
    } catch (err) {
      const error = err as NormalizedApiError
      toast.error(error.message || 'Không thể chốt kỳ công. Vui lòng kiểm tra lại.')
    } finally {
      setIsLocking(false)
    }
  }

  // ── Thao tác Mở lại Kỳ Công (Unlock) ──────────────────────────────────────

  const handleOpenUnlockModal = (period: PayrollPeriodResponse) => {
    setPeriodToUnlock(period)
  }

  const handleConfirmUnlockPeriod = async (reason: string) => {
    if (!periodToUnlock) return
    const periodCode = `${periodToUnlock.periodYear}-${String(periodToUnlock.periodMonth).padStart(2, '0')}`

    try {
      setIsUnlocking(true)
      await payrollPeriodService.unlockPeriod(periodCode, { reason })
      // Cập nhật trạng thái mở lại vào Store tập trung (isAdjustmentLocked -> false)
      updatePeriodStatus(periodToUnlock.id, 'OPEN')
      toast.success(
        `Đã mở lại thành công kỳ công ${periodToUnlock.periodMonth}/${periodToUnlock.periodYear}. Các nút điều chỉnh công đã được mở khóa.`
      )
      setPeriodToUnlock(null)
    } catch (err) {
      const error = err as NormalizedApiError
      toast.error(error.message || 'Không thể mở lại kỳ công. Vui lòng thử lại.')
      throw error
    } finally {
      setIsUnlocking(false)
    }
  }

  // ── Thao tác Xuất Báo Cáo Kỳ Công (TASK-WEB-020) ──────────────────────────
  const [exportingPeriodId, setExportingPeriodId] = useState<number | null>(null)

  const handleExportPeriodReport = async (period: PayrollPeriodResponse) => {
    const periodCode = `${period.periodYear}-${String(period.periodMonth).padStart(2, '0')}`
    try {
      setExportingPeriodId(period.id)
      const result = await reportExportService.exportTimesheetReport({
        period: periodCode,
        format: 'xlsx',
      })
      reportExportService.triggerDownload(result.blob, result.filename)
      toast.success(`Đã xuất thành công bảng công kỳ ${period.periodMonth}/${period.periodYear}.`)
    } catch {
      // Fallback tạo file client-side (DD-WEB-017)
      const fallbackResult = reportExportService.generateClientExcelReport({
        companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ FAS',
        reportTitle: `BẢNG TỔNG HỢP CÔNG KỲ ${period.periodMonth}/${period.periodYear}`,
        period: periodCode,
        generatedAt: new Date().toLocaleString('vi-VN'),
        records: [],
      })
      reportExportService.triggerDownload(fallbackResult.blob, fallbackResult.filename)
      toast.success(`Đã xuất bảng công (bản offline) kỳ ${period.periodMonth}/${period.periodYear}.`)
    } finally {
      setExportingPeriodId(null)
    }
  }

  return (
    <div className="space-y-6" data-testid="admin-payroll-period-view">
      {/* ── Tiêu đề trang & Thanh công cụ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Quản Lý & Chốt Kỳ Công
            {isAdjustmentLocked ? (
              <span data-testid="payroll-status-badge-locked" className="sr-only">
                Kỳ đang chọn: ĐÃ KHÓA
              </span>
            ) : (
              <span data-testid="payroll-status-badge-open" className="sr-only">
                Kỳ đang chọn: ĐANG MỞ
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            Chốt bảng công hàng tháng, lan tỏa cờ khóa điều chỉnh và mở lại kỳ công có kiểm toán
          </p>
        </div>

        {/* Bộ chọn năm & Nút làm mới */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Năm:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value))
                setPage(0)
              }}
              data-testid="select-payroll-year"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadPayrollPeriods}
            data-testid="refresh-payroll-periods-btn"
            title="Làm mới dữ liệu"
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* ── Cảnh báo Nghiệp vụ Kỳ Đã Chốt ── */}
      {selectedPeriod && selectedPeriod.status === 'LOCKED' && (
        <div
          data-testid="payroll-locked-active-alert"
          className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs"
        >
          <div className="p-1.5 rounded-lg bg-amber-200 text-amber-800 mt-0.5 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-amber-900">
              Kỳ công {selectedPeriod.periodMonth}/{selectedPeriod.periodYear} ĐÃ ĐƯỢC CHỐT
            </p>
            <p className="text-amber-800 leading-relaxed">
              Kỳ công này đã được chốt bởi{' '}
              <span className="font-semibold">{selectedPeriod.lockedByName || 'Quản trị viên'}</span>
              {selectedPeriod.lockedAt ? ` vào lúc ${new Date(selectedPeriod.lockedAt).toLocaleString('vi-VN')}` : ''}.
              Toàn bộ các nút duyệt đơn, phân ca và điều chỉnh công của kỳ này đang bị vô hiệu hóa trên toàn hệ thống.
            </p>
          </div>
        </div>
      )}

      {/* ── Bảng Danh Sách Kỳ Công Trong Năm ── */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th scope="col" className="py-3 px-4">Kỳ Công</th>
                <th scope="col" className="py-3 px-4">Trạng Thái</th>
                <th scope="col" className="py-3 px-4">Thông Tin Chốt Kỳ</th>
                <th scope="col" className="py-3 px-4">Thông Tin Mở Lại (Gần nhất)</th>
                <th scope="col" className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                  Thao Tác Quản Trị
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <TableSkeleton columns={5} rows={5} hasActionColumn ariaLabel={`Đang tải danh sách kỳ công năm ${selectedYear}...`} />
              ) : memoizedPeriods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-secondary">
                    Không có dữ liệu kỳ công nào cho năm {selectedYear}.
                  </td>
                </tr>
              ) : (
                paginatedPeriods.map((period) => {
                  const { isPeriodLocked, isCurrentSelected } = period

                  return (
                    <tr
                      key={period.id}
                      data-testid={`payroll-period-row-${period.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Kỳ công tháng/năm */}
                      <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
                          <span>
                            Tháng {String(period.periodMonth).padStart(2, '0')}/{period.periodYear}
                          </span>
                          {isCurrentSelected && (
                            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-brand-primary text-white shrink-0">
                              Đang chọn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        <span
                          data-testid={`period-status-badge-${period.id}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold shrink-0 ${
                            isPeriodLocked
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-status-success border border-emerald-300'
                          }`}
                        >
                          {isPeriodLocked ? (
                            <>
                              <Lock className="w-3 h-3 shrink-0" />
                              <span>ĐÃ CHỐT</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3 shrink-0" />
                              <span>ĐANG MỞ</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Thông tin chốt kỳ */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        {isPeriodLocked ? (
                          <div className="space-y-0.5">
                            <span
                              className="font-semibold text-text-primary block truncate max-w-[200px]"
                              title={period.lockedByName || 'Quản trị viên'}
                            >
                              {period.lockedByName || 'Quản trị viên'}
                            </span>
                            <span className="text-2xs font-mono text-text-muted">
                              {period.lockedAt
                                ? new Date(period.lockedAt).toLocaleString('vi-VN')
                                : '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      {/* Thông tin mở lại */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        {period.unlockReason ? (
                          <div className="space-y-0.5">
                            <span
                              className="font-semibold text-text-primary block truncate max-w-[200px]"
                              title={period.unlockedByName || 'Quản trị viên'}
                            >
                              {period.unlockedByName || 'Quản trị viên'}
                            </span>
                            <span
                              className="text-2xs text-text-secondary italic block truncate max-w-[200px]"
                              title={period.unlockReason}
                            >
                              "{period.unlockReason}"
                            </span>
                            <span className="text-2xs font-mono text-text-muted">
                              {period.unlockedAt
                                ? new Date(period.unlockedAt).toLocaleString('vi-VN')
                                : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-bg-app shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Nút chọn làm kỳ hiện hành */}
                          {!isCurrentSelected && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedPeriod(period)}
                              data-testid={`select-period-btn-${period.id}`}
                            >
                              Chọn kỳ này
                            </Button>
                          )}

                          {/* Nút Chốt kỳ công */}
                          {!isPeriodLocked ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenLockModal(period)}
                              data-testid={`lock-period-btn-${period.id}`}
                              leftIcon={<Lock className="w-3.5 h-3.5 shrink-0" />}
                              className="text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300 font-bold"
                            >
                              Chốt Kỳ
                            </Button>
                          ) : (
                            /* Nút Mở lại kỳ công (chỉ khả dụng nếu là ADMIN) */
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenUnlockModal(period)}
                              disabled={!isAdmin}
                              title={
                                !isAdmin
                                  ? 'Chỉ Quản trị viên (ADMIN) mới có quyền mở lại kỳ công đã chốt'
                                  : 'Mở lại kỳ công (Bắt buộc nhập lý do)'
                              }
                              data-testid={`unlock-period-btn-${period.id}`}
                              leftIcon={<Unlock className="w-3.5 h-3.5 shrink-0" />}
                              className="text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 font-bold"
                            >
                              Mở Lại Kỳ
                            </Button>
                          )}

                          {/* Nút Xuất Báo Cáo Kỳ Công */}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void handleExportPeriodReport(period)}
                            disabled={exportingPeriodId === period.id}
                            title="Xuất bảng công kỳ này"
                            data-testid={`export-period-btn-${period.id}`}
                            leftIcon={<Download className="w-3.5 h-3.5 shrink-0" />}
                          >
                            {exportingPeriodId === period.id ? 'Đang xuất...' : 'Xuất File'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && totalElements > 0 && (
          <PaginationBar
            page={safePage}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="kỳ công"
          />
        )}
      </div>

      {/* ── Modal Xác Nhận Chốt Kỳ Công (Lock Modal) ── */}
      <LockPayrollModal
        period={periodToLock}
        isLocking={isLocking}
        onConfirm={handleConfirmLockPeriod}
        onCancel={() => setPeriodToLock(null)}
      />

      {/* ── Modal Mở Lại Kỳ Công Kèm Lý Do Kiểm Toán (Unlock Modal) ── */}
      <UnlockPayrollModal
        period={periodToUnlock}
        isUnlocking={isUnlocking}
        onConfirm={handleConfirmUnlockPeriod}
        onCancel={() => setPeriodToUnlock(null)}
      />
    </div>
  )
}
