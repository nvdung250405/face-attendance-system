/**
 * DetailDrawer: Generic accessible slide-over right drawer (420px - 560px)
 * Tuân thủ WCAG 2.1/2.2 AA, xây dựng trên Radix Dialog / Sheet primitive.
 * (eval-web-ui-inventory-20261124-155500.md Master-Detail Architecture).
 */

import * as React from 'react'
import { X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './sheet'
import { cn } from '@/utils/cn'

export type DetailDrawerSize = 'sm' | 'md' | 'default' | 'lg' | 'xl' | 'full'

export interface DetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  size?: DetailDrawerSize
  children: React.ReactNode
  footer?: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
  contentClassName?: string
  closeButtonAriaLabel?: string
  'data-testid'?: string
}

const SIZE_CLASSES: Record<DetailDrawerSize, string> = {
  sm: 'sm:max-w-[380px]',
  md: 'sm:max-w-[420px]',
  default: 'sm:max-w-[480px]',
  lg: 'sm:max-w-[560px]',
  xl: 'sm:max-w-[640px]',
  full: 'sm:max-w-full',
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  badge,
  size = 'default',
  children,
  footer,
  headerActions,
  className,
  contentClassName,
  closeButtonAriaLabel = 'Đóng ngăn chi tiết',
  'data-testid': testId = 'detail-drawer',
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        hideCloseButton
        data-testid={testId}
        className={cn(
          'w-full p-0 flex flex-col bg-white text-slate-900 border-l border-slate-200 shadow-2xl',
          SIZE_CLASSES[size] || SIZE_CLASSES.default,
          className
        )}
      >
        {/* Accessible Drawer Header */}
        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between text-left gap-4 shrink-0">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <SheetTitle className="text-base font-bold text-slate-900 tracking-tight truncate">
                {title}
              </SheetTitle>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {description && (
              <SheetDescription className="text-xs text-slate-500 line-clamp-2">
                {description}
              </SheetDescription>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeButtonAriaLabel}
              data-testid="detail-drawer-close-btn"
              className="p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5 shrink-0" strokeWidth={2} />
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable Drawer Body */}
        <div
          className={cn(
            'p-6 space-y-6 overflow-y-auto flex-1 focus:outline-hidden text-xs text-slate-700',
            contentClassName
          )}
          tabIndex={-1}
        >
          {children}
        </div>

        {/* Optional Drawer Footer */}
        {footer && (
          <SheetFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
