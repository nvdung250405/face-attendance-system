/**
 * Unit Tests cho StompWebSocketService & Hooks
 * (DD-WEB-010, DD-WEB-011, APD-WEB-003, BLD-WEB-011, TASK-WEB-015, TST-WEB-015).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { IFrame, IMessage, StompSubscription } from '@stomp/stompjs'
import {
  StompWebSocketService,
  createStompWebSocketService,
  stompClientService,
} from '../stompClientService'
import { useLiveAttendance, LIVE_ATTENDANCE_TOPIC } from '../hooks/useLiveAttendance'
import { useEnrollmentStatus } from '../hooks/useEnrollmentStatus'
import type { AttendanceRecord, EnrollmentSuccessMessage } from '@/types'
import { attendanceKeys } from '../queryClient'

// Mock dữ liệu điểm danh mẫu
const mockAttendanceRecord: AttendanceRecord = {
  recordId: 98231,
  employeeId: 1042,
  employeeCode: 'NV-1042',
  fullName: 'Ngô Văn Dũng',
  department: 'Phòng Kỹ thuật',
  punchTimestamp: '2026-10-12T08:30:00.000+07:00',
  punchType: 'CHECK_IN',
  verificationMethod: 'VERIFICATION_FACE',
  status: 'ON_TIME',
  lateMinutes: 0,
  kioskId: 'KIOSK-HN-01',
}

const mockEnrollmentPayload: EnrollmentSuccessMessage = {
  status: 'ENROLLMENT_SUCCESS',
  otp: '654321',
  employeeId: 1042,
  message: 'Khuôn mặt đã được kích hoạt thành công trên Kiosk KIOSK-HN-01',
  activatedAt: '2026-10-12T08:35:00.000+07:00',
}

const dummyFrame: IFrame = {
  command: 'CONNECTED',
  headers: {},
  body: '',
  isBinaryBody: false,
  binaryBody: new Uint8Array(),
}

const dummyCloseEvent = {} as CloseEvent

describe('StompWebSocketService & Hooks (TASK-WEB-015)', () => {
  let mockClientInstance: {
    activate: ReturnType<typeof vi.fn>
    deactivate: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
    publish: ReturnType<typeof vi.fn>
    connected: boolean
    active: boolean
    connectHeaders: Record<string, string>
    reconnectDelay: number
    beforeConnect?: () => void
    onConnect?: (frame: IFrame) => void
    onDisconnect?: (frame: IFrame) => void
    onWebSocketClose?: (evt: CloseEvent) => void
    onStompError?: (frame: IFrame) => void
    onWebSocketError?: (evt: Event) => void
  }

  beforeEach(() => {
    vi.restoreAllMocks()

    mockClientInstance = {
      activate: vi.fn(() => {
        mockClientInstance.active = true
      }),
      deactivate: vi.fn(async () => {
        mockClientInstance.active = false
        mockClientInstance.connected = false
      }),
      subscribe: vi.fn(() => {
        const sub: StompSubscription = {
          id: `sub-test-${Math.random()}`,
          unsubscribe: vi.fn(),
        }
        return sub
      }),
      publish: vi.fn(),
      connected: false,
      active: false,
      connectHeaders: {},
      reconnectDelay: 1000,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function createTestService(options: { token?: string | null; endpoint?: string } = {}) {
    const service = createStompWebSocketService({
      endpoint: options.endpoint ?? '/ws-attendance',
      tokenProvider: () => (options.token !== undefined ? options.token : 'test-jwt-token'),
      baseReconnectDelay: 1000,
      maxReconnectDelay: 16000,
    })

    // Gán mock client trực tiếp
    const client = service.getClient()
    Object.assign(client, {
      activate: mockClientInstance.activate,
      deactivate: mockClientInstance.deactivate,
      subscribe: mockClientInstance.subscribe,
      publish: mockClientInstance.publish,
    })

    // Đồng bộ thuộc tính getter
    Object.defineProperty(client, 'connected', {
      get: () => mockClientInstance.connected,
      set: (val: boolean) => {
        mockClientInstance.connected = val
      },
    })
    Object.defineProperty(client, 'active', {
      get: () => mockClientInstance.active,
      set: (val: boolean) => {
        mockClientInstance.active = val
      },
    })

    return service
  }

  describe('1. Khởi tạo & Cấu hình StompWebSocketService (DD-WEB-010)', () => {
    it('khởi tạo thành công với cấu hình mặc định và trạng thái DISCONNECTED ban đầu', () => {
      const service = createTestService()
      expect(service.getStatus()).toBe('DISCONNECTED')
      expect(service.isConnected()).toBe(false)
      expect(service.getSubscriptionCount()).toBe(0)
    })

    it('tự động gắn Authorization Bearer token vào CONNECT Headers khi trước khi kết nối', () => {
      const service = createTestService({ token: 'jwt-access-token-xyz' })
      const client = service.getClient()

      // Giả lập kích hoạt beforeConnect
      client.beforeConnect?.(client)

      expect(service.getStatus()).toBe('CONNECTING')
      expect(client.connectHeaders['Authorization']).toBe('Bearer jwt-access-token-xyz')
    })

    it('không gắn header Authorization nếu tokenProvider trả về null', () => {
      const service = createTestService({ token: null })
      const client = service.getClient()

      client.beforeConnect?.(client)

      expect(service.getStatus()).toBe('CONNECTING')
      expect(client.connectHeaders['Authorization']).toBeUndefined()
    })

    it('stompClientService singleton instance được khởi tạo sẵn sàng', () => {
      expect(stompClientService).toBeInstanceOf(StompWebSocketService)
    })
  })

  describe('2. Quản lý Vòng đời & Trạng thái Kết nối (DD-WEB-010)', () => {
    it('phát sự kiện thay đổi trạng thái khi chuyển từ DISCONNECTED -> CONNECTING -> CONNECTED', () => {
      const service = createTestService()
      const statusHistory: string[] = []

      const unsubscribeListener = service.onStatusChange((status) => {
        statusHistory.push(status)
      })

      const client = service.getClient()

      // Bước 1: Bắt đầu kết nối
      client.beforeConnect?.(client)
      // Bước 2: Kết nối thành công
      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)

      expect(statusHistory).toEqual(['DISCONNECTED', 'CONNECTING', 'CONNECTED'])
      expect(service.isConnected()).toBe(true)

      unsubscribeListener()
    })

    it('chuyển sang trạng thái DISCONNECTED khi ngắt kết nối', () => {
      const service = createTestService()
      const client = service.getClient()

      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)
      expect(service.getStatus()).toBe('CONNECTED')

      client.onDisconnect?.(dummyFrame)
      expect(service.getStatus()).toBe('DISCONNECTED')
    })

    it('tính toán Exponential Backoff cho reconnectDelay khi socket bị đóng bất ngờ', () => {
      const service = createTestService()
      const client = service.getClient()

      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)
      expect(client.reconnectDelay).toBe(1000)

      // Lần rớt mạng 1: 1000 * 1.5^0 = 1000
      client.onWebSocketClose?.(dummyCloseEvent)
      expect(service.getStatus()).toBe('DISCONNECTED')
      expect(client.reconnectDelay).toBe(1000)

      // Lần rớt mạng 2: 1000 * 1.5^1 = 1500
      client.onWebSocketClose?.(dummyCloseEvent)
      expect(client.reconnectDelay).toBe(1500)

      // Lần rớt mạng 3: 1000 * 1.5^2 = 2250
      client.onWebSocketClose?.(dummyCloseEvent)
      expect(client.reconnectDelay).toBe(2250)

      // Khi kết nối lại thành công, reset về baseReconnectDelay
      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)
      expect(client.reconnectDelay).toBe(1000)
    })

    it('chuyển sang trạng thái ERROR và tính backoff khi nhận onStompError', () => {
      const service = createTestService()
      const client = service.getClient()

      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)

      client.onStompError?.({
        ...dummyFrame,
        headers: { message: 'Broker connection rejected' },
        body: 'Invalid credentials',
      })

      expect(service.getStatus()).toBe('ERROR')
      expect(client.reconnectDelay).toBe(1000)
    })
  })

  describe('3. Hàng đợi Subscription & Tự hủy an toàn (Deferred Subscription)', () => {
    it('cho phép đăng ký trước khi kết nối (Deferred) và tự động kích hoạt khi onConnect chạy', () => {
      const service = createTestService()
      const client = service.getClient()

      const receivedMessages: string[] = []
      const handle = service.subscribe('/topic/live-attendance', (msg) => {
        receivedMessages.push(msg.body)
      })

      expect(service.getSubscriptionCount()).toBe(1)
      // Chưa kết nối nên chưa gọi client.subscribe
      expect(mockClientInstance.subscribe).not.toHaveBeenCalled()

      // Giả lập kết nối thành công
      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)

      // Ngay sau khi onConnect, client.subscribe phải được gọi
      expect(mockClientInstance.subscribe).toHaveBeenCalledWith(
        '/topic/live-attendance',
        expect.any(Function),
        undefined
      )

      // Giả lập broker gửi tin nhắn qua subscription callback
      const registeredCallback = mockClientInstance.subscribe.mock.calls[0][1] as (
        msg: IMessage
      ) => void
      registeredCallback({ body: 'test-message' } as IMessage)

      expect(receivedMessages).toEqual(['test-message'])

      // Hủy đăng ký an toàn
      handle.unsubscribe()
      expect(service.getSubscriptionCount()).toBe(0)
    })

    it('đăng ký trực tiếp ngay lập tức nếu client đã ở trạng thái CONNECTED', () => {
      const service = createTestService()
      const client = service.getClient()

      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)

      const handle = service.subscribe('/topic/live-attendance', vi.fn())
      expect(mockClientInstance.subscribe).toHaveBeenCalledTimes(1)
      expect(service.getSubscriptionCount()).toBe(1)

      handle.unsubscribe()
      expect(service.getSubscriptionCount()).toBe(0)
    })

    it('tự động khôi phục toàn bộ subscriptions khi kết nối lại sau khi rớt mạng', () => {
      const service = createTestService()
      const client = service.getClient()

      // Kết nối lần đầu
      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)

      service.subscribe('/topic/live-attendance', vi.fn())
      service.subscribe('/topic/enrollment/123456', vi.fn())
      expect(mockClientInstance.subscribe).toHaveBeenCalledTimes(2)

      // Mất mạng
      mockClientInstance.connected = false
      client.onWebSocketClose?.(dummyCloseEvent)

      // Kết nối lại thành công
      mockClientInstance.connected = true
      client.onConnect?.(dummyFrame)

      // Phải tự động subscribe lại cả 2 kênh (tổng 4 lần gọi)
      expect(mockClientInstance.subscribe).toHaveBeenCalledTimes(4)
    })

    it('hủy subscription khi chưa kết nối thành công không gây ngoại lệ', () => {
      const service = createTestService()
      const handle = service.subscribe('/topic/live-attendance', vi.fn())
      expect(service.getSubscriptionCount()).toBe(1)

      // Hủy trước khi kết nối
      expect(() => handle.unsubscribe()).not.toThrow()
      expect(service.getSubscriptionCount()).toBe(0)

      // Khi kết nối sau đó, không bị subscribe rác
      mockClientInstance.connected = true
      service.getClient().onConnect?.(dummyFrame)
      expect(mockClientInstance.subscribe).not.toHaveBeenCalled()
    })
  })

  describe('4. Publish Message (Gửi bản tin)', () => {
    it('gửi bản tin khi client đã kết nối', () => {
      const service = createTestService()
      mockClientInstance.connected = true

      service.publish('/app/ping', { data: 'pong' })
      expect(mockClientInstance.publish).toHaveBeenCalledWith({
        destination: '/app/ping',
        body: JSON.stringify({ data: 'pong' }),
        headers: undefined,
      })
    })

    it('bỏ qua an toàn và cảnh báo khi publish lúc chưa kết nối', () => {
      const service = createTestService()
      mockClientInstance.connected = false

      service.publish('/app/ping', 'payload')
      expect(mockClientInstance.publish).not.toHaveBeenCalled()
    })
  })

  describe('5. Hook useLiveAttendance (TST-WEB-015)', () => {
    function createWrapper(queryClient: QueryClient) {
      return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    it('lắng nghe kênh /topic/live-attendance, prepend bản ghi và cập nhật TanStack Query cache', () => {
      const service = createTestService()
      const queryClient = new QueryClient()

      mockClientInstance.connected = true
      service.getClient().onConnect?.(dummyFrame)

      const { result, unmount } = renderHook(
        () =>
          useLiveAttendance({
            service,
            autoConnect: false,
            maxRecords: 50,
          }),
        { wrapper: createWrapper(queryClient) }
      )

      expect(result.current.latestEvents).toEqual([])
      expect(mockClientInstance.subscribe).toHaveBeenCalledWith(
        LIVE_ATTENDANCE_TOPIC,
        expect.any(Function),
        undefined
      )

      // Giả lập backend bắn tin STOMP chứa AttendanceRecord
      const subCallback = mockClientInstance.subscribe.mock.calls[0][1] as (msg: IMessage) => void
      act(() => {
        subCallback({
          body: JSON.stringify(mockAttendanceRecord),
        } as IMessage)
      })

      // 1. Kiểm tra state cục bộ
      expect(result.current.latestEvents).toHaveLength(1)
      expect(result.current.latestEvents[0].recordId).toBe(98231)

      // 2. Kiểm tra TanStack Query cache đã được cập nhật
      const cachedLiveRecords = queryClient.getQueryData<AttendanceRecord[]>(attendanceKeys.live())
      expect(cachedLiveRecords).toBeDefined()
      expect(cachedLiveRecords?.[0].recordId).toBe(98231)

      // 3. Unmount hook tự động hủy subscription mà không rò rỉ bộ nhớ
      unmount()
      expect(service.getSubscriptionCount()).toBe(0)
    })

    it('giữ tối đa 50 bản ghi (hoặc maxRecords cấu hình) khi có lượng lớn bản tin dồn dập', () => {
      const service = createTestService()
      const queryClient = new QueryClient()

      mockClientInstance.connected = true
      service.getClient().onConnect?.(dummyFrame)

      const { result } = renderHook(
        () =>
          useLiveAttendance({
            service,
            autoConnect: false,
            maxRecords: 3,
          }),
        { wrapper: createWrapper(queryClient) }
      )

      const subCallback = mockClientInstance.subscribe.mock.calls[0][1] as (msg: IMessage) => void

      act(() => {
        for (let i = 1; i <= 5; i++) {
          subCallback({
            body: JSON.stringify({ ...mockAttendanceRecord, recordId: i }),
          } as IMessage)
        }
      })

      // Chỉ giữ tối đa 3 bản ghi mới nhất (5, 4, 3)
      expect(result.current.latestEvents).toHaveLength(3)
      expect(result.current.latestEvents.map((r) => r.recordId)).toEqual([5, 4, 3])
    })
  })

  describe('6. Hook useEnrollmentStatus (DD-WEB-011)', () => {
    it('lắng nghe kênh /topic/enrollment/{otp} và cập nhật trạng thái khi kích hoạt thành công', () => {
      const service = createTestService()
      mockClientInstance.connected = true
      service.getClient().onConnect?.(dummyFrame)

      const onSuccessMock = vi.fn()
      const { result, unmount } = renderHook(() =>
        useEnrollmentStatus({
          otp: '654321',
          service,
          autoConnect: false,
          onSuccess: onSuccessMock,
        })
      )

      expect(result.current.isEnrolled).toBe(false)
      expect(result.current.enrollmentData).toBeNull()
      expect(mockClientInstance.subscribe).toHaveBeenCalledWith(
        '/topic/enrollment/654321',
        expect.any(Function),
        undefined
      )

      // Giả lập Kiosk quét mặt thành công và backend bắn STOMP message
      const subCallback = mockClientInstance.subscribe.mock.calls[0][1] as (msg: IMessage) => void
      act(() => {
        subCallback({
          body: JSON.stringify(mockEnrollmentPayload),
        } as IMessage)
      })

      expect(result.current.isEnrolled).toBe(true)
      expect(result.current.enrollmentData).toEqual(mockEnrollmentPayload)
      expect(onSuccessMock).toHaveBeenCalledWith(mockEnrollmentPayload)

      // Thử hàm reset
      act(() => {
        result.current.reset()
      })
      expect(result.current.isEnrolled).toBe(false)
      expect(result.current.enrollmentData).toBeNull()

      // Unmount hook tự động hủy subscription
      unmount()
      expect(service.getSubscriptionCount()).toBe(0)
    })

    it('không đăng ký lắng nghe nếu OTP rỗng hoặc null', () => {
      const service = createTestService()
      mockClientInstance.connected = true
      service.getClient().onConnect?.(dummyFrame)

      const { result } = renderHook(() =>
        useEnrollmentStatus({
          otp: null,
          service,
          autoConnect: false,
        })
      )

      expect(result.current.isEnrolled).toBe(false)
      expect(mockClientInstance.subscribe).not.toHaveBeenCalled()
      expect(service.getSubscriptionCount()).toBe(0)
    })
  })
})
