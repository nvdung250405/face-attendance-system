import * as React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastItem, type ToastType } from '@/store/toastStore'
import { cn } from '@/utils/cn'

const typeConfig: Record<
  ToastType,
  {
    icon: React.ReactNode
    containerClass: string
    titleClass: string
  }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    containerClass: 'bg-white border-emerald-200 shadow-emerald-500/10',
    titleClass: 'text-emerald-950',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    containerClass: 'bg-white border-rose-200 shadow-rose-500/10',
    titleClass: 'text-rose-950',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    containerClass: 'bg-white border-amber-200 shadow-amber-500/10',
    titleClass: 'text-amber-950',
  },
  info: {
    icon: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
    containerClass: 'bg-white border-indigo-200 shadow-indigo-500/10',
    titleClass: 'text-indigo-950',
  },
}

export const ToastCard: React.FC<{ toast: ToastItem }> = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast)
  const cfg = typeConfig[toast.type]

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      data-testid={`toast-${toast.type}`}
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 pointer-events-auto select-none',
        'animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-4',
        cfg.containerClass
      )}
    >
      <div className="mt-0.5">{cfg.icon}</div>
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <div className={cn('text-xs font-bold leading-tight', cfg.titleClass)}>
            {toast.title}
          </div>
        )}
        <div className="text-xs text-slate-600 leading-snug mt-0.5">
          {toast.message}
        </div>
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label="Đóng thông báo"
        className="min-w-[44px] min-h-[44px] p-2 -mr-2 -mt-2 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        <X size={16} />
      </button>
    </div>
  )
}

/**
 * Tiện ích kích hoạt Toast toàn cục (Global Toast Dispatcher)
 */
export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ message, title, type: 'success', duration }),
  error: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ message, title, type: 'error', duration }),
  warning: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ message, title, type: 'warning', duration }),
  info: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ message, title, type: 'info', duration }),
}
