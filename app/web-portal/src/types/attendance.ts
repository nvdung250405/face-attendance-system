/**
 * Hợp đồng dữ liệu Điểm danh & Thống kê Chấm công (DATA-WEB-004, API-WEB-004, API-WEB-005, API-WEB-007).
 */

export type VerificationMethod = 'VERIFICATION_FACE' | 'VERIFICATION_PIN'
export type PunchType = 'CHECK_IN' | 'CHECK_OUT'
export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'EARLY_LEAVE'

export interface AttendanceRecord {
  readonly recordId: number
  readonly employeeId: number
  readonly employeeCode: string
  readonly fullName: string
  readonly department: string
  readonly punchTimestamp: string // ISO-8601 (+07:00)
  readonly punchType: PunchType
  readonly verificationMethod: VerificationMethod
  readonly status: AttendanceStatus
  readonly lateMinutes: number
  readonly kioskId: string
}

export interface AttendanceQueryParams {
  page: number
  size: number
  fromDate?: string // YYYY-MM-DD
  toDate?: string   // YYYY-MM-DD
  department?: string
  status?: AttendanceStatus
  keyword?: string
}

export interface AttendanceStats {
  presentCount: number
  onTimeCount: number
  lateCount: number
  totalEmployees?: number
  absentCount?: number
}

export interface DailyAttendanceItem {
  date: string // YYYY-MM-DD
  checkIn?: string
  checkOut?: string
  status?: AttendanceStatus
  lateMinutes?: number
}

export interface LiveAttendanceMessage extends AttendanceRecord {
  eventType?: 'ATTENDANCE_PUNCHED' | string
}

export interface MonthlyTimesheet {
  period: string
  employeeId: number
  totalWorkingDays: number
  presentDays: number
  lateDays: number
  absentDays: number
  excusePendingDays: number
  dailyRecords: Array<{
    date: string
    dayOfWeek: string
    checkIn: string | null
    checkOut: string | null
    status: AttendanceStatus | string
    workingHours: number
    shiftCode: string
  }>
}

export type DayAttendanceStatus =
  | 'ON_TIME'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'ABSENT'
  | 'REST_DAY'
  | 'HOLIDAY'
  | 'EXCUSE_PENDING'

export interface PersonalAttendanceDayRecord {
  date: string // YYYY-MM-DD
  dayOfWeek?: string
  checkIn?: string | null
  checkOut?: string | null
  status: DayAttendanceStatus | AttendanceStatus | string
  lateMinutes?: number
  workingHours?: number
  shiftCode?: string
  verificationMethod?: VerificationMethod
  kioskId?: string
}

export interface PersonalAttendanceResponse {
  month: number
  year: number
  totalWorkDays: number
  totalOnTimeDays: number
  totalLateDays: number
  records: PersonalAttendanceDayRecord[]
}

export interface AdjustAttendanceRequest {
  punchTimestamp?: string
  status?: AttendanceStatus
  lateMinutes?: number
  reason: string
}

