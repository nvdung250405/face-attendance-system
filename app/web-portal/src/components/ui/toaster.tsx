import React from 'react'
import { useToastStore } from '@/store/toastStore'
import { ToastCard } from './toast'

export const Toaster: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      data-testid="global-toaster"
      aria-label="Thông báo hệ thống"
      className="fixed z-60 flex flex-col gap-2 pointer-events-none max-w-sm w-full
                 top-4 right-4 sm:top-5 sm:right-5
                 max-sm:top-auto max-sm:bottom-4 max-sm:inset-x-4 max-sm:mx-auto"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} />
      ))}
    </div>
  )
}
