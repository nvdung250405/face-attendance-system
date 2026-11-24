/**
 * React Hook useLiveAttendance
 * (DD-WEB-007, DD-WEB-010, APD-WEB-003, BLD-WEB-011, TASK-WEB-015).
 *
 * Lắng nghe kênh STOMP '/topic/live-attendance':
 * - Nhận thông điệp AttendanceRecord theo thời gian thực.
 * - Duy trì danh sách hiển thị cục bộ (Optimistic Prepend tối đa 50 bản ghi mới nhất).
 * - Cập nhật đồng bộ vào bộ nhớ đệm TanStack Query Cache qua handleLiveAttendanceEvent.
 * - Tự động hủy đăng ký khi unmount, bảo vệ chống rò rỉ bộ nhớ.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { IMessage } from '@stomp/stompjs'
import type { AttendanceRecord } from '@/types'
import { stompClientService, type StompWebSocketService } from '../stompClientService'
import { attendanceKeys, handleLiveAttendanceEvent } from '../queryClient'

export interface UseLiveAttendanceOptions {
  /** Số lượng bản ghi tối đa duy trì trong danh sách cục bộ (mặc định 50) */
  maxRecords?: number
  /** Tự động kích hoạt kết nối STOMP nếu chưa bật (mặc định true) */
  autoConnect?: boolean
  /** Instance service tùy biến (phục vụ testing hoặc môi trường tách biệt) */
  service?: StompWebSocketService
  /** Callback tùy chọn kích hoạt mỗi khi có bản ghi mới */
  onRecordReceived?: (record: AttendanceRecord) => void
}

export interface UseLiveAttendanceResult {
  /** Danh sách các bản ghi điểm danh mới nhất theo thời gian thực */
  latestEvents: AttendanceRecord[]
  /** Trạng thái kết nối WebSocket STOMP */
  isConnected: boolean
  /** Hàm xóa sạch danh sách sự kiện cục bộ */
  clearEvents: () => void
}

export const LIVE_ATTENDANCE_TOPIC = '/topic/live-attendance'
export const DEFAULT_MAX_RECORDS = 50

export function useLiveAttendance(options: UseLiveAttendanceOptions = {}): UseLiveAttendanceResult {
  const {
    maxRecords = DEFAULT_MAX_RECORDS,
    autoConnect = true,
    service = stompClientService,
    onRecordReceived,
  } = options

  const queryClient = useQueryClient()
  const [latestEvents, setLatestEvents] = useState<AttendanceRecord[]>([])
  const [isConnected, setIsConnected] = useState<boolean>(service.isConnected())
  const seenRecordIdsRef = useRef<Set<number>>(new Set())

  const onRecordReceivedRef = useRef(onRecordReceived)
  useEffect(() => {
    onRecordReceivedRef.current = onRecordReceived
  }, [onRecordReceived])

  const clearEvents = useCallback(() => {
    seenRecordIdsRef.current.clear()
    setLatestEvents([])
    queryClient.setQueryData(attendanceKeys.live(), [])
  }, [queryClient])

  useEffect(() => {
    // 1. Theo dõi trạng thái kết nối
    const unbindStatus = service.onStatusChange((status) => {
      setIsConnected(status === 'CONNECTED')
    })

    // 2. Tự động kết nối nếu được yêu cầu
    if (autoConnect) {
      service.activate()
    }

    // 3. Đăng ký kênh '/topic/live-attendance'
    const subscription = service.subscribe(LIVE_ATTENDANCE_TOPIC, (message: IMessage) => {
      try {
        const record = JSON.parse(message.body) as AttendanceRecord
        if (!record || typeof record !== 'object') return

        // Chống trùng lặp recordId khi STOMP gửi lại bản tin (F-TECH-02)
        if (record.recordId != null && seenRecordIdsRef.current.has(record.recordId)) {
          return
        }
        if (record.recordId != null) {
          seenRecordIdsRef.current.add(record.recordId)
        }

        // Cập nhật danh sách hiển thị cục bộ (chèn đầu, giữ tối đa maxRecords)
        setLatestEvents((prev) => {
          const filtered = prev.filter((r) => r.recordId !== record.recordId)
          return [record, ...filtered].slice(0, maxRecords)
        })

        // Cập nhật TanStack Query Cache (Live Table + KPI + Invalidation)
        handleLiveAttendanceEvent(record, queryClient)

        // Kích hoạt callback nếu có
        onRecordReceivedRef.current?.(record)
      } catch (err) {
        console.error('[useLiveAttendance] Failed to parse message body:', err)
      }
    })

    // 4. Cleanup an toàn khi unmount
    return () => {
      subscription.unsubscribe()
      unbindStatus()
    }
  }, [service, autoConnect, maxRecords, queryClient])

  return {
    latestEvents,
    isConnected,
    clearEvents,
  }
}
