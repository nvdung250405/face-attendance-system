/**
 * Hộp thoại Hiển thị Mật khẩu Tạm thời Khởi tạo Tài khoản (DD-WEB-018, SOL-WEB-006, TASK-WEB-024).
 *
 * RÀNG BUỘC BẢO MẬT:
 * 1. Mật khẩu tạm chỉ hiển thị duy nhất MỘT LẦN trên giao diện khi tạo mới hoặc cấp lại.
 * 2. Tuyệt đối KHÔNG lưu trữ hay cache vào LocalStorage, SessionStorage hay Zustand.
 * 3. Hỗ trợ nút sao chép vào bộ nhớ tạm với phản hồi thị giác rõ ràng.
 */

import React, { useState } from 'react'
import { KeyRound, AlertTriangle, Check, Copy } from 'lucide-react'

export interface TemporaryPasswordModalProps {
  isOpen: boolean
  temporaryPassword: string | null
  employeeName?: string
  employeeCode?: string
  onClose: () => void
}

export const TemporaryPasswordModal: React.FC<TemporaryPasswordModalProps> = ({
  isOpen,
  temporaryPassword,
  employeeName,
  employeeCode,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !temporaryPassword) {
    return null
  }

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(temporaryPassword)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback nếu clipboard API bị chặn
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="temp-pwd-title"
      data-testid="temporary-password-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="card-surface w-full max-w-md p-6 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Tiêu đề & Icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <KeyRound size={22} strokeWidth={2} />
          </div>
          <div>
            <h3 id="temp-pwd-title" className="text-lg font-bold text-text-primary leading-snug">
              Mật khẩu tạm thời khởi tạo
            </h3>
            {(employeeName || employeeCode) && (
              <p className="text-xs text-text-secondary mt-0.5">
                Nhân viên: <span className="font-semibold text-text-primary">{employeeName}</span> {employeeCode ? `(${employeeCode})` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Khối cảnh báo bảo mật */}
        <div className="my-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cảnh báo hiển thị một lần:</p>
            <p className="mt-0.5">
              Mật khẩu này chỉ được hiển thị <span className="underline font-bold">duy nhất một lần</span> trên màn hình này và không được lưu trữ lại. Hãy sao chép và chuyển ngay cho nhân viên trước khi đóng hộp thoại.
            </p>
          </div>
        </div>

        {/* Ô hiển thị mật khẩu */}
        <div className="my-5">
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
            Mật khẩu tạm (Temporary Password)
          </label>
          <div className="flex items-center gap-2">
            <div
              data-testid="temporary-password-display"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 font-mono text-base font-bold text-slate-800 tracking-wider select-all text-center"
            >
              {temporaryPassword}
            </div>
            <button
              type="button"
              id="btn-copy-temp-password"
              data-testid="btn-copy-temp-password"
              onClick={handleCopy}
              className={`h-12 px-4 rounded-lg font-medium text-sm transition-all duration-150 inline-flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-primary text-white hover:bg-brand-hover'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy size={16} strokeWidth={2} />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-medium mt-1.5 text-center">
              ✓ Đã sao chép mật khẩu vào bộ nhớ tạm!
            </p>
          )}
        </div>

        {/* Nút đóng */}
        <div className="pt-3 border-t border-border-subtle flex justify-end">
          <button
            type="button"
            id="btn-close-temp-password"
            data-testid="btn-close-temp-password"
            onClick={onClose}
            className="btn-secondary w-full sm:w-auto px-6 font-semibold"
          >
            Đã lưu & Đóng hộp thoại
          </button>
        </div>
      </div>
    </div>
  )
}
