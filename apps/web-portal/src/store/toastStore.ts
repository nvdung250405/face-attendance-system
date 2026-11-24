import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (newToast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const duration = newToast.duration ?? 4000

    set((state) => ({
      toasts: [...state.toasts, { ...newToast, id, duration }],
    }))

    if (duration > 0) {
      const timer = setTimeout(() => {
        toastTimers.delete(id)
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
      toastTimers.set(id, timer)
    }

    return id
  },
  removeToast: (id) => {
    const timer = toastTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      toastTimers.delete(id)
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  clearToasts: () => {
    toastTimers.forEach((timer) => clearTimeout(timer))
    toastTimers.clear()
    set({ toasts: [] })
  },
}))

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

