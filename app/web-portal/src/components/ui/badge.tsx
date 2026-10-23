import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none border',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-indigo-600 text-white shadow-xs hover:bg-indigo-700',
        secondary:
          'border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200',
        destructive:
          'border-rose-200 bg-rose-50 text-rose-700',
        danger:
          'border-rose-200 bg-rose-50 text-rose-800',
        outline: 'text-slate-700 border-slate-200 bg-white',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-800',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800',
        info:
          'border-sky-200 bg-sky-50 text-sky-700',
        neutral:
          'border-slate-200 bg-slate-100 text-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const dotColorMap: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  destructive: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  secondary: 'bg-slate-400',
  default: 'bg-indigo-300',
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  icon?: React.ReactNode
}

function Badge({ className, variant, dot = false, icon, children, ...props }: BadgeProps) {
  const dotColor = (variant && dotColorMap[variant]) || 'bg-slate-400'

  return (
    <div data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn('size-1.5 rounded-full shrink-0', dotColor)}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

export { Badge, badgeVariants }
