/**
 * React Hook useEnrollmentStatus
 * (DD-WEB-010, DD-WEB-011, APD-WEB-003, BLD-WEB-011, TASK-WEB-015).
 *
 * Lắng nghe kênh STOMP '/topic/enrollment/{otp}':
 * - Bắt sự kiện kích hoạt khuôn mặt thành công từ trạm Kiosk khi nhân viên quét OTP.
 * - Quản lý cờ trạng thái isEnrolled và chi tiết payload EnrollmentSuccessMessage.
 * - Hỗ trợ hàm reset và tự động hủy đăng ký kênh khi unmount hoặc OTP thay đổi.
 */

import { useState, useEffect, useCallback } from 'react'
import type { IMessage } from '@stomp/stompjs'
import type { EnrollmentSuccessMessage } from '@/types'
import { stompClientService, type StompWebSocketService } from '../stompClientService'

export interface UseEnrollmentStatusOptions {
  /** Mã OTP 6 chữ số đang chờ kích hoạt tại Kiosk */
  otp?: string | null
  /** Tự động kích hoạt kết nối STOMP nếu chưa bật (mặc định true) */
  autoConnect?: boolean
  /** Instance service tùy biến (phục vụ testing hoặc môi trường tách biệt) */
  service?: StompWebSocketService
  /** Hàm gọi lại khi nhận được tín hiệu kích hoạt thành công */
  onSuccess?: (message: EnrollmentSuccessMessage) => void
}

export interface UseEnrollmentStatusResult {
  /** Đã kích hoạt khuôn mặt thành công tại Kiosk hay chưa */
  isEnrolled: boolean
  /** Dữ liệu chi tiết sự kiện kích hoạt thành công */
  enrollmentData: EnrollmentSuccessMessage | null
  /** Trạng thái kết nối WebSocket STOMP */
  isConnected: boolean
  /** Đặt lại trạng thái về ban đầu */
  reset: () => void
}

export function useEnrollmentStatus(
  optionsOrOtp?: UseEnrollmentStatusOptions | string | null
): UseEnrollmentStatusResult {
  const options: UseEnrollmentStatusOptions =
    typeof optionsOrOtp === 'string' || optionsOrOtp === null || optionsOrOtp === undefined
      ? { otp: optionsOrOtp }
      : optionsOrOtp

  const {
    otp,
    autoConnect = true,
    service = stompClientService,
    onSuccess,
  } = options

  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentSuccessMessage | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(service.isConnected())

  const reset = useCallback(() => {
    setIsEnrolled(false)
    setEnrollmentData(null)
  }, [])

  useEffect(() => {
    // 1. Theo dõi trạng thái kết nối
    const unbindStatus = service.onStatusChange((status) => {
      setIsConnected(status === 'CONNECTED')
    })

    // 2. Nếu không có OTP hoặc OTP rỗng thì không đăng ký
    const trimmedOtp = otp?.trim()
    if (!trimmedOtp) {
      return () => {
        unbindStatus()
      }
    }

    // 3. Tự động kết nối nếu được yêu cầu
    if (autoConnect) {
      service.activate()
    }

    const destination = `/topic/enrollment/${trimmedOtp}`

    // 4. Đăng ký kênh '/topic/enrollment/{otp}'
    const subscription = service.subscribe(destination, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body) as EnrollmentSuccessMessage
        if (payload && payload.status === 'ENROLLMENT_SUCCESS') {
          setIsEnrolled(true)
          setEnrollmentData(payload)
          onSuccess?.(payload)
        }
      } catch (err) {
        console.error(`[useEnrollmentStatus] Failed to parse message on ${destination}:`, err)
      }
    })

    // 5. Cleanup an toàn khi đổi OTP hoặc unmount
    return () => {
      subscription.unsubscribe()
      unbindStatus()
    }
  }, [otp, autoConnect, service, onSuccess])

  return {
    isEnrolled,
    enrollmentData,
    isConnected,
    reset,
  }
}
