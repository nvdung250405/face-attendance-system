/**
 * KioskRegistryMemoryStore (DTD-WEB-006, DATA-WEB-007, DD-WEB-019, BLD-WEB-025, TASK-WEB-022).
 *
 * Quản lý danh mục trạm Kiosk và Secret Token thuần túy trong bộ nhớ RAM:
 * - TUYỆT ĐỐI KHÔNG ghi Secret Token vào LocalStorage hoặc SessionStorage
 *   để ngăn chặn rò rỉ mã bí mật của máy trạm qua XSS hoặc Browser DevTools.
 * - Secret Token chỉ hiển thị một lần duy nhất khi tạo trạm và tự động bị tiêu hủy
 *   khi người dùng đóng modal, unmount component hoặc tải lại trang.
 * - Phát hiện và cảnh báo trạm Kiosk mất tín hiệu Ping quá 5 phút theo DD-WEB-019.
 */

import { create } from 'zustand'
import type { KioskItemResponse, KioskStatus } from '@/types'

export const DEFAULT_PING_WARNING_THRESHOLD_MINUTES = 5

export interface KioskRegistryState {
  kiosks: KioskItemResponse[]
  /** Bản đồ lưu Secret Token duy nhất trong RAM (kioskId -> token) */
  secretTokens: Record<string, string>
  selectedKioskId: string | null

  // Actions
  setKiosks: (kiosks: KioskItemResponse[]) => void
  setSelectedKioskId: (kioskId: string | null) => void
  setSecretToken: (kioskId: string, token: string) => void
  clearSecretToken: (kioskId?: string) => void
  getSecretToken: (kioskId: string) => string | null
  updateKioskStatus: (
    kioskId: string,
    status: KioskStatus,
    lastPingAt?: string
  ) => void
  isPingStale: (lastPingAt?: string, thresholdMinutes?: number) => boolean
  clearStore: () => void
}

export const useKioskRegistryStore = create<KioskRegistryState>((set, get) => ({
  kiosks: [],
  secretTokens: {},
  selectedKioskId: null,

  /**
   * Cập nhật danh sách các trạm Kiosk từ Backend API
   */
  setKiosks: (kiosks: KioskItemResponse[]) => {
    set({ kiosks })
  },

  /**
   * Chọn trạm Kiosk để xem chi tiết
   */
  setSelectedKioskId: (kioskId: string | null) => {
    set({ selectedKioskId: kioskId })
  },

  /**
   * Lưu Secret Token tạm thời trong RAM (chỉ hiển thị một lần sau khi đăng ký trạm)
   */
  setSecretToken: (kioskId: string, token: string) => {
    set((state) => ({
      secretTokens: {
        ...state.secretTokens,
        [kioskId]: token,
      },
    }))
  },

  /**
   * Xóa Secret Token khỏi RAM (khi người dùng bấm xác nhận đã sao chép hoặc đóng modal)
   */
  clearSecretToken: (kioskId?: string) => {
    set((state) => {
      if (!kioskId) {
        return { secretTokens: {} }
      }
      const rest = { ...state.secretTokens }
      delete rest[kioskId]
      return { secretTokens: rest }
    })
  },

  /**
   * Truy xuất Secret Token từ RAM
   */
  getSecretToken: (kioskId: string) => {
    return get().secretTokens[kioskId] ?? null
  },

  /**
   * Cập nhật trạng thái và mốc ping mới nhất của trạm Kiosk
   */
  updateKioskStatus: (kioskId: string, status: KioskStatus, lastPingAt?: string) => {
    set((state) => ({
      kiosks: state.kiosks.map((k) => {
        if (k.kioskId !== kioskId) return k
        return {
          ...k,
          status,
          lastPingAt: lastPingAt ?? k.lastPingAt,
        }
      }),
    }))
  },

  /**
   * Kiểm tra xem trạm Kiosk có bị mất tín hiệu Ping quá ngưỡng (mặc định 5 phút) hay không (DD-WEB-019)
   */
  isPingStale: (
    lastPingAt?: string,
    thresholdMinutes = DEFAULT_PING_WARNING_THRESHOLD_MINUTES
  ): boolean => {
    if (!lastPingAt) return true
    const pingTime = new Date(lastPingAt).getTime()
    if (isNaN(pingTime)) return true
    const elapsedMinutes = (Date.now() - pingTime) / (1000 * 60)
    return elapsedMinutes > thresholdMinutes
  },

  /**
   * Xóa sạch toàn bộ dữ liệu RAM khi unmount hoặc rời màn hình (DD-WEB-019)
   */
  clearStore: () => {
    set({
      kiosks: [],
      secretTokens: {},
      selectedKioskId: null,
    })
  },
}))
