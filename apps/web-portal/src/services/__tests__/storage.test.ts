/**
 * Unit Tests cho Safe Storage Adapters & Multi-Tab Synchronization
 * (DTD-WEB-001, DTD-WEB-002, DTD-WEB-003, DD-WEB-003, DD-WEB-004, DD-WEB-005, TST-WEB-002).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MemoryStorage,
  SafeStorage,
  safeLocalStorage,
  safeSessionStorage,
  STORAGE_KEYS,
  onStorageKeyChange,
  setupMultiTabAuthSyncListener,
} from '../storage'
import type { AuthSession } from '@/types'

describe('Safe Storage Adapters (TASK-WEB-006)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    safeLocalStorage.clear()
    safeSessionStorage.clear()
    vi.restoreAllMocks()
  })

  describe('1. MemoryStorage', () => {
    it('thực hiện chính xác các thao tác get, set, remove, clear, has, key', () => {
      const memory = new MemoryStorage()

      expect(memory.length).toBe(0)
      expect(memory.getItem('nonexistent')).toBeNull()
      expect(memory.has('key1')).toBe(false)

      memory.setItem('key1', 'value1')
      memory.setItem('key2', 'value2')

      expect(memory.length).toBe(2)
      expect(memory.getItem('key1')).toBe('value1')
      expect(memory.has('key1')).toBe(true)
      expect(memory.key(0)).toBe('key1')
      expect(memory.key(1)).toBe('key2')

      memory.removeItem('key1')
      expect(memory.length).toBe(1)
      expect(memory.getItem('key1')).toBeNull()
      expect(memory.has('key1')).toBe(false)

      memory.clear()
      expect(memory.length).toBe(0)
      expect(memory.getItem('key2')).toBeNull()
    })
  })

  describe('2. SafeStorage với Native Browser Storage (DTD-WEB-001, DTD-WEB-003)', () => {
    it('tự động thêm tiền tố fas_ và không nhân đôi tiền tố nếu đã có', () => {
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })

      expect(storage.formatKey('token')).toBe('fas_token')
      expect(storage.formatKey('fas_token')).toBe('fas_token')
      expect(storage.formatKey('custom_key')).toBe('fas_custom_key')
    })

    it('serialize và deserialize đối tượng JSON chính xác', () => {
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })
      const sampleData = {
        name: 'Ngô Văn Dũng',
        role: 'EMPLOYEE',
        settings: { darkTheme: false, count: 42 },
      }

      const success = storage.setItem('user_profile', sampleData)
      expect(success).toBe(true)

      const retrieved = storage.getItem<typeof sampleData>('user_profile')
      expect(retrieved).toEqual(sampleData)

      // Kiểm tra giá trị thực tế trong native localStorage
      const rawInNative = localStorage.getItem('fas_user_profile')
      expect(rawInNative).toBe(JSON.stringify(sampleData))
    })

    it('hỗ trợ các kiểu dữ liệu nguyên thủy (primitive) và mảng', () => {
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })

      storage.setItem('active', true)
      storage.setItem('retryCount', 3)
      storage.setItem('tags', ['tag1', 'tag2'])

      expect(storage.getItem<boolean>('active')).toBe(true)
      expect(storage.getItem<number>('retryCount')).toBe(3)
      expect(storage.getItem<string[]>('tags')).toEqual(['tag1', 'tag2'])
    })

    it('trả về defaultValue hoặc null khi khóa không tồn tại', () => {
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })

      expect(storage.getItem('missing_key')).toBeNull()
      expect(storage.getItem('missing_key', 'fallback_val')).toBe('fallback_val')
      expect(storage.getItem('missing_key', { defaultObj: true })).toEqual({ defaultObj: true })
    })

    it('kiểm tra has, removeItem và getAllKeys', () => {
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })

      storage.setItem('key_a', 'valA')
      storage.setItem('key_b', 'valB')

      expect(storage.has('key_a')).toBe(true)
      expect(storage.has('key_c')).toBe(false)

      const keys = storage.getAllKeys()
      expect(keys).toContain('fas_key_a')
      expect(keys).toContain('fas_key_b')

      storage.removeItem('key_a')
      expect(storage.has('key_a')).toBe(false)
      expect(storage.getItem('key_a')).toBeNull()
    })

    it('clear chỉ xóa các khóa thuộc tiền tố của adapter, bảo lưu dữ liệu khác', () => {
      localStorage.setItem('other_app_key', 'preserve_me')
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })

      storage.setItem('item1', 'val1')
      storage.setItem('item2', 'val2')

      expect(storage.getAllKeys().length).toBe(2)

      storage.clear()

      expect(storage.getAllKeys().length).toBe(0)
      expect(storage.getItem('item1')).toBeNull()
      // Dữ liệu không thuộc prefix fas_ vẫn được giữ nguyên
      expect(localStorage.getItem('other_app_key')).toBe('preserve_me')
    })

    it('trả về defaultValue khi dữ liệu trong storage bị hỏng mà không gây ném ngoại lệ', () => {
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })
      localStorage.setItem('fas_corrupted', 'invalid{json-corrupted')

      expect(storage.getItem('corrupted')).toBeNull()
      expect(storage.getItem('corrupted', 'default_val')).toBe('default_val')
    })
  })

  describe('3. Chế độ Ẩn danh & Fallback RAM (Private Browsing & Quota Fallback)', () => {
    it('tự động chuyển sang RAM fallback khi truy cập Storage ném lỗi SecurityError (Private Browsing)', () => {
      // Giả lập môi trường mà window.localStorage ném lỗi khi setItem (Private Browsing)
      const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      })

      // Khởi tạo adapter trong môi trường bị hạn chế
      const privateStorage = new SafeStorage('localStorage', { prefix: 'fas_' })

      expect(privateStorage.isFallback()).toBe(true)
      expect(privateStorage.isPersistent()).toBe(false)

      // Ghi và đọc dữ liệu qua bộ nhớ RAM
      privateStorage.setItem('session_token', { token: 'in-memory-xyz' })
      const retrieved = privateStorage.getItem<{ token: string }>('session_token')

      expect(retrieved).toEqual({ token: 'in-memory-xyz' })
      expect(privateStorage.has('session_token')).toBe(true)

      privateStorage.removeItem('session_token')
      expect(privateStorage.getItem('session_token')).toBeNull()

      spy.mockRestore()
    })

    it('tự động lưu vào RAM khi gặp ngoại lệ QuotaExceededError trong lúc ghi', () => {
      const storage = new SafeStorage('localStorage', { prefix: 'fas_' })
      expect(storage.isPersistent()).toBe(true)

      // Giả lập quota bị đầy khi setItem
      const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      })

      // Không được ném lỗi, tự động lưu vào memory fallback
      const success = storage.setItem('large_payload', { bigData: 'abcdef' })
      expect(success).toBe(true)

      // Vẫn đọc lại được giá trị từ fallback RAM
      const readBack = storage.getItem<{ bigData: string }>('large_payload')
      expect(readBack).toEqual({ bigData: 'abcdef' })

      spy.mockRestore()
    })
  })

  describe('4. Instance định sẵn safeLocalStorage & safeSessionStorage', () => {
    it('safeLocalStorage sử dụng localStorage và tiền tố fas_', () => {
      safeLocalStorage.setItem('test_auth', { loggedIn: true })
      expect(localStorage.getItem('fas_test_auth')).toBe(JSON.stringify({ loggedIn: true }))
      expect(safeLocalStorage.getItem<{ loggedIn: boolean }>('test_auth')?.loggedIn).toBe(true)
    })

    it('safeSessionStorage sử dụng sessionStorage và tiền tố fas_', () => {
      safeSessionStorage.setItem(STORAGE_KEYS.CONSENT_SESSION, { otp: '123456' })
      expect(sessionStorage.getItem(STORAGE_KEYS.CONSENT_SESSION)).toBe(JSON.stringify({ otp: '123456' }))
      expect(safeSessionStorage.getItem<{ otp: string }>(STORAGE_KEYS.CONSENT_SESSION)?.otp).toBe('123456')
    })
  })

  describe('5. Đồng bộ Đa Tab qua Sự kiện Storage (DTD-WEB-002, DD-WEB-004)', () => {
    it('lắng nghe và xử lý sự kiện storage khi có thay đổi trên khóa đăng ký', () => {
      const callback = vi.fn()
      const cleanup = onStorageKeyChange<{ theme: string }>('fas_ui_prefs', callback)

      // Phát sự kiện storage thay đổi
      const event = new StorageEvent('storage', {
        key: 'fas_ui_prefs',
        newValue: JSON.stringify({ theme: 'dark' }),
        oldValue: JSON.stringify({ theme: 'light' }),
      })
      window.dispatchEvent(event)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({ theme: 'dark' }, { theme: 'light' }, event)

      cleanup()

      // Sau khi hủy đăng ký, sự kiện mới không được gọi callback
      window.dispatchEvent(event)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('bỏ qua các sự kiện thuộc khóa khác', () => {
      const callback = vi.fn()
      const cleanup = onStorageKeyChange('fas_target_key', callback)

      const unrelatedEvent = new StorageEvent('storage', {
        key: 'fas_other_key',
        newValue: 'test',
        oldValue: null,
      })
      window.dispatchEvent(unrelatedEvent)

      expect(callback).not.toHaveBeenCalled()
      cleanup()
    })

    it('setupMultiTabAuthSyncListener gọi onLogout khi một tab khác xóa session', () => {
      const onLogout = vi.fn()
      const onSessionUpdate = vi.fn()

      const cleanup = setupMultiTabAuthSyncListener({
        onLogout,
        onSessionUpdate,
      })

      // Giả lập tab khác đăng xuất (xóa key)
      const logoutEvent = new StorageEvent('storage', {
        key: STORAGE_KEYS.AUTH_SESSION,
        newValue: null,
        oldValue: JSON.stringify({ accessToken: 'old-token' }),
      })
      window.dispatchEvent(logoutEvent)

      expect(onLogout).toHaveBeenCalledTimes(1)
      expect(onSessionUpdate).not.toHaveBeenCalled()

      cleanup()
    })

    it('setupMultiTabAuthSyncListener gọi onSessionUpdate khi một tab khác cập nhật session', () => {
      const onLogout = vi.fn()
      const onSessionUpdate = vi.fn()

      const cleanup = setupMultiTabAuthSyncListener({
        onLogout,
        onSessionUpdate,
      })

      const updatedSession: Partial<AuthSession> = {
        accessToken: 'new-valid-token-999',
        tokenType: 'Bearer',
      }

      const updateEvent = new StorageEvent('storage', {
        key: STORAGE_KEYS.AUTH_SESSION,
        newValue: JSON.stringify(updatedSession),
        oldValue: null,
      })
      window.dispatchEvent(updateEvent)

      expect(onSessionUpdate).toHaveBeenCalledTimes(1)
      expect(onSessionUpdate).toHaveBeenCalledWith(updatedSession)
      expect(onLogout).not.toHaveBeenCalled()

      cleanup()
    })
  })
})
