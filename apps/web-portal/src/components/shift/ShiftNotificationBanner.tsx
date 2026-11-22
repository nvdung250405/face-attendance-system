import React from 'react'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

interface ShiftNotificationBannerProps {
  notification: {
    type: 'success' | 'error' | 'warning'
    message: string
  } | null
  onClose: () => void
}

export const ShiftNotificationBanner: React.FC<ShiftNotificationBannerProps> = ({
  notification,
  onClose,
}) => {
  if (!notification) return null

  return (
    <div
      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xs ${
        notification.type === 'success'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : notification.type === 'warning'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-rose-50 text-rose-800 border-rose-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {notification.type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        )}
        <span>{notification.message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
