/**
 * Bộ Khung Giả Lập Kênh STOMP WebSocket Broker (TASK-WEB-032, API-WEB-007, API-WEB-008, DD-WEB-010).
 *
 * Cho phép các bài test Component và Hooks bắn bản tin điểm danh trực tiếp hoặc kích hoạt OTP
 * mà không phụ thuộc vào hạ tầng WebSocket Broker thực tế.
 */

import type { IMessage } from '@stomp/stompjs'
import type { LiveAttendanceMessage } from '@/types'
import { mockLiveAttendancePunchedEvent, mockEnrollmentCompletedEvent } from './fixtures'

export type StompMessageCallback = (message: IMessage) => void

export class StompMockHarness {
  private subscriptions: Map<string, Set<StompMessageCallback>> = new Map()
  public isConnected: boolean = false

  /**
   * Thiết lập trạng thái kết nối
   */
  connect(): void {
    this.isConnected = true
  }

  /**
   * Ngắt kết nối giả lập
   */
  disconnect(): void {
    this.isConnected = false
  }

  /**
   * Đăng ký nhận bản tin từ destination
   */
  subscribe(destination: string, callback: StompMessageCallback): { unsubscribe: () => void } {
    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, new Set())
    }
    this.subscriptions.get(destination)!.add(callback)

    return {
      unsubscribe: () => {
        this.subscriptions.get(destination)?.delete(callback)
      },
    }
  }

  /**
   * Bắn bản tin giả lập tới destination
   */
  emit(destination: string, payload: unknown): void {
    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const mockMessage: IMessage = {
      body: rawBody,
      command: 'MESSAGE',
      headers: {
        destination,
        'message-id': `mock-msg-${Date.now()}`,
        'subscription': `sub-${destination}`,
      },
      ack: () => {},
      nack: () => {},
      isBinaryBody: false,
      binaryBody: new Uint8Array(),
    }

    const listeners = this.subscriptions.get(destination)
    if (listeners) {
      listeners.forEach((callback) => callback(mockMessage))
    }
  }

  /**
   * Bắn sự kiện điểm danh trực tiếp tới topic /topic/live-attendance
   */
  emitLiveAttendance(customEvent?: Partial<LiveAttendanceMessage>): void {
    const event: LiveAttendanceMessage = {
      ...mockLiveAttendancePunchedEvent,
      ...customEvent,
      punchTimestamp: customEvent?.punchTimestamp || new Date().toISOString(),
    }
    this.emit('/topic/live-attendance', event)
  }

  /**
   * Bắn sự kiện kích hoạt khuôn mặt thành công tới topic /topic/enrollment/{otp}
   */
  emitEnrollmentSuccess(otp: string, customPayload?: Record<string, unknown>): void {
    const payload = {
      ...mockEnrollmentCompletedEvent,
      otp,
      activatedAt: new Date().toISOString(),
      ...customPayload,
    }
    this.emit(`/topic/enrollment/${otp}`, payload)
  }

  /**
   * Dọn sạch toàn bộ subscriptions
   */
  reset(): void {
    this.subscriptions.clear()
    this.isConnected = false
  }
}

export const stompMockHarness = new StompMockHarness()
