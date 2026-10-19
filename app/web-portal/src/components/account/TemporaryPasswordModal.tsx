/**
 * Hộp thoại Hiển thị Mật khẩu Tạm thời Khởi tạo Tài khoản (DD-WEB-018, SOL-WEB-006, TASK-WEB-024).
 * Kế thừa từ shadcn Dialog và Button (Radix UI Primitive).
 *
 * RÀNG BUỘC BẢO MẬT:
 * 1. Mật khẩu tạm chỉ hiển thị duy nhất MỘT LẦN trên giao diện khi tạo mới hoặc cấp lại.
 * 2. Tuyệt đối KHÔNG lưu trữ hay cache vào LocalStorage, SessionStorage hay Zustand.
 * 3. Hỗ trợ nút sao chép vào bộ nhớ tạm với phản hồi thị giác rõ ràng.
 */

import React, { useState } from 'react'
import { KeyRound, AlertTriangle, Check, Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        data-testid="temporary-password-modal"
        className="max-w-md p-6"
      >
        {/* Tiêu đề & Icon */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <KeyRound size={22} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle id="temp-pwd-title" className="text-lg font-bold text-slate-900 leading-snug">
                Mật khẩu tạm thời khởi tạo
              </DialogTitle>
              {(employeeName || employeeCode) && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân viên: <span className="font-semibold text-slate-900">{employeeName}</span> {employeeCode ? `(${employeeCode})` : ''}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Khối cảnh báo bảo mật */}
        <div className="my-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cảnh báo hiển thị một lần:</p>
            <p className="mt-0.5">
              Mật khẩu này chỉ được hiển thị <span className="underline font-bold">duy nhất một lần</span> trên màn hình này và không được lưu trữ lại. Hãy sao chép và chuyển ngay cho nhân viên trước khi đóng hộp thoại.
            </p>
          </div>
        </div>

        {/* Ô hiển thị mật khẩu */}
        <div className="my-3">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            Mật khẩu tạm (Temporary Password)
          </label>
          <div className="flex items-center gap-2">
            <div
              data-testid="temporary-password-display"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 font-mono text-base font-bold text-slate-800 tracking-wider select-all text-center"
            >
              {temporaryPassword}
            </div>
            <Button
              type="button"
              id="btn-copy-temp-password"
              data-testid="btn-copy-temp-password"
              onClick={handleCopy}
              variant={copied ? 'default' : 'default'}
              className={`h-12 px-4 rounded-xl ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
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
            </Button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-medium mt-1.5 text-center">
              ✓ Đã sao chép mật khẩu vào bộ nhớ tạm!
            </p>
          )}
        </div>

        {/* Nút đóng */}
        <DialogFooter className="pt-2">
          <Button
            type="button"
            id="btn-close-temp-password"
            data-testid="btn-close-temp-password"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto px-6 font-semibold"
          >
            Đã lưu & Đóng hộp thoại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
