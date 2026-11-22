/**
 * Fixtures cho Thông báo Trong Ứng dụng (TASK-WEB-026, APD-WEB-010, API-WEB-016).
 */

import type { ApiResponse, NotificationResponse } from '@/types'

export const mockNotificationResponses: NotificationResponse[] = [
  {
    id: 101,
    userId: 1,
    eventType: 'ATTENDANCE_PUNCH',
    title: 'Điểm danh thành công',
    body: 'Bạn đã hoàn thành chấm công ca sáng lúc 08:30:15 tại Kiosk sảnh 1.',
    readAt: null,
    createdAt: '2026-10-14T08:30:15.000+07:00',
  },
  {
    id: 102,
    userId: 1,
    eventType: 'SHIFT_ASSIGNED',
    title: 'Phân ca làm việc mới',
    body: 'Bạn đã được phân công ca Ca Hành Chính từ ngày 15/10/2026.',
    readAt: null,
    createdAt: '2026-10-13T16:00:00.000+07:00',
  },
  {
    id: 103,
    userId: 1,
    eventType: 'CONSENT_SIGNED',
    title: 'Cam kết bảo vệ dữ liệu',
    body: 'Bản Informed Consent phiên bản 2.0 đã được lưu trữ thành công.',
    readAt: '2026-10-12T09:15:00.000+07:00',
    createdAt: '2026-10-12T09:10:00.000+07:00',
  },
]

export const mockNotificationsResponse: ApiResponse<NotificationResponse[]> = {
  success: true,
  code: 'OK',
  message: 'Lấy danh sách thông báo thành công',
  data: mockNotificationResponses,
  timestamp: '2026-10-14T10:00:00.000+07:00',
}

export const mockMarkAsReadResponse: ApiResponse<NotificationResponse> = {
  success: true,
  code: 'OK',
  message: 'Đã đánh dấu thông báo là đã đọc',
  data: {
    ...mockNotificationResponses[0],
    readAt: '2026-10-14T15:30:00.000+07:00',
  },
  timestamp: '2026-10-14T15:30:00.000+07:00',
}
