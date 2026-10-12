/**
 * Zustand Auth Store & Multi-Tab Synchronization (SOL-WEB-001, BLD-WEB-012, DATA-WEB-001).
 * Quản lý thông tin xác thực, vai trò người dùng và đồng bộ LocalStorage 'fas_auth_session'.
 */

import { create } from 'zustand'
import type { AuthSession, UserProfile, UserRole } from '@/types'
import { AUTH_STORAGE_KEY } from '@/services/apiClient'

export function getDefaultPathForRole(role?: UserRole): string {
  switch (role) {
    case 'EMPLOYEE':
      return '/employee/dashboard'
    case 'HR_MANAGER':
    case 'ADMIN':
    case 'DPO':
      return '/admin/dashboard'
    default:
      return '/login'
  }
}

/**
 * Đọc phiên an toàn từ LocalStorage
 */
export function readSessionFromStorage(): AuthSession | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    if (!session || !session.accessToken || !session.user) {
      return null
    }
    return session
  } catch {
    return null
  }
}

/**
 * Lưu phiên an toàn vào LocalStorage
 */
export function writeSessionToStorage(session: AuthSession | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch {
    // QuotaExceededError hoặc Private Browsing fallback
  }
}

interface AuthState {
  session: AuthSession | null
  user: UserProfile | null
  isAuthenticated: boolean
  isInitialized: boolean

  // Actions
  initialize: () => void
  setSession: (session: AuthSession) => void
  clearSession: () => void
  updateUser: (partialUser: Partial<UserProfile>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  initialize: () => {
    const existing = readSessionFromStorage()
    if (existing) {
      set({
        session: existing,
        user: existing.user,
        isAuthenticated: true,
        isInitialized: true,
      })
    } else {
      set({
        session: null,
        user: null,
        isAuthenticated: false,
        isInitialized: true,
      })
    }
  },

  setSession: (session: AuthSession) => {
    writeSessionToStorage(session)
    set({
      session,
      user: session.user,
      isAuthenticated: true,
    })
  },

  clearSession: () => {
    writeSessionToStorage(null)
    set({
      session: null,
      user: null,
      isAuthenticated: false,
    })
  },

  updateUser: (partialUser: Partial<UserProfile>) => {
    const current = get().session
    if (!current) return
    const updatedUser = { ...current.user, ...partialUser }
    const updatedSession = { ...current, user: updatedUser }
    writeSessionToStorage(updatedSession)
    set({
      session: updatedSession,
      user: updatedUser,
    })
  },
}))

/**
 * Lắng nghe sự kiện storage trên window để đồng bộ đa tab (DD-WEB-004)
 */
export function setupMultiTabAuthSync(): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      if (!event.newValue) {
        useAuthStore.getState().clearSession()
      } else {
        try {
          const newSession = JSON.parse(event.newValue) as AuthSession
          if (newSession && newSession.accessToken) {
            useAuthStore.setState({
              session: newSession,
              user: newSession.user,
              isAuthenticated: true,
            })
          }
        } catch {
          useAuthStore.getState().clearSession()
        }
      }
    }
  }

  window.addEventListener('storage', handleStorageChange)
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}
