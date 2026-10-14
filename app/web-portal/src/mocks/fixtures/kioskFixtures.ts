/**
 * Fixtures cho Quản lý Trạm Kiosk (TASK-WEB-027, APD-WEB-011, DATA-WEB-007, DD-WEB-019).
 */

import type { ApiResponse, KioskItemResponse, RegisterKioskResponse } from '@/types'

// Mock thời gian hiện tại
const now = Date.now()

export const mockKioskList: KioskItemResponse[] = [
  {
    id: 1,
    kioskId: 'KIOSK-HN-01',
    name: 'Trạm Kiosk Sảnh Chính Tầng 1',
    location: 'Tòa nhà văn phòng Hà Nội - Sảnh A',
    status: 'ONLINE',
    // Vừa ping 1 phút trước (online tốt)
    lastPingAt: new Date(now - 1 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.101',
    appVersion: 'v2.0.4',
  },
  {
    id: 2,
    kioskId: 'KIOSK-HN-02',
    name: 'Trạm Kiosk Cổng Sau Kho Vận',
    location: 'Khu vực Kho Vận Tầng B1',
    status: 'WARNING',
    // Mất ping 12 phút trước (> 5 phút threshold theo DD-WEB-019)
    lastPingAt: new Date(now - 12 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.102',
    appVersion: 'v2.0.3',
  },
  {
    id: 3,
    kioskId: 'KIOSK-HCM-01',
    name: 'Trạm Kiosk Chi nhánh HCM',
    location: 'Văn phòng Quận 1 - Tầng 5',
    status: 'OFFLINE',
    // Không có ping gần đây
    lastPingAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
    ipAddress: '192.168.10.50',
    appVersion: 'v2.0.2',
  },
]

export const mockKiosksResponse: ApiResponse<KioskItemResponse[]> = {
  success: true,
  code: 'OK',
  message: 'Lấy danh sách trạm Kiosk thành công',
  data: mockKioskList,
  timestamp: new Date().toISOString(),
}

export const mockRegisterKioskSuccess: ApiResponse<RegisterKioskResponse> = {
  success: true,
  code: 'CREATED',
  message: 'Đăng ký trạm Kiosk mới thành công',
  data: {
    kiosk: {
      id: 4,
      kioskId: 'KIOSK-DN-01',
      name: 'Trạm Kiosk Đà Nẵng',
      location: 'Tòa nhà Hải Châu - Tầng 2',
      status: 'OFFLINE',
      lastPingAt: undefined,
      ipAddress: '192.168.20.10',
      appVersion: 'v2.0.4',
    },
    secretToken: 'kiosk-secret-token-uuid-9f8a7b6c5d4e3f2a1b0c',
  },
  timestamp: new Date().toISOString(),
}
