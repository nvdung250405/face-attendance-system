import React from 'react'
import { cn } from '../../utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'card-surface overflow-hidden transition-all duration-150',
        hoverable && 'hover:shadow-md hover:border-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('p-5 border-b border-border-subtle flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn('text-base font-bold text-text-primary leading-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn('text-xs text-text-secondary mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('p-4 border-t border-border-subtle bg-slate-50/50 flex items-center justify-end gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}
