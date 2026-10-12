/**
 * Unit Tests cho KioskRegistryMemoryStore
 * (DTD-WEB-006, DATA-WEB-007, DD-WEB-019, BLD-WEB-025, TASK-WEB-022).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useKioskRegistryStore } from '../kioskRegistryStore'
import { safeLocalStorage, safeSessionStorage } from '@/services/storage'
import type { KioskItemResponse } from '@/types'

const mockKiosk1: KioskItemResponse = {
  id: 1,
  kioskId: 'KIOSK-HN-01',
  name: 'Trạm Kiosk Sảnh Lễ Tân Tầng 1',
  location: 'Sảnh Lễ Tân Tầng 1',
  status: 'ONLINE',
  lastPingAt: new Date(Date.now() - 60 * 1000).toISOString(), // Ping 1 phút trước
  ipAddress: '192.168.1.101',
  appVersion: '1.2.0',
}

const mockKiosk2: KioskItemResponse = {
  id: 2,
  kioskId: 'KIOSK-HN-02',
  name: 'Trạm Kiosk Căn Tin Tầng 3',
  location: 'Khu vực Căn Tin Tầng 3',
  status: 'WARNING',
  lastPingAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Ping 10 phút trước (> 5 phút)
  ipAddress: '192.168.1.102',
  appVersion: '1.2.0',
}

describe('KioskRegistryMemoryStore (TASK-WEB-022)', () => {
  beforeEach(() => {
    useKioskRegistryStore.getState().clearStore()
    safeLocalStorage.clear()
    safeSessionStorage.clear()
  })

  describe('1. Quản lý Secret Token Thuần túy trong RAM (DD-WEB-019, Done when)', () => {
    it('lưu Secret Token trong RAM và truy xuất chính xác qua getSecretToken', () => {
      const store = useKioskRegistryStore.getState()
      store.setSecretToken('KIOSK-HN-01', 'secret-token-abc-123')

      expect(useKioskRegistryStore.getState().getSecretToken('KIOSK-HN-01')).toBe(
        'secret-token-abc-123'
      )
      expect(useKioskRegistryStore.getState().getSecretToken('KIOSK-NONEXIST')).toBeNull()
    })

    it('clearSecretToken xóa Secret Token của một trạm cụ thể hoặc toàn bộ khỏi RAM', () => {
      const store = useKioskRegistryStore.getState()
      store.setSecretToken('KIOSK-01', 'token-1')
      store.setSecretToken('KIOSK-02', 'token-2')

      // Xóa 1 trạm
      store.clearSecretToken('KIOSK-01')
      expect(useKioskRegistryStore.getState().getSecretToken('KIOSK-01')).toBeNull()
      expect(useKioskRegistryStore.getState().getSecretToken('KIOSK-02')).toBe('token-2')

      // Xóa toàn bộ
      store.clearSecretToken()
      expect(useKioskRegistryStore.getState().getSecretToken('KIOSK-02')).toBeNull()
    })

    it('TUYỆT ĐỐI KHÔNG lưu Secret Token vào LocalStorage hoặc SessionStorage (Done when)', () => {
      const store = useKioskRegistryStore.getState()
      store.setSecretToken('KIOSK-HN-01', 'top-secret-kiosk-token-xyz')

      // Kiểm tra tiêu chí Done when: Secret Token không xuất hiện trong storage
      expect(safeLocalStorage.getItem('secretToken')).toBeNull()
      expect(safeLocalStorage.getItem('fas_secretToken')).toBeNull()
      expect(safeLocalStorage.getItem('kiosk_tokens')).toBeNull()
      expect(safeSessionStorage.getItem('secretToken')).toBeNull()
      expect(safeSessionStorage.getItem('fas_kiosk_secret')).toBeNull()

      // Kiểm tra raw native storage nếu có
      if (typeof window !== 'undefined' && window.localStorage) {
        expect(window.localStorage.getItem('secretToken')).toBeNull()
        expect(window.localStorage.getItem('fas_secretToken')).toBeNull()
      }
    })

    it('clearStore dọn sạch toàn bộ Secret Tokens và danh sách Kiosk khi unmount (DD-WEB-019)', () => {
      const store = useKioskRegistryStore.getState()
      store.setKiosks([mockKiosk1])
      store.setSecretToken('KIOSK-HN-01', 'secret-token-1')
      store.setSelectedKioskId('KIOSK-HN-01')

      store.clearStore()
      const state = useKioskRegistryStore.getState()
      expect(state.kiosks).toEqual([])
      expect(state.secretTokens).toEqual({})
      expect(state.selectedKioskId).toBeNull()
    })
  })

  describe('2. Quản lý Danh mục Kiosk & Cảnh báo Mất Ping > 5 phút (DD-WEB-019)', () => {
    it('setKiosks cập nhật danh mục trạm Kiosk', () => {
      const store = useKioskRegistryStore.getState()
      store.setKiosks([mockKiosk1, mockKiosk2])

      const state = useKioskRegistryStore.getState()
      expect(state.kiosks).toHaveLength(2)
      expect(state.kiosks[0].kioskId).toBe('KIOSK-HN-01')
    })

    it('updateKioskStatus cập nhật trạng thái hoạt động và mốc ping mới', () => {
      const store = useKioskRegistryStore.getState()
      store.setKiosks([mockKiosk1])

      const newPing = new Date().toISOString()
      store.updateKioskStatus('KIOSK-HN-01', 'ONLINE', newPing)

      const updated = useKioskRegistryStore.getState().kiosks[0]
      expect(updated.status).toBe('ONLINE')
      expect(updated.lastPingAt).toBe(newPing)
    })

    it('isPingStale phát hiện chính xác trạm Kiosk mất ping quá 5 phút', () => {
      const store = useKioskRegistryStore.getState()

      // Trạm 1: Ping 1 phút trước -> Chưa stale
      const pingRecent = new Date(Date.now() - 60 * 1000).toISOString()
      expect(store.isPingStale(pingRecent, 5)).toBe(false)

      // Trạm 2: Ping 6 phút trước (> 5 phút) -> Đã stale
      const pingStale = new Date(Date.now() - 6 * 60 * 1000).toISOString()
      expect(store.isPingStale(pingStale, 5)).toBe(true)

      // Không có thông tin lastPingAt -> Coi là stale
      expect(store.isPingStale(undefined, 5)).toBe(true)
    })
  })
})
