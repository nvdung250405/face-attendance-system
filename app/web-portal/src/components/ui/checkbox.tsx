import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, disabled, checked, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="flex flex-col gap-1 select-none">
        <label
          htmlFor={inputId}
          className={cn(
            'inline-flex items-start gap-2.5 min-h-[40px] py-1 cursor-pointer group',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
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
                'w-5 h-5 rounded-md border border-slate-300 bg-white transition-all duration-150 flex items-center justify-center',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary peer-focus-visible:ring-offset-2',
                'peer-checked:bg-brand-primary peer-checked:border-brand-primary peer-checked:text-white',
                'peer-hover:border-slate-400 group-hover:border-indigo-400',
                disabled && 'bg-slate-100 border-slate-200 peer-checked:bg-slate-400',
                error && 'border-status-danger',
                className
              )}
            >
              <Check className="w-3.5 h-3.5 stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity text-white" />
            </div>
          </div>
          {(label || description) && (
            <div className="flex flex-col">
              {label && (
                <span className="text-sm font-semibold text-text-primary leading-tight">
                  {label}
                </span>
              )}
              {description && (
                <span className="text-xs text-text-secondary mt-0.5 leading-normal">
                  {description}
                </span>
              )}
            </div>
          )}
        </label>
        {error && <span className="text-xs text-status-danger font-medium ml-7">{error}</span>}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
