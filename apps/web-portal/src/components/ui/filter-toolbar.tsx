import React, { useState, useEffect, useRef } from 'react'
import { Search, X, RotateCcw } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { cn } from '@/utils/cn'
import { useDebounce } from '@/hooks/useDebounce'

export interface FilterToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
}

export function FilterToolbarRoot({
  children,
  className,
  ...props
}: FilterToolbarProps) {
  return (
    <div
      role="search"
      aria-label="Thanh công cụ lọc"
      className={cn(
        'card-surface p-3.5 sm:p-4 rounded-xl border border-border-subtle flex flex-wrap items-center gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface FilterToolbarSearchProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onDebouncedChange?: (debouncedValue: string) => void
  placeholder?: string
  debounceMs?: number
  maxLength?: number
  disabled?: boolean
  className?: string
  inputClassName?: string
  id?: string
  'data-testid'?: string
  'aria-label'?: string
}

export function FilterToolbarSearch({
  value,
  defaultValue = '',
  onChange,
  onDebouncedChange,
  placeholder = 'Tìm kiếm...',
  debounceMs = 350,
  maxLength = 100,
  disabled = false,
  className,
  inputClassName,
  id,
  'data-testid': dataTestId = 'filter-toolbar-search',
  'aria-label': ariaLabel,
}: FilterToolbarSearchProps) {
  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(defaultValue)
  const activeValue = isControlled ? value : uncontrolledValue
  const debouncedValue = useDebounce(activeValue, debounceMs)
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    onDebouncedChange?.(debouncedValue)
  }, [debouncedValue, onDebouncedChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.slice(0, maxLength)
    if (!isControlled) {
      setUncontrolledValue(next)
    }
    onChange?.(next)
  }

  const handleClear = () => {
    if (!isControlled) {
      setUncontrolledValue('')
    }
    onChange?.('')
    onDebouncedChange?.('')
  }

  return (
    <div className={cn('relative flex-1 min-w-[200px]', className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
      </div>
      <input
        id={id}
        type="text"
        value={activeValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        data-testid={dataTestId}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
          inputClassName
        )}
      />
      {activeValue.length > 0 && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Xóa nội dung tìm kiếm"
          data-testid="filter-toolbar-search-clear"
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
        >
          <X className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export interface FilterSelectOption {
  value: string | number
  label: string
}

export interface FilterToolbarSelectProps {
  value: string | number
  onChange: (value: string) => void
  options: Array<FilterSelectOption | string>
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
  id?: string
  'data-testid'?: string
  'aria-label'?: string
}

export function FilterToolbarSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
  disabled = false,
  id,
  'data-testid': dataTestId = 'filter-toolbar-select',
  'aria-label': ariaLabel,
}: FilterToolbarSelectProps) {
  return (
    <div className={cn('w-full sm:w-auto min-w-[140px]', className)}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel ?? label ?? placeholder}
        data-testid={dataTestId}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const optVal = typeof opt === 'string' ? opt : opt.value
          const optLabel = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={String(optVal)} value={optVal}>
              {optLabel}
            </option>
          )
        })}
      </select>
    </div>
  )
}

export interface FilterToolbarDateRangeProps {
  from?: string
  to?: string
  onFromChange?: (value: string) => void
  onToChange?: (value: string) => void
  fromLabel?: string
  toLabel?: string
  label?: string
  className?: string
  disabled?: boolean
  'data-testid'?: string
  fromDataTestId?: string
  toDataTestId?: string
}

export function FilterToolbarDateRange({
  from = '',
  to = '',
  onFromChange,
  onToChange,
  fromLabel = 'Từ ngày',
  toLabel = 'Đến ngày',
  label = 'Khoảng ngày:',
  className,
  disabled = false,
  'data-testid': dataTestId = 'filter-toolbar-date-range',
  fromDataTestId = 'filter-date-from',
  toDataTestId = 'filter-date-to',
}: FilterToolbarDateRangeProps) {
  return (
    <div
      className={cn('flex items-center gap-2 flex-wrap', className)}
      data-testid={dataTestId}
    >
      {label && <span className="text-xs font-medium text-slate-500 shrink-0">{label}</span>}
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange?.(e.target.value)}
        disabled={disabled}
        title={fromLabel}
        aria-label={fromLabel}
        data-testid={fromDataTestId}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all disabled:bg-slate-50 cursor-pointer"
      />
      <span className="text-slate-400 text-xs font-medium shrink-0" aria-hidden="true">
        —
      </span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange?.(e.target.value)}
        disabled={disabled}
        title={toLabel}
        aria-label={toLabel}
        data-testid={toDataTestId}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 shadow-2xs transition-all disabled:bg-slate-50 cursor-pointer"
      />
    </div>
  )
}

export interface FilterToolbarActiveCountProps {
  count: number
  label?: string
  className?: string
}

export function FilterToolbarActiveCount({
  count,
  label = 'bộ lọc đang áp dụng',
  className,
}: FilterToolbarActiveCountProps) {
  if (count <= 0) return null

  return (
    <Badge
      variant="info"
      data-testid="filter-active-count-badge"
      className={cn(
        'h-7 px-2.5 text-2xs font-semibold rounded-md shrink-0 flex items-center gap-1',
        className
      )}
    >
      <span>{count}</span>
      <span>{label}</span>
    </Badge>
  )
}

export interface FilterToolbarResetProps {
  onClick: () => void
  visible?: boolean
  label?: string
  disabled?: boolean
  className?: string
  'data-testid'?: string
}

export function FilterToolbarReset({
  onClick,
  visible = true,
  label = 'Đặt lại',
  disabled = false,
  className,
  'data-testid': dataTestId = 'filter-reset-btn',
}: FilterToolbarResetProps) {
  if (!visible) return null

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      className={cn(
        'h-9 px-3 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer',
        className
      )}
    >
      <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  )
}

export function FilterToolbar({
  children,
  className,
  ...props
}: FilterToolbarProps) {
  return (
    <FilterToolbarRoot className={className} {...props}>
      {children}
    </FilterToolbarRoot>
  )
}

FilterToolbar.Search = FilterToolbarSearch
FilterToolbar.Select = FilterToolbarSelect
FilterToolbar.DateRange = FilterToolbarDateRange
FilterToolbar.ActiveCount = FilterToolbarActiveCount
FilterToolbar.Reset = FilterToolbarReset
