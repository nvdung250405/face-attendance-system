import React, { useId } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4',
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      id: customId,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = customId || generatedId

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full bg-white text-text-primary border rounded-lg transition-colors placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              disabled && 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-border-subtle focus:border-brand-primary focus:ring-brand-primary/15',
              sizeStyles[inputSize],
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-text-muted">{hint}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
