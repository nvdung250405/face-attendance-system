import * as React from 'react'
import { Label } from './label'
import { cn } from '@/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
  hasError?: boolean
}

const sizeStyles = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4',
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      hasError,
      id: customId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = customId || generatedId
    const isInvalid = Boolean(error || hasError)

    const inputElement = (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 shrink-0">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            'flex w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            sizeStyles[inputSize],
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            isInvalid && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center text-slate-400 shrink-0">
            {rightIcon}
          </div>
        )}
      </div>
    )

    if (!label && !error && !hint) {
      return inputElement
    }

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <Label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </Label>
        )}
        {inputElement}
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
