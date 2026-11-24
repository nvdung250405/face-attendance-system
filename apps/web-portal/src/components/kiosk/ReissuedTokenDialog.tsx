import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { Check, Copy } from 'lucide-react'

export interface ReissuedTokenDialogProps {
  reissuedTokenKiosk: { kioskId: string; token: string } | null
  onClose: () => void
}

export const ReissuedTokenDialog: React.FC<ReissuedTokenDialogProps> = ({
  reissuedTokenKiosk,
  onClose,
}) => {
  const [copiedToken, setCopiedToken] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const handleCopy = () => {
    if (reissuedTokenKiosk?.token) {
      navigator.clipboard.writeText(reissuedTokenKiosk.token)
      setCopiedToken(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  const handleClose = () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    setCopiedToken(false)
    onClose()
  }

  return (
    <Dialog
      open={Boolean(reissuedTokenKiosk)}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent
        hideCloseButton
        aria-describedby="reissued-token-description"
        className="w-full max-w-md p-6 space-y-4"
      >
        {reissuedTokenKiosk && (
          <>
            <DialogTitle className="text-base font-bold text-slate-900">
              Cấp Lại Secret Token Thành Công
            </DialogTitle>
            <p id="reissued-token-description" className="sr-only">
              Secret Token mới của trạm Kiosk {reissuedTokenKiosk.kioskId}
            </p>

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
                onClick={handleCopy}
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
                onClick={handleClose}
              >
                Tôi đã lưu Token an toàn
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
