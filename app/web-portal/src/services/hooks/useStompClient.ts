/**
 * React Hook useStompClient — Dịch vụ Kết nối STOMP Client Infrastructure
 * (BLD-WEB-014, TASK-WEB-018, DD-WEB-010, DD-WEB-011).
 *
 * Hook tầng hạ tầng quản lý toàn bộ vòng đời kết nối STOMP singleton:
 * - Kích hoạt kết nối tới /ws-attendance khi mount, ngắt kết nối khi unmount.
 * - Tự động kết nối lại với Exponential Backoff (được xử lý bởi StompWebSocketService).
 * - Đồng bộ trạng thái kết nối vào stompConnectionStore (Zustand) để TopHeader đọc.
 * - Không phát sinh duplicate connection khi nhiều component cùng gọi.
 *
 * Khác biệt với useLiveAttendance / useEnrollmentStatus:
 * - Hook này chỉ quản lý kết nối, không subscribe vào topic cụ thể nào.
 * - Được mount 1 lần duy nhất tại AdminShellLayout.
 */

import { useEffect } from 'react'
import { stompClientService, type StompWebSocketService } from '../stompClientService'
import { useStompConnectionStore } from '@/store/stompConnectionStore'
import type { StompStatus } from '@/store/stompConnectionStore'
import type { ConnectionStatus } from '../stompClientService'

export interface UseStompClientOptions {
  /** Tự động kích hoạt khi hook mount (mặc định: true) */
  autoConnect?: boolean
  /** Instance service tùy biến — dùng cho testing */
  service?: StompWebSocketService
}

export interface UseStompClientResult {
  /** Trạng thái kết nối STOMP hiện tại */
  status: StompStatus
  /** Có đang kết nối thành công không */
  isConnected: boolean
  /** Kích hoạt kết nối thủ công */
  connect: () => void
  /** Ngắt kết nối thủ công */
  disconnect: () => Promise<void>
}

// Map ConnectionStatus của service → StompStatus của store
function mapStatus(connectionStatus: ConnectionStatus): StompStatus {
  return connectionStatus as StompStatus
}

export function useStompClient(options: UseStompClientOptions = {}): UseStompClientResult {
  const { autoConnect = true, service = stompClientService } = options
  const { status, setStatus } = useStompConnectionStore()

  useEffect(() => {
    // 1. Đồng bộ trạng thái hiện tại của service vào store ngay khi mount
    setStatus(mapStatus(service.getStatus()))

    // 2. Lắng nghe mọi thay đổi trạng thái từ service → cập nhật store
    const unbind = service.onStatusChange((newStatus) => {
      setStatus(mapStatus(newStatus))
    })

    // 3. Tự động kích hoạt kết nối nếu được yêu cầu và chưa active
    if (autoConnect) {
      service.activate()
    }

    // 4. Cleanup: hủy listener. Không deactivate service tại đây vì
    //    singleton dùng chung — deactivate chỉ khi app thoát hoàn toàn.
    return () => {
      unbind()
    }
  }, [service, autoConnect, setStatus])

  return {
    status,
    isConnected: status === 'CONNECTED',
    connect: () => service.activate(),
    disconnect: () => service.deactivate(),
  }
}
