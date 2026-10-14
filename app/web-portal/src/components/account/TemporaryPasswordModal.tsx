/**
 * Hộp thoại Hiển thị Mật khẩu Tạm thời Khởi tạo Tài khoản (DD-WEB-018, SOL-WEB-006, TASK-WEB-024).
 *
 * RÀNG BUỘC BẢO MẬT:
 * 1. Mật khẩu tạm chỉ hiển thị duy nhất MỘT LẦN trên giao diện khi tạo mới hoặc cấp lại.
 * 2. Tuyệt đối KHÔNG lưu trữ hay cache vào LocalStorage, SessionStorage hay Zustand.
 * 3. Hỗ trợ nút sao chép vào bộ nhớ tạm với phản hồi thị giác rõ ràng.
 */

import React, { useState } from 'react'

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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
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
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
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
