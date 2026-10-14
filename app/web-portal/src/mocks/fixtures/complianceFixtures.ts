/**
 * Fixtures cho Quyền Chủ thể Dữ liệu & Tuân thủ (TASK-WEB-026, APD-WEB-008, API-WEB-014).
 */

import type { ApiResponse, DataSubjectRequestItem } from '@/types'

export const mockDataSubjectRequests: DataSubjectRequestItem[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'EMP-001',
    fullName: 'Nguyễn Văn A',
    requestType: 'ACCESS',
    details: 'Yêu cầu trích xuất toàn bộ dữ liệu điểm danh tháng 09/2026.',
    status: 'COMPLETED',
    submittedAt: '2026-10-01T08:30:00.000+07:00',
    handledAt: '2026-10-02T14:15:00.000+07:00',
    handledBy: 'DPO Officer',
    adminNote: 'Đã gửi file trích xuất dữ liệu qua email cá nhân.',
  },
  {
    id: 2,
    employeeId: 1042,
    employeeCode: 'EMP-001',
    fullName: 'Nguyễn Văn A',
    requestType: 'RECTIFICATION',
    details: 'Đính chính sai sót thông tin số điện thoại liên hệ khẩn cấp.',
    status: 'IN_PROGRESS',
    submittedAt: '2026-10-10T10:00:00.000+07:00',
    handledAt: null,
    handledBy: null,
    adminNote: 'Đang xác minh giấy tờ tùy thân.',
  },
  {
    id: 3,
    employeeId: 1042,
    employeeCode: 'EMP-001',
    fullName: 'Nguyễn Văn A',
    requestType: 'ERASURE',
    details: 'Yêu cầu xóa toàn bộ lịch sử điểm danh thử nghiệm giai đoạn thử việc.',
    status: 'PENDING',
    submittedAt: '2026-10-14T09:00:00.000+07:00',
    handledAt: null,
    handledBy: null,
    adminNote: null,
  },
]

export const mockDataSubjectRequestsResponse: ApiResponse<DataSubjectRequestItem[]> = {
  success: true,
  code: 'OK',
  message: 'Lấy danh sách yêu cầu dữ liệu thành công',
  data: mockDataSubjectRequests,
  timestamp: '2026-10-14T10:00:00.000+07:00',
}

export const mockCreateDataSubjectRequestSuccess: ApiResponse<DataSubjectRequestItem> = {
  success: true,
  code: 'CREATED',
  message: 'Yêu cầu về quyền dữ liệu cá nhân đã được gửi đến DPO thành công',
  data: {
    id: 4,
    employeeId: 1042,
    employeeCode: 'EMP-001',
    fullName: 'Nguyễn Văn A',
    requestType: 'EXPORT',
    details: 'Yêu cầu xuất tệp dữ liệu cá nhân theo định dạng JSON.',
    status: 'PENDING',
    submittedAt: '2026-10-14T15:00:00.000+07:00',
    handledAt: null,
    handledBy: null,
    adminNote: null,
  },
  timestamp: '2026-10-14T15:00:00.000+07:00',
}

export const mockCreatedDataSubjectRequest: DataSubjectRequestItem = mockCreateDataSubjectRequestSuccess.data
