/**
 * AdminKioskManagementView: Màn hình Quản trị Trạm Kiosk
 * (SOL-WEB-012, UI-WEB-012, DD-WEB-019, BLD-WEB-021, TASK-WEB-027).
 *
 * Tính năng chính:
 * 1. Giám sát tình trạng kết nối, nhịp tim Ping và phát hiện trạm mất Ping > 5 phút (DD-WEB-019).
 * 2. Đăng ký trạm Kiosk mới và Cấp lại Secret Token (chỉ cho phép ADMIN / HR_MANAGER).
 * 3. Secret Token CHỈ lưu trong RAM (Zustand Store), TUYỆT ĐỐI không lưu vào Storage.
 * 4. Quyền truy cập: Role DPO ở chế độ CHỈ ĐỌC (không có nút thêm/sửa/cấp lại token).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw,
  Plus,
  Info,
  AlertTriangle,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/common'
import { toast } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useKioskRegistryStore } from '@/store/kioskRegistryStore'
import { complianceAdminService } from '@/services/complianceAdminService'
import { KioskRegistrationModal, ReissuedTokenDialog, KioskKpiCards } from '@/components/kiosk'
import { formatRelativeTime } from '@/utils/date'
import type { KioskItemResponse, KioskStatus } from '@/types'

const STATUS_CONFIG: Record<KioskStatus, { label: string; className: string }> = {
  ONLINE: {
    label: 'Trực tuyến',
    className: 'badge-success',
  },
  WARNING: {
    label: 'Cảnh báo',
    className: 'badge-warning',
  },
  OFFLINE: {
    label: 'Ngoại tuyến',
    className: 'badge-danger',
  },
}

export const AdminKioskManagementView: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const kiosks = useKioskRegistryStore((s) => s.kiosks)
  const isPingStale = useKioskRegistryStore((s) => s.isPingStale)
  const setKiosks = useKioskRegistryStore((s) => s.setKiosks)
  const setSecretToken = useKioskRegistryStore((s) => s.setSecretToken)
  const clearSecretToken = useKioskRegistryStore((s) => s.clearSecretToken)
  const clearStore = useKioskRegistryStore((s) => s.clearStore)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  // Modal hiển thị Secret Token khi cấp lại
  const [reissuedTokenKiosk, setReissuedTokenKiosk] = useState<{
    kioskId: string
    token: string
  } | null>(null)
  const [isReissuing, setIsReissuing] = useState<string | null>(null)

  const isReadOnly = user?.role === 'DPO'

  const loadKiosks = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getKiosks()
      setKiosks(data)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải danh sách trạm Kiosk.')
    } finally {
      setIsLoading(false)
    }
  }, [setKiosks])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadKiosks()

    return () => {
      // Tiêu hủy RAM khi unmount theo DD-WEB-019
      clearStore()
    }
  }, [loadKiosks, clearStore])

  const handleReissueToken = async (kiosk: KioskItemResponse) => {
    if (isReadOnly) return
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn cấp lại Secret Token cho trạm ${kiosk.kioskId}? Mã cũ sẽ bị thu hồi ngay lập tức.`
    )
    if (!confirmed) return

    try {
      setIsReissuing(kiosk.kioskId)
      const result = await complianceAdminService.updateKiosk(kiosk.id, {
        resetSecretToken: true,
      })

      if (result.secretToken) {
        // Lưu duy nhất trong RAM
        setSecretToken(kiosk.kioskId, result.secretToken)
        setReissuedTokenKiosk({
          kioskId: kiosk.kioskId,
          token: result.secretToken,
        })
      }
    } catch (err) {
      const error = err as { message?: string }
      toast.error(error.message || 'Không thể cấp lại token cho trạm Kiosk.')
    } finally {
      setIsReissuing(null)
    }
  }

  // Danh sách các trạm mất ping quá 5 phút và thống kê KPI (tính trong 1 vòng lặp duy nhất)
  const { staleKiosks, onlineCount, warningCount, offlineCount } = useMemo(() => {
    const stale: KioskItemResponse[] = []
    let online = 0
    let warning = 0
    let offline = 0

    for (const k of kiosks) {
      const isStale = isPingStale(k.lastPingAt)
      if (isStale) stale.push(k)
      if (k.status === 'ONLINE' && !isStale) online++
      if (k.status === 'WARNING' || isStale) warning++
      if (k.status === 'OFFLINE') offline++
    }
    return { staleKiosks: stale, onlineCount: online, warningCount: warning, offlineCount: offline }
  }, [kiosks, isPingStale])

  return (
    <div className="space-y-6">
      {/* ── Tiêu đề trang ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Quản lý Trạm Kiosk</h1>
          <p className="page-subtitle">
            Giám sát tình trạng kết nối, nhịp tim ping và cấu hình bảo mật máy trạm biên
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadKiosks}
            leftIcon={<RefreshCw size={15} />}
            title="Làm mới"
          >
            Làm mới
          </Button>

          {!isReadOnly && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="open-register-kiosk-btn"
              onClick={() => setIsRegisterModalOpen(true)}
              leftIcon={<Plus size={16} />}
            >
              Đăng ký Kiosk Mới
            </Button>
          )}
        </div>
      </div>

      {/* ── Thông báo Chế độ Chỉ Đọc cho DPO ── */}
      {isReadOnly && (
        <div
          role="status"
          data-testid="dpo-readonly-banner"
          className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 text-sm flex items-start gap-3 shadow-xs"
        >
          <Info size={18} className="shrink-0 mt-0.5 text-blue-600" />
          <div>
            <span className="font-bold">Chế độ Tra cứu Chỉ Đọc (DPO Compliance Role)</span>
            <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
              Bạn đang xem danh mục trạm Kiosk với quyền giám sát tuân thủ. Các thao tác đăng ký mới, cập nhật hoặc cấp lại Secret Token bị vô hiệu hóa.
            </p>
          </div>
        </div>
      )}

      {/* ── Cảnh báo Trạm Kiosk Mất Ping > 5 Phút ── */}
      {staleKiosks.length > 0 && (
        <div
          role="alert"
          data-testid="stale-ping-warning-banner"
          className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900">
              Cảnh báo: Có {staleKiosks.length} trạm Kiosk mất tín hiệu Ping quá 5 phút
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Các trạm Kiosk sau không gửi nhịp tim ping định kỳ trong hơn 5 phút: {' '}
              <strong className="font-mono text-amber-950">
                {staleKiosks.map((k) => k.kioskId).join(', ')}
              </strong>
              . Vui lòng kiểm tra kết nối mạng nội bộ hoặc dịch vụ nền tại điểm đặt máy.
            </p>
          </div>
        </div>
      )}

      {/* ── Thống kê tổng quan KPI Đồng bộ ── */}
      <KioskKpiCards
        totalCount={kiosks.length}
        onlineCount={onlineCount}
        warningCount={warningCount}
        offlineCount={offlineCount}
      />

      {/* ── Thông báo lỗi nếu có ── */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={loadKiosks}
            className="text-xs underline font-semibold hover:text-rose-900"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Bảng Danh mục Trạm Kiosk ── */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="kiosk-management-table">
            <thead>
              <tr className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 z-20 bg-slate-50/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)]">Mã Trạm</th>
                <th className="py-3 px-4">Tên Trạm Kiosk</th>
                <th className="py-3 px-4">Vị Trí Lắp Đặt</th>
                <th className="py-3 px-4">Địa Chỉ IP / Phiên Bản</th>
                <th className="py-3 px-4">Ping Gần Nhất</th>
                <th className="py-3 px-4">Trạng Thái Kết Nối</th>
                {!isReadOnly && (
                  <th className="py-3 px-4 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-20">
                    Thao Tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="py-12 text-center text-text-secondary">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                      <span>Đang nạp danh sách trạm Kiosk...</span>
                    </div>
                  </td>
                </tr>
              ) : kiosks.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Monitor size={24} />
                      </div>
                      <p className="font-semibold text-text-secondary">Chưa có trạm Kiosk nào được đăng ký</p>
                      <p className="text-xs text-slate-600">Bấm &quot;Đăng ký Kiosk Mới&quot; để thiết lập trạm đầu tiên.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                kiosks.map((kiosk) => {
                  const stale = isPingStale(kiosk.lastPingAt)
                  const statusInfo = STATUS_CONFIG[kiosk.status] || {
                    label: kiosk.status,
                    className: 'badge-info',
                  }

                  return (
                    <tr
                      key={kiosk.kioskId}
                      data-testid={`kiosk-row-${kiosk.kioskId}`}
                      className="hover:bg-slate-50/80 group transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.04)] whitespace-nowrap">
                        {kiosk.kioskId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-primary text-xs">
                        {kiosk.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary">
                        {kiosk.location}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">
                        <div>{kiosk.ipAddress || '—'}</div>
                        <div className="text-[11px] text-text-secondary">{kiosk.appVersion || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              stale ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-emerald-500 ring-2 ring-emerald-200'
                            }`}
                          />
                          <span>{formatRelativeTime(kiosk.lastPingAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {stale ? (
                            <span
                              data-testid={`ping-stale-badge-${kiosk.kioskId}`}
                              title="Không nhận được nhịp tim ping từ trạm trong hơn 5 phút"
                              className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 cursor-help"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              MẤT TÍN HIỆU &gt; 5P
                            </span>
                          ) : (
                            <span className={statusInfo.className}>{statusInfo.label}</span>
                          )}
                        </div>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            data-testid={`reissue-token-btn-${kiosk.kioskId}`}
                            onClick={() => handleReissueToken(kiosk)}
                            disabled={isReissuing === kiosk.kioskId}
                            title="Cấp lại Secret Token"
                          >
                            {isReissuing === kiosk.kioskId ? (
                              <span>Đang xử lý...</span>
                            ) : (
                              <span>Cấp lại Token</span>
                            )}
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Đăng ký Kiosk Mới ── */}
      <KioskRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          loadKiosks()
        }}
      />

      {/* ── Modal Hiển thị Secret Token Cấp Lại (Một Lần Trong RAM) ── */}
      <ReissuedTokenDialog
        reissuedTokenKiosk={reissuedTokenKiosk}
        onClose={() => {
          if (reissuedTokenKiosk) {
            clearSecretToken(reissuedTokenKiosk.kioskId)
          }
          setReissuedTokenKiosk(null)
        }}
      />
    </div>
  )
}
