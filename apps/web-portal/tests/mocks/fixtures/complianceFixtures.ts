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

export const mockAuditLogList: import('@/types').AuditLogItem[] = [
  {
    id: 1,
    action: 'KIOSK_REGISTERED',
    actorId: 2,
    actorEmail: 'admin@company.com',
    targetResource: 'KIOSK-HN-01',
    oldValues: null,
    newValues: { name: 'Trạm Kiosk Sảnh Chính Tầng 1', location: 'Tòa nhà Hà Nội' },
    ipAddress: '192.168.1.50',
    createdAt: '2026-10-14T08:00:00.000+07:00',
  },
  {
    id: 2,
    action: 'CONSENT_SIGNED',
    actorId: 1042,
    actorEmail: 'nguyenvana@example.com',
    targetResource: 'EMPLOYEE_1042',
    oldValues: { hasBiometric: false },
    newValues: { hasBiometric: true, version: '2.0' },
    ipAddress: '192.168.1.100',
    createdAt: '2026-10-14T08:15:00.000+07:00',
  },
  {
    id: 3,
    action: 'CONSENT_WITHDRAWN',
    actorId: 1045,
    actorEmail: 'tranthib@example.com',
    targetResource: 'EMPLOYEE_1045',
    oldValues: { hasBiometric: true },
    newValues: { hasBiometric: false, retentionDeadline: '2026-10-21T09:00:00.000+07:00' },
    ipAddress: '192.168.1.105',
    createdAt: '2026-10-14T09:00:00.000+07:00',
  },
]

export const mockAuditLogsPaginatedResponse: import('@/types').PaginatedResult<import('@/types').AuditLogItem> = {
  content: mockAuditLogList,
  page: 0,
  size: 10,
  totalElements: 3,
  totalPages: 1,
  first: true,
  last: true,
}

export const mockDpoConsentList: import('@/types').DpoConsentAuditItem[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'EMP-001',
    fullName: 'Nguyễn Văn A',
    agreedAt: '2026-10-14T08:15:00.000+07:00',
    ipAddress: '192.168.1.100',
    consentVersion: 'v2.0-Decree13',
    status: 'ACTIVE',
  },
  {
    id: 2,
    employeeId: 1045,
    employeeCode: 'EMP-005',
    fullName: 'Trần Thị B',
    agreedAt: '2026-10-10T14:20:00.000+07:00',
    ipAddress: '192.168.1.105',
    consentVersion: 'v2.0-Decree13',
    status: 'WITHDRAWN',
  },
]

export const mockRetentionScheduleList: import('@/types').RetentionScheduleItem[] = [
  {
    id: 1,
    employeeId: 1045,
    employeeCode: 'EMP-005',
    fullName: 'Trần Thị B',
    resignedAt: '2026-10-14T09:00:00.000+07:00',
    scheduledDestructionDate: '2026-10-21T09:00:00.000+07:00', // 7 ngày
    actualDestructionDate: null,
    status: 'SCHEDULED',
  },
  {
    id: 2,
    employeeId: 1020,
    employeeCode: 'EMP-002',
    fullName: 'Lê Văn C',
    resignedAt: '2026-09-30T17:00:00.000+07:00',
    scheduledDestructionDate: '2026-10-07T17:00:00.000+07:00',
    actualDestructionDate: '2026-10-07T10:00:00.000+07:00',
    status: 'COMPLETED',
  },
]
