import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { logoutService } from '@/services/logoutService'

export interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navigate = useNavigate()

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutService.logout()
      onClose()
      navigate('/login', { replace: true })
    } catch {
      onClose()
      navigate('/login', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoggingOut) onClose()
      }}
    >
      <DialogContent
        data-testid="logout-confirm-modal"
        className="sm:max-w-sm sm:p-6"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <LogOut size={20} strokeWidth={2.25} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
                Xác nhận đăng xuất
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Bạn có chắc muốn đăng xuất khỏi tài khoản này?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            id="btn-cancel-logout"
            data-testid="btn-cancel-logout"
            onClick={onClose}
            disabled={isLoggingOut}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Ở lại
          </Button>
          <Button
            type="button"
            variant="destructive"
            id="btn-confirm-logout"
            data-testid="btn-confirm-logout"
            onClick={handleConfirmLogout}
            isLoading={isLoggingOut}
            loadingText="Đang đăng xuất..."
            className="w-full sm:w-auto min-h-[44px]"
          >
            Đăng xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

