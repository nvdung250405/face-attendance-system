/**
 * Trình Giả Lập Dịch Vụ API Phục Vụ Phát Triển Giao Diện Độc Lập (Dev Mock Server).
 * Tích hợp axios-mock-adapter gắn vào apiClient để mô phỏng toàn bộ hành vi backend REST API.
 */

import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '@/services/apiClient'
import type {
  ApiResponse,
  PageResponse,
  UserProfile,
  LoginResponse,
  TokenResponse,
  AttendanceRecord,
  AttendanceStats,
  PersonalAttendanceResponse,
  PersonalAttendanceDayRecord,
  KioskItemResponse,
  RegisterKioskResponse,
  EmployeeItem,
  CreateEmployeeResponse,
  ShiftItem,
  EmployeeShiftAssignment,
  BatchAssignResult,
  ExcuseRequestItem,
  PayrollPeriodResponse,
  AuditLogItem,
  DpoConsentAuditItem,
  RetentionScheduleItem,
  ConsentResult,
  WithdrawConsentResponse,
  DataSubjectRequestItem,
  NotificationResponse,
  PinStatusResponse,
  ChangePasswordResponse,
} from '@/types'
import type { ResetEmployeeCredentialsResponse } from '@/services/adminEmployeeService'
import type { KioskHealthResponse } from '@/services/complianceAdminService'

// Helper tạo bao bọc chuẩn ApiResponse<T>
function makeResponse<T>(data: T, message = 'Thành công', code = 'OK'): ApiResponse<T> {
  return {
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

function makePageResponse<T>(content: T[], page = 0, size = 10, totalElements?: number): PageResponse<T> {
  const total = totalElements ?? content.length
  const totalPages = Math.max(1, Math.ceil(total / size))
  return {
    content,
    page,
    size,
    totalElements: total,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  }
}

// -----------------------------------------------------------------------------
// DỮ LIỆU MOCK KHỞI TẠO (IN-MEMORY STATE)
// -----------------------------------------------------------------------------

const initialEmployees: EmployeeItem[] = [
  {
    id: 1,
    employeeCode: 'NV-ADM-001',
    fullName: 'Quản Trị Hệ Thống',
    email: 'admin@fas.com',
    department: 'Ban Giám Đốc',
    role: 'ADMIN',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-01-01T08:00:00+07:00',
  },
  {
    id: 2,
    employeeCode: 'NV-HR-001',
    fullName: 'Nguyễn Thị Thu Hà',
    email: 'hr.manager@fas.com',
    department: 'Phòng Nhân sự',
    role: 'HR_MANAGER',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-01-15T08:00:00+07:00',
  },
  {
    id: 3,
    employeeCode: 'NV-DPO-001',
    fullName: 'Trần Tuân Thủ DPO',
    email: 'dpo@fas.com',
    department: 'Ban Pháp Chế & DPO',
    role: 'DPO',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-02-01T08:00:00+07:00',
  },
  {
    id: 1042,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    email: 'dung.nv@fas.com',
    department: 'Phòng Kỹ thuật',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-03-01T08:30:00+07:00',
  },
  {
    id: 1043,
    employeeCode: 'NV-1043',
    fullName: 'Lê Thị Mai',
    email: 'mai.lt@fas.com',
    department: 'Phòng Kế toán',
    role: 'EMPLOYEE',
    status: 'PENDING_CONSENT',
    hasBiometric: false,
    hasPin: false,
    createdAt: '2026-09-01T09:00:00+07:00',
  },
  {
    id: 1044,
    employeeCode: 'NV-1044',
    fullName: 'Phạm Văn Cường',
    email: 'cuong.pv@fas.com',
    department: 'Phòng Kinh doanh',
    role: 'EMPLOYEE',
    status: 'TERMINATED',
    hasBiometric: false,
    hasPin: false,
    createdAt: '2026-04-10T08:00:00+07:00',
  },
]

const initialKiosks: KioskItemResponse[] = [
  {
    id: 1,
    kioskId: 'KIOSK-HN-01',
    name: 'Trạm Kiosk Sảnh Chính Tầng 1',
    location: 'Tòa nhà văn phòng Hà Nội - Sảnh A',
    status: 'ONLINE',
    lastPingAt: new Date(Date.now() - 60000).toISOString(),
    ipAddress: '192.168.1.101',
    appVersion: 'v2.0.4',
    isActive: true,
    isOnline: true,
  },
  {
    id: 2,
    kioskId: 'KIOSK-HN-02',
    name: 'Trạm Kiosk Cổng Sau Kho Vận',
    location: 'Khu vực Kho Vận Tầng B1',
    status: 'WARNING',
    lastPingAt: new Date(Date.now() - 600000).toISOString(),
    ipAddress: '192.168.1.102',
    appVersion: 'v2.0.3',
    isActive: true,
    isOnline: false,
  },
  {
    id: 3,
    kioskId: 'KIOSK-HCM-01',
    name: 'Trạm Kiosk Chi nhánh HCM',
    location: 'Văn phòng Quận 1 - Tầng 5',
    status: 'OFFLINE',
    lastPingAt: new Date(Date.now() - 86400000).toISOString(),
    ipAddress: '192.168.10.50',
    appVersion: 'v2.0.2',
    isActive: false,
    isOnline: false,
  },
]

const initialShifts: ShiftItem[] = [
  {
    id: 1,
    shiftCode: 'CA_HANH_CHINH',
    name: 'Ca Hành Chính',
    shiftName: 'Ca Hành Chính',
    startTime: '08:00',
    endTime: '17:30',
    gracePeriodMinutes: 15,
    isActive: true,
    createdAt: '2026-01-01T00:00:00+07:00',
  },
  {
    id: 2,
    shiftCode: 'CA_SANG',
    name: 'Ca Sáng',
    shiftName: 'Ca Sáng',
    startTime: '06:00',
    endTime: '14:30',
    gracePeriodMinutes: 10,
    isActive: true,
    createdAt: '2026-01-01T00:00:00+07:00',
  },
  {
    id: 3,
    shiftCode: 'CA_CHIEU',
    name: 'Ca Chiều',
    shiftName: 'Ca Chiều',
    startTime: '14:00',
    endTime: '22:30',
    gracePeriodMinutes: 10,
    isActive: true,
    createdAt: '2026-01-01T00:00:00+07:00',
  },
  {
    id: 4,
    shiftCode: 'CA_DEM',
    name: 'Ca Đêm (+1 ngày)',
    shiftName: 'Ca Đêm (+1 ngày)',
    startTime: '22:00',
    endTime: '06:30',
    gracePeriodMinutes: 15,
    isActive: false,
    createdAt: '2026-02-01T00:00:00+07:00',
  },
]

const initialEmployeeShifts: EmployeeShiftAssignment[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    shiftId: 1,
    shiftCode: 'CA_HANH_CHINH',
    shiftName: 'Ca Hành Chính',
    effectiveStartDate: '2026-01-01',
    effectiveEndDate: '2026-12-31',
    createdAt: '2026-01-01T08:00:00+07:00',
  },
  {
    id: 2,
    employeeId: 1043,
    employeeCode: 'NV-1043',
    fullName: 'Lê Thị Mai',
    shiftId: 1,
    shiftCode: 'CA_HANH_CHINH',
    shiftName: 'Ca Hành Chính',
    effectiveStartDate: '2026-01-01',
    effectiveEndDate: '2026-12-31',
    createdAt: '2026-01-01T08:00:00+07:00',
  },
]

const initialAttendanceRecords: AttendanceRecord[] = [
  {
    recordId: 1001,
    employeeId: 1042,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    department: 'Phòng Kỹ thuật',
    punchTimestamp: '2026-10-24T08:12:30+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KIOSK-HN-01',
  },
  {
    recordId: 1002,
    employeeId: 1043,
    employeeCode: 'NV-1043',
    fullName: 'Lê Thị Mai',
    department: 'Phòng Kế toán',
    punchTimestamp: '2026-10-24T08:25:10+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'LATE',
    lateMinutes: 10,
    kioskId: 'KIOSK-HN-02',
  },
  {
    recordId: 1003,
    employeeId: 2,
    employeeCode: 'NV-HR-001',
    fullName: 'Nguyễn Thị Thu Hà',
    department: 'Phòng Nhân sự',
    punchTimestamp: '2026-10-24T07:55:00+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_PIN',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KIOSK-HN-01',
  },
  {
    recordId: 1004,
    employeeId: 1,
    employeeCode: 'NV-ADM-001',
    fullName: 'Quản Trị Hệ Thống',
    department: 'Ban Giám Đốc',
    punchTimestamp: '2026-10-24T08:05:40+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KIOSK-HN-01',
  },
]

const initialExcuseRequests: ExcuseRequestItem[] = [
  {
    id: 1,
    userId: 1043,
    employeeCode: 'NV-1043',
    fullName: 'Lê Thị Mai',
    attendanceLogId: 1002,
    originalPunchTimestamp: '2026-10-24T08:25:10+07:00',
    requestedPunchTimestamp: '2026-10-24T08:15:00+07:00',
    reason: 'Trục trặc kỹ thuật đường truyền mạng tại cổng Kiosk khiến thiết bị nhận diện chậm.',
    status: 'PENDING',
    decidedById: null,
    decidedByName: null,
    decidedAt: null,
    rejectionReason: null,
    createdAt: '2026-10-24T08:45:00+07:00',
    updatedAt: '2026-10-24T08:45:00+07:00',
  },
  {
    id: 2,
    userId: 1042,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    attendanceLogId: 999,
    originalPunchTimestamp: '2026-10-23T08:35:00+07:00',
    requestedPunchTimestamp: '2026-10-23T08:00:00+07:00',
    reason: 'Được phân công xử lý sự cố khẩn cấp máy chủ chi nhánh sáng sớm.',
    status: 'APPROVED',
    decidedById: 2,
    decidedByName: 'Nguyễn Thị Thu Hà',
    decidedAt: '2026-10-23T11:00:00+07:00',
    rejectionReason: null,
    createdAt: '2026-10-23T09:00:00+07:00',
    updatedAt: '2026-10-23T11:00:00+07:00',
  },
]

const initialPayrollPeriods: PayrollPeriodResponse[] = [
  {
    id: 1,
    periodYear: 2026,
    periodMonth: 10,
    status: 'OPEN',
    lockedById: null,
    lockedByName: null,
    lockedAt: null,
    unlockedById: null,
    unlockedByName: null,
    unlockedAt: null,
    unlockReason: null,
    createdAt: '2026-10-01T00:00:00+07:00',
  },
  {
    id: 2,
    periodYear: 2026,
    periodMonth: 9,
    status: 'LOCKED',
    lockedById: 1,
    lockedByName: 'Quản Trị Hệ Thống',
    lockedAt: '2026-10-05T17:00:00+07:00',
    unlockedById: null,
    unlockedByName: null,
    unlockedAt: null,
    unlockReason: null,
    createdAt: '2026-09-01T00:00:00+07:00',
  },
  {
    id: 3,
    periodYear: 2026,
    periodMonth: 8,
    status: 'LOCKED',
    lockedById: 1,
    lockedByName: 'Quản Trị Hệ Thống',
    lockedAt: '2026-09-05T17:00:00+07:00',
    unlockedById: null,
    unlockedByName: null,
    unlockedAt: null,
    unlockReason: null,
    createdAt: '2026-08-01T00:00:00+07:00',
  },
]

const initialAuditLogs: AuditLogItem[] = [
  {
    id: 1,
    action: 'KIOSK_REGISTERED',
    actorId: 1,
    actorEmail: 'admin@fas.com',
    targetResource: 'KIOSK-HN-01',
    oldValues: null,
    newValues: { name: 'Trạm Kiosk Sảnh Chính Tầng 1', location: 'Tòa nhà Hà Nội' },
    ipAddress: '192.168.1.50',
    createdAt: '2026-10-24T08:00:00+07:00',
  },
  {
    id: 2,
    action: 'CONSENT_SIGNED',
    actorId: 1042,
    actorEmail: 'dung.nv@fas.com',
    targetResource: 'EMPLOYEE_1042',
    oldValues: { hasBiometric: false },
    newValues: { hasBiometric: true, version: '2.0' },
    ipAddress: '192.168.1.100',
    createdAt: '2026-10-24T08:10:00+07:00',
  },
  {
    id: 3,
    action: 'ATTENDANCE_ADJUSTED',
    actorId: 2,
    actorEmail: 'hr.manager@fas.com',
    targetResource: 'ATTENDANCE_1002',
    oldValues: { status: 'LATE', lateMinutes: 10 },
    newValues: { status: 'ON_TIME', lateMinutes: 0 },
    ipAddress: '192.168.1.55',
    createdAt: '2026-10-24T08:30:00+07:00',
  },
]

const initialDataSubjectRequests: DataSubjectRequestItem[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    requestType: 'ACCESS',
    detail: 'Yêu cầu trích xuất toàn bộ dữ liệu điểm danh tháng 09/2026 theo Nghị định 356.',
    details: 'Yêu cầu trích xuất toàn bộ dữ liệu điểm danh tháng 09/2026 theo Nghị định 356.',
    status: 'FULFILLED',
    submittedAt: '2026-10-01T08:30:00+07:00',
    createdAt: '2026-10-01T08:30:00+07:00',
    handledAt: '2026-10-02T14:15:00+07:00',
    handledBy: 'Trần Tuân Thủ DPO',
    adminNote: 'Đã gửi file trích xuất dữ liệu qua email cá nhân.',
  },
  {
    id: 2,
    employeeId: 1042,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    requestType: 'CORRECTION',
    detail: 'Cập nhật lại số điện thoại liên hệ khẩn cấp.',
    details: 'Cập nhật lại số điện thoại liên hệ khẩn cấp.',
    status: 'IN_PROGRESS',
    submittedAt: '2026-10-10T10:00:00+07:00',
    createdAt: '2026-10-10T10:00:00+07:00',
    handledAt: null,
    handledBy: null,
    adminNote: 'Đang xác minh giấy tờ xác thực.',
  },
]

const initialNotifications: NotificationResponse[] = [
  {
    id: 101,
    userId: 1042,
    eventType: 'ATTENDANCE_PUNCH',
    title: 'Điểm danh thành công',
    body: 'Bạn đã hoàn thành chấm công lúc 08:12:30 tại Trạm Kiosk Sảnh Chính Tầng 1.',
    readAt: null,
    createdAt: '2026-10-24T08:12:30+07:00',
  },
  {
    id: 102,
    userId: 1042,
    eventType: 'SHIFT_ASSIGNED',
    title: 'Phân ca làm việc mới',
    body: 'Bạn đã được phân công Ca Hành Chính từ ngày 01/01/2026 đến 31/12/2026.',
    readAt: null,
    createdAt: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 103,
    userId: 1042,
    eventType: 'CONSENT_SIGNED',
    title: 'Cam kết bảo vệ dữ liệu',
    body: 'Bản cam kết Informed Consent phiên bản v2.0 đã được ký và kích hoạt an toàn.',
    readAt: '2026-10-12T09:15:00+07:00',
    createdAt: '2026-10-12T09:10:00+07:00',
  },
]

// -----------------------------------------------------------------------------
// KHỞI TẠO DEV MOCK SERVER
// -----------------------------------------------------------------------------

export function initDevMockServer(options: { delayResponse?: number } = { delayResponse: 80 }): MockAdapter {
  const mock = new MockAdapter(apiClient, {
    delayResponse: options.delayResponse ?? 80,
    onNoMatch: 'passthrough',
  })

  // Mutable dev state
  const employees: EmployeeItem[] = [...initialEmployees]
  const kiosks: KioskItemResponse[] = [...initialKiosks]
  const shifts: ShiftItem[] = [...initialShifts]
  const employeeShifts: EmployeeShiftAssignment[] = [...initialEmployeeShifts]
  const attendanceRecords: AttendanceRecord[] = [...initialAttendanceRecords]
  const excuseRequests: ExcuseRequestItem[] = [...initialExcuseRequests]
  const payrollPeriods: PayrollPeriodResponse[] = [...initialPayrollPeriods]
  const auditLogs: AuditLogItem[] = [...initialAuditLogs]
  const dataRequests: DataSubjectRequestItem[] = [...initialDataSubjectRequests]
  const notifications: NotificationResponse[] = [...initialNotifications]

  // 1. AUTHENTICATION & SESSIONS
  mock.onPost(/(?:^|\/api\/v1)\/auth\/login/).reply((config) => {
    try {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
      const email = String(body?.email || body?.username || '').toLowerCase()
      const password = String(body?.password || '')

      if (password === 'WrongPassword' || password === 'invalid') {
        return [
          401,
          {
            type: 'https://problem.fas.enterprise/errors/unauthorized',
            title: 'Unauthorized',
            status: 401,
            detail: 'Tài khoản hoặc mật khẩu không chính xác',
            instance: '/api/v1/auth/login',
          },
        ]
      }

      let user: UserProfile = employees.find((e) => e.email.toLowerCase() === email) || employees[3]

      if (email.includes('admin') || email.includes('quan-tri')) {
        user = employees[0]
      } else if (email.includes('hr') || email.includes('nhan-su')) {
        user = employees[1]
      } else if (email.includes('dpo') || email.includes('phap-che')) {
        user = employees[2]
      }

      const loginData: LoginResponse = {
        accessToken: `dev-mock-jwt-${user.role.toLowerCase()}-${Date.now()}`,
        refreshToken: `dev-mock-refresh-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user,
      }

      return [200, makeResponse(loginData, 'Đăng nhập thành công')]
    } catch {
      return [400, { title: 'Bad Request', detail: 'Payload không hợp lệ' }]
    }
  })

  mock.onPost(/(?:^|\/api\/v1)\/auth\/refresh/).reply((config) => {
    try {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
      if (!body?.refreshToken || body?.refreshToken === 'expired-token') {
        return [
          401,
          {
            type: 'https://problem.fas.enterprise/errors/token-expired',
            title: 'Unauthorized',
            status: 401,
            detail: 'Refresh token đã hết hạn',
          },
        ]
      }
      const tokenData: TokenResponse = {
        accessToken: `dev-mock-refreshed-jwt-${Date.now()}`,
        refreshToken: `dev-mock-refreshed-uuid-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
      }
      return [200, makeResponse(tokenData, 'Làm mới token thành công')]
    } catch {
      return [401, { title: 'Unauthorized', detail: 'Yêu cầu làm mới không hợp lệ' }]
    }
  })

  mock.onPost(/(?:^|\/api\/v1)\/auth\/logout/).reply(200, makeResponse(null, 'Đăng xuất thành công'))

  mock.onPost(/(?:^|\/api\/v1)\/auth\/change-password/).reply(() => {
    const res: ChangePasswordResponse = {
      message: 'Đổi mật khẩu thành công. Các phiên làm việc cũ đã được thu hồi.',
      sessionsRevoked: true,
    }
    return [200, makeResponse(res)]
  })

  // 2. ADMIN ATTENDANCE & STATS
  mock.onGet(/(?:^|\/api\/v1)\/admin\/attendance\/stats/).reply(() => {
    const stats: AttendanceStats = {
      presentCount: attendanceRecords.length,
      onTimeCount: attendanceRecords.filter((r) => r.status === 'ON_TIME').length,
      lateCount: attendanceRecords.filter((r) => r.status === 'LATE').length,
      totalEmployees: employees.length,
      absentCount: Math.max(0, employees.length - attendanceRecords.length),
    }
    return [200, makeResponse(stats)]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/attendance(?:\?.*)?$/).reply((config) => {
    const params = config.params || {}
    let list = [...attendanceRecords]

    if (params.status) {
      list = list.filter((r) => r.status === params.status)
    }
    if (params.department) {
      list = list.filter((r) => r.department === params.department)
    }
    if (params.keyword) {
      const kw = String(params.keyword).toLowerCase()
      list = list.filter((r) => r.fullName.toLowerCase().includes(kw) || r.employeeCode.toLowerCase().includes(kw))
    }

    const page = Number(params.page || 0)
    const size = Number(params.size || 20)
    const paginated = list.slice(page * size, (page + 1) * size)
    const pageRes = makePageResponse(paginated, page, size, list.length)
    return [200, makeResponse(pageRes)]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/admin\/attendance\/\d+/).reply((config) => {
    const match = config.url?.match(/\/admin\/attendance\/(\d+)/)
    const id = match ? Number(match[1]) : 0
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const recIndex = attendanceRecords.findIndex((r) => r.recordId === id)
    if (recIndex >= 0) {
      const updated = {
        ...attendanceRecords[recIndex],
        ...body,
      }
      attendanceRecords[recIndex] = updated
      return [200, makeResponse(updated, 'Điều chỉnh điểm danh thành công')]
    }
    return [200, makeResponse(attendanceRecords[0], 'Điều chỉnh điểm danh thành công')]
  })

  // 3. ADMIN KIOSKS
  mock.onGet(/(?:^|\/api\/v1)\/admin\/kiosks\/[^/]+\/health/).reply((config) => {
    const match = config.url?.match(/\/admin\/kiosks\/([^/]+)\/health/)
    const kioskId = match ? match[1] : 'KIOSK-HN-01'
    const health: KioskHealthResponse = {
      kioskId,
      status: 'ONLINE',
      isStale: false,
      lastPingAt: new Date().toISOString(),
    }
    return [200, makeResponse(health)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/kiosks\/[^/]+\/rotate-secret/).reply((config) => {
    const match = config.url?.match(/\/admin\/kiosks\/([^/]+)\/rotate-secret/)
    const kioskId = match ? match[1] : '1'
    const k = kiosks.find((item) => String(item.id) === kioskId || item.kioskId === kioskId) || kiosks[0]
    return [
      200,
      makeResponse({
        ...k,
        newSecretToken: `kiosk-rotated-secret-${Date.now()}`,
      }),
    ]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/admin\/kiosks\/[^/]+/).reply((config) => {
    const match = config.url?.match(/\/admin\/kiosks\/([^/]+)/)
    const kioskId = match ? match[1] : '1'
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const index = kiosks.findIndex((k) => String(k.id) === kioskId || k.kioskId === kioskId)
    if (index >= 0) {
      kiosks[index] = { ...kiosks[index], ...body }
      return [200, makeResponse(kiosks[index])]
    }
    return [200, makeResponse(kiosks[0])]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/kiosks(?:\?.*)?$/).reply(() => {
    return [200, makeResponse(kiosks)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/kiosks$/).reply((config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const newKiosk: KioskItemResponse = {
      id: kiosks.length + 1,
      kioskId: body.id || body.kioskId || `KIOSK-DEV-${kiosks.length + 1}`,
      name: body.name || body.locationName || 'Trạm Kiosk Mới',
      location: body.location || body.locationName || 'Trụ sở chính',
      status: 'ONLINE',
      lastPingAt: new Date().toISOString(),
      ipAddress: '192.168.1.199',
      appVersion: 'v2.0.4',
      isActive: true,
      isOnline: true,
    }
    kiosks.push(newKiosk)
    const res: RegisterKioskResponse = {
      kiosk: newKiosk,
      secretToken: `kiosk-token-uuid-${Date.now()}`,
    }
    return [201, makeResponse(res, 'Đăng ký trạm Kiosk thành công')]
  })

  // 4. ADMIN EMPLOYEES
  mock.onGet(/(?:^|\/api\/v1)\/admin\/employees\/\d+$/).reply((config) => {
    const match = config.url?.match(/\/admin\/employees\/(\d+)/)
    const id = match ? Number(match[1]) : 1
    const emp = employees.find((e) => e.id === id) || employees[0]
    return [200, makeResponse(emp)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/employees\/\d+\/credentials\/reset/).reply(() => {
    const res: ResetEmployeeCredentialsResponse = {
      temporaryPassword: `Fas@Temp${Math.floor(1000 + Math.random() * 9000)}`,
      message: 'Mật khẩu tạm thời đã được tạo mới thành công.',
    }
    return [200, makeResponse(res)]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/admin\/employees\/\d+\/status/).reply((config) => {
    const match = config.url?.match(/\/admin\/employees\/(\d+)\/status/)
    const id = match ? Number(match[1]) : 1
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const empIndex = employees.findIndex((e) => e.id === id)
    if (empIndex >= 0) {
      employees[empIndex] = { ...employees[empIndex], status: body?.status || 'ACTIVE' }
      return [200, makeResponse(employees[empIndex])]
    }
    return [200, makeResponse(employees[0])]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/admin\/employees\/\d+$/).reply((config) => {
    const match = config.url?.match(/\/admin\/employees\/(\d+)/)
    const id = match ? Number(match[1]) : 1
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const empIndex = employees.findIndex((e) => e.id === id)
    if (empIndex >= 0) {
      employees[empIndex] = { ...employees[empIndex], ...body }
      return [200, makeResponse(employees[empIndex])]
    }
    return [200, makeResponse(employees[0])]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/employees(?:\?.*)?$/).reply((config) => {
    const params = config.params || {}
    let list = [...employees]

    if (params.status) {
      list = list.filter((e) => e.status === params.status)
    }
    if (params.role) {
      list = list.filter((e) => e.role === params.role)
    }
    if (params.department) {
      list = list.filter((e) => e.department === params.department)
    }
    if (params.keyword) {
      const kw = String(params.keyword).toLowerCase()
      list = list.filter((e) => e.fullName.toLowerCase().includes(kw) || e.employeeCode.toLowerCase().includes(kw))
    }

    const page = Number(params.page || 0)
    const size = Number(params.size || 20)
    const paginated = list.slice(page * size, (page + 1) * size)
    const pageRes = makePageResponse(paginated, page, size, list.length)
    return [200, makeResponse(pageRes)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/employees$/).reply((config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const newEmp: EmployeeItem = {
      id: employees.length + 1,
      employeeCode: body.employeeCode || `NV-${1050 + employees.length}`,
      fullName: body.fullName || 'Nhân viên mới',
      email: body.email || 'nv.new@fas.com',
      department: body.department || 'Phòng Kỹ thuật',
      role: body.role || 'EMPLOYEE',
      status: 'PENDING_CONSENT',
      hasBiometric: false,
      hasPin: false,
      createdAt: new Date().toISOString(),
    }
    employees.push(newEmp)
    const res: CreateEmployeeResponse = {
      employee: newEmp,
      temporaryPassword: `Fas@Temp${Math.floor(1000 + Math.random() * 9000)}`,
    }
    return [201, makeResponse(res, 'Tạo hồ sơ nhân sự thành công')]
  })

  // 5. ADMIN SHIFTS & ASSIGNMENTS
  mock.onPost(/(?:^|\/api\/v1)\/admin\/shifts\/\d+\/activate/).reply((config) => {
    const match = config.url?.match(/\/admin\/shifts\/(\d+)\/activate/)
    const id = match ? Number(match[1]) : 1
    const idx = shifts.findIndex((s) => s.id === id)
    if (idx >= 0) shifts[idx] = { ...shifts[idx], isActive: true }
    return [200, makeResponse(null, 'Kích hoạt ca làm việc thành công')]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/shifts\/\d+\/deactivate/).reply((config) => {
    const match = config.url?.match(/\/admin\/shifts\/(\d+)\/deactivate/)
    const id = match ? Number(match[1]) : 1
    const idx = shifts.findIndex((s) => s.id === id)
    if (idx >= 0) shifts[idx] = { ...shifts[idx], isActive: false }
    return [200, makeResponse(null, 'Tạm dừng ca làm việc thành công')]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/admin\/shifts\/\d+$/).reply((config) => {
    const match = config.url?.match(/\/admin\/shifts\/(\d+)/)
    const id = match ? Number(match[1]) : 1
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const idx = shifts.findIndex((s) => s.id === id)
    if (idx >= 0) {
      shifts[idx] = { ...shifts[idx], ...body, name: body.shiftName || body.name || shifts[idx].name }
      return [200, makeResponse(shifts[idx])]
    }
    return [200, makeResponse(shifts[0])]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/shifts(?:\?.*)?$/).reply((config) => {
    const activeOnly = config.params?.activeOnly === true || config.params?.activeOnly === 'true'
    const list = activeOnly ? shifts.filter((s) => s.isActive) : shifts
    return [200, makeResponse(list)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/shifts$/).reply((config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const newShift: ShiftItem = {
      id: shifts.length + 1,
      shiftCode: body.shiftCode || `CA_CUSTOM_${shifts.length + 1}`,
      name: body.shiftName || body.name || 'Ca Mới',
      shiftName: body.shiftName || body.name || 'Ca Mới',
      startTime: body.startTime || '08:00',
      endTime: body.endTime || '17:30',
      gracePeriodMinutes: body.gracePeriodMinutes ?? 15,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    shifts.push(newShift)
    return [201, makeResponse(newShift, 'Tạo ca làm việc thành công')]
  })

  mock.onDelete(/(?:^|\/api\/v1)\/admin\/employee-shifts\/\d+/).reply((config) => {
    const match = config.url?.match(/\/admin\/employee-shifts\/(\d+)/)
    const id = match ? Number(match[1]) : 1
    const idx = employeeShifts.findIndex((es) => es.id === id)
    if (idx >= 0) employeeShifts.splice(idx, 1)
    return [200, makeResponse(null, 'Hủy phân ca thành công')]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/employee-shifts\/batch/).reply((config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const empIds: number[] = body.employeeIds || []
    const shift = shifts.find((s) => s.id === body.shiftId) || shifts[0]
    const createdAssignments: EmployeeShiftAssignment[] = []

    for (const eid of empIds) {
      const emp = employees.find((e) => e.id === eid)
      const assignment: EmployeeShiftAssignment = {
        id: employeeShifts.length + 1,
        employeeId: eid,
        employeeCode: emp?.employeeCode || `NV-${eid}`,
        fullName: emp?.fullName || `Nhân viên #${eid}`,
        shiftId: shift.id,
        shiftCode: shift.shiftCode,
        shiftName: shift.name,
        effectiveStartDate: body.effectiveStartDate || '2026-01-01',
        effectiveEndDate: body.effectiveEndDate || '2026-12-31',
        createdAt: new Date().toISOString(),
      }
      employeeShifts.push(assignment)
      createdAssignments.push(assignment)
    }

    const res: BatchAssignResult = {
      total: empIds.length,
      successCount: empIds.length,
      failedCount: 0,
      failures: [],
      assignments: createdAssignments,
    }
    return [200, makeResponse(res, 'Phân ca hàng loạt thành công')]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/employee-shifts$/).reply((config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const eid = Number(body.employeeId || body.userId || 1042)
    const emp = employees.find((e) => e.id === eid)
    const shift = shifts.find((s) => s.id === body.shiftId) || shifts[0]
    const assignment: EmployeeShiftAssignment = {
      id: employeeShifts.length + 1,
      employeeId: eid,
      employeeCode: emp?.employeeCode || `NV-${eid}`,
      fullName: emp?.fullName || `Nhân viên #${eid}`,
      shiftId: shift.id,
      shiftCode: shift.shiftCode,
      shiftName: shift.name,
      effectiveStartDate: body.effectiveStartDate || '2026-01-01',
      effectiveEndDate: body.effectiveEndDate || '2026-12-31',
      createdAt: new Date().toISOString(),
    }
    employeeShifts.push(assignment)
    return [201, makeResponse(assignment, 'Phân ca thành công')]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/employee-shifts(?:\?.*)?$/).reply((config) => {
    let list = [...employeeShifts]
    if (config.params?.employeeId) {
      list = list.filter((es) => es.employeeId === Number(config.params.employeeId))
    }
    if (config.params?.shiftId) {
      list = list.filter((es) => es.shiftId === Number(config.params.shiftId))
    }
    return [200, makeResponse(list)]
  })

  // 6. ADMIN & EMPLOYEE EXCUSE REQUESTS
  mock.onPost(/(?:^|\/api\/v1)\/admin\/excuse-requests\/\d+\/approve/).reply((config) => {
    const match = config.url?.match(/\/admin\/excuse-requests\/(\d+)\/approve/)
    const id = match ? Number(match[1]) : 1
    const idx = excuseRequests.findIndex((r) => r.id === id)
    if (idx >= 0) {
      excuseRequests[idx] = {
        ...excuseRequests[idx],
        status: 'APPROVED',
        decidedById: 2,
        decidedByName: 'Nguyễn Thị Thu Hà',
        decidedAt: new Date().toISOString(),
      }
      return [200, makeResponse(excuseRequests[idx], 'Duyệt đơn giải trình thành công')]
    }
    return [200, makeResponse(excuseRequests[0])]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/excuse-requests\/\d+\/reject/).reply((config) => {
    const match = config.url?.match(/\/admin\/excuse-requests\/(\d+)\/reject/)
    const id = match ? Number(match[1]) : 1
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const idx = excuseRequests.findIndex((r) => r.id === id)
    if (idx >= 0) {
      excuseRequests[idx] = {
        ...excuseRequests[idx],
        status: 'REJECTED',
        decidedById: 2,
        decidedByName: 'Nguyễn Thị Thu Hà',
        decidedAt: new Date().toISOString(),
        rejectionReason: body?.rejectionReason || 'Không đủ căn cứ chấp thuận',
      }
      return [200, makeResponse(excuseRequests[idx], 'Từ chối đơn giải trình thành công')]
    }
    return [200, makeResponse(excuseRequests[0])]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/admin\/excuse-requests\/\d+$/).reply((config) => {
    const match = config.url?.match(/\/admin\/excuse-requests\/(\d+)/)
    const id = match ? Number(match[1]) : 1
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const idx = excuseRequests.findIndex((r) => r.id === id)
    if (idx >= 0) {
      const isApproved = body?.status === 'APPROVED'
      excuseRequests[idx] = {
        ...excuseRequests[idx],
        status: isApproved ? 'APPROVED' : 'REJECTED',
        decidedById: 2,
        decidedByName: 'Nguyễn Thị Thu Hà',
        decidedAt: new Date().toISOString(),
        rejectionReason: !isApproved ? (body?.rejectionReason || 'Không chấp thuận') : null,
      }
      return [200, makeResponse(excuseRequests[idx])]
    }
    return [200, makeResponse(excuseRequests[0])]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/excuse-requests\/\d+$/).reply((config) => {
    const match = config.url?.match(/\/admin\/excuse-requests\/(\d+)/)
    const id = match ? Number(match[1]) : 1
    const req = excuseRequests.find((r) => r.id === id) || excuseRequests[0]
    return [200, makeResponse(req)]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/excuse-requests(?:\?.*)?$/).reply((config) => {
    let list = [...excuseRequests]
    if (config.params?.status) {
      list = list.filter((r) => r.status === config.params.status)
    }
    const page = Number(config.params?.page || 0)
    const size = Number(config.params?.size || 10)
    const pageRes = makePageResponse(list.slice(page * size, (page + 1) * size), page, size, list.length)
    return [200, makeResponse(pageRes)]
  })

  // 7. ADMIN PAYROLL PERIODS
  mock.onPost(/(?:^|\/api\/v1)\/admin\/payroll-periods\/[^/]+\/lock/).reply((config) => {
    const match = config.url?.match(/\/admin\/payroll-periods\/([^/]+)\/lock/)
    const period = match ? match[1] : '2026-10'
    const parts = period.split('-')
    const year = Number(parts[0]) || 2026
    const month = Number(parts[1]) || 10
    const idx = payrollPeriods.findIndex((p) => p.periodYear === year && p.periodMonth === month)
    if (idx >= 0) {
      payrollPeriods[idx] = {
        ...payrollPeriods[idx],
        status: 'LOCKED',
        lockedById: 1,
        lockedByName: 'Quản Trị Hệ Thống',
        lockedAt: new Date().toISOString(),
      }
      return [200, makeResponse(payrollPeriods[idx], 'Chốt kỳ công thành công')]
    }
    return [200, makeResponse(payrollPeriods[0])]
  })

  mock.onPost(/(?:^|\/api\/v1)\/admin\/payroll-periods\/[^/]+\/unlock/).reply((config) => {
    const match = config.url?.match(/\/admin\/payroll-periods\/([^/]+)\/unlock/)
    const period = match ? match[1] : '2026-09'
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const parts = period.split('-')
    const year = Number(parts[0]) || 2026
    const month = Number(parts[1]) || 9
    const idx = payrollPeriods.findIndex((p) => p.periodYear === year && p.periodMonth === month)
    if (idx >= 0) {
      payrollPeriods[idx] = {
        ...payrollPeriods[idx],
        status: 'OPEN',
        unlockedById: 1,
        unlockedByName: 'Quản Trị Hệ Thống',
        unlockedAt: new Date().toISOString(),
        unlockReason: body?.reason || 'Mở khóa điều chỉnh bổ sung',
      }
      return [200, makeResponse(payrollPeriods[idx], 'Mở lại kỳ công thành công')]
    }
    return [200, makeResponse(payrollPeriods[0])]
  })

  mock.onGet(/(?:^|\/api\/v1)\/admin\/payroll-periods(?:\?.*)?$/).reply(() => {
    return [200, makeResponse(payrollPeriods)]
  })

  // 8. AUDIT LOGS & DPO COMPLIANCE
  mock.onGet(/(?:^|\/api\/v1)\/admin\/audit-logs(?:\?.*)?$/).reply((config) => {
    const page = Number(config.params?.page || 0)
    const size = Number(config.params?.size || 10)
    const pageRes = makePageResponse(auditLogs.slice(page * size, (page + 1) * size), page, size, auditLogs.length)
    return [200, makeResponse(pageRes)]
  })

  mock.onGet(/(?:^|\/api\/v1)\/dpo\/consents(?:\?.*)?$/).reply(() => {
    const list: DpoConsentAuditItem[] = [
      {
        id: 1,
        employeeId: 1042,
        employeeCode: 'NV-1042',
        fullName: 'Ngô Văn Dũng',
        agreedAt: '2026-10-13T09:15:00+07:00',
        ipAddress: '192.168.1.100',
        consentVersion: 'v2.0',
        status: 'ACTIVE',
      },
      {
        id: 2,
        employeeId: 1043,
        employeeCode: 'NV-1043',
        fullName: 'Lê Thị Mai',
        agreedAt: '2026-10-14T10:00:00+07:00',
        ipAddress: '192.168.1.105',
        consentVersion: 'v2.0',
        status: 'ACTIVE',
      },
    ]
    return [200, makeResponse(list)]
  })

  mock.onGet(/(?:^|\/api\/v1)\/dpo\/retention-schedule(?:\?.*)?$/).reply(() => {
    const list: RetentionScheduleItem[] = [
      {
        id: 1,
        employeeId: 1044,
        employeeCode: 'NV-1044',
        fullName: 'Phạm Văn Cường',
        resignedAt: '2026-10-10T17:00:00+07:00',
        scheduledDestructionDate: '2026-10-30T17:00:00+07:00',
        status: 'SCHEDULED',
      },
    ]
    return [200, makeResponse(list)]
  })

  mock.onGet(/(?:^|\/api\/v1)\/dpo\/data-requests(?:\?.*)?$/).reply(() => {
    return [200, makeResponse(dataRequests)]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/dpo\/data-requests\/\d+$/).reply((config) => {
    const match = config.url?.match(/\/dpo\/data-requests\/(\d+)/)
    const id = match ? Number(match[1]) : 1
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const idx = dataRequests.findIndex((r) => r.id === id)
    if (idx >= 0) {
      dataRequests[idx] = {
        ...dataRequests[idx],
        status: body?.status || 'FULFILLED',
        adminNote: body?.adminNote || body?.response || dataRequests[idx].adminNote,
        handledAt: new Date().toISOString(),
        handledBy: 'Trần Tuân Thủ DPO',
      }
      return [200, makeResponse(dataRequests[idx])]
    }
    return [200, makeResponse(dataRequests[0])]
  })

  // 9. EMPLOYEE WORKFLOWS
  mock.onGet(/(?:^|\/api\/v1)\/employee\/attendance\/logs(?:\?.*)?$/).reply((config) => {
    const page = Number(config.params?.page || 0)
    const size = Number(config.params?.size || 10)
    const logs = attendanceRecords.filter((r) => r.employeeId === 1042)
    const pageRes = makePageResponse(logs.slice(page * size, (page + 1) * size), page, size, logs.length)
    return [200, makeResponse(pageRes)]
  })

  mock.onGet(/(?:^|\/api\/v1)\/employee\/attendance(?:\?.*)?$/).reply((config) => {
    const month = Number(config.params?.month || 10)
    const year = Number(config.params?.year || 2026)

    const days: PersonalAttendanceDayRecord[] = []
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

    for (let d = 1; d <= 28; d++) {
      const dayStr = String(d).padStart(2, '0')
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${dayStr}`
      const dateObj = new Date(year, month - 1, d)
      const dayOfWeek = dayNames[dateObj.getDay()]
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

      if (isWeekend) {
        days.push({
          date: dateStr,
          dayOfWeek,
          checkIn: null,
          checkOut: null,
          status: 'REST_DAY',
          lateMinutes: 0,
          workingHours: 0,
          shiftCode: 'CA_HANH_CHINH',
        })
      } else if (d === 15) {
        days.push({
          date: dateStr,
          dayOfWeek,
          checkIn: '08:25:00',
          checkOut: '17:35:00',
          status: 'LATE',
          lateMinutes: 10,
          workingHours: 8,
          shiftCode: 'CA_HANH_CHINH',
          verificationMethod: 'VERIFICATION_FACE',
          kioskId: 'KIOSK-HN-01',
          checkInLogId: 9811,
          checkOutLogId: 9812,
        })
      } else {
        days.push({
          date: dateStr,
          dayOfWeek,
          checkIn: '08:12:00',
          checkOut: '17:30:00',
          status: 'ON_TIME',
          lateMinutes: 0,
          workingHours: 8,
          shiftCode: 'CA_HANH_CHINH',
          verificationMethod: 'VERIFICATION_FACE',
          kioskId: 'KIOSK-HN-01',
          checkInLogId: 9801 + d,
          checkOutLogId: 9851 + d,
        })
      }
    }

    const res: PersonalAttendanceResponse = {
      month,
      year,
      totalWorkDays: 20,
      totalOnTimeDays: 19,
      totalLateDays: 1,
      records: days,
    }
    return [200, makeResponse(res)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/employee\/consent\/withdraw/).reply(() => {
    const res: WithdrawConsentResponse = {
      withdrawnAt: new Date().toISOString(),
      retentionDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      message: 'Rút cam kết thành công. Dữ liệu sinh trắc học sẽ được tiêu hủy trong vòng 7 ngày.',
    }
    return [200, makeResponse(res)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/employee\/consent$/).reply(() => {
    const otp = '839201'
    const res: ConsentResult = {
      otp,
      qrCodeData: `fas-otp:${otp}:1042`,
      qrCodeDataUrl:
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==',
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      kioskLocations: ['Trạm Kiosk Tầng 1 - Sảnh chính', 'Trạm Kiosk Tầng 2 - Khối Kỹ thuật'],
    }
    return [200, makeResponse(res, 'Ký cam kết Informed Consent thành công')]
  })

  mock.onGet(/(?:^|\/api\/v1)\/employee\/excuse-requests(?:\?.*)?$/).reply((config) => {
    const list = excuseRequests.filter((r) => r.userId === 1042)
    const page = Number(config.params?.page || 0)
    const size = Number(config.params?.size || 10)
    const pageRes = makePageResponse(list.slice(page * size, (page + 1) * size), page, size, list.length)
    return [200, makeResponse(pageRes)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/employee\/excuse-requests$/).reply((config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const newReq: ExcuseRequestItem = {
      id: excuseRequests.length + 1,
      userId: 1042,
      employeeCode: 'NV-1042',
      fullName: 'Ngô Văn Dũng',
      attendanceLogId: body.attendanceLogId || 1001,
      originalPunchTimestamp: new Date().toISOString(),
      requestedPunchTimestamp: body.requestedPunchTimestamp || new Date().toISOString(),
      reason: body.reason || 'Giải trình giờ công cá nhân',
      status: 'PENDING',
      decidedById: null,
      decidedByName: null,
      decidedAt: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    excuseRequests.push(newReq)
    return [201, makeResponse(newReq, 'Nộp đơn giải trình thành công')]
  })

  mock.onGet(/(?:^|\/api\/v1)\/employee\/data-requests(?:\?.*)?$/).reply(() => {
    return [200, makeResponse(dataRequests)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/employee\/data-requests$/).reply((config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const newReq: DataSubjectRequestItem = {
      id: dataRequests.length + 1,
      employeeId: 1042,
      employeeCode: 'NV-1042',
      fullName: 'Ngô Văn Dũng',
      requestType: body.requestType || 'ACCESS',
      detail: body.detail || body.details || 'Yêu cầu dữ liệu cá nhân',
      details: body.detail || body.details || 'Yêu cầu dữ liệu cá nhân',
      status: 'RECEIVED',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      handledAt: null,
      handledBy: null,
      adminNote: null,
    }
    dataRequests.push(newReq)
    return [201, makeResponse(newReq, 'Gửi yêu cầu dữ liệu cá nhân thành công')]
  })

  mock.onPost(/(?:^|\/api\/v1)\/employee\/pin\/reset/).reply(() => {
    const res: PinStatusResponse = {
      hasPin: true,
      message: 'Đặt lại mã PIN dự phòng thành công.',
    }
    return [200, makeResponse(res)]
  })

  mock.onPost(/(?:^|\/api\/v1)\/employee\/pin$/).reply(() => {
    const res: PinStatusResponse = {
      hasPin: true,
      message: 'Thiết lập mã PIN dự phòng thành công.',
    }
    return [200, makeResponse(res)]
  })

  // 10. NOTIFICATIONS
  mock.onPatch(/(?:^|\/api\/v1)\/notifications\/read-all/).reply(() => {
    notifications.forEach((item, idx) => {
      notifications[idx] = { ...item, readAt: new Date().toISOString() }
    })
    return [200, makeResponse(null, 'Đã đánh dấu tất cả thông báo là đã đọc')]
  })

  mock.onPost(/(?:^|\/api\/v1)\/notifications\/read-all/).reply(() => {
    notifications.forEach((item, idx) => {
      notifications[idx] = { ...item, readAt: new Date().toISOString() }
    })
    return [200, makeResponse(null, 'Đã đánh dấu tất cả thông báo là đã đọc')]
  })

  mock.onPatch(/(?:^|\/api\/v1)\/notifications\/\d+\/read/).reply((config) => {
    const match = config.url?.match(/\/notifications\/(\d+)\/read/)
    const id = match ? Number(match[1]) : 101
    const idx = notifications.findIndex((item) => item.id === id)
    if (idx >= 0) {
      notifications[idx] = { ...notifications[idx], readAt: new Date().toISOString() }
      return [200, makeResponse(notifications[idx])]
    }
    return [200, makeResponse(notifications[0])]
  })

  mock.onGet(/(?:^|\/api\/v1)\/notifications(?:\?.*)?$/).reply(() => {
    return [200, makeResponse(notifications)]
  })

  // 11. REPORTS EXPORT
  mock.onGet(/(?:^|\/api\/v1)\/admin\/reports\/export/).reply(() => {
    const dummyBlob = new Blob(['mock,timesheet,report\n1,2,3'], { type: 'text/csv' })
    return [200, dummyBlob]
  })

  // Log in browser dev tools for visibility
  if (typeof console !== 'undefined' && console.info) {
    console.info('[DevMockServer] FAS Web Portal dev mock server loaded with axios-mock-adapter.')
  }

  return mock
}
