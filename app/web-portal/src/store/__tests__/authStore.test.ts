/**
 * Unit Tests cho Zustand Auth Store (SOL-WEB-001, BLD-WEB-012, TST-WEB-013).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useAuthStore,
  getDefaultPathForRole,
  setupMultiTabAuthSync,
} from '../authStore'
import { AUTH_STORAGE_KEY } from '@/services/apiClient'
import type { AuthSession } from '@/types'

describe('Zustand Auth Store (TASK-WEB-016)', () => {
  const sampleSession: AuthSession = {
    accessToken: 'test-access-token-123',
    refreshToken: 'test-refresh-token-456',
    tokenType: 'Bearer',
    expiresAt: Date.now() + 3600000,
    user: {
      id: 1042,
      employeeCode: 'NV-1042',
      fullName: 'Ngô Văn Dũng',
      email: 'dung.nv@company.com',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      department: 'Phòng Kỹ thuật',
    },
  }

  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      session: null,
      user: null,
      isAuthenticated: false,
      isInitialized: false,
    })
    vi.restoreAllMocks()
  })

  describe('getDefaultPathForRole', () => {
    it('điều hướng đúng đường dẫn theo vai trò người dùng', () => {
      expect(getDefaultPathForRole('EMPLOYEE')).toBe('/employee/dashboard')
      expect(getDefaultPathForRole('HR_MANAGER')).toBe('/admin/dashboard')
      expect(getDefaultPathForRole('ADMIN')).toBe('/admin/dashboard')
      expect(getDefaultPathForRole('DPO')).toBe('/admin/dashboard')
      expect(getDefaultPathForRole(undefined)).toBe('/login')
    })
  })

  describe('initialize', () => {
    it('khởi tạo với trạng thái chưa đăng nhập khi LocalStorage rỗng', () => {
      useAuthStore.getState().initialize()
      const state = useAuthStore.getState()

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.isInitialized).toBe(true)
    })

    it('khởi tạo và nạp thành công session từ LocalStorage nếu có', () => {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sampleSession))

      useAuthStore.getState().initialize()
      const state = useAuthStore.getState()

      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.employeeCode).toBe('NV-1042')
      expect(state.session?.accessToken).toBe('test-access-token-123')
      expect(state.isInitialized).toBe(true)
    })
  })

  describe('setSession & clearSession', () => {
    it('lưu phiên vào state và LocalStorage khi setSession', () => {
      useAuthStore.getState().setSession(sampleSession)
      const state = useAuthStore.getState()

      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.fullName).toBe('Ngô Văn Dũng')

      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!).accessToken).toBe('test-access-token-123')
    })

    it('xóa sạch state và LocalStorage khi clearSession (Logout)', () => {
      useAuthStore.getState().setSession(sampleSession)
      useAuthStore.getState().clearSession()
      const state = useAuthStore.getState()

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('cập nhật thông tin người dùng trong cả state lẫn LocalStorage', () => {
      useAuthStore.getState().setSession(sampleSession)
      useAuthStore.getState().updateUser({ hasBiometric: true })

      const state = useAuthStore.getState()
      expect(state.user?.hasBiometric).toBe(true)

      const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)!)
      expect(stored.user.hasBiometric).toBe(true)
    })
  })

  describe('Multi-Tab Sync (DD-WEB-004)', () => {
    it('đồng bộ đăng xuất khi tab khác xóa session khỏi LocalStorage', () => {
      const cleanup = setupMultiTabAuthSync()
      useAuthStore.getState().setSession(sampleSession)

      // Kích hoạt sự kiện storage mô phỏng tab khác đăng xuất
      const storageEvent = new StorageEvent('storage', {
        key: AUTH_STORAGE_KEY,
        newValue: null,
      })
      window.dispatchEvent(storageEvent)

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()

      cleanup()
    })
  })
})
