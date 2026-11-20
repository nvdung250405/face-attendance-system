import * as React from 'react'
import { cn } from '@/utils/cn'

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: React.ReactNode
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, disabled, checked, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex items-center justify-between gap-4 min-h-[44px] py-1 cursor-pointer select-none group',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-semibold text-text-primary leading-tight">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-text-secondary mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
        <div className="relative inline-flex items-center shrink-0">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            disabled={disabled}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-11 h-6 rounded-full bg-slate-200 transition-colors duration-200',
              'peer-checked:bg-brand-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary peer-focus-visible:ring-offset-2',
              disabled && 'bg-slate-100 peer-checked:bg-slate-300',
              className
            )}
          />
          <div
            className={cn(
              'absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
              'peer-checked:translate-x-5'
            )}
          />
        </div>
      </label>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
