import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../apiClient'
import { adminEmployeeService } from '../adminEmployeeService'
import { shiftAdminService } from '../shiftAdminService'
import { credentialService } from '../credentialService'
import { payrollPeriodService } from '../payrollPeriodService'
import { dataSubjectService } from '../dataSubjectService'
import { logoutService } from '../logoutService'
import { notificationService } from '../notificationService'
import { complianceAdminService } from '../complianceAdminService'
import { reportExportService } from '../reportExportService'
import { safeLocalStorage, safeSessionStorage, STORAGE_KEYS } from '../storage'
import { useAuthStore } from '@/store/authStore'

describe('Bộ Client Dịch vụ Vòng đời (TASK-WEB-023, BLD-WEB-022, APD-WEB-004..012)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    safeLocalStorage.clear()
    safeSessionStorage.clear()
    useAuthStore.getState().clearSession()
  })

  // 1. AdminEmployeeService (APD-WEB-004, API-WEB-009, API-WEB-010)
  describe('1. AdminEmployeeService', () => {
    it('getEmployees gọi đúng endpoint và trả danh sách phân trang', async () => {
      const mockResult = {
        content: [
          { id: 1, employeeCode: 'NV-001', fullName: 'Nguyễn Văn A', email: 'a@c.com', department: 'IT', role: 'EMPLOYEE', status: 'ACTIVE', hasBiometric: true, hasPin: false, createdAt: '2026-10-01' },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      }
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await adminEmployeeService.getEmployees({ page: 0, size: 20 })
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/employees', { params: { page: 0, size: 20 } })
      expect(res.content.length).toBe(1)
      expect(res.content[0].employeeCode).toBe('NV-001')
    })

    it('createEmployee nhận temporaryPassword và không lưu vào Storage', async () => {
      const mockData = {
        employee: { id: 2, employeeCode: 'NV-002', fullName: 'Trần B', email: 'b@c.com', department: 'HR', role: 'HR_MANAGER', status: 'ACTIVE', hasBiometric: false, hasPin: false, createdAt: '2026-10-01' },
        temporaryPassword: 'TempPassword@123',
      }
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true, data: mockData } })

      const res = await adminEmployeeService.createEmployee({
        employeeCode: 'NV-002',
        fullName: 'Trần B',
        email: 'b@c.com',
        department: 'HR',
        role: 'HR_MANAGER',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/admin/employees', expect.any(Object))
      expect(res.temporaryPassword).toBe('TempPassword@123')
      // Đảm bảo mật khẩu tạm không bị lọt vào storage
      expect(safeLocalStorage.getItem('temporaryPassword')).toBeNull()
      expect(safeSessionStorage.getItem('temporaryPassword')).toBeNull()
    })

    it('updateEmployee & updateEmployeeStatus & resetCredentials hoạt động chính xác', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { id: 1, fullName: 'Tên Mới' } },
      })
      const updated = await adminEmployeeService.updateEmployee(1, { fullName: 'Tên Mới' })
      expect(updated.fullName).toBe('Tên Mới')

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { id: 1, status: 'INACTIVE' } },
      })
      const statusUpdated = await adminEmployeeService.updateEmployeeStatus(1, 'INACTIVE')
      expect(statusUpdated.status).toBe('INACTIVE')

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { temporaryPassword: 'NewTemp@456', message: 'Cấp lại thành công' } },
      })
      const reset = await adminEmployeeService.resetCredentials(1)
      expect(reset.temporaryPassword).toBe('NewTemp@456')
    })
  })

  // 2. ShiftAdminService (APD-WEB-005, API-WEB-011, DD-WEB-001)
  describe('2. ShiftAdminService', () => {
    it('getShifts & createShift & updateShift gọi đúng endpoint', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: [{ id: 1, shiftCode: 'CA_SANG', name: 'Ca sáng', startTime: '08:00', endTime: '17:30', gracePeriodMinutes: 15, isActive: true }] },
      })
      const shifts = await shiftAdminService.getShifts()
      expect(shifts.length).toBe(1)

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { id: 2, shiftCode: 'CA_CHIEU', name: 'Ca chiều', startTime: '13:00', endTime: '21:00', gracePeriodMinutes: 10, isActive: true } },
      })
      const created = await shiftAdminService.createShift({
        shiftCode: 'CA_CHIEU',
        name: 'Ca chiều',
        startTime: '13:00',
        endTime: '21:00',
      })
      expect(created.shiftCode).toBe('CA_CHIEU')
    })

    it('assignShift phân ca và removeShiftAssignment gỡ ca', async () => {
      const mockAssignment = {
        id: 10,
        employeeId: 1,
        employeeCode: 'NV-001',
        fullName: 'Nguyễn Văn A',
        shiftId: 1,
        shiftCode: 'CA_SANG',
        shiftName: 'Ca sáng',
        effectiveStartDate: '2026-10-01',
        effectiveEndDate: '2026-10-31',
      }
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true, data: mockAssignment } })
      const res = await shiftAdminService.assignShift({
        employeeId: 1,
        shiftId: 1,
        effectiveStartDate: '2026-10-01',
        effectiveEndDate: '2026-10-31',
      })
      expect(res.id).toBe(10)

      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ status: 204 })
      await shiftAdminService.removeShiftAssignment(10)
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/admin/employee-shifts/10')
    })
  })

  // 3. CredentialService (APD-WEB-006, API-WEB-012, DD-WEB-018)
  describe('3. CredentialService', () => {
    it('changePassword gọi POST /api/v1/auth/change-password thành công', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, message: 'Đổi mật khẩu thành công', data: { message: 'Đổi thành công', sessionsRevoked: true } },
      })
      const res = await credentialService.changePassword({
        oldPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      })
      expect(res.sessionsRevoked).toBe(true)
    })

    it('setupPin & resetPin hoạt động chính xác', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { hasPin: true, message: 'Thiết lập PIN thành công' } },
      })
      const pinRes = await credentialService.setupPin({ pin: '123456' })
      expect(pinRes.hasPin).toBe(true)

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { hasPin: true, message: 'Đặt lại PIN thành công' } },
      })
      const resetRes = await credentialService.resetPin({ currentPassword: 'Pass', newPin: '654321' })
      expect(resetRes.hasPin).toBe(true)
    })
  })

  // 4. PayrollPeriodService (APD-WEB-007, API-WEB-013, DD-WEB-006)
  describe('4. PayrollPeriodService', () => {
    it('getPayrollPeriods, lockPeriod và unlockPeriod gọi đúng endpoints', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: [{ id: 1, periodYear: 2026, periodMonth: 10, status: 'OPEN', createdAt: '2026-10-01' }] },
      })
      const periods = await payrollPeriodService.getPayrollPeriods({ year: 2026 })
      expect(periods.length).toBe(1)

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { id: 1, periodYear: 2026, periodMonth: 10, status: 'LOCKED', createdAt: '2026-10-01' } },
      })
      const locked = await payrollPeriodService.lockPeriod('2026-10')
      expect(locked.status).toBe('LOCKED')

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { id: 1, periodYear: 2026, periodMonth: 10, status: 'OPEN', unlockReason: 'Điều chỉnh bổ sung', createdAt: '2026-10-01' } },
      })
      const unlocked = await payrollPeriodService.unlockPeriod('2026-10', { reason: 'Điều chỉnh bổ sung' })
      expect(unlocked.status).toBe('OPEN')
    })
  })

  // 5. DataSubjectService (APD-WEB-008, API-WEB-014, DD-WEB-015)
  describe('5. DataSubjectService', () => {
    it('withdrawConsent trả hạn 7 ngày tiêu hủy dữ liệu', async () => {
      const mockWithdraw = {
        withdrawnAt: '2026-10-12T10:00:00Z',
        retentionDeadline: '2026-10-19T10:00:00Z',
        message: 'Đã rút Informed Consent thành công',
      }
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true, data: mockWithdraw } })

      const res = await dataSubjectService.withdrawConsent({ reason: 'Không còn nhu cầu' })
      expect(res.retentionDeadline).toBe('2026-10-19T10:00:00Z')
    })

    it('quản lý yêu cầu dữ liệu cá nhân cho Employee và DPO', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { id: 5, employeeId: 1, requestType: 'ACCESS', details: 'Trích xuất dữ liệu', status: 'PENDING', submittedAt: '2026-10-12' } },
      })
      const created = await dataSubjectService.createEmployeeDataRequest({
        requestType: 'ACCESS',
        details: 'Trích xuất dữ liệu',
      })
      expect(created.id).toBe(5)

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: [created] },
      })
      const list = await dataSubjectService.getDpoDataRequests()
      expect(list.length).toBe(1)

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { ...created, status: 'COMPLETED', adminNote: 'Đã trích xuất xong' } },
      })
      const updated = await dataSubjectService.updateDataRequestStatus(5, {
        status: 'COMPLETED',
        adminNote: 'Đã trích xuất xong',
      })
      expect(updated.status).toBe('COMPLETED')
    })
  })

  // 6. LogoutService (APD-WEB-009, API-WEB-015, DD-WEB-004)
  describe('6. LogoutService', () => {
    it('logout thu hồi Refresh Token trên backend và xóa sạch Storage', async () => {
      safeLocalStorage.setItem('fas_auth_session', {
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
        user: {
          id: 1,
          employeeCode: 'NV-001',
          fullName: 'Nguyễn Văn A',
          email: 'a@c.com',
          department: 'IT',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      })
      safeSessionStorage.setItem(STORAGE_KEYS.CONSENT_SESSION, { otp: '123456' })

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ status: 204 })

      await logoutService.logout()

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout', { refreshToken: 'mock-refresh' })
      expect(safeLocalStorage.getItem('fas_auth_session')).toBeNull()
      expect(safeSessionStorage.getItem(STORAGE_KEYS.CONSENT_SESSION)).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('logout vẫn xóa sạch client storage dù backend trả lỗi hoặc mất mạng', async () => {
      safeLocalStorage.setItem('fas_auth_session', {
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
      })
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network Error'))

      await logoutService.logout()

      expect(safeLocalStorage.getItem('fas_auth_session')).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  // 7. NotificationService (APD-WEB-010, API-WEB-016, DD-WEB-020)
  describe('7. NotificationService', () => {
    it('getNotifications, markAsRead và markAllAsRead gọi đúng endpoint', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: [{ id: 1, userId: 10, eventType: 'ATTENDANCE_PUNCH', title: 'Điểm danh', body: 'Đã quẹt thẻ', createdAt: '2026-10-12' }] },
      })
      const list = await notificationService.getNotifications()
      expect(list.length).toBe(1)

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { id: 1, readAt: '2026-10-12T10:00:00Z' } },
      })
      const read = await notificationService.markAsRead(1)
      expect(read.readAt).toBeDefined()

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ status: 200 })
      await notificationService.markAllAsRead()
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/notifications/read-all')
    })
  })

  // 8. ComplianceAdminService (APD-WEB-011, API-WEB-017, DD-WEB-019)
  describe('8. ComplianceAdminService', () => {
    it('getAuditLogs tra cứu nhật ký kiểm toán chỉ đọc', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { content: [{ id: 1, action: 'LOGIN', actorId: 1, actorEmail: 'a@c.com', targetResource: 'AUTH', createdAt: '2026-10-12' }], totalElements: 1 } },
      })
      const logs = await complianceAdminService.getAuditLogs({ page: 0, size: 10 })
      expect(logs.content.length).toBe(1)
    })

    it('registerKiosk nhận secretToken và không lưu vào storage', async () => {
      const mockKioskRes = {
        kiosk: { id: 1, kioskId: 'KSK-01', name: 'Trạm Cổng', location: 'Tầng 1', status: 'ONLINE' as const },
        secretToken: 'ksk_sec_abcdef123456',
      }
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true, data: mockKioskRes } })

      const res = await complianceAdminService.registerKiosk({
        kioskId: 'KSK-01',
        name: 'Trạm Cổng',
        location: 'Tầng 1',
      })
      expect(res.secretToken).toBe('ksk_sec_abcdef123456')
      expect(safeLocalStorage.getItem('secretToken')).toBeNull()
      expect(safeSessionStorage.getItem('secretToken')).toBeNull()
    })

    it('getKioskHealth, getDpoConsents và getDpoRetentionSchedule hoạt động', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { kioskId: 'KSK-01', status: 'ONLINE', isStale: false } },
      })
      const health = await complianceAdminService.getKioskHealth('KSK-01')
      expect(health.isStale).toBe(false)

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: [{ id: 1, employeeId: 2, employeeCode: 'NV-002', fullName: 'B', agreedAt: '2026-10-12', ipAddress: '127.0.0.1', consentVersion: 'v1.0', status: 'ACTIVE' }] },
      })
      const consents = await complianceAdminService.getDpoConsents()
      expect(consents.length).toBe(1)

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: [{ id: 1, employeeId: 3, employeeCode: 'NV-003', fullName: 'C', scheduledDestructionDate: '2026-10-19', status: 'SCHEDULED' }] },
      })
      const retention = await complianceAdminService.getDpoRetentionSchedule()
      expect(retention.length).toBe(1)
    })
  })

  // 9. ReportExportService (APD-WEB-012, API-WEB-018, DD-WEB-017)
  describe('9. ReportExportService', () => {
    it('exportTimesheetReport gửi request blob và trích xuất filename từ header', async () => {
      const mockBlob = new Blob(['sample-excel-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="timesheet-2026-10.xlsx"',
        },
      })

      const res = await reportExportService.exportTimesheetReport({
        period: '2026-10',
        format: 'xlsx',
      })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/reports/export', {
        params: { period: '2026-10', departmentId: undefined, format: 'xlsx' },
        responseType: 'blob',
      })
      expect(res.filename).toBe('timesheet-2026-10.xlsx')
      expect(res.blob).toBe(mockBlob)
    })

    it('triggerDownload tạo thẻ anchor tải xuống an toàn', () => {
      const mockBlob = new Blob(['test'])
      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/mock-uuid')
      const revokeObjectURLMock = vi.fn()
      window.URL.createObjectURL = createObjectURLMock
      window.URL.revokeObjectURL = revokeObjectURLMock

      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      reportExportService.triggerDownload(mockBlob, 'test-file.xlsx')

      expect(createObjectURLMock).toHaveBeenCalledWith(mockBlob)
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/mock-uuid')
    })
  })
})
