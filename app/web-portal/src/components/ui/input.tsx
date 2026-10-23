import * as React from 'react'
import { Label } from './label'
import { cn } from '@/utils/cn'

/**
 * Input Component chuẩn hóa theo FAS Design Tokens & UI States:
 * Hỗ trợ đầy đủ 4 trạng thái tương tác:
 * 1. Default (trắng sáng, viền subtle, focus ring theo màu thương hiệu brand-primary)
 * 2. Loading (isLoading, hiển thị spinner xoay ở góc phải, cursor wait, aria-busy)
 * 3. Error (error/hasError/isError, viền đỏ status-danger, focus ring đỏ, aria-invalid)
 * 4. Disabled (disabled, nền xám slate-50, chữ mờ text-muted, cursor not-allowed)
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
  hasError?: boolean
  isError?: boolean
  isLoading?: boolean
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
      hasError = false,
      isError = false,
      isLoading = false,
      id: customId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = customId || generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const isInvalid = Boolean(error || hasError || isError)
    const isDisabled = Boolean(disabled || isLoading)

    const inputElement = (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 shrink-0">
            {leftIcon}
          </div>
        )}
        <input
          data-slot="input"
          id={inputId}
          type={type}
          disabled={isDisabled}
          aria-busy={isLoading ? 'true' : undefined}
          aria-invalid={isInvalid ? 'true' : undefined}
          aria-disabled={isDisabled ? 'true' : undefined}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={cn(
            'flex w-full rounded-lg border border-border-subtle bg-white px-3.5 py-2 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:outline-hidden focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-text-muted disabled:border-slate-200',
            sizeStyles[inputSize],
            leftIcon && 'pl-9',
            (rightIcon || isLoading) && 'pr-9',
            isInvalid &&
              'border-status-danger text-rose-900 focus:border-status-danger focus:ring-status-danger/20',
            isLoading && 'bg-slate-50/70 cursor-wait',
            className
          )}
          ref={ref}
          {...props}
        />
        {isLoading ? (
          <div
            data-testid="input-loading-spinner"
            className="absolute right-3 flex items-center pointer-events-none text-brand-primary shrink-0"
          >
            <svg
              className="animate-spin size-4"
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
          </div>
        ) : rightIcon ? (
          <div className="absolute right-3 flex items-center text-slate-400 shrink-0">
            {rightIcon}
          </div>
        ) : null}
      </div>
    )

    if (!label && !error && !hint) {
      return inputElement
    }

    return (
      <div className="flex flex-col gap-1.5 w-full font-sans">
        {label && (
          <Label
            htmlFor={inputId}
            className={cn(
              'block text-xs font-semibold text-slate-700',
              disabled && 'text-slate-400'
            )}
          >
            {label}
          </Label>
        )}
        {inputElement}
        {error ? (
          <p id={errorId} className="text-xs text-status-danger font-medium">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }

