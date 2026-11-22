/**
 * StompWebSocketService & Connection Manager
 * (DD-WEB-010, DD-WEB-011, APD-WEB-003, BLD-WEB-011, TASK-WEB-015).
 *
 * Cung cấp dịch vụ kết nối WebSocket STOMP chuẩn hóa:
 * - Đóng gói @stomp/stompjs với SockJS Fallback và Exponential Backoff Reconnect.
 * - Tự động trích xuất và gắn Bearer Token qua STOMP CONNECT Headers.
 * - Quản lý hàng đợi Subscription an toàn (Deferred/Pending Subscriptions):
 *   tự động đăng ký khi kết nối thành công và tự hủy sạch sẽ khi unmount, chống rò rỉ bộ nhớ.
 * - Quản lý và phát thông báo vòng đời kết nối (DISCONNECTED, CONNECTING, CONNECTED, ERROR).
 */

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getStoredAccessToken } from './apiClient'

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

export interface StompServiceOptions {
  /** Đường dẫn endpoint STOMP WebSocket (mặc định lấy từ VITE_WS_BASE_URL hoặc '/ws-attendance') */
  endpoint?: string
  /** Hàm trích xuất access token (mặc định dùng getStoredAccessToken từ apiClient) */
  tokenProvider?: () => string | null
  /** Độ trễ kết nối lại cơ sở (milliseconds, mặc định 1000ms) */
  baseReconnectDelay?: number
  /** Độ trễ kết nối lại tối đa (milliseconds, mặc định 30000ms) */
  maxReconnectDelay?: number
  /** Chu kỳ nhịp tim chiều nhận (heartbeat incoming ms, mặc định 4000) */
  heartbeatIncoming?: number
  /** Chu kỳ nhịp tim chiều gửi (heartbeat outgoing ms, mặc định 4000) */
  heartbeatOutgoing?: number
  /** Bật/tắt log debug */
  debug?: boolean | ((msg: string) => void)
  /** Factory tạo WebSocket tùy biến (dùng khi kiểm thử hoặc môi trường đặc thù) */
  webSocketFactory?: () => WebSocket
}

export interface SubscriptionHandle {
  readonly id: string
  readonly destination: string
  unsubscribe: () => void
}

interface InternalSubscriptionItem {
  id: string
  destination: string
  callback: (message: IMessage) => void
  headers?: Record<string, string>
  stompSub?: StompSubscription
}

export class StompWebSocketService {
  private client: Client
  private status: ConnectionStatus = 'DISCONNECTED'
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set()
  private subscriptions: Map<string, InternalSubscriptionItem> = new Map()
  private subCounter = 0

  private readonly tokenProvider: () => string | null
  private readonly baseReconnectDelay: number
  private readonly maxReconnectDelay: number
  private reconnectAttempts = 0

  constructor(options: StompServiceOptions = {}) {
    const rawEndpoint = options.endpoint ?? import.meta.env?.VITE_WS_BASE_URL ?? '/ws-attendance'
    const endpoint = rawEndpoint.trim() || '/ws-attendance'

    this.tokenProvider = options.tokenProvider ?? getStoredAccessToken
    this.baseReconnectDelay = options.baseReconnectDelay ?? 1000
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000

    const debugLogger =
      typeof options.debug === 'function'
        ? options.debug
        : options.debug === true
          ? (str: string) => console.log(`[STOMP] ${str}`)
          : () => {}

    const customWebSocketFactory = options.webSocketFactory

    this.client = new Client({
      // Nếu có custom factory thì dùng, ngược lại dùng SockJS fallback
      webSocketFactory: customWebSocketFactory
        ? customWebSocketFactory
        : () => new SockJS(endpoint) as unknown as WebSocket,
      reconnectDelay: this.baseReconnectDelay,
      heartbeatIncoming: options.heartbeatIncoming ?? 4000,
      heartbeatOutgoing: options.heartbeatOutgoing ?? 4000,
      debug: debugLogger,
    })

    this.setupClientCallbacks()
  }

  /**
   * Thiết lập các sự kiện vòng đời của STOMP Client
   */
  private setupClientCallbacks(): void {
    // Trước khi kết nối: đọc token mới nhất và tiêm vào CONNECT headers
    this.client.beforeConnect = () => {
      this.updateStatus('CONNECTING')
      const token = this.tokenProvider()
      if (token) {
        this.client.connectHeaders = {
          Authorization: `Bearer ${token}`,
        }
      } else {
        this.client.connectHeaders = {}
      }
    }

    // Khi kết nối thành công
    this.client.onConnect = () => {
      this.reconnectAttempts = 0
      this.client.reconnectDelay = this.baseReconnectDelay
      this.updateStatus('CONNECTED')

      // Tái đăng ký hoặc kích hoạt tất cả các subscriptions đang chờ
      this.resubscribeAll()
    }

    // Khi ngắt kết nối chủ động
    this.client.onDisconnect = () => {
      this.updateStatus('DISCONNECTED')
      this.clearActiveStompSubscriptions()
    }

    // Khi socket bị đóng (mất mạng hoặc thử kết nối lại thất bại) -> áp dụng Exponential Backoff
    this.client.onWebSocketClose = () => {
      this.updateStatus('DISCONNECTED')
      this.clearActiveStompSubscriptions()
      this.applyExponentialBackoff()
    }

    // Khi nhận khung lỗi STOMP từ máy chủ
    this.client.onStompError = (frame) => {
      console.error('[STOMP Error Frame]:', frame.headers['message'], frame.body)
      this.updateStatus('ERROR')
      this.clearActiveStompSubscriptions()
      if (!this.tokenProvider()) {
        void this.client.deactivate().catch(() => {})
        return
      }
      this.applyExponentialBackoff()
    }

    // Khi socket tầng transport phát sinh lỗi
    this.client.onWebSocketError = (event) => {
      console.error('[STOMP WebSocket Error]:', event)
      this.updateStatus('ERROR')
    }
  }

  /**
   * Tính toán và áp dụng Exponential Backoff cho lần kết nối lại tiếp theo
   */
  private applyExponentialBackoff(): void {
    this.reconnectAttempts += 1
    // Backoff: delay = min(maxDelay, baseDelay * 1.5^(attempts - 1))
    const factor = Math.pow(1.5, Math.max(0, this.reconnectAttempts - 1))
    const nextDelay = Math.min(this.maxReconnectDelay, Math.round(this.baseReconnectDelay * factor))
    this.client.reconnectDelay = nextDelay
  }

  /**
   * Cập nhật trạng thái và phát sự kiện tới các listeners
   */
  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return
    this.status = newStatus
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus)
      } catch (err) {
        console.error('[STOMP] Error in status change listener:', err)
      }
    })
  }

  /**
   * Kích hoạt toàn bộ danh sách đăng ký kênh khi STOMP đã ở trạng thái CONNECTED
   */
  private resubscribeAll(): void {
    if (!this.client.connected) return

    this.subscriptions.forEach((item) => {
      try {
        item.stompSub = this.client.subscribe(
          item.destination,
          (message: IMessage) => item.callback(message),
          item.headers
        )
      } catch (err) {
        console.error(`[STOMP] Failed to subscribe to ${item.destination}:`, err)
      }
    })
  }

  /**
   * Dọn sạch các đối tượng subscription của STOMP khi mất kết nối nhưng giữ lại đăng ký trong map
   * để tự động khôi phục khi kết nối lại thành công.
   */
  private clearActiveStompSubscriptions(): void {
    this.subscriptions.forEach((item) => {
      item.stompSub = undefined
    })
  }

  /**
   * Trạng thái kết nối hiện tại
   */
  getStatus(): ConnectionStatus {
    return this.status
  }

  /**
   * Kiểm tra máy khách STOMP đã kết nối sẵn sàng hay chưa
   */
  isConnected(): boolean {
    return this.client.connected
  }

  /**
   * Đăng ký lắng nghe sự kiện thay đổi trạng thái kết nối
   */
  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    // Phát ngay trạng thái hiện tại cho listener mới
    listener(this.status)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /**
   * Kích hoạt kết nối WebSocket STOMP
   */
  activate(): void {
    if (this.client.active) return
    const token = this.tokenProvider()
    if (!token) {
      return
    }
    this.updateStatus('CONNECTING')
    this.client.activate()
  }

  /**
   * Ngắt kết nối WebSocket STOMP và giải phóng toàn bộ kết nối
   */
  async deactivate(): Promise<void> {
    if (!this.client.active) {
      this.updateStatus('DISCONNECTED')
      return
    }

    // Hủy toàn bộ active stomp subscriptions
    this.subscriptions.forEach((item) => {
      if (item.stompSub) {
        try {
          item.stompSub.unsubscribe()
        } catch {
          // Bỏ qua lỗi khi socket đang đóng
        }
        item.stompSub = undefined
      }
    })

    await this.client.deactivate()
    this.updateStatus('DISCONNECTED')
  }

  /**
   * Đăng ký kênh truyền tin (Destination Topic/Queue).
   * Hỗ trợ Deferred Subscription: Nếu chưa kết nối, subscription sẽ được lưu vào hàng đợi
   * và tự động kích hoạt ngay khi kết nối thành công.
   *
   * Trả về handle có phương thức `unsubscribe()` an toàn, không rò rỉ bộ nhớ.
   */
  subscribe(
    destination: string,
    callback: (message: IMessage) => void,
    headers?: Record<string, string>
  ): SubscriptionHandle {
    this.subCounter += 1
    const subId = `sub-${Date.now()}-${this.subCounter}`

    const item: InternalSubscriptionItem = {
      id: subId,
      destination,
      callback,
      headers,
    }

    // Nếu STOMP client đã connected, đăng ký ngay lập tức
    if (this.client.connected) {
      try {
        item.stompSub = this.client.subscribe(
          destination,
          (message: IMessage) => item.callback(message),
          headers
        )
      } catch (err) {
        console.error(`[STOMP] Subscribe error on destination ${destination}:`, err)
      }
    }

    this.subscriptions.set(subId, item)

    // Trả về handle để tự hủy khi component unmount
    return {
      id: subId,
      destination,
      unsubscribe: () => {
        const existing = this.subscriptions.get(subId)
        if (existing) {
          if (existing.stompSub) {
            try {
              existing.stompSub.unsubscribe()
            } catch {
              // Bỏ qua lỗi nếu socket đã ngắt
            }
          }
          this.subscriptions.delete(subId)
        }
      },
    }
  }

  /**
   * Phát bản tin lên STOMP broker
   */
  publish(destination: string, body: unknown, headers?: Record<string, string>): void {
    if (!this.client.connected) {
      console.warn(`[STOMP] Publish ignored: client is not connected to ${destination}`)
      return
    }

    const payload = typeof body === 'string' ? body : JSON.stringify(body)
    this.client.publish({
      destination,
      body: payload,
      headers,
    })
  }

  /**
   * Truy xuất instance Client gốc của @stomp/stompjs (chủ yếu phục vụ kiểm thử)
   */
  getClient(): Client {
    return this.client
  }

  /**
   * Truy xuất số lượng subscription đang đăng ký trong hệ thống
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size
  }
}

/**
 * Factory khởi tạo instance StompWebSocketService
 */
export function createStompWebSocketService(options?: StompServiceOptions): StompWebSocketService {
  return new StompWebSocketService(options)
}

/**
 * Singleton StompWebSocketService mặc định cho toàn bộ ứng dụng Cổng Web Portal
 */
export const stompClientService = createStompWebSocketService()
