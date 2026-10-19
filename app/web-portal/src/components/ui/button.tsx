import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98]',
        primary:
          'bg-brand-primary text-white hover:bg-brand-hover focus-visible:ring-brand-primary shadow-xs border-transparent',
        destructive:
          'bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:scale-[0.98]',
        danger:
          'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-xs border-transparent',
        outline:
          'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
        secondary:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98]',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        link:
          'text-indigo-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
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
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
