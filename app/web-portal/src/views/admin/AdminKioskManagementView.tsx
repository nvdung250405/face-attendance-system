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
            Giám sát tình trạng kết nối, nhịp tim ping và cấu hình bảo mật máy trạm biên (DD-WEB-019)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadKiosks}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Làm mới"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Làm mới</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              data-testid="open-register-kiosk-btn"
              onClick={() => setIsRegisterModalOpen(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Đăng ký Kiosk Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Thông báo Chế độ Chỉ Đọc cho DPO ── */}
      {isReadOnly && (
        <div
          role="status"
          data-testid="dpo-readonly-banner"
          className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-start gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-blue-600">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <span className="font-bold">Chế độ Tra cứu Chỉ Đọc (DPO Compliance Role)</span>
            <p className="text-xs text-blue-800 mt-0.5">
              Bạn đang xem danh mục trạm Kiosk với quyền giám sát tuân thủ. Các thao tác đăng ký mới, cập nhật hoặc cấp lại Secret Token bị vô hiệu hóa.
            </p>
          </div>
        </div>
      )}

      {/* ── Cảnh báo Trạm Kiosk Mất Ping > 5 Phút (DD-WEB-019) ── */}
      {staleKiosks.length > 0 && (
        <div
          role="alert"
          data-testid="stale-ping-warning-banner"
          className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900">
              Cảnh báo: Có {staleKiosks.length} trạm Kiosk mất tín hiệu Ping quá 5 phút (DD-WEB-019)
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

      {/* ── Thống kê tổng quan KPI ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-surface p-4 space-y-1">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tổng số trạm</div>
          <div className="text-2xl font-bold text-text-primary" data-testid="kpi-total-kiosks">
            {kiosks.length}
          </div>
        </div>
        <div className="card-surface p-4 space-y-1">
          <div className="text-xs font-semibold text-status-success uppercase tracking-wider">Trực tuyến</div>
          <div className="text-2xl font-bold text-status-success" data-testid="kpi-online-kiosks">
            {onlineCount}
          </div>
        </div>
        <div className="card-surface p-4 space-y-1">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Mất Ping &gt; 5p</div>
          <div className="text-2xl font-bold text-amber-600" data-testid="kpi-stale-kiosks">
            {warningCount}
          </div>
        </div>
        <div className="card-surface p-4 space-y-1">
          <div className="text-xs font-semibold text-status-danger uppercase tracking-wider">Ngoại tuyến</div>
          <div className="text-2xl font-bold text-status-danger" data-testid="kpi-offline-kiosks">
            {offlineCount}
          </div>
        </div>
      </div>

      {/* ── Bảng Danh mục Trạm Kiosk ── */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-slate-50/50">
          <h3 className="text-base font-bold text-text-primary">Danh mục Thiết bị Kiosk Biên</h3>
          <span className="text-xs text-text-muted">Đồng bộ tự động qua giao thức HTTP Heartbeat</span>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 text-rose-700 text-sm border-b border-rose-200">
            {errorMessage}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="kiosk-management-table">
            <thead>
              <tr className="table-sticky-header">
                <th className="py-3 px-4">Mã Trạm</th>
                <th className="py-3 px-4">Tên Trạm Kiosk</th>
                <th className="py-3 px-4">Vị Trí Lắp Đặt</th>
                <th className="py-3 px-4">Địa Chỉ IP / Phiên Bản</th>
                <th className="py-3 px-4">Ping Gần Nhất</th>
                <th className="py-3 px-4">Trạng Thái Kết Nối</th>
                {!isReadOnly && <th className="py-3 px-4 text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="py-12 text-center text-text-muted">
                    <div className="inline-flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5 text-brand-primary" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Đang nạp danh sách trạm Kiosk...</span>
                    </div>
                  </td>
                </tr>
              ) : kiosks.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="py-12 text-center text-text-muted">
                    <p className="font-semibold text-text-secondary">Chưa có trạm Kiosk nào được đăng ký</p>
                    <p className="text-xs mt-1">Bấm &quot;Đăng ký Kiosk Mới&quot; để thiết lập trạm đầu tiên.</p>
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
                      className="table-row-hover transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-text-primary">
                        {kiosk.kioskId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-primary text-xs">
                        {kiosk.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary">
                        {kiosk.location}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-text-muted">
                        <div>{kiosk.ipAddress || '—'}</div>
                        <div className="text-[11px] text-text-secondary">{kiosk.appVersion || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              stale ? 'bg-amber-500' : 'bg-emerald-500'
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
                              className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded"
                            >
                              MẤT PING &gt; 5P
                            </span>
                          )}
                        </div>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            data-testid={`reissue-token-btn-${kiosk.kioskId}`}
                            onClick={() => handleReissueToken(kiosk)}
                            disabled={isReissuing === kiosk.kioskId}
                            className="btn-secondary text-xs h-8 px-2.5 hover:text-brand-primary"
                            title="Cấp lại Secret Token"
                          >
                            {isReissuing === kiosk.kioskId ? (
                              <span>Đang xử lý...</span>
                            ) : (
                              <span>Cấp lại Token</span>
                            )}
                          </button>
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
      {reissuedTokenKiosk && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-surface-card rounded-2xl shadow-2xl border border-border-subtle p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary">
              Cấp Lại Secret Token Thành Công
            </h3>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              Secret Token mới của trạm <strong>{reissuedTokenKiosk.kioskId}</strong> chỉ hiển thị duy nhất 1 lần trong RAM. Khi đóng hộp thoại này, token sẽ bị hủy khỏi bộ nhớ trình duyệt.
            </div>

            <div className="p-3 bg-slate-100 rounded-xl border border-border-subtle flex items-center justify-between gap-3">
              <code
                data-testid="reissued-token-value"
                className="font-mono text-sm font-bold text-brand-primary break-all select-all"
              >
                {reissuedTokenKiosk.token}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(reissuedTokenKiosk.token)
                  alert('Đã sao chép Secret Token mới!')
                }}
                className="btn-secondary text-xs h-8 px-2.5 shrink-0"
              >
                Sao chép
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                data-testid="close-reissued-token-modal-btn"
                onClick={() => {
                  clearSecretToken(reissuedTokenKiosk.kioskId)
                  setReissuedTokenKiosk(null)
                }}
                className="btn-primary text-sm"
              >
                Tôi đã lưu Token an toàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
