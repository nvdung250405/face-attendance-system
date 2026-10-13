/**
 * Chuẩn Fixtures Phản Hồi Điểm Danh & STOMP Events (TASK-WEB-032, API-WEB-004, API-WEB-005, API-WEB-007).
 */

import type { ApiResponse, PaginatedResult, AttendanceRecord, MonthlyTimesheet, LiveAttendanceMessage } from '@/types'

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    recordId: 98231,
    employeeId: 1042,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    department: 'Phòng Kỹ thuật',
    punchTimestamp: '2026-10-13T08:29:45.120+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KIOSK-HN-01',
  },
  {
    recordId: 98230,
    employeeId: 1045,
    employeeCode: 'NV-1045',
    fullName: 'Lê Thị Thu',
    department: 'Phòng Kế toán',
    punchTimestamp: '2026-10-13T08:35:12.450+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_FACE',
    status: 'LATE',
    lateMinutes: 5,
    kioskId: 'KIOSK-HN-02',
  },
  {
    recordId: 98229,
    employeeId: 1012,
    employeeCode: 'NV-1012',
    fullName: 'Phạm Minh Hoàng',
    department: 'Phòng Kinh doanh',
    punchTimestamp: '2026-10-13T08:20:00.000+07:00',
    punchType: 'CHECK_IN',
    verificationMethod: 'VERIFICATION_PIN',
    status: 'ON_TIME',
    lateMinutes: 0,
    kioskId: 'KIOSK-HN-01',
  },
]

export const mockAdminAttendancePageResponse: ApiResponse<PaginatedResult<AttendanceRecord>> = {
  success: true,
  code: 'OK',
  message: 'Lấy dữ liệu điểm danh thành công',
  data: {
    content: mockAttendanceRecords,
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
  },
  timestamp: '2026-10-13T08:40:00.000+07:00',
}

export const mockEmployeeMonthlyTimesheet: ApiResponse<MonthlyTimesheet> = {
  success: true,
  code: 'OK',
  message: 'Tra cứu bảng công tháng thành công',
  data: {
    period: '2026-10',
    employeeId: 1042,
    totalWorkingDays: 22,
    presentDays: 12,
    lateDays: 1,
    absentDays: 0,
    excusePendingDays: 1,
    dailyRecords: [
      {
        date: '2026-10-13',
        dayOfWeek: 'Thứ Ba',
        checkIn: '08:29:45',
        checkOut: null,
        status: 'ON_TIME',
        workingHours: 4.5,
        shiftCode: 'CA_HANH_CHINH',
      },
      {
        date: '2026-10-12',
        dayOfWeek: 'Thứ Hai',
        checkIn: '08:25:10',
        checkOut: '17:35:00',
        status: 'ON_TIME',
        workingHours: 8.0,
        shiftCode: 'CA_HANH_CHINH',
      },
    ],
  },
  timestamp: '2026-10-13T08:45:00.000+07:00',
}

export const mockLiveAttendancePunchedEvent: LiveAttendanceMessage = {
  eventType: 'ATTENDANCE_PUNCHED',
  recordId: 98232,
  employeeId: 1048,
  employeeCode: 'NV-1048',
  fullName: 'Vũ Đức Đạt',
  department: 'Phòng Kỹ thuật',
  punchTimestamp: '2026-10-13T08:47:00.000+07:00',
  punchType: 'CHECK_IN',
  verificationMethod: 'VERIFICATION_FACE',
  status: 'LATE',
  lateMinutes: 17,
  kioskId: 'KIOSK-HN-01',
}
