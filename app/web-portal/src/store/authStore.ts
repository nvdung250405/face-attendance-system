/**
 * Zustand Auth Store & Multi-Tab Synchronization (SOL-WEB-001, BLD-WEB-012, DATA-WEB-001).
 * Quản lý thông tin xác thực, vai trò người dùng và đồng bộ LocalStorage 'fas_auth_session'.
 */

import { create } from 'zustand'
import type { AuthSession, UserProfile, UserRole } from '@/types'
import { AUTH_STORAGE_KEY } from '@/services/apiClient'
import { safeLocalStorage, onStorageKeyChange } from '@/services/storage'

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
 * Đọc phiên an toàn qua SafeLocalStorage (DTD-WEB-001, DD-WEB-003)
 */
export function readSessionFromStorage(): AuthSession | null {
  const session = safeLocalStorage.getItem<AuthSession>(AUTH_STORAGE_KEY)
  if (!session || !session.accessToken || !session.user) {
    return null
  }
  return session
}

/**
 * Lưu phiên an toàn qua SafeLocalStorage (DTD-WEB-001, DD-WEB-003)
 */
export function writeSessionToStorage(session: AuthSession | null): void {
  if (session) {
    safeLocalStorage.setItem(AUTH_STORAGE_KEY, session)
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
 * Lắng nghe sự kiện storage trên window để đồng bộ đa tab (DTD-WEB-002, DD-WEB-004)
 */
export function setupMultiTabAuthSync(): () => void {
  return onStorageKeyChange<AuthSession>(AUTH_STORAGE_KEY, (newSession) => {
    if (!newSession || !newSession.accessToken) {
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
