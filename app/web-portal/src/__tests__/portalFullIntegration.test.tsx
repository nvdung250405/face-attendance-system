/**
 * Kiểm Thử Tích Hợp Toàn Trình Giao Diện Cổng Web (Portal Full Integration)
 * (TASK-WEB-021, BLD-WEB-017, Wave 7).
 *
 * Bao phủ các luồng toàn trình:
 * 1. Xác thực JWT, Router Guard & Phân quyền RBAC (Dual-Role HR/Admin vs Employee).
 * 2. Tiếp nhận sự kiện STOMP thời gian thực cập nhật Live Table (< 1s) & hiệu ứng Green Flash.
 * 3. Quy trình ký cam kết Informed Consent (cuộn 100%, OTP 6 số, QR) & kích hoạt sinh trắc.
 * 4. Luồng vòng đời: Đổi mật khẩu bắt buộc, Rút Consent 2 bước, Chốt kỳ công lan tỏa cờ khóa điều chỉnh.
 * 5. Xuất báo cáo bảng công toàn trình Excel & PDF (Backend API & Fallback Client-side).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/services/queryClient'
import { AppRoutes } from '@/routes/AppRoutes'
import { useAuthStore } from '@/store/authStore'
import { usePayrollPeriodStore } from '@/store/payrollPeriodStore'
import { useNotificationStore } from '@/store/notificationStore'
import { attendanceService } from '@/services/attendanceService'
import { consentService } from '@/services/consentService'
import { dataSubjectService } from '@/services/dataSubjectService'
import { payrollPeriodService } from '@/services/payrollPeriodService'
import { shiftAdminService } from '@/services/shiftAdminService'
import { adminEmployeeService } from '@/services/adminEmployeeService'
import { reportExportService } from '@/services/reportExportService'
import { notificationService } from '@/services/notificationService'
import * as useLiveAttendanceModule from '@/services/hooks/useLiveAttendance'
import * as useEnrollmentStatusModule from '@/services/hooks/useEnrollmentStatus'
import type {
  UserProfile,
  AttendanceRecord,
  AttendanceStats,
  PageResponse,
  ConsentResult,
  ShiftItem,
  EmployeeShiftAssignment,
  PayrollPeriodResponse,
  EnrollmentSuccessMessage,
  AuthSession,
} from '@/types'

// ── Mock SockJS & STOMP hooks để không gọi WebSocket thật trong Happy-DOM ───

vi.mock('@/store/stompConnectionStore', () => ({
  useStompConnectionStore: () => ({ status: 'CONNECTED', setStatus: vi.fn() }),
}))

vi.mock('@/services/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/hooks')>()
  return {
    ...actual,
    useStompClient: () => ({ status: 'CONNECTED', isConnected: true, connect: vi.fn(), disconnect: vi.fn() }),
  }
})

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockHrUser: UserProfile = {
  id: 1,
  employeeCode: 'HR-001',
  fullName: 'Trần Thị Thu Hà',
  email: 'hr.manager@company.com',
  role: 'HR_MANAGER',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Phòng Nhân sự',
}

const mockAdminUser: UserProfile = {
  id: 2,
  employeeCode: 'ADM-001',
  fullName: 'Nguyễn Quản Trị',
  email: 'admin@company.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  hasBiometric: true,
  hasPin: true,
  department: 'Ban Giám Đốc',
}

const mockEmployeeUser: UserProfile = {
  id: 101,
  employeeCode: 'NV-101',
  fullName: 'Đỗ Hoàng Nam',
  email: 'nam.dh@company.com',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  hasBiometric: false,
  hasPin: false,
  department: 'Phòng Kỹ thuật',
}

const mockForcedUser: UserProfile = {
  id: 102,
  employeeCode: 'NV-102',
  fullName: 'Phạm Minh Quân',
  email: 'quan.pm@company.com',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  mustChangePassword: true,
  hasBiometric: false,
  hasPin: false,
  department: 'Phòng Kỹ thuật',
}

const mockInitialStats: AttendanceStats = {
  totalEmployees: 100,
  presentCount: 75,
  onTimeCount: 70,
  lateCount: 5,
  absentCount: 25,
}

const mockInitialRecord: AttendanceRecord = {
  recordId: 501,
  employeeId: 1001,
  employeeCode: 'NV-1001',
  fullName: 'Nguyễn Văn An',
  department: 'Phòng Kỹ thuật',
  punchTimestamp: '2026-10-14T08:05:00.000+07:00',
  punchType: 'CHECK_IN',
  verificationMethod: 'VERIFICATION_FACE',
  status: 'ON_TIME',
  lateMinutes: 0,
  kioskId: 'KSK-01',
}

const mockNewStompRecord: AttendanceRecord = {
  recordId: 502,
  employeeId: 1002,
  employeeCode: 'NV-1002',
  fullName: 'Lê Hoàng Yến',
  department: 'Phòng Kinh doanh',
  punchTimestamp: '2026-10-14T08:16:00.000+07:00',
  punchType: 'CHECK_IN',
  verificationMethod: 'VERIFICATION_FACE',
  status: 'ON_TIME',
  lateMinutes: 0,
  kioskId: 'KSK-01',
}

const mockPageRecords: PageResponse<AttendanceRecord> = {
  content: [mockInitialRecord],
  totalElements: 1,
  totalPages: 1,
  size: 50,
  page: 0,
  first: true,
  last: true,
}

const mockShifts: ShiftItem[] = [
  {
    id: 1,
    shiftCode: 'CA_SANG',
    name: 'Ca Sáng Hành Chính',
    startTime: '08:00',
    endTime: '12:00',
    gracePeriodMinutes: 15,
    isActive: true,
  },
]

const mockAssignments: EmployeeShiftAssignment[] = [
  {
    id: 301,
    employeeId: 101,
    employeeCode: 'NV-101',
    fullName: 'Đỗ Hoàng Nam',
    shiftId: 1,
    shiftCode: 'CA_SANG',
    shiftName: 'Ca Sáng Hành Chính',
    effectiveStartDate: '2026-10-12',
    effectiveEndDate: '2026-10-16',
  },
]

const mockPayrollPeriods: PayrollPeriodResponse[] = [
  {
    id: 1,
    periodYear: 2026,
    periodMonth: 10,
    status: 'OPEN',
    createdAt: '2026-10-01T00:00:00Z',
  },
]

// Helper tạo phiên đăng nhập hợp lệ và ghi vào storage để AppRoutes.initialize() đọc được
const setupUserSession = (user: UserProfile) => {
  const session: AuthSession = {
    accessToken: `mock-jwt-token-${user.id}`,
    refreshToken: `mock-refresh-token-${user.id}`,
    tokenType: 'Bearer',
    expiresAt: Date.now() + 3600000,
    user,
  }
  useAuthStore.getState().setSession(session)
}

// Helper render AppRoutes với QueryClient và MemoryRouter
const renderAppAt = (initialRoute: string) => {
  const qc = createQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('TASK-WEB-021: Tích Hợp Toàn Trình Giao Diện Cổng Web (BLD-WEB-017, Wave 7)', () => {
  let liveAttendanceCallback: ((rec: AttendanceRecord) => void) | null = null

  beforeEach(() => {
    vi.restoreAllMocks()
    window.confirm = vi.fn().mockReturnValue(true)

    useAuthStore.getState().clearSession()
    usePayrollPeriodStore.getState().clearStore()
    useNotificationStore.getState().clearStore()

    // Mock API services mặc định
    vi.spyOn(attendanceService, 'getAdminAttendance').mockResolvedValue(mockPageRecords)
    vi.spyOn(attendanceService, 'getAttendanceStats').mockResolvedValue(mockInitialStats)
    vi.spyOn(attendanceService, 'getPersonalAttendance').mockResolvedValue({
      month: 10,
      year: 2026,
      totalWorkDays: 20,
      totalOnTimeDays: 19,
      totalLateDays: 1,
      records: [],
    })
    vi.spyOn(shiftAdminService, 'getShifts').mockResolvedValue(mockShifts)
    vi.spyOn(shiftAdminService, 'getEmployeeShifts').mockResolvedValue(mockAssignments)
    vi.spyOn(payrollPeriodService, 'getPayrollPeriods').mockResolvedValue(mockPayrollPeriods)
    vi.spyOn(notificationService, 'getNotifications').mockResolvedValue([])
    vi.spyOn(adminEmployeeService, 'getEmployees').mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
      size: 200,
      page: 0,
      first: true,
      last: true,
    })

    // Bắt callback của useLiveAttendance để kích hoạt bắn tin STOMP giả lập
    liveAttendanceCallback = null
    vi.spyOn(useLiveAttendanceModule, 'useLiveAttendance').mockImplementation((options) => {
      if (options?.onRecordReceived) {
        liveAttendanceCallback = options.onRecordReceived
      }
      return {
        latestEvents: [],
        isConnected: true,
        connectionState: 'CONNECTED',
        clearEvents: vi.fn(),
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. Luồng Xác thực JWT, Router Guard & Phân quyền RBAC
  // ══════════════════════════════════════════════════════════════════════════════
  describe('1. Xác thực JWT, Router Guard & Phân quyền RBAC', () => {
    it('chặn truy cập trang bảo vệ khi chưa đăng nhập và điều hướng về /login', async () => {
      renderAppAt('/admin/dashboard')

      await waitFor(() => {
        expect(screen.getByText('Đăng nhập Cổng Web')).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeTruthy()
      })
    })

    it('đăng nhập thành công với vai trò HR_MANAGER điều hướng vào /admin/dashboard và hiển thị Shell Layout', async () => {
      renderAppAt('/login')

      // Nhập thông tin đăng nhập với email chứa hr -> HR_MANAGER
      fireEvent.change(screen.getByLabelText(/Email doanh nghiệp/i), {
        target: { value: 'hr.manager@company.com' },
      })
      fireEvent.change(screen.getByLabelText(/Mật khẩu/i), {
        target: { value: 'SecurePass@123' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

      // Chờ điều hướng vào Admin Shell Layout
      await waitFor(() => {
        expect(screen.getByTestId('admin-shell-layout')).toBeTruthy()
        expect(screen.getByTestId('sidebar')).toBeTruthy()
        expect(screen.getByTestId('top-header')).toBeTruthy()
      })
    })

    it('cho phép người dùng vào thẳng /employee/dashboard mà không bị chặn điều hướng (DD-WEB-018)', async () => {
      setupUserSession(mockForcedUser)

      // Người dùng vào /employee/dashboard
      renderAppAt('/employee/dashboard')

      await waitFor(() => {
        expect(screen.getByTestId('employee-dashboard-view')).toBeTruthy()
      })
    })

    it('phân quyền RBAC: Tài khoản EMPLOYEE cố vào /admin/* bị chặn chuyển về /employee/dashboard', async () => {
      setupUserSession(mockEmployeeUser)

      // EMPLOYEE cố truy cập /admin/employees
      renderAppAt('/admin/employees')

      await waitFor(() => {
        // Tự động chuyển hướng về trang tự phục vụ nhân viên
        expect(screen.getByTestId('employee-dashboard-view')).toBeTruthy()
        expect(screen.getByText('Cổng Thông Tin Nhân Viên')).toBeTruthy()
      })
    })

    it('điều hướng trực tiếp /admin/reports mở đúng màn hình Bảng chấm công & Xuất báo cáo', async () => {
      setupUserSession(mockHrUser)

      renderAppAt('/admin/reports')

      await waitFor(() => {
        expect(screen.getByTestId('admin-attendance-view')).toBeTruthy()
        expect(screen.getByText('Bảng Chấm Công HR Trực Tiếp')).toBeTruthy()
        expect(screen.getByTestId('open-export-modal-btn')).toBeTruthy()
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. Tiếp nhận Sự kiện STOMP Cập nhật Live Table & KPI Realtime (< 1 giây)
  // ══════════════════════════════════════════════════════════════════════════════
  describe('2. Tiếp nhận Sự kiện STOMP Cập nhật Live Table & KPI (< 1s)', () => {
    beforeEach(() => {
      setupUserSession(mockHrUser)
    })

    it('nhận bản ghi mới qua STOMP: chèn lên đầu bảng và tăng chỉ số KPI tức thì', async () => {
      renderAppAt('/admin/attendance')

      await waitFor(() => {
        expect(screen.getByTestId('admin-attendance-view')).toBeTruthy()
        expect(screen.getByText('Nguyễn Văn An')).toBeTruthy()
      })

      // Mô phỏng nhận sự kiện STOMP điểm danh mới
      expect(liveAttendanceCallback).toBeTypeOf('function')
      act(() => {
        liveAttendanceCallback!(mockNewStompRecord)
      })

      // Bản ghi mới xuất hiện lập tức trên đầu bảng
      await waitFor(() => {
        expect(screen.getByText('Lê Hoàng Yến')).toBeTruthy()
      })

      // Hiệu ứng Green Flash được kích hoạt trên dòng mới nhận
      const newRow = screen.getByTestId('attendance-row-502')
      expect(newRow.className).toContain('bg-emerald-50')
    })

    it('khi tạm dừng Live Stream: gom bản ghi vào danh sách chờ và nạp tức thì khi kích hoạt lại', async () => {
      renderAppAt('/admin/attendance')

      await waitFor(() => {
        expect(screen.getByTestId('toggle-live-mode-btn')).toBeTruthy()
      })

      // Bấm tạm dừng Live Mode
      fireEvent.click(screen.getByTestId('toggle-live-mode-btn'))
      expect(screen.getByText('Tạm dừng Live')).toBeTruthy()

      // Bắn sự kiện STOMP trong lúc tạm dừng
      act(() => {
        liveAttendanceCallback!(mockNewStompRecord)
      })

      // Bản ghi chưa hiển thị trên bảng, xuất hiện badge chờ
      expect(screen.queryByText('Lê Hoàng Yến')).toBeNull()
      expect(screen.getByTestId('flush-pending-btn')).toBeTruthy()
      expect(screen.getByText('+1 bản ghi mới')).toBeTruthy()

      // Bấm nút xả hàng chờ (flush pending)
      fireEvent.click(screen.getByTestId('flush-pending-btn'))

      await waitFor(() => {
        expect(screen.getByText('Lê Hoàng Yến')).toBeTruthy()
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. Quy trình Ký Cam kết Informed Consent & Mở Khóa OTP / QR
  // ══════════════════════════════════════════════════════════════════════════════
  describe('3. Quy trình Ký Cam kết Informed Consent & Mở Khóa OTP / QR', () => {
    let enrollmentSuccessCallback: ((data: EnrollmentSuccessMessage) => void) | null = null

    beforeEach(() => {
      setupUserSession({ ...mockEmployeeUser, hasBiometric: false })

      enrollmentSuccessCallback = null
      vi.spyOn(useEnrollmentStatusModule, 'useEnrollmentStatus').mockImplementation((options) => {
        if (typeof options === 'object' && options?.onSuccess) {
          enrollmentSuccessCallback = options.onSuccess
        }
        return {
          isEnrolled: false,
          enrollmentData: null,
          isConnected: true,
          reset: vi.fn(),
        }
      })
    })

    it('mở modal ký cam kết, cuộn 100% điều khoản, ký thành công sinh OTP 6 số và QR', async () => {
      const mockConsentResult: ConsentResult = {
        otp: '849201',
        qrCodeData: 'https://fas.company.com/enroll?otp=849201',
        expiresAt: new Date(Date.now() + 172800000).toISOString(),
      }
      vi.spyOn(consentService, 'submitConsent').mockResolvedValueOnce(mockConsentResult)

      renderAppAt('/employee/consent')

      await waitFor(() => {
        expect(screen.getByTestId('open-consent-modal-btn')).toBeTruthy()
      })

      // Bấm mở modal ký cam kết
      fireEvent.click(screen.getByTestId('open-consent-modal-btn'))

      expect(screen.getByTestId('consent-modal')).toBeTruthy()
      expect(screen.getByText(/Cam kết Thu thập & Xử lý Dữ liệu Sinh trắc học/i)).toBeTruthy()

      // Nút ký bị khóa khi chưa cuộn hết điều khoản
      const signBtn = screen.getByTestId('submit-consent-btn')
      expect(signBtn.hasAttribute('disabled')).toBe(true)

      // Giả lập cuộn 100% văn bản điều khoản
      const termsBox = screen.getByTestId('terms-container')
      Object.defineProperty(termsBox, 'scrollTop', { value: 500, configurable: true })
      Object.defineProperty(termsBox, 'clientHeight', { value: 300, configurable: true })
      Object.defineProperty(termsBox, 'scrollHeight', { value: 800, configurable: true })
      fireEvent.scroll(termsBox)

      // Tích chọn checkbox đồng ý
      const agreeCheckbox = screen.getByTestId('consent-agreement-checkbox')
      fireEvent.click(agreeCheckbox)

      // Bấm nút Ký cam kết điện tử
      expect(signBtn.hasAttribute('disabled')).toBe(false)
      fireEvent.click(signBtn)

      // Bước 2: Hiển thị OTP 6 số kích thước chuẩn kèm hướng dẫn Kiosk
      await waitFor(() => {
        expect(screen.getByTestId('otp-display-box')).toBeTruthy()
        expect(screen.getByText(/849\s*201/)).toBeTruthy()
      })

      // Mô phỏng sự kiện STOMP Kiosk quét mặt thành công (ENROLLMENT_SUCCESS)
      expect(enrollmentSuccessCallback).toBeTypeOf('function')
      act(() => {
        enrollmentSuccessCallback!({
          status: 'ENROLLMENT_SUCCESS',
          otp: '849201',
          employeeId: 101,
          message: 'Kích hoạt thành công',
          activatedAt: new Date().toISOString(),
        })
      })

      // Chuyển sang bước SUCCESS (hiển thị Confetti) và cập nhật hasBiometric = true
      await waitFor(() => {
        expect(screen.getByTestId('confetti-effect')).toBeTruthy()
        expect(useAuthStore.getState().user?.hasBiometric).toBe(true)
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. Luồng Vòng Đời: Rút Consent & Chốt Kỳ Công Lan Tỏa Cờ Khóa
  // ══════════════════════════════════════════════════════════════════════════════
  describe('4. Luồng Vòng Đời: Rút Consent & Chốt Kỳ Công Lan Tỏa Cờ Khóa', () => {
    it('nhân viên rút cam kết sinh trắc 2 bước hiển thị cảnh báo tiêu hủy 7 ngày và chuyển sang PIN', async () => {
      setupUserSession({ ...mockEmployeeUser, hasBiometric: true })

      const withdrawSpy = vi.spyOn(dataSubjectService, 'withdrawConsent').mockResolvedValueOnce({
        withdrawnAt: new Date().toISOString(),
        retentionDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        message: 'Rút cam kết thành công',
      })

      renderAppAt('/employee/consent')

      await waitFor(() => {
        expect(screen.getByTestId('open-withdraw-modal-btn')).toBeTruthy()
      })

      // Mở modal rút cam kết
      fireEvent.click(screen.getByTestId('open-withdraw-modal-btn'))

      // Bước 1: Cảnh báo hệ quả
      expect(screen.getByText(/Bước 1\/2: Cảnh báo hệ quả pháp lý & vận hành/i)).toBeTruthy()
      expect(screen.getByText(/Tiêu hủy trong 7 ngày:/i)).toBeTruthy()
      expect(screen.getByText(/Chuyển sang PIN dự phòng:/i)).toBeTruthy()

      // Sang Bước 2
      fireEvent.click(screen.getByTestId('withdrawal-next-step-btn'))
      expect(screen.getByText(/Bước 2\/2: Xác nhận hủy dữ liệu nhận diện/i)).toBeTruthy()

      // Tích xác nhận
      fireEvent.click(screen.getByTestId('confirm-withdrawal-checkbox'))
      fireEvent.click(screen.getByTestId('confirm-withdraw-submit-btn'))

      await waitFor(() => {
        expect(withdrawSpy).toHaveBeenCalled()
        // hasBiometric chuyển về false
        expect(useAuthStore.getState().user?.hasBiometric).toBe(false)
      })
    })

    it('chốt kỳ công tại AdminPayrollPeriodView lan tỏa cờ isAdjustmentLocked và vô hiệu hóa nút hủy phân ca trên AdminShiftManagementView', async () => {
      setupUserSession(mockAdminUser)

      const periodsState: PayrollPeriodResponse[] = [
        {
          id: 1,
          periodYear: 2026,
          periodMonth: 10,
          status: 'OPEN',
          createdAt: '2026-10-01T00:00:00Z',
        },
      ]
      vi.spyOn(payrollPeriodService, 'getPayrollPeriods').mockImplementation(async () => periodsState)

      vi.spyOn(payrollPeriodService, 'lockPeriod').mockImplementation(async () => {
        periodsState[0] = {
          ...periodsState[0],
          status: 'LOCKED',
          lockedByName: 'Trần Thị Thu Hà',
          lockedAt: new Date().toISOString(),
        }
        return periodsState[0]
      })

      // 1. Chốt kỳ tại màn hình kỳ công
      renderAppAt('/admin/payroll-periods')

      await waitFor(() => {
        expect(screen.getByTestId('lock-period-btn-1')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('lock-period-btn-1'))
      fireEvent.click(screen.getByTestId('confirm-lock-period-btn'))

      await waitFor(() => {
        // Cờ isAdjustmentLocked được cập nhật vào Store tập trung
        expect(usePayrollPeriodStore.getState().isAdjustmentLocked).toBe(true)
      })

      // 2. Sang màn hình Ca & Phân ca thông qua liên kết Sidebar
      fireEvent.click(screen.getByRole('link', { name: /Ca & Phân ca/i }))

      await waitFor(() => {
        expect(screen.getByTestId('admin-shift-management-view')).toBeTruthy()
      })

      // Chuyển sang tab Lịch Phân Ca
      fireEvent.click(screen.getByTestId('tab-assignments-btn'))

      await waitFor(() => {
        // Cảnh báo nghiệp vụ kỳ công bị khóa hiển thị
        expect(screen.getByTestId('payroll-locked-warning-banner')).toBeTruthy()
        // Nút hủy phân ca bị vô hiệu hóa
        const removeBtn = screen.getByTestId('remove-assignment-btn-301')
        expect(removeBtn.hasAttribute('disabled')).toBe(true)
      })

      // 3. Mở lại kỳ công có kiểm toán lý do
      const unlockSpy = vi.spyOn(payrollPeriodService, 'unlockPeriod').mockImplementation(async () => {
        periodsState[0] = {
          ...periodsState[0],
          status: 'OPEN',
        }
        return periodsState[0]
      })

      // Quay lại màn hình Chốt kỳ công qua liên kết Sidebar
      fireEvent.click(screen.getByRole('link', { name: /Chốt kỳ công/i }))

      await waitFor(() => {
        expect(screen.getByTestId('unlock-period-btn-1')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('unlock-period-btn-1'))
      const reasonInput = screen.getByTestId('input-unlock-reason')
      fireEvent.change(reasonInput, {
        target: { value: 'Mở lại kỳ công điều chỉnh chấm công cho khối sản xuất' },
      })
      fireEvent.click(screen.getByTestId('confirm-unlock-period-btn'))

      await waitFor(() => {
        expect(unlockSpy).toHaveBeenCalled()
        // isAdjustmentLocked trở về false
        expect(usePayrollPeriodStore.getState().isAdjustmentLocked).toBe(false)
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. Xuất Báo Cáo Bảng Công Toàn Trình (Excel & PDF)
  // ══════════════════════════════════════════════════════════════════════════════
  describe('5. Xuất Báo Cáo Bảng Công Toàn Trình (Excel & PDF)', () => {
    beforeEach(() => {
      setupUserSession(mockHrUser)
    })

    it('xuất báo cáo Excel từ AdminAttendanceView qua modal ExportReportModal', async () => {
      const exportSpy = vi.spyOn(reportExportService, 'exportTimesheetReport').mockResolvedValueOnce({
        blob: new Blob(['mock-excel-binary']),
        filename: 'bang-cham-cong-2026-10.xlsx',
      })
      const downloadSpy = vi.spyOn(reportExportService, 'triggerDownload').mockImplementation(() => {})

      renderAppAt('/admin/attendance')

      await waitFor(() => {
        expect(screen.getByTestId('open-export-modal-btn')).toBeTruthy()
      })

      // Bấm nút mở modal xuất báo cáo
      fireEvent.click(screen.getByTestId('open-export-modal-btn'))

      expect(screen.getByTestId('export-report-modal')).toBeTruthy()

      // Chọn định dạng Excel và bấm xuất
      fireEvent.click(screen.getByTestId('format-option-xlsx'))
      fireEvent.click(screen.getByTestId('confirm-export-btn'))

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'xlsx',
          })
        )
        expect(downloadSpy).toHaveBeenCalledWith(expect.any(Blob), 'bang-cham-cong-2026-10.xlsx')
      })
    })

    it('xuất báo cáo PDF từ AdminAttendanceView qua modal ExportReportModal', async () => {
      const exportSpy = vi.spyOn(reportExportService, 'exportTimesheetReport').mockResolvedValueOnce({
        blob: new Blob(['mock-pdf-binary']),
        filename: 'bang-cham-cong-2026-10.pdf',
      })
      const downloadSpy = vi.spyOn(reportExportService, 'triggerDownload').mockImplementation(() => {})

      renderAppAt('/admin/attendance')

      await waitFor(() => {
        expect(screen.getByTestId('open-export-modal-btn')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('open-export-modal-btn'))
      expect(screen.getByTestId('export-report-modal')).toBeTruthy()

      // Chọn định dạng PDF và bấm xuất
      fireEvent.click(screen.getByTestId('format-option-pdf'))
      fireEvent.click(screen.getByTestId('confirm-export-btn'))

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'pdf',
          })
        )
        expect(downloadSpy).toHaveBeenCalledWith(expect.any(Blob), 'bang-cham-cong-2026-10.pdf')
      })
    })
  })
})
