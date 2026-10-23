import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

/**
 * Button Component chuẩn hóa theo FAS Design Tokens (Indigo Clean SaaS) & UI States:
 * Hỗ trợ đầy đủ 4 trạng thái tương tác:
 * 1. Default (primary, secondary, outline, danger/destructive, ghost, link)
 * 2. Loading (isLoading, hiển thị spinner xoay, tự động vô hiệu hóa bấm kép)
 * 3. Error (isError/hasError/error, hiển thị viền/nền báo lỗi ngữ nghĩa)
 * 4. Disabled (disabled, mờ 50%, chặn tương tác, con trỏ not-allowed)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-brand-primary text-white shadow-xs hover:bg-brand-hover active:scale-[0.98]',
        primary:
          'bg-brand-primary text-white hover:bg-brand-hover focus-visible:ring-brand-primary shadow-xs border-transparent',
        destructive:
          'bg-status-danger text-white shadow-xs hover:bg-rose-700 active:scale-[0.98]',
        danger:
          'bg-status-danger text-white hover:bg-rose-700 focus-visible:ring-status-danger shadow-xs border-transparent',
        outline:
          'border border-border-subtle bg-white text-text-primary hover:bg-slate-50 hover:text-slate-900',
        secondary:
          'bg-slate-100 text-text-primary hover:bg-slate-200 active:scale-[0.98]',
        ghost:
          'text-text-secondary hover:bg-slate-100 hover:text-text-primary',
        link:
          'text-brand-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
      isError: {
        true: 'border-status-danger bg-status-danger-bg text-status-danger hover:bg-rose-100 focus-visible:ring-status-danger',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      isError: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: React.ReactNode
  isError?: boolean
  hasError?: boolean
  error?: boolean | string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      isError = false,
      hasError = false,
      error = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isErr = Boolean(isError || hasError || error)
    const isDisabled = Boolean(disabled || isLoading)
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({
            variant: isErr ? undefined : variant,
            size,
            isError: isErr,
            className,
          })
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading ? 'true' : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-invalid={isErr ? 'true' : undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 size-4 text-current"
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
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

