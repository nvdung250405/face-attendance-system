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

import React, { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Plus,
  Info,
  AlertTriangle,
  Monitor,
  Wifi,
  WifiOff,
  Server,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/common'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/store/authStore'
import { useKioskRegistryStore } from '@/store/kioskRegistryStore'
import { complianceAdminService } from '@/services/complianceAdminService'
import { KioskRegistrationModal } from '@/components/kiosk'
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

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Chưa có tín hiệu'
  try {
    const pingTime = new Date(isoString).getTime()
    if (isNaN(pingTime)) return isoString
    const diffSeconds = Math.max(0, Math.floor((Date.now() - pingTime) / 1000))
    if (diffSeconds < 60) return `${diffSeconds} giây trước`
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes} phút trước`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} ngày trước`
  } catch {
    return isoString
  }
}

export const AdminKioskManagementView: React.FC = () => {
  const { user } = useAuthStore()
  const {
    kiosks,
    setKiosks,
    isPingStale,
    setSecretToken,
    clearSecretToken,
    clearStore,
  } = useKioskRegistryStore()

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  // Modal hiển thị Secret Token khi cấp lại
  const [reissuedTokenKiosk, setReissuedTokenKiosk] = useState<{
    kioskId: string
    token: string
  } | null>(null)
  const [isReissuing, setIsReissuing] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

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
    let ignore = false
    complianceAdminService
      .getKiosks()
      .then((data) => {
        if (!ignore) {
          setKiosks(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          const error = err as { message?: string }
          setErrorMessage(error.message || 'Không thể tải danh sách trạm Kiosk.')
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
      // Tiêu hủy RAM khi unmount theo DD-WEB-019
      clearStore()
    }
  }, [setKiosks, clearStore])

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
      alert(error.message || 'Không thể cấp lại token cho trạm Kiosk.')
    } finally {
      setIsReissuing(null)
    }
  }

  // Danh sách các trạm mất ping quá 5 phút
  const staleKiosks = kiosks.filter((k) => isPingStale(k.lastPingAt))
  const onlineCount = kiosks.filter((k) => k.status === 'ONLINE' && !isPingStale(k.lastPingAt)).length
  const warningCount = kiosks.filter((k) => k.status === 'WARNING' || isPingStale(k.lastPingAt)).length
  const offlineCount = kiosks.filter((k) => k.status === 'OFFLINE').length

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tổng số trạm */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/80" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl ring-1 ring-indigo-500/20 bg-indigo-50/70 text-indigo-600 flex items-center justify-center shadow-xs">
              <Server size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tất cả</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng số trạm</div>
            <div className="text-2xl font-extrabold font-mono text-slate-800 tracking-tight" data-testid="kpi-total-kiosks">
              {kiosks.length}
            </div>
          </div>
        </div>

        {/* Trực tuyến */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/80" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl ring-1 ring-emerald-500/20 bg-emerald-50/70 text-emerald-600 flex items-center justify-center shadow-xs">
              <Wifi size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              Hoạt động
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-700">Trực tuyến</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-700 tracking-tight" data-testid="kpi-online-kiosks">
              {onlineCount}
            </div>
          </div>
        </div>

        {/* Mất Ping > 5p */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/80" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl ring-1 ring-amber-500/20 bg-amber-50/70 text-amber-600 flex items-center justify-center shadow-xs">
              <AlertTriangle size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
              Mất tín hiệu
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-700">Mất Ping &gt; 5p</div>
            <div className="text-2xl font-extrabold font-mono text-amber-700 tracking-tight" data-testid="kpi-stale-kiosks">
              {warningCount}
            </div>
          </div>
        </div>

        {/* Ngoại tuyến */}
        <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500/80" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl ring-1 ring-rose-500/20 bg-rose-50/70 text-rose-600 flex items-center justify-center shadow-xs">
              <WifiOff size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
              Gián đoạn
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-700">Ngoại tuyến</div>
            <div className="text-2xl font-extrabold font-mono text-rose-700 tracking-tight" data-testid="kpi-offline-kiosks">
              {offlineCount}
            </div>
          </div>
        </div>
      </div>

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
                          <span className={statusInfo.className}>{statusInfo.label}</span>
                          {stale && (
                            <span
                              data-testid={`ping-stale-badge-${kiosk.kioskId}`}
                              title="Không nhận được nhịp tim ping từ trạm trong hơn 5 phút"
                              className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded cursor-help"
                            >
                              MẤT TÍN HIỆU &gt; 5P
                            </span>
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
      <Dialog
        open={Boolean(reissuedTokenKiosk)}
        onOpenChange={(open) => {
          if (!open && reissuedTokenKiosk) {
            clearSecretToken(reissuedTokenKiosk.kioskId)
            setReissuedTokenKiosk(null)
            setCopiedToken(false)
          }
        }}
      >
        <DialogContent
          hideCloseButton
          usePortal={false}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4"
        >
          {reissuedTokenKiosk && (
            <>
              <DialogTitle className="text-base font-bold text-slate-900">
                Cấp Lại Secret Token Thành Công
              </DialogTitle>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                Secret Token mới của trạm <strong>{reissuedTokenKiosk.kioskId}</strong> chỉ hiển thị duy nhất 1 lần trong RAM. Khi đóng hộp thoại này, token sẽ bị hủy khỏi bộ nhớ trình duyệt.
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <code
                  data-testid="reissued-token-value"
                  className="font-mono text-xs font-bold text-indigo-600 break-all select-all"
                >
                  {reissuedTokenKiosk.token}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(reissuedTokenKiosk.token)
                    setCopiedToken(true)
                    setTimeout(() => setCopiedToken(false), 2000)
                  }}
                  leftIcon={copiedToken ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  className="shrink-0"
                >
                  {copiedToken ? 'Đã chép' : 'Sao chép'}
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  data-testid="close-reissued-token-modal-btn"
                  onClick={() => {
                    clearSecretToken(reissuedTokenKiosk.kioskId)
                    setReissuedTokenKiosk(null)
                    setCopiedToken(false)
                  }}
                >
                  Tôi đã lưu Token an toàn
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
