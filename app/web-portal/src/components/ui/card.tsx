import * as React from 'react'
import { cn } from '@/utils/cn'

/**
 * Card Component chuẩn hóa theo FAS Design Tokens & UI States:
 * Hỗ trợ đầy đủ 4 trạng thái tương tác:
 * 1. Default (bề mặt thẻ trắng sáng, bo góc chuẩn radius-card, viền subtle)
 * 2. Loading (isLoading, overlay spinner mờ hoặc skeleton, giữ steady layout, aria-busy)
 * 3. Error (error/isError/hasError, viền đỏ status-danger, thanh thông báo lỗi kèm nút Thử lại, role alert)
 * 4. Disabled (disabled/isDisabled, mờ 60%, chặn click pointer-events-none, cursor not-allowed)
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  loadingMessage?: React.ReactNode
  isError?: boolean
  hasError?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  disabled?: boolean
  isDisabled?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      children,
      isLoading = false,
      loadingMessage,
      isError = false,
      hasError = false,
      error,
      onRetry,
      disabled = false,
      isDisabled = false,
      ...props
    },
    ref
  ) => {
    const isCardError = Boolean(isError || hasError || error)
    const isCardDisabled = Boolean(disabled || isDisabled)

    return (
      <div
        ref={ref}
        data-slot="card"
        aria-busy={isLoading ? 'true' : undefined}
        aria-disabled={isCardDisabled ? 'true' : undefined}
        role={isCardError ? 'alert' : undefined}
        className={cn(
          'relative rounded-xl border border-border-subtle bg-surface-card text-text-primary shadow-xs transition-shadow',
          isCardDisabled &&
            'opacity-60 pointer-events-none select-none bg-slate-50/60 cursor-not-allowed',
          isCardError && 'border-status-danger/40 bg-status-danger-bg/5',
          className
        )}
        {...props}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div
            data-testid="card-loading-overlay"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-[1px] p-6 text-center transition-opacity"
          >
            <svg
              className="animate-spin size-6 text-brand-primary mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span className="text-xs font-medium text-text-secondary">
              {loadingMessage || 'Đang tải dữ liệu...'}
            </span>
          </div>
        )}

        {/* Error Alert Banner */}
        {isCardError && error && (
          <div
            data-testid="card-error-banner"
            className="p-3.5 border-b border-status-danger/20 bg-status-danger-bg flex items-center justify-between gap-3 text-status-danger text-xs font-medium rounded-t-xl"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-status-danger shrink-0" />
              <span>{typeof error === 'string' ? error : error}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs underline font-semibold hover:text-red-700 cursor-pointer pointer-events-auto shrink-0"
              >
                Thử lại
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn('flex flex-col gap-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-title"
    className={cn('font-bold leading-none tracking-tight text-text-primary', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-description"
    className={cn('text-sm text-text-secondary', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="card-content" className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

