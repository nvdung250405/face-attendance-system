import * as React from 'react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  dataTestId?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  dataTestId = 'empty-state',
}) => {
  return (
    <div
      data-testid={dataTestId}
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3.5 shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-800 leading-snug">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
