import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { isOvernightShift } from '@/utils/date'
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  MinusCircle,
  Calendar,
  FileQuestion,
} from 'lucide-react'

export interface AttendanceStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
  lateMinutes?: number
  showIcon?: boolean
  shortLate?: boolean
  lateFormat?: 'short' | 'standard' | 'verbose'
  size?: 'default' | 'sm'
  isOvernight?: boolean
  startTime?: string
  endTime?: string
  testId?: string
  'data-testid'?: string
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    variant: 'success' | 'warning' | 'destructive' | 'info' | 'neutral'
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  ON_TIME: { label: 'Đúng giờ', variant: 'success', icon: CheckCircle2 },
  LATE: { label: 'Đi muộn', variant: 'warning', icon: AlertTriangle },
  EARLY_LEAVE: { label: 'Về sớm', variant: 'warning', icon: Clock },
  OVERTIME: { label: 'Tăng ca', variant: 'info', icon: Clock },
  ANOMALOUS: { label: 'Bất thường', variant: 'destructive', icon: AlertTriangle },
  ABSENT: { label: 'Vắng mặt', variant: 'destructive', icon: ShieldAlert },
  REST_DAY: { label: 'Nghỉ tuần', variant: 'neutral', icon: MinusCircle },
  HOLIDAY: { label: 'Nghỉ lễ', variant: 'info', icon: Calendar },
  EXCUSE_PENDING: { label: 'Chờ duyệt giải trình', variant: 'info', icon: FileQuestion },
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = React.memo(
  ({
    status,
    lateMinutes,
    showIcon = false,
    shortLate = false,
    lateFormat,
    size = 'default',
    isOvernight,
    startTime,
    endTime,
    testId,
    'data-testid': dataTestId,
    className,
    ...props
  }) => {
    const config = STATUS_CONFIG[status] || {
      label: status,
      variant: 'neutral' as const,
      icon: MinusCircle,
    }

    let label = config.label
    if (status === 'LATE' && lateMinutes && lateMinutes > 0) {
      if (shortLate || lateFormat === 'short') {
        label = `Muộn ${lateMinutes}p`
      } else if (lateFormat === 'verbose') {
        label = `Đi muộn (${lateMinutes} phút)`
      } else {
        label = `Đi muộn (${lateMinutes}p)`
      }
    }

    const IconComponent = config.icon
    const iconClass = size === 'sm' ? 'w-2.5 h-2.5 shrink-0' : 'w-3.5 h-3.5 shrink-0'

    const crossesMidnight = isOvernight || (startTime && endTime && isOvernightShift(startTime, endTime))

    return (
      <span className="inline-flex items-center gap-1">
        <Badge
          variant={config.variant}
          icon={showIcon ? <IconComponent className={iconClass} /> : undefined}
          data-testid={testId || dataTestId}
          className={cn(
            size === 'sm' && 'text-2xs px-1.5 py-0.5 rounded-sm',
            className
          )}
          {...props}
        >
          {label}
        </Badge>
        {crossesMidnight && (
          <span
            data-testid="overnight-badge"
            className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0"
            title="Ca làm việc qua đêm (+1 ngày)"
          >
            +1 ngày
          </span>
        )}
      </span>
    )
  }
)

AttendanceStatusBadge.displayName = 'AttendanceStatusBadge'
