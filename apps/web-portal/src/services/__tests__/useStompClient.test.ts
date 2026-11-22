/**
 * Kiểm thử Hook useStompClient — Dịch vụ Kết nối STOMP Client
 * (TASK-WEB-018, BLD-WEB-014, DD-WEB-010, DD-WEB-011).
 *
 * Xác minh:
 * - Hook kích hoạt kết nối STOMP khi mount (autoConnect=true).
 * - Hook đồng bộ trạng thái vào stompConnectionStore khi status thay đổi.
 * - Hook không kết nối khi autoConnect=false.
 * - Hook trả về đúng isConnected và status.
 * - connect() / disconnect() gọi đúng phương thức service.
 * - Cleanup: listener được hủy khi unmount (không rò rỉ bộ nhớ).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStompClient } from '@/services/hooks/useStompClient'
import { useStompConnectionStore } from '@/store/stompConnectionStore'
import type { ConnectionStatus } from '@/services/stompClientService'

// ── Mock StompWebSocketService ────────────────────────────────────────────────

function createMockService(initialStatus: ConnectionStatus = 'DISCONNECTED') {
  let currentStatus: ConnectionStatus = initialStatus
  const statusListeners: Set<(status: ConnectionStatus) => void> = new Set()
  let activateCalled = false
  let deactivateCalled = false

  return {
    getStatus: vi.fn(() => currentStatus),
    isConnected: vi.fn(() => currentStatus === 'CONNECTED'),
    activate: vi.fn(() => { activateCalled = true }),
    deactivate: vi.fn(async () => { deactivateCalled = true }),
    onStatusChange: vi.fn((listener: (status: ConnectionStatus) => void) => {
      statusListeners.add(listener)
      // Phát ngay trạng thái hiện tại
      listener(currentStatus)
      return () => { statusListeners.delete(listener) }
    }),
    // Tiện ích test: giả lập thay đổi trạng thái
    _emit: (status: ConnectionStatus) => {
      currentStatus = status
      statusListeners.forEach((l) => l(status))
    },
    _wasActivateCalled: () => activateCalled,
    _wasDeactivateCalled: () => deactivateCalled,
  }
}

describe('useStompClient (TASK-WEB-018, BLD-WEB-014)', () => {
  beforeEach(() => {
    // Reset stompConnectionStore về DISCONNECTED trước mỗi test
    useStompConnectionStore.setState({ status: 'DISCONNECTED' })
  })

  // 1. Kích hoạt kết nối khi mount
  describe('1. Kích hoạt kết nối khi mount', () => {
    it('Gọi service.activate() khi autoConnect=true (mặc định)', () => {
      const service = createMockService()

      renderHook(() => useStompClient({ service: service as never }))

      expect(service.activate).toHaveBeenCalledTimes(1)
    })

    it('Không gọi service.activate() khi autoConnect=false', () => {
      const service = createMockService()

      renderHook(() => useStompClient({ service: service as never, autoConnect: false }))

      expect(service.activate).not.toHaveBeenCalled()
    })
  })

  // 2. Đồng bộ trạng thái vào stompConnectionStore
  describe('2. Đồng bộ trạng thái vào stompConnectionStore', () => {
    it('Khởi tạo store với trạng thái hiện tại của service khi mount', () => {
      const service = createMockService('CONNECTING')

      renderHook(() => useStompClient({ service: service as never }))

      expect(useStompConnectionStore.getState().status).toBe('CONNECTING')
    })

    it('Cập nhật store khi service chuyển sang CONNECTED', () => {
      const service = createMockService('CONNECTING')

      renderHook(() => useStompClient({ service: service as never }))

      act(() => {
        service._emit('CONNECTED')
      })

      expect(useStompConnectionStore.getState().status).toBe('CONNECTED')
    })

    it('Cập nhật store khi service chuyển sang ERROR', () => {
      const service = createMockService('CONNECTED')

      renderHook(() => useStompClient({ service: service as never }))

      act(() => {
        service._emit('ERROR')
      })

      expect(useStompConnectionStore.getState().status).toBe('ERROR')
    })

    it('Cập nhật store khi service mất kết nối (DISCONNECTED)', () => {
      const service = createMockService('CONNECTED')

      renderHook(() => useStompClient({ service: service as never }))

      act(() => {
        service._emit('DISCONNECTED')
      })

      expect(useStompConnectionStore.getState().status).toBe('DISCONNECTED')
    })
  })

  // 3. Giá trị trả về
  describe('3. Giá trị trả về của hook', () => {
    it('Trả về isConnected=true khi status=CONNECTED', () => {
      const service = createMockService()

      const { result } = renderHook(() => useStompClient({ service: service as never }))

      act(() => {
        service._emit('CONNECTED')
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.status).toBe('CONNECTED')
    })

    it('Trả về isConnected=false khi status=DISCONNECTED', () => {
      const service = createMockService('DISCONNECTED')

      const { result } = renderHook(() => useStompClient({ service: service as never }))

      expect(result.current.isConnected).toBe(false)
      expect(result.current.status).toBe('DISCONNECTED')
    })

    it('Trả về isConnected=false khi status=ERROR', () => {
      const service = createMockService('CONNECTED')

      const { result } = renderHook(() => useStompClient({ service: service as never }))

      act(() => {
        service._emit('ERROR')
      })

      expect(result.current.isConnected).toBe(false)
    })
  })

  // 4. Phương thức connect / disconnect
  describe('4. Phương thức connect() và disconnect()', () => {
    it('connect() gọi service.activate()', () => {
      const service = createMockService()
      const { result } = renderHook(() =>
        useStompClient({ service: service as never, autoConnect: false })
      )

      act(() => {
        result.current.connect()
      })

      expect(service.activate).toHaveBeenCalledTimes(1)
    })

    it('disconnect() gọi service.deactivate()', async () => {
      const service = createMockService('CONNECTED')
      const { result } = renderHook(() => useStompClient({ service: service as never }))

      await act(async () => {
        await result.current.disconnect()
      })

      expect(service.deactivate).toHaveBeenCalledTimes(1)
    })
  })

  // 5. Cleanup khi unmount
  describe('5. Cleanup khi unmount — không rò rỉ bộ nhớ', () => {
    it('Hủy status listener khi component unmount', () => {
      const service = createMockService()
      const { unmount } = renderHook(() => useStompClient({ service: service as never }))

      // Ghi nhận onStatusChange trả về hàm cleanup
      const unbind = service.onStatusChange.mock.results[0]?.value
      expect(typeof unbind).toBe('function')

      unmount()

      // Sau unmount, emit status mới → store không được cập nhật
      act(() => {
        service._emit('CONNECTED')
      })

      // Store giữ nguyên giá trị trước unmount
      expect(useStompConnectionStore.getState().status).not.toBe('CONNECTED')
    })
  })
})
