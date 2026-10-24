/**
 * KioskRegistrationModal: Hộp thoại Đăng ký Trạm Kiosk & Hiển thị Secret Token Một Lần
 * (SOL-012, UI-WEB-012, DD-WEB-019, BLD-WEB-021, TASK-WEB-027).
 *
 * Tính năng chính:
 * 1. Form đăng ký trạm Kiosk mới (Mã Kiosk, Tên trạm, Vị trí lắp đặt).
 * 2. Gọi POST /api/v1/admin/kiosks nhận về Secret Token.
 * 3. Secret Token CHỈ lưu trong RAM (Zustand KioskRegistryStore), TUYỆT ĐỐI KHÔNG lưu
 *    vào LocalStorage hoặc SessionStorage (DD-WEB-019).
 * 4. Hiển thị Secret Token một lần duy nhất kèm nút sao chép và cảnh báo tiêu hủy khi đóng modal.
 */

import React, { useState } from 'react'
import { Monitor, X, AlertTriangle, Check, Copy } from 'lucide-react'
import { complianceAdminService } from '@/services/complianceAdminService'
import { useKioskRegistryStore } from '@/store/kioskRegistryStore'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { KioskItemResponse } from '@/types'

export interface KioskRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (kiosk: KioskItemResponse) => void
}

const KioskRegistrationModalContent: React.FC<KioskRegistrationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { setSecretToken, clearSecretToken } = useKioskRegistryStore()
  const [step, setStep] = useState<'FORM' | 'TOKEN_DISPLAY'>('FORM')
  const [kioskId, setKioskId] = useState('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [createdSecretToken, setCreatedSecretToken] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kioskId.trim() || !name.trim() || !location.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const result = await complianceAdminService.registerKiosk({
        kioskId: kioskId.trim(),
        name: name.trim(),
        location: location.trim(),
      })

      // Lưu Secret Token duy nhất vào RAM
      setSecretToken(result.kiosk.kioskId, result.secretToken)
      setCreatedSecretToken(result.secretToken)
      setStep('TOKEN_DISPLAY')
      onSuccess?.(result.kiosk)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể đăng ký trạm Kiosk. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyToken = () => {
    if (createdSecretToken) {
      navigator.clipboard.writeText(createdSecretToken)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleClose = () => {
    if (kioskId) {
      // Tiêu hủy Secret Token khỏi RAM khi đóng
      clearSecretToken(kioskId)
    }
    onClose()
  }

  return (
    <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-brand-primary flex items-center justify-center">
              <Monitor size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 id="kiosk-registration-title" className="text-base font-bold text-text-primary">
                {step === 'FORM' ? 'Đăng Ký Trạm Kiosk Mới' : 'Secret Token Kiosk (Một Lần)'}
              </h2>
              <p className="text-xs text-text-secondary">
                {step === 'FORM'
                  ? 'Khởi tạo cấu hình kết nối trạm điểm danh biên'
                  : 'Mã xác thực duy nhất — Chỉ hiển thị một lần trong RAM'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'FORM' ? (
            <form id="register-kiosk-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="kiosk-id-input" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Mã Trạm Kiosk (Kiosk ID) *
                </label>
                <input
                  type="text"
                  id="kiosk-id-input"
                  data-testid="kiosk-id-input"
                  value={kioskId}
                  onChange={(e) => setKioskId(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: KIOSK-HN-03"
                  className="input-base font-mono font-medium"
                  required
                />
                <p className="text-[11px] text-text-secondary mt-1">Định danh duy nhất của trạm Kiosk trong hệ thống</p>
              </div>

              <div>
                <label htmlFor="kiosk-name-input" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Tên Trạm Kiosk *
                </label>
                <input
                  type="text"
                  id="kiosk-name-input"
                  data-testid="kiosk-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Trạm Kiosk Sảnh Chính Tầng 2"
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label htmlFor="kiosk-location-input" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Vị trí lắp đặt *
                </label>
                <input
                  type="text"
                  id="kiosk-location-input"
                  data-testid="kiosk-location-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Tòa nhà A - Sảnh Lễ tân"
                  className="input-base"
                  required
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle size={18} className="text-amber-600" />
                  <span>LƯU Ý BẢO MẬT BẮT BUỘC (DD-WEB-019)</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-amber-900/90">
                  Secret Token này được dùng để cấu hình trạm Kiosk và <strong>CHỈ ĐƯỢC HIỂN THỊ DUY NHẤT 1 LẦN</strong>.
                  Token được lưu tạm thời trên bộ nhớ RAM và <strong>KHÔNG</strong> lưu vào LocalStorage/SessionStorage.
                  Khi đóng hộp thoại hoặc tải lại trang, token sẽ bị tiêu hủy vĩnh viễn khỏi trình duyệt.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Secret Token của trạm <span className="font-mono text-text-primary">{kioskId}</span>
                </label>
                <div className="p-3 bg-slate-100 rounded-xl border border-border-subtle flex items-center justify-between gap-3">
                  <code
                    data-testid="secret-token-value"
                    className="font-mono text-sm font-bold text-brand-primary break-all select-all"
                  >
                    {createdSecretToken}
                  </code>
                  <button
                    type="button"
                    data-testid="copy-token-btn"
                    onClick={handleCopyToken}
                    className="btn-secondary text-xs shrink-0 flex items-center gap-1.5 h-8 px-2.5"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-status-success" />
                        <span className="text-status-success font-semibold">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-slate-50/50 flex items-center justify-end gap-3">
          {step === 'FORM' ? (
            <>
              <button
                type="button"
                data-testid="cancel-kiosk-btn"
                onClick={handleClose}
                className="px-4 py-2 border border-border-subtle rounded-xl text-sm font-medium text-text-secondary hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="register-kiosk-form"
                data-testid="submit-register-kiosk-btn"
                disabled={isSubmitting || !kioskId.trim() || !name.trim()}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang đăng ký...</span>
                  </>
                ) : (
                  <span>Đăng ký trạm</span>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="close-token-display-btn"
              onClick={handleClose}
              className="px-5 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              Tôi đã lưu Secret Token an toàn
            </button>
          )}
        </div>
      </div>
  )
}

export const KioskRegistrationModal: React.FC<KioskRegistrationModalProps> = (props) => {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
    >
      <DialogContent
        hideCloseButton
        usePortal={false}
        className="p-0 max-w-lg border-0 bg-transparent shadow-none"
      >
        <KioskRegistrationModalContent {...props} />
      </DialogContent>
    </Dialog>
  )
}
