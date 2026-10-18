import React, { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

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
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid={dataTestId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={cn(
          'card-surface w-full bg-white shadow-2xl overflow-hidden my-auto',
          'animate-in fade-in zoom-in-95 duration-150',
          sizeStyles[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-border-subtle bg-slate-50/50">
            <div className="flex items-center gap-3">
              {icon && <div className="shrink-0">{icon}</div>}
              <div>
                {title && (
                  <h3 className="text-base font-bold text-text-primary leading-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-text-secondary mt-1">{description}</p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border-subtle bg-slate-50/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
