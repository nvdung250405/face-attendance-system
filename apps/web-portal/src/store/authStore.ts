/**
 * Zustand Auth Store & Multi-Tab Synchronization (SOL-WEB-001, BLD-WEB-012, DATA-WEB-001).
 * Quản lý thông tin xác thực, vai trò người dùng và đồng bộ LocalStorage 'fas_auth_session'.
 */

import { create } from 'zustand'
import type { AuthSession, UserProfile, UserRole } from '@/types'
import { safeLocalStorage, onStorageKeyChange, AUTH_STORAGE_KEY } from '@/services/storage'

export { AUTH_STORAGE_KEY }

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
 * Đọc phiên an toàn qua SafeLocalStorage (DTD-WEB-001, DD-WEB-003, SEC-002)
 */
export function readSessionFromStorage(): AuthSession | null {
  const session = safeLocalStorage.getItem<AuthSession>(AUTH_STORAGE_KEY)
  if (!session || !session.user) {
    return null
  }
  return session
}

/**
 * Lưu phiên an toàn qua SafeLocalStorage (DTD-WEB-001, DD-WEB-003, SEC-002, F-TECH-08)
 * Lưu trữ thông tin người dùng; accessToken và refreshToken được lưu trong RAM Zustand.
 */
export function writeSessionToStorage(session: AuthSession | null): void {
  if (session) {
    // SEC-002 & F-TECH-08: Exclude sensitive accessToken and refreshToken from localStorage to prevent DOM XSS theft.
    // Both tokens are strictly preserved in Zustand in-memory RAM state.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken: _a, refreshToken: _r, ...persistentSession } = session
    safeLocalStorage.setItem(AUTH_STORAGE_KEY, persistentSession)
  } else {
    safeLocalStorage.removeItem(AUTH_STORAGE_KEY)
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

export const useAuthStore = create<AuthState>((set, get) => {
  const initialSession = readSessionFromStorage()

  return {
    session: initialSession,
    user: initialSession?.user ?? null,
    isAuthenticated: Boolean(initialSession?.user),
    isInitialized: true,

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
}
})

/**
 * Lắng nghe sự kiện storage trên window để đồng bộ đa tab (DTD-WEB-002, DD-WEB-004)
 */
export function setupMultiTabAuthSync(): () => void {
  return onStorageKeyChange<AuthSession>(AUTH_STORAGE_KEY, (newSession) => {
    if (!newSession || (!newSession.accessToken && !newSession.refreshToken)) {
      useAuthStore.getState().clearSession()
    } else {
      useAuthStore.setState({
        session: newSession,
        user: newSession.user,
        isAuthenticated: true,
      })
    }
  })
}
