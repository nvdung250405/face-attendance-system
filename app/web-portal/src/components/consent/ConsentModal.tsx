/**
 * ConsentModal: Hộp thoại Ký Cam kết Informed Consent & Hiển thị OTP/QR
 * (SOL-WEB-002, UXD-WEB-002, DD-WEB-005, DD-WEB-011, DD-WEB-015, DD-WEB-016, BLD-WEB-013, TASK-WEB-017).
 *
 * Tính năng chính:
 * 1. Bước 1 - Ký cam kết:
 *    - Tuân thủ Nghị định 13/2023/NĐ-CP: khóa nút xác nhận cho đến khi cuộn hết 100% văn bản.
 *    - Bắt buộc tích chọn đồng ý trước khi ký.
 *    - Gọi POST /api/v1/employee/consent và lưu phiên tạm vào SafeSessionStorage.
 * 2. Bước 2 - Hiển thị OTP & QR:
 *    - Hiển thị mã OTP 6 số kích thước lớn (44px/48px bold font-mono) kèm nút sao chép.
 *    - Hiển thị mã QR kích thước chuẩn 200x200px.
 *    - Đếm ngược hạn sử dụng 48 giờ.
 *    - Tích hợp hook useEnrollmentStatus lắng nghe sự kiện STOMP /topic/enrollment/{otp}.
 * 3. Bước 3 - Kích hoạt Thành công:
 *    - Tự động chuyển cảnh khi nhận tín hiệu quét mặt xong từ Kiosk.
 *    - Cập nhật AuthStore (status: ACTIVE, hasBiometric: true).
 *    - Tiêu hủy phiên tạm và đóng modal.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  Clock,
  MapPin,
  X,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { consentService } from '@/services/consentService'
import { useEnrollmentStatus } from '@/services/hooks/useEnrollmentStatus'
import { useAuthStore } from '@/store/authStore'
import type { ConsentResult } from '@/types'

export type ConsentModalStep = 'TERMS' | 'OTP_DISPLAY' | 'SUCCESS'

const CONFETTI_COLORS = [
  '#4f46e5', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // rose
  '#06b6d4', // cyan
  '#8b5cf6', // purple
]

export const ConfettiEffect: React.FC = () => {
  const pieces = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.8 + (i % 5) * 1.5) % 96}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${(i % 6) * 0.15}s`,
      size:
        i % 3 === 0
          ? 'w-2 h-4 rounded-xs'
          : i % 3 === 1
            ? 'w-2.5 h-2.5 rounded-full'
            : 'w-3 h-2 rounded-xs',
      duration: `${1.8 + (i % 4) * 0.25}s`,
    }))
  }, [])

  return (
    <div
      data-testid="confetti-effect"
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-20"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute top-0 opacity-0 animate-[confettiDrop_2.5s_ease-out_forwards] ${p.size}`}
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}

export interface ConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  /** Cho phép tiêm OTP ban đầu hoặc phục vụ kiểm thử */
  initialOtp?: string
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialOtp,
}) => {
  const { updateUser } = useAuthStore()

  // Dữ liệu OTP sau khi ký
  const [otpData, setOtpData] = useState<{
    otp: string
    qrCodeData: string
    qrCodeDataUrl?: string
    expiresAt: string
    kioskLocations?: string[]
  } | null>(() => {
    const savedSession = consentService.getStoredConsentSession()
    if (savedSession && savedSession.otp) {
      return {
        otp: savedSession.otp,
        qrCodeData: savedSession.qrCodeData,
        qrCodeDataUrl: savedSession.qrCodeDataUrl,
        expiresAt: savedSession.expiresAt,
        kioskLocations: savedSession.kioskLocations,
      }
    }
    return null
  })

  const effectiveOtpData = useMemo(() => {
    if (initialOtp) {
      return {
        otp: initialOtp,
        qrCodeData: `otp:${initialOtp}`,
        expiresAt: '',
      }
    }
    return otpData
  }, [initialOtp, otpData])

  const [step, setStep] = useState<ConsentModalStep>(() =>
    effectiveOtpData?.otp ? 'OTP_DISPLAY' : 'TERMS'
  )
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const termsContainerRef = useRef<HTMLDivElement>(null)
  const modalCardRef = useRef<HTMLDivElement>(null)

  // Lắng nghe WebSocket STOMP kích hoạt khuôn mặt tại Kiosk
  const activeOtp = effectiveOtpData?.otp ?? null

  const handleEnrollmentSuccess = useCallback(() => {
    setStep('SUCCESS')
    updateUser({ status: 'ACTIVE', hasBiometric: true })
    consentService.clearConsentSession()
    // Hủy OTP để dừng subscription /topic/enrollment/{otp} (activeOtp -> null)
    setOtpData(null)
    onSuccess?.()
  }, [updateUser, onSuccess])

  const { reset } = useEnrollmentStatus({
    otp: activeOtp,
    autoConnect: true,
    onSuccess: handleEnrollmentSuccess,
  })

  // Tự động đóng modal sau 3 giây khi kích hoạt hoàn tất (DD-WEB-011, BLD-WEB-007)
  useEffect(() => {
    if (step === 'SUCCESS') {
      reset()
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [step, reset, onClose])

  // Hiển thị bước hiện tại (step SUCCESS thì ưu tiên hiển thị SUCCESS)
  const currentStep: ConsentModalStep =
    step === 'SUCCESS'
      ? 'SUCCESS'
      : effectiveOtpData?.otp
        ? 'OTP_DISPLAY'
        : step

  // Theo dõi sự kiện cuộn văn bản điều khoản (DD-WEB-015)
  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasScrolledToBottom) return
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    // Cho phép dung sai 8px
    if (scrollTop + clientHeight >= scrollHeight - 8) {
      setHasScrolledToBottom(true)
    }
  }

  // Xử lý ký cam kết
  const handleSignConsent = async () => {
    if (!hasScrolledToBottom || !isAgreed || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const result: ConsentResult = await consentService.submitConsent({
        agreed: true,
        consentVersion: 'v1.0',
      })

      setOtpData({
        otp: result.otp,
        qrCodeData: result.qrCodeData || `otp:${result.otp}`,
        qrCodeDataUrl: result.qrCodeDataUrl,
        expiresAt: result.expiresAt,
        kioskLocations: result.kioskLocations,
      })
      setStep('OTP_DISPLAY')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Không thể gửi cam kết. Vui lòng thử lại sau.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Sao chép mã OTP vào Clipboard
  const handleCopyOtp = useCallback(async () => {
    if (!effectiveOtpData?.otp) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(effectiveOtpData.otp)
      }
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Fallback
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }, [effectiveOtpData])

  // Bẫy tiêu điểm (Focus Trap - APC-WEB-004) & Đóng khi bấm ESC
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalCardRef.current) {
        const focusables = modalCardRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return

        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open && !isSubmitting) onClose()
      }}
    >
      <DialogContent
        data-testid="consent-modal"
        hideCloseButton
        usePortal={false}
        className="p-0 max-w-2xl border-0 bg-transparent shadow-none"
      >
      <div
        ref={modalCardRef}
        className="relative w-full max-w-2xl bg-surface-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {currentStep === 'SUCCESS' && <ConfettiEffect />}
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="consent-modal-title" className="text-base font-bold text-text-primary">
                {currentStep === 'TERMS' &&
                  'Cam kết Thu thập & Xử lý Dữ liệu Sinh trắc học (Nghị định 13/2023/NĐ-CP)'}
                {currentStep === 'OTP_DISPLAY' && 'Mã OTP Kích hoạt tại Trạm Kiosk'}
                {currentStep === 'SUCCESS' && 'Kích hoạt Thành công'}
              </h2>
              <p className="text-xs text-text-secondary">
                {currentStep === 'TERMS' &&
                  'Vui lòng đọc hết điều khoản bảo mật dữ liệu trước khi ký'}
                {currentStep === 'OTP_DISPLAY' &&
                  'Sử dụng mã OTP hoặc quét mã QR tại trạm Kiosk để nạp khuôn mặt'}
                {currentStep === 'SUCCESS' && 'Hồ sơ sinh trắc học của bạn đã sẵn sàng hoạt động'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung theo từng bước */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm text-status-danger">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* BƯỚC 1: ĐIỀU KHOẢN PHÁP LÝ INFORMED CONSENT */}
          {currentStep === 'TERMS' && (
            <div className="space-y-4">
              <div
                ref={termsContainerRef}
                onScroll={handleTermsScroll}
                tabIndex={0}
                role="region"
                aria-label="Văn bản điều khoản cam kết"
                className="p-4 rounded-xl border border-border-subtle bg-slate-50 text-sm text-slate-700 space-y-3.5 max-h-64 sm:max-h-72 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                data-testid="terms-container"
              >
                <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>ĐIỀU KHOẢN BẢO VỆ DỮ LIỆU CÁ NHÂN & THU THẬP SINH TRẮC HỌC</span>
                </div>

                <p className="font-medium text-slate-800">
                  Căn cứ Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân, Hệ thống
                  Điểm danh Khuôn mặt (FAS) xin thông báo và xin ý kiến chấp thuận của Quý nhân
                  viên đối với việc thu thập, xử lý dữ liệu đặc trưng sinh trắc học:
                </p>

                <div className="space-y-2 pl-2">
                  <p>
                    <strong>1. Mục đích thu thập:</strong> Dữ liệu đặc trưng khuôn mặt (vector biểu
                    diễn toán học) chỉ được sử dụng duy nhất cho mục đích nhận diện điểm danh vào/ra,
                    quản lý chấm công và kiểm soát an ninh tại trụ sở doanh nghiệp.
                  </p>
                  <p>
                    <strong>2. Nguyên tắc bảo mật & Công nghệ:</strong> Hệ thống TUYỆT ĐỐI KHÔNG lưu
                    trữ ảnh chụp khuôn mặt thô hoặc hình ảnh cá nhân gốc trên máy trạm Kiosk. Hình ảnh
                    sau khi quét được trích xuất thành vector 128D/512D ẩn danh và mã hóa bằng chuẩn
                    AES-256-GCM trước khi truyền về máy chủ trung tâm.
                  </p>
                  <p>
                    <strong>3. Quyền của chủ thể dữ liệu:</strong> Quý nhân viên có quyền được biết,
                    tra cứu lịch sử điểm danh, yêu cầu chỉnh sửa thông tin sai sót hoặc rút lại sự đồng
                    thuận bất kỳ lúc nào tại Cổng Thông Tin Nhân Viên. Khi rút cam kết, dữ liệu vector
                    sinh trắc học của Quý nhân viên sẽ được tiêu hủy hoàn toàn trong vòng 7 ngày làm
                    việc.
                  </p>
                  <p>
                    <strong>4. Phương thức thay thế:</strong> Trường hợp Quý nhân viên không đồng ý
                    thu thập sinh trắc học khuôn mặt, Quý nhân viên sẽ sử dụng Mã PIN 6 số do phòng
                    Nhân sự cấp để thực hiện điểm danh tại trạm Kiosk.
                  </p>
                  <p className="text-xs text-slate-500 italic pt-2 border-t border-slate-200">
                    Bằng việc xác nhận dưới đây, Quý nhân viên khẳng định đã đọc, hiểu rõ toàn bộ nội
                    dung và hoàn toàn tự nguyện cho phép Doanh nghiệp xử lý dữ liệu sinh trắc học theo
                    các mục đích đã nêu trên.
                  </p>
                </div>
              </div>

              {/* Chỉ báo cuộn văn bản */}
              {!hasScrolledToBottom ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Vui lòng cuộn xuống dưới cùng của văn bản để mở khóa nút xác nhận.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Đã đọc hết nội dung văn bản. Bạn có thể tích chọn xác nhận bên dưới.</span>
                </div>
              )}

              {/* Checkbox cam kết */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none ${
                  !hasScrolledToBottom
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                    : isAgreed
                      ? 'bg-brand-50/40 border-brand-300'
                      : 'hover:bg-slate-50 border-border-subtle'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!hasScrolledToBottom}
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  data-testid="consent-agreement-checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand-600 focus:ring-brand-500 disabled:opacity-40"
                />
                <span className="text-sm text-text-primary font-medium leading-snug">
                  Tôi đã đọc kỹ, hiểu rõ và hoàn toàn đồng ý với các điều khoản bảo vệ và xử lý dữ liệu
                  sinh trắc học nêu trên.
                </span>
              </label>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleSignConsent}
                  disabled={!hasScrolledToBottom || !isAgreed || isSubmitting}
                  data-testid="submit-consent-btn"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all shadow-brand-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Tôi đồng ý và Ký cam kết</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 2: HIỂN THỊ MÃ OTP KÍCH HOẠT */}
          {currentStep === 'OTP_DISPLAY' && effectiveOtpData && (
            <div className="flex flex-col items-center text-center space-y-5 py-2">
              <p className="text-xs uppercase font-bold tracking-wider text-text-tertiary">
                Mã OTP Kích hoạt tại Trạm Kiosk
              </p>

              {/* Hộp OTP to rõ 48px kèm nút sao chép */}
              <div className="w-full flex flex-col items-center gap-3.5 py-5 px-6 rounded-2xl bg-gradient-to-b from-brand-50/60 to-indigo-50/30 border border-brand-200 shadow-xs">
                <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                  Mã xác thực gồm 6 chữ số
                </span>

                <div className="flex items-center justify-center gap-3">
                  <div
                    data-testid="otp-display-box"
                    className="px-8 py-3.5 rounded-2xl bg-white border-2 border-dashed border-brand-300 text-brand-700 font-mono text-4xl sm:text-5xl font-extrabold tracking-[0.25em] shadow-sm select-all"
                  >
                    {effectiveOtpData.otp.length === 6
                      ? `${effectiveOtpData.otp.slice(0, 3)} ${effectiveOtpData.otp.slice(3)}`
                      : effectiveOtpData.otp}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    data-testid="copy-otp-btn"
                    title="Sao chép mã OTP"
                    className="p-3.5 rounded-xl border border-border-subtle bg-white hover:bg-slate-50 text-text-secondary hover:text-brand-600 transition-colors shadow-sm"
                  >
                    {isCopied ? (
                      <Check className="w-5 h-5 text-status-success" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>
                    Thời hạn: <strong>48 giờ</strong> (
                    {effectiveOtpData.expiresAt
                      ? new Date(effectiveOtpData.expiresAt).toLocaleString('vi-VN')
                      : 'Hết hạn sau 48h'}
                    )
                  </span>
                </div>
              </div>

              {/* 3 Bước hướng dẫn kích hoạt tại Kiosk */}
              <div className="w-full space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>3 bước hoàn tất kích hoạt tại máy trạm Kiosk:</span>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600 leading-relaxed">
                  <li>Di chuyển tới trạm Kiosk bất kỳ tại sảnh công ty.</li>
                  <li>
                    Bấm phím <strong>F3</strong> (hoặc chạm nút <em>"Đăng ký khuôn mặt"</em> trên màn hình).
                  </li>
                  <li>
                    Nhập <strong>mã OTP gồm 6 chữ số</strong> ở trên vào bàn phím số cảm ứng và căn chỉnh khuôn mặt vào khung Oval.
                  </li>
                </ol>

                {effectiveOtpData.kioskLocations && effectiveOtpData.kioskLocations.length > 0 && (
                  <div className="mt-1 text-slate-600 border-t border-slate-200 pt-1.5">
                    Các trạm khả dụng: {effectiveOtpData.kioskLocations.join(', ')}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-brand-700">
                  <Radio className="w-4 h-4 animate-pulse shrink-0 text-brand-600" />
                  <span className="font-medium">
                    Kênh trực tuyến: Đang đợi tín hiệu quét mặt từ Kiosk... (Màn hình tự động cập nhật ngay)
                  </span>
                </div>
              </div>

              <div className="w-full flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Đóng (tiếp tục chờ tại Kiosk)
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 3: KÍCH HOẠT THÀNH CÔNG */}
          {currentStep === 'SUCCESS' && (
            <div className="flex flex-col items-center text-center space-y-4 py-8 animate-fade-in relative z-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-status-success flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-primary">
                  Kích hoạt Khuôn mặt Thành công!
                </h3>
                <p className="text-sm text-text-secondary max-w-sm">
                  Dữ liệu khuôn mặt của bạn đã được quét và nạp thành công tại trạm Kiosk. Bạn đã có
                  thể bắt đầu điểm danh khuôn mặt ngay từ hôm nay.
                </p>
                <p className="text-xs text-text-tertiary pt-2">
                  Hộp thoại sẽ tự động đóng sau 3 giây...
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                data-testid="complete-consent-btn"
                className="mt-4 px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all shadow-brand-500/20"
              >
                Hoàn tất & Bắt đầu
              </button>
            </div>
          )}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
