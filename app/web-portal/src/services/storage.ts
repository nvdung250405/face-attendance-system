/**
 * Safe Storage Adapters & Multi-Tab Synchronization
 * (DTD-WEB-001, DTD-WEB-002, DTD-WEB-003, DD-WEB-003, DD-WEB-004, DD-WEB-005, BLD-WEB-002, TASK-WEB-006).
 *
 * Cung cấp bộ điều hợp lưu trữ an toàn bọc ngoài LocalStorage và SessionStorage:
 * - Tự động serialize / deserialize JSON.
 * - Tiêm tiền tố định danh tập trung (mặc định 'fas_').
 * - Tự động Fallback sang RAM (MemoryStorage) khi gặp lỗi Quota hoặc Private Browsing.
 * - Lắng nghe sự kiện 'storage' để đồng bộ phiên làm việc tức thời giữa các tab trình duyệt.
 */

import type { AuthSession } from '@/types'

/**
 * Các khóa lưu trữ chuẩn hóa của Web Portal
 */
export const STORAGE_KEYS = {
  AUTH_SESSION: 'fas_auth_session',
  UI_PREFS: 'fas_ui_prefs',
  CONSENT_SESSION: 'fas_consent_session',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | (string & {})

/**
 * Bộ nhớ RAM thuần túy tuân thủ giao diện Storage
 * Đảm bảo hoạt động liên tục khi LocalStorage/SessionStorage bị chặn hoặc lỗi Quota.
 */
export class MemoryStorage implements Storage {
  private map: Map<string, string> = new Map()

  get length(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  key(index: number): string | null {
    const keys = Array.from(this.map.keys())
    return keys[index] ?? null
  }

  has(key: string): boolean {
    return this.map.has(key)
  }
}

export type StorageType = 'localStorage' | 'sessionStorage'

export interface SafeStorageOptions {
  prefix?: string
}

/**
 * Lớp điều hợp lưu trữ an toàn (Safe Storage Adapter)
 */
export class SafeStorage {
  private readonly storageType: StorageType
  private readonly prefix: string
  private memoryFallback: MemoryStorage = new MemoryStorage()
  private isFallbackMode = false

  constructor(storageType: StorageType = 'localStorage', options: SafeStorageOptions = {}) {
    this.storageType = storageType
    this.prefix = options.prefix ?? 'fas_'
    this.isFallbackMode = !this.probeStorage()
  }

  /**
   * Thử nghiệm quyền đọc/ghi trên Web Storage của trình duyệt.
   * Nếu ném ngoại lệ (Private Browsing, Quota, hoặc không có window), chuyển sang chế độ fallback.
   */
  private probeStorage(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const storage = window[this.storageType]
      if (!storage) return false
      const probeKey = `__${this.prefix}probe_${Math.random().toString(36).slice(2, 8)}__`
      storage.setItem(probeKey, '1')
      storage.removeItem(probeKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Lấy instance Storage thực tế của trình duyệt nếu khả dụng
   */
  private getNativeStorage(): Storage | null {
    if (this.isFallbackMode || typeof window === 'undefined') {
      return null
    }
    try {
      return window[this.storageType] ?? null
    } catch {
      return null
    }
  }

  /**
   * Định dạng khóa với tiền tố chuẩn hóa (tránh nhân đôi tiền tố nếu khóa đã có sẵn)
   */
  formatKey(key: string): string {
    if (!this.prefix) return key
    if (key.startsWith(this.prefix)) return key
    return `${this.prefix}${key}`
  }

  /**
   * Kiểm tra xem adapter có đang hoạt động ở chế độ Fallback RAM hay không
   */
  isFallback(): boolean {
    return this.isFallbackMode
  }

  /**
   * Kiểm tra xem adapter có lưu trữ bền vững (Native Browser Storage) hay không
   */
  isPersistent(): boolean {
    return !this.isFallbackMode
  }

  /**
   * Lấy giá trị đã parse JSON từ storage.
   * Nếu không tìm thấy hoặc JSON lỗi, trả về defaultValue hoặc null.
   */
  getItem<T = unknown>(key: string, defaultValue?: T): T | null {
    const formattedKey = this.formatKey(key)

    if (this.isFallbackMode) {
      const raw = this.memoryFallback.getItem(formattedKey)
      if (raw === null) return defaultValue ?? null
      try {
        return JSON.parse(raw) as T
      } catch {
        return defaultValue ?? null
      }
    }

    try {
      const storage = this.getNativeStorage()
      const raw = storage ? storage.getItem(formattedKey) : null
      if (raw === null) {
        // Kiểm tra thêm memory fallback phòng trường hợp ghi trước đó gặp QuotaExceeded
        const memRaw = this.memoryFallback.getItem(formattedKey)
        if (memRaw !== null) {
          try {
            return JSON.parse(memRaw) as T
          } catch {
            return defaultValue ?? null
          }
        }
        return defaultValue ?? null
      }
      try {
        return JSON.parse(raw) as T
      } catch {
        return defaultValue ?? null
      }
    } catch {
      const memRaw = this.memoryFallback.getItem(formattedKey)
      if (memRaw === null) return defaultValue ?? null
      try {
        return JSON.parse(memRaw) as T
      } catch {
        return defaultValue ?? null
      }
    }
  }

  /**
   * Lưu giá trị dưới dạng JSON vào storage.
   * Tự động fallback vào RAM nếu gặp QuotaExceededError hoặc SecurityError.
   */
  setItem<T = unknown>(key: string, value: T): boolean {
    const formattedKey = this.formatKey(key)
    const serialized = JSON.stringify(value)

    if (this.isFallbackMode) {
      this.memoryFallback.setItem(formattedKey, serialized)
      return true
    }

    try {
      const storage = this.getNativeStorage()
      if (!storage) {
        this.memoryFallback.setItem(formattedKey, serialized)
        return true
      }
      storage.setItem(formattedKey, serialized)
      return true
    } catch {
      // Khi gặp lỗi ghi (ví dụ QuotaExceededError trên trình duyệt hoặc Private Browsing)
      this.memoryFallback.setItem(formattedKey, serialized)
      return true
    }
  }

  /**
   * Xóa một phần tử theo khóa
   */
  removeItem(key: string): void {
    const formattedKey = this.formatKey(key)
    this.memoryFallback.removeItem(formattedKey)

    if (!this.isFallbackMode) {
      try {
        const storage = this.getNativeStorage()
        if (storage) {
          storage.removeItem(formattedKey)
        }
      } catch {
        // Bỏ qua lỗi trong môi trường hạn chế
      }
    }
  }

  /**
   * Xóa toàn bộ các phần tử thuộc tiền tố quản lý của adapter này
   */
  clear(): void {
    this.memoryFallback.clear()

    if (!this.isFallbackMode) {
      try {
        const storage = this.getNativeStorage()
        if (storage) {
          // Chỉ xóa các khóa thuộc tiền tố hiện tại để không ảnh hưởng dữ liệu khác
          const keysToRemove: string[] = []
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i)
            if (k && k.startsWith(this.prefix)) {
              keysToRemove.push(k)
            }
          }
          for (const k of keysToRemove) {
            storage.removeItem(k)
          }
        }
      } catch {
        // Bỏ qua lỗi
      }
    }
  }

  /**
   * Kiểm tra xem khóa có tồn tại hay không
   */
  has(key: string): boolean {
    const formattedKey = this.formatKey(key)
    if (this.memoryFallback.has(formattedKey)) {
      return true
    }
    if (!this.isFallbackMode) {
      try {
        const storage = this.getNativeStorage()
        return storage ? storage.getItem(formattedKey) !== null : false
      } catch {
        return false
      }
    }
    return false
  }

  /**
   * Lấy danh sách toàn bộ các khóa đang được lưu trữ dưới tiền tố của adapter
   */
  getAllKeys(): string[] {
    const keySet = new Set<string>()

    // Lấy từ memory fallback
    for (let i = 0; i < this.memoryFallback.length; i++) {
      const k = this.memoryFallback.key(i)
      if (k && k.startsWith(this.prefix)) {
        keySet.add(k)
      }
    }

    if (!this.isFallbackMode) {
      try {
        const storage = this.getNativeStorage()
        if (storage) {
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i)
            if (k && k.startsWith(this.prefix)) {
              keySet.add(k)
            }
          }
        }
      } catch {
        // Bỏ qua lỗi
      }
    }

    return Array.from(keySet)
  }
}

/**
 * Adapter chuẩn hóa cho LocalStorage (DTD-WEB-001, DD-WEB-003)
 */
export const safeLocalStorage = new SafeStorage('localStorage', { prefix: 'fas_' })

/**
 * Adapter chuẩn hóa cho SessionStorage (DTD-WEB-003, DD-WEB-005)
 */
export const safeSessionStorage = new SafeStorage('sessionStorage', { prefix: 'fas_' })

/**
 * Kiểu hàm gọi lại khi có sự thay đổi storage
 */
export type StorageChangeCallback<T = unknown> = (
  newValue: T | null,
  oldValue: T | null,
  event: StorageEvent
) => void

/**
 * Lắng nghe sự kiện thay đổi của một khóa lưu trữ cụ thể trên window (DTD-WEB-002, DD-WEB-004).
 * Trả về hàm hủy đăng ký (cleanup).
 */
export function onStorageKeyChange<T = unknown>(
  key: string,
  callback: StorageChangeCallback<T>
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const targetKey = safeLocalStorage.formatKey(key)

  const handler = (event: StorageEvent) => {
    if (event.key === targetKey) {
      let parsedNew: T | null = null
      let parsedOld: T | null = null

      if (event.newValue !== null) {
        try {
          parsedNew = JSON.parse(event.newValue) as T
        } catch {
          parsedNew = event.newValue as unknown as T
        }
      }

      if (event.oldValue !== null) {
        try {
          parsedOld = JSON.parse(event.oldValue) as T
        } catch {
          parsedOld = event.oldValue as unknown as T
        }
      }

      callback(parsedNew, parsedOld, event)
    }
  }

  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('storage', handler)
  }
}

/**
 * Cấu hình cơ chế đồng bộ đăng xuất / cập nhật phiên đa tab (DTD-WEB-002, DD-WEB-004)
 */
export interface MultiTabAuthSyncOptions {
  onLogout: () => void
  onSessionUpdate?: (session: AuthSession) => void
}

export function setupMultiTabAuthSyncListener(options: MultiTabAuthSyncOptions): () => void {
  return onStorageKeyChange<AuthSession>(STORAGE_KEYS.AUTH_SESSION, (newSession) => {
    if (!newSession || !newSession.accessToken) {
      options.onLogout()
    } else if (options.onSessionUpdate) {
      options.onSessionUpdate(newSession)
    }
  })
}
