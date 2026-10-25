import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog'
import { cn } from '@/utils/cn'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: ModalSize
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  dataTestId?: string
  className?: string
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
}

/**
 * Modal Component chuẩn hóa kế thừa từ shadcn Dialog và Radix UI Primitive.
 * Tự động quản lý Focus trap, phím ESC, Portal và Scroll lock.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  dataTestId,
  className,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        data-testid={dataTestId}
        hideCloseButton={!showCloseButton}
        className={cn(sizeStyles[size], className)}
        onPointerDownOutside={(e) => {
          if (!closeOnOverlayClick) {
            e.preventDefault()
          }
        }}
      >
        {(title || icon || description) && (
          <DialogHeader>
            <div className="flex items-center gap-3">
              {icon && <div className="shrink-0">{icon}</div>}
              <div>
                {title && <DialogTitle>{title}</DialogTitle>}
                {description && (
                  <DialogDescription className="mt-1">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
        )}

        <div className="py-1 text-slate-700">{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
