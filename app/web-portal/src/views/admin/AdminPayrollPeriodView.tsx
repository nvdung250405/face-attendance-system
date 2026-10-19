/**
 * Màn hình Quản lý Kỳ công & Chốt Kỳ Công Phía Quản trị
 * (SOL-WEB-008, BLD-WEB-019, UXD-WEB-006, FR-WEB-010, TASK-WEB-025).
 *
 * - Tra cứu danh mục kỳ công theo năm.
 * - Chốt kỳ công (LOCKED): Khóa điều chỉnh và lan tỏa cờ isAdjustmentLocked qua PayrollPeriodStore.
 * - Mở lại kỳ công (OPEN): Dành cho vai trò ADMIN, bắt buộc ghi rõ lý do mở khóa và ghi log kiểm toán.
 * - Cảnh báo nghiệp vụ UXD-WEB-006 hiển thị trực tiếp trên đầu bảng.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Lock,
  Unlock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCw,
  ShieldCheck,
  Download,
} from 'lucide-react'
import { Button } from '@/components/common'
import { payrollPeriodService } from '@/services/payrollPeriodService'
import { reportExportService } from '@/services/reportExportService'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { useAuthStore } from '@/store/authStore'
import type { PayrollPeriodResponse } from '@/types'
import type { NormalizedApiError } from '@/services/errorNormalizer'

export const AdminPayrollPeriodView: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user)
  const isAdmin = currentUser?.role === 'ADMIN'

  // Store trạng thái kỳ công
  const {
    periods,
    selectedPeriod,
    isAdjustmentLocked,
    setPeriods,
    setSelectedPeriod,
    updatePeriodStatus,
  } = usePayrollPeriodStore()

  // Năm tra cứu
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Thông báo phản hồi
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
  } | null>(null)

  // Modal Chốt kỳ công (Lock Modal)
  const [periodToLock, setPeriodToLock] = useState<PayrollPeriodResponse | null>(null)
  const [isLocking, setIsLocking] = useState<boolean>(false)

  // Modal Mở lại kỳ công (Unlock Modal - Yêu cầu lý do)
  const [periodToUnlock, setPeriodToUnlock] = useState<PayrollPeriodResponse | null>(null)
  const [unlockReason, setUnlockReason] = useState<string>('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false)

  // Tải danh sách kỳ công
  const loadPayrollPeriods = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await payrollPeriodService.getPayrollPeriods({ year: selectedYear })
      setPeriods(data || [])
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({
        type: 'error',
        message: error.message || 'Không thể tải danh sách kỳ công.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear, setPeriods])

  useEffect(() => {
    let ignore = false
    const fetchData = async () => {
      try {
        const data = await payrollPeriodService.getPayrollPeriods({ year: selectedYear })
        if (!ignore) {
          setPeriods(data || [])
        }
      } catch (err) {
        if (!ignore) {
          const error = err as NormalizedApiError
          setNotification({
            type: 'error',
            message: error.message || 'Không thể tải danh sách kỳ công.',
          })
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      ignore = true
    }
  }, [selectedYear, setPeriods])

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
      setNotification({
        type: 'success',
        message: `Đã chốt thành công kỳ công ${periodToLock.periodMonth}/${periodToLock.periodYear}. Toàn bộ chức năng điều chỉnh công của kỳ này đã được khóa.`,
      })
      setPeriodToLock(null)
    } catch (err) {
      const error = err as NormalizedApiError
      setNotification({
        type: 'error',
        message: error.message || 'Không thể chốt kỳ công. Vui lòng kiểm tra lại.',
      })
    } finally {
      setIsLocking(false)
    }
  }

  // ── Thao tác Mở lại Kỳ Công (Unlock) ──────────────────────────────────────

  const handleOpenUnlockModal = (period: PayrollPeriodResponse) => {
    setPeriodToUnlock(period)
    setUnlockReason('')
    setUnlockError(null)
  }

  const handleConfirmUnlockPeriod = async () => {
    if (!periodToUnlock) return
    const trimmedReason = unlockReason.trim()
    if (!trimmedReason) {
      setUnlockError('Bắt buộc phải nhập lý do mở lại kỳ công theo quy định kiểm toán tuân thủ.')
      return
    }
    if (trimmedReason.length < 5) {
      setUnlockError('Lý do mở lại kỳ công phải có độ dài tối thiểu 5 ký tự.')
      return
    }

    const periodCode = `${periodToUnlock.periodYear}-${String(periodToUnlock.periodMonth).padStart(2, '0')}`

    try {
      setIsUnlocking(true)
      await payrollPeriodService.unlockPeriod(periodCode, { reason: trimmedReason })
      // Cập nhật trạng thái mở lại vào Store tập trung (isAdjustmentLocked -> false)
      updatePeriodStatus(periodToUnlock.id, 'OPEN')
      setNotification({
        type: 'success',
        message: `Đã mở lại thành công kỳ công ${periodToUnlock.periodMonth}/${periodToUnlock.periodYear}. Các nút điều chỉnh công đã được mở khóa.`,
      })
      setPeriodToUnlock(null)
    } catch (err) {
      const error = err as NormalizedApiError
      setUnlockError(error.message || 'Không thể mở lại kỳ công. Vui lòng thử lại.')
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
      setNotification({
        type: 'success',
        message: `Đã xuất thành công bảng công kỳ ${period.periodMonth}/${period.periodYear}.`,
      })
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
      setNotification({
        type: 'success',
        message: `Đã xuất bảng công (bản offline) kỳ ${period.periodMonth}/${period.periodYear}.`,
      })
    } finally {
      setExportingPeriodId(null)
    }
  }

  return (
    <div className="space-y-6" data-testid="admin-payroll-period-view">
      {/* ── Tiêu đề trang & Thanh công cụ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span>Quản Lý & Chốt Kỳ Công</span>
            {isAdjustmentLocked ? (
              <span
                data-testid="payroll-status-badge-locked"
                className="badge-warning inline-flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kỳ đang chọn: ĐÃ KHÓA</span>
              </span>
            ) : (
              <span
                data-testid="payroll-status-badge-open"
                className="badge-success inline-flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Kỳ đang chọn: ĐANG MỞ</span>
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
              onChange={(e) => setSelectedYear(Number(e.target.value))}
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

      {/* Thông báo thao tác */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notification.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Bảng Danh Sách Kỳ Công Trong Năm ── */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Kỳ Công</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Thông Tin Chốt Kỳ</th>
                <th className="py-3 px-4">Thông Tin Mở Lại (Gần nhất)</th>
                <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                  Thao Tác Quản Trị
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                      <span>Đang tải danh sách kỳ công năm {selectedYear}...</span>
                    </div>
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    Không có dữ liệu kỳ công nào cho năm {selectedYear}.
                  </td>
                </tr>
              ) : (
                periods.map((period) => {
                  const isPeriodLocked = period.status === 'LOCKED'
                  const isCurrentSelected = selectedPeriod?.id === period.id

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
                          <Calendar className="w-4 h-4 text-brand-primary" />
                          <span>
                            Tháng {String(period.periodMonth).padStart(2, '0')}/{period.periodYear}
                          </span>
                          {isCurrentSelected && (
                            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-brand-primary text-white">
                              Đang chọn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        <span
                          data-testid={`period-status-badge-${period.id}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold ${
                            isPeriodLocked
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-status-success border border-emerald-300'
                          }`}
                        >
                          {isPeriodLocked ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>ĐÃ CHỐT</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>ĐANG MỞ</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Thông tin chốt kỳ */}
                      <td className="py-3.5 px-4 text-text-secondary">
                        {isPeriodLocked ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-text-primary block">
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
                            <span className="font-semibold text-text-primary block">
                              {period.unlockedByName || 'Quản trị viên'}
                            </span>
                            <span className="text-2xs text-text-secondary italic block">
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
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-[#f8fafc] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10 whitespace-nowrap">
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
                              leftIcon={<Lock className="w-3.5 h-3.5" />}
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
                              leftIcon={<Unlock className="w-3.5 h-3.5" />}
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
                            leftIcon={<Download className="w-3.5 h-3.5" />}
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
      </div>

      {/* ── Modal Xác Nhận Chốt Kỳ Công (Lock Modal) ── */}
      {periodToLock && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            data-testid="lock-payroll-modal"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác Nhận Chốt Kỳ Công</h3>
                <span className="text-xs text-slate-500">
                  Kỳ Tháng {String(periodToLock.periodMonth).padStart(2, '0')}/{periodToLock.periodYear}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 leading-relaxed">
              <p className="font-bold">Cảnh báo hệ quả quan trọng:</p>
              <ul className="list-disc list-inside space-y-1 text-2xs text-amber-800">
                <li>Bảng chấm công và số liệu kỳ này sẽ chính thức bị đóng băng.</li>
                <li>Toàn bộ chức năng duyệt đơn giải trình, phân ca và điều chỉnh công sẽ bị khóa.</li>
                <li>Hành động mở lại kỳ sau này sẽ được ghi nhận vào nhật ký kiểm toán bảo mật.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPeriodToLock(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmLockPeriod}
                disabled={isLocking}
                data-testid="confirm-lock-period-btn"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isLocking ? 'Đang chốt...' : 'Xác Nhận Chốt Kỳ'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Mở Lại Kỳ Công Kèm Lý Do Kiểm Toán (Unlock Modal) ── */}
      {periodToUnlock && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            data-testid="unlock-payroll-modal"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Mở Lại Kỳ Công Đã Chốt</h3>
                <span className="text-xs text-slate-500">
                  Kỳ Tháng {String(periodToUnlock.periodMonth).padStart(2, '0')}/{periodToUnlock.periodYear}
                </span>
              </div>
            </div>

            {unlockError && (
              <div
                data-testid="unlock-modal-error"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="unlock-reason"
                className="text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span>
                  Lý do mở lại kỳ công <span className="text-rose-600">*</span>
                </span>
                <span className="text-2xs text-slate-400">Bắt buộc theo quy định kiểm toán</span>
              </label>
              <textarea
                id="unlock-reason"
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                data-testid="input-unlock-reason"
                placeholder="Ví dụ: Điều chỉnh bổ sung giờ công cho nhân viên phòng Kỹ thuật theo biên bản phê duyệt số 12/BB-NS..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quy định kiểm toán tuân thủ (DPO / Audit Log)</span>
              </div>
              <p>
                Thao tác mở lại kỳ công sẽ được hệ thống lưu vết vĩnh viễn kèm danh tính Quản trị viên và lý do giải trình.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPeriodToUnlock(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmUnlockPeriod}
                disabled={isUnlocking}
                data-testid="confirm-unlock-period-btn"
                leftIcon={<Unlock className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isUnlocking ? 'Đang mở lại...' : 'Xác Nhận Mở Lại'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
