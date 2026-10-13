/**
 * Chuẩn Fixtures Phản Hồi Cam Kết Sinh Trắc Informed Consent (TASK-WEB-032, API-WEB-003, API-WEB-008, API-WEB-014).
 */

import type { ApiResponse, ConsentResult, WithdrawConsentResponse } from '@/types'

export const mockConsentSubmitSuccess: ApiResponse<ConsentResult> = {
  success: true,
  code: 'CONSENT_ACCEPTED',
  message: 'Ký cam kết điện tử thành công. Vui lòng quét mã tại trạm Kiosk.',
  data: {
    otp: '839201',
    qrCodeData: 'fas-otp:839201:1042',
    qrCodeDataUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 phút hiệu lực
    kioskLocations: ['Trạm Kiosk Tầng 1 - Sảnh chính', 'Trạm Kiosk Tầng 2 - Khối Kỹ thuật'],
  },
  timestamp: '2026-10-13T09:15:00.000+07:00',
}

export const mockEnrollmentCompletedEvent = {
  status: 'ENROLLMENT_SUCCESS',
  otp: '839201',
  employeeId: 1042,
  message: 'Khuôn mặt đã được quét và kích hoạt thành công trên trạm KIOSK-HN-01',
  activatedAt: '2026-10-13T09:20:00.000+07:00',
}

export const mockWithdrawConsentSuccess: ApiResponse<WithdrawConsentResponse> = {
  success: true,
  code: 'CONSENT_WITHDRAWN',
  message: 'Rút cam kết Informed Consent thành công. Dữ liệu khuôn mặt sẽ được tiêu hủy theo hạn quy định.',
  data: {
    withdrawnAt: '2026-10-13T09:30:00.000+07:00',
    retentionDeadline: '2026-10-20T09:30:00.000+07:00', // 7 ngày
    message: 'Dữ liệu sinh trắc học sẽ được tiêu hủy trước ngày 20/10/2026.',
  },
  timestamp: '2026-10-13T09:30:00.000+07:00',
}
