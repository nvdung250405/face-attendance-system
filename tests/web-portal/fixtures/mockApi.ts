import type { Page } from '@playwright/test';

export interface MockUserOptions {
  role?: 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';
  status?: 'ACTIVE' | 'PENDING_CONSENT';
  fullName?: string;
  email?: string;
  hasBiometric?: boolean;
  longEmployeeName?: boolean;
  emptyNotifications?: boolean;
  emptyAttendance?: boolean;
}

export async function setupMockApi(page: Page, options: MockUserOptions = {}) {
  const role = options.role ?? 'ADMIN';
  const status = options.status ?? 'ACTIVE';
  const email = options.email ?? (role === 'ADMIN' ? 'admin@company.com' : 'nam.dh@company.com');
  const fullName = options.fullName ?? (role === 'ADMIN' ? 'Nguyễn Quản Trị' : 'Đỗ Hoàng Nam');
  const hasBiometric = options.hasBiometric ?? (status === 'ACTIVE' && role === 'ADMIN');

  const currentUser = {
    id: role === 'ADMIN' ? 2 : 101,
    employeeCode: role === 'ADMIN' ? 'ADM-001' : 'NV-101',
    fullName,
    email,
    role,
    status,
    department: role === 'ADMIN' ? 'Ban Giám Đốc' : 'Phòng Kỹ thuật',
    hasBiometric,
    hasPin: status === 'ACTIVE',
    mustChangePassword: false,
  };

  await page.route('**/eventsource**', (route) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'retry: 1000000\n\n' }));
  await page.route('**/ws/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"websocket":false,"origins":["*:*"],"cookie_needed":false,"entropy":123456}' }));
  await page.route('**/ws-attendance/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"websocket":false,"origins":["*:*"],"cookie_needed":false,"entropy":123456}' }));

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    const jsonOk = (data: any) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 'OK',
          message: 'Success',
          data,
          timestamp: new Date().toISOString(),
        }),
      });

    // 1. Auth Login
    if (path.endsWith('/auth/login') && method === 'POST') {
      const body = route.request().postDataJSON() || {};
      const username = body.username || body.email || '';

      if (username.includes('invalid') || body.password === 'wrong') {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            code: 'AUTH_INVALID_CREDENTIALS',
            message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
            timestamp: new Date().toISOString(),
          }),
        });
      }

      return jsonOk({
        accessToken: 'mock-jwt-token-123456',
        refreshToken: 'mock-refresh-token-123456',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: currentUser,
      });
    }

    // 2. Auth Logout
    if (path.endsWith('/auth/logout') && method === 'POST') {
      return jsonOk({ success: true });
    }

    // 3. User Me
    if (path.endsWith('/auth/me') && method === 'GET') {
      return jsonOk(currentUser);
    }

    // 4. Consent Endpoints
    if (path.includes('/consent')) {
      if (method === 'GET') {
        return jsonOk({
          hasSignedConsent: hasBiometric,
          consentVersion: 'v1.0',
        });
      }
      if (method === 'POST') {
        return jsonOk({
          otp: '839201',
          qrCodeData: 'FAS:839201:EMP101',
          qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          notice: 'Ký cam kết dữ liệu thành công',
        });
      }
    }

    // 5. Attendance Stats & Live Summary
    if (path.includes('/admin/attendance/stats') || path.includes('/attendance/live-summary')) {
      return jsonOk({
        totalEmployees: 120,
        presentCount: 85,
        lateCount: 7,
        absentCount: 28,
        excuseCount: 5,
        onTimeCount: 78,
        earlyLeaveCount: 0,
      });
    }

    // 6. Attendance Paginated Records
    if (path.includes('/admin/attendance')) {
      if (options.emptyAttendance) {
        return jsonOk({
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        });
      }
      return jsonOk({
        content: [
          {
            recordId: 1001,
            employeeId: 101,
            employeeCode: 'NV-101',
            fullName: 'Đỗ Hoàng Nam',
            department: 'Phòng Kỹ thuật',
            punchTimestamp: '2026-11-09T08:02:15',
            punchType: 'CHECK_IN',
            status: 'ON_TIME',
            verificationMethod: 'FACE_RECOGNITION',
            kioskId: 'KIOSK-LOBBY-01',
            similarity: 0.94,
          },
          {
            recordId: 1002,
            employeeId: 102,
            employeeCode: 'NV-102',
            fullName: 'Phạm Minh Quân',
            department: 'Phòng Kinh doanh',
            punchTimestamp: '2026-11-09T08:24:45',
            punchType: 'CHECK_IN',
            status: 'LATE',
            verificationMethod: 'PIN_FALLBACK',
            kioskId: 'KIOSK-GATE-02',
            similarity: 0.0,
          },
        ],
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      });
    }

    // 7. Employee Shifts (Shift Assignments)
    if (path.includes('/admin/employee-shifts')) {
      if (path.includes('/batch') && method === 'POST') {
        return jsonOk({
          total: 2,
          successCount: 2,
          failedCount: 0,
          failures: [],
        });
      }
      if (method === 'POST') {
        return jsonOk({ id: 99, success: true });
      }
      return jsonOk([
        {
          id: 1,
          employeeId: 101,
          employeeCode: 'NV-101',
          fullName: 'Đỗ Hoàng Nam',
          shiftId: 1,
          shiftCode: 'HC-01',
          shiftName: 'Ca Hành Chính',
          effectiveFrom: '2026-11-01',
          effectiveTo: '2026-11-30',
        },
      ]);
    }

    // 8. Shifts Catalog
    if (path.includes('/admin/shifts')) {
      return jsonOk([
        {
          id: 1,
          shiftCode: 'HC-01',
          name: 'Ca Hành Chính',
          shiftName: 'Ca Hành Chính',
          startTime: '08:00',
          endTime: '17:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
        {
          id: 2,
          shiftCode: 'CA-02',
          name: 'Ca Chiều',
          shiftName: 'Ca Chiều',
          startTime: '13:00',
          endTime: '21:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
      ]);
    }

    // 9. Employees List for Admin
    if (path.includes('/admin/employees')) {
      const content = [
        {
          id: 101,
          employeeCode: 'NV-101',
          fullName: options.longEmployeeName
            ? 'Nguyễn Hoàng Công Tằng Tôn Nữ Long Vân Trúc Mai Thị Hoa'
            : 'Đỗ Hoàng Nam',
          email: 'nam.dh@company.com',
          department: 'Phòng Kỹ thuật & Phát triển Phần mềm Doanh nghiệp Lớn',
          status: 'ACTIVE',
        },
        {
          id: 102,
          employeeCode: 'NV-102',
          fullName: 'Phạm Minh Quân',
          email: 'quan.pm@company.com',
          department: 'Phòng Kinh doanh',
          status: 'ACTIVE',
        },
      ];
      return jsonOk({
        content,
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      });
    }

    // 10. Excuse Requests
    if (path.includes('/admin/excuse-requests')) {
      if (path.includes('/approve') && method === 'POST') {
        return jsonOk({ success: true, status: 'APPROVED' });
      }
      return jsonOk({
        content: [
          {
            id: 1,
            employeeId: 102,
            employeeCode: 'NV-102',
            employeeName: 'Phạm Minh Quân',
            fullName: 'Phạm Minh Quân',
            date: '2026-11-08',
            reason: 'Gặp khách hàng đột xuất buổi sáng',
            status: 'PENDING',
            createdAt: '2026-11-08T09:00:00',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      });
    }

    // 11. Payroll Periods
    if (path.includes('/admin/payroll-periods')) {
      if (path.includes('/lock') && method === 'POST') {
        return jsonOk({ success: true, status: 'LOCKED' });
      }
      return jsonOk([
        {
          id: 1,
          periodMonth: 11,
          periodYear: 2026,
          month: 11,
          year: 2026,
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          status: 'OPEN',
        },
      ]);
    }

    // 12. Kiosks Management
    if (path.includes('/admin/kiosks')) {
      if (path.includes('/rotate-secret') && method === 'POST') {
        return jsonOk({
          id: 1,
          kioskId: 'KIOSK-LOBBY-01',
          name: 'Trạm Sảnh Chính (Tầng 1)',
          location: 'Sảnh A Tòa Nhà VP',
          secretToken: 'fas_sec_rot_998877665544332211',
          newSecretToken: 'fas_sec_rot_998877665544332211',
          status: 'ONLINE',
          isActive: true,
        });
      }
      return jsonOk([
        {
          id: 1,
          kioskId: 'KIOSK-LOBBY-01',
          name: 'Trạm Sảnh Chính (Tầng 1)',
          location: 'Sảnh A Tòa Nhà VP',
          ipAddress: '192.168.1.101',
          status: 'ONLINE',
          lastPingAt: new Date(Date.now() - 30 * 1000).toISOString(),
          appVersion: '2.4.0',
          isActive: true,
        },
        {
          id: 2,
          kioskId: 'KIOSK-GATE-02',
          name: 'Trạm Cổng Phụ (Khu Kỹ Thuật)',
          location: 'Cổng B Tòa Nhà VP',
          ipAddress: '192.168.1.102',
          status: 'ONLINE',
          lastPingAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          appVersion: '2.4.0',
          isActive: true,
        },
      ]);
    }

    // 13. Audit Logs
    if (path.includes('/admin/audit-logs')) {
      return jsonOk({
        content: [
          {
            id: 1,
            action: 'LOGIN_SUCCESS',
            actor: 'admin@company.com',
            actorEmail: 'admin@company.com',
            target: 'SYSTEM',
            targetResource: 'SYSTEM',
            ipAddress: '192.168.1.50',
            timestamp: '2026-11-09T23:50:00',
            createdAt: '2026-11-09T23:50:00',
            details: 'Đăng nhập thành công với vai trò ADMIN',
            status: 'SUCCESS',
          },
          {
            id: 2,
            action: 'CONSENT_SIGNED',
            actor: 'nam.dh@company.com',
            actorEmail: 'nam.dh@company.com',
            target: 'BIOMETRIC_DATA',
            targetResource: 'BIOMETRIC_DATA',
            ipAddress: '192.168.1.105',
            timestamp: '2026-11-09T22:30:00',
            createdAt: '2026-11-09T22:30:00',
            details: 'Ký thỏa thuận đồng thuận NĐ 13/2023',
            status: 'SUCCESS',
            oldValues: { consentStatus: 'PENDING', signedVersion: 'NONE' },
            newValues: { consentStatus: 'ACTIVE', signedVersion: 'v1.0' },
          },
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 20,
      });
    }

    // 14. Employee Data Requests (ND 13/2023)
    if (path.includes('/employee/data-requests') || path.includes('/dpo/data-requests')) {
      return jsonOk([
        {
          id: 1,
          requestType: 'ACCESS',
          status: 'COMPLETED',
          details: 'Yêu cầu trích xuất lịch sử chấm công sinh trắc cá nhân',
          reason: 'Yêu cầu trích xuất lịch sử chấm công sinh trắc cá nhân',
          submittedAt: '2026-11-05T10:00:00',
          createdAt: '2026-11-05T10:00:00',
          handledAt: '2026-11-06T14:30:00',
          completedAt: '2026-11-06T14:30:00',
          handledBy: 'DPO Admin',
          adminNote: 'Dữ liệu đã được xuất và gửi tới email của nhân viên',
          responseSummary: 'Dữ liệu đã được xuất và gửi tới email của nhân viên',
        },
      ]);
    }

    // 15. Employee Excuse Requests History
    if (path.includes('/employee/excuse-requests')) {
      return jsonOk({
        content: [
          {
            id: 1,
            employeeId: 101,
            employeeCode: 'NV-101',
            employeeName: 'Đỗ Hoàng Nam',
            date: '2026-11-08',
            reason: 'Gặp khách hàng đột xuất buổi sáng',
            status: 'APPROVED',
            createdAt: '2026-11-08T09:00:00',
            reviewNote: 'Đã duyệt căn cứ xác nhận của Trưởng bộ phận',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      });
    }

    // 16. DPO Consents & Retention Schedule
    if (path.includes('/dpo/consents')) {
      return jsonOk([
        {
          id: 1,
          employeeId: 101,
          employeeCode: 'NV-101',
          fullName: 'Đỗ Hoàng Nam',
          agreedAt: '2026-11-05T10:00:00',
          ipAddress: '192.168.1.105',
          consentVersion: 'v1.0',
          status: 'ACTIVE',
        },
        {
          id: 2,
          employeeId: 102,
          employeeCode: 'NV-102',
          fullName: 'Phạm Minh Quân',
          agreedAt: '2026-11-06T14:30:00',
          ipAddress: '192.168.1.110',
          consentVersion: 'v1.0',
          status: 'ACTIVE',
        },
      ]);
    }

    if (path.includes('/dpo/retention-schedule')) {
      return jsonOk([
        {
          id: 1,
          employeeId: 99,
          employeeCode: 'NV-099',
          fullName: 'Trần Văn Cựu',
          withdrawnAt: '2026-11-08T09:00:00',
          scheduledDeletionAt: '2026-11-15T09:00:00',
          status: 'PENDING_DELETION',
          daysRemaining: 5,
        },
      ]);
    }

    // 17. Notifications
    if (path.includes('/notifications')) {
      if (options.emptyNotifications) {
        return jsonOk([]);
      }
      return jsonOk([
        {
          id: 1,
          userId: 2,
          eventType: 'ATTENDANCE_LATE',
          title: 'Cảnh báo đi muộn',
          body: 'Nhân viên NV-102 (Phạm Minh Quân) vừa điểm danh muộn 24 phút.',
          readAt: null,
          createdAt: '2026-11-10T08:24:45',
        },
        {
          id: 2,
          userId: 2,
          eventType: 'EXCUSE_REQUEST_SUBMITTED',
          title: 'Đơn giải trình mới cần duyệt',
          body: 'Đỗ Hoàng Nam đã gửi đơn giải trình công ngày 08/11/2026.',
          readAt: '2026-11-09T18:00:00',
          createdAt: '2026-11-09T09:00:00',
        },
      ]);
    }

    // Fallback for unhandled endpoints
    return jsonOk({});
  });
}

/**
 * Inject auth session into localStorage before page load
 */
export async function injectAuthSession(
  page: Page,
  role: 'ADMIN' | 'EMPLOYEE' | 'HR_MANAGER' = 'ADMIN',
  overrides: Record<string, any> = {}
) {
  const session = {
    accessToken: 'mock-jwt-token-123456',
    refreshToken: 'mock-refresh-token-123456',
    tokenType: 'Bearer',
    expiresAt: Date.now() + 3600 * 1000,
    user: {
      id: role === 'ADMIN' ? 2 : 101,
      employeeCode: role === 'ADMIN' ? 'ADM-001' : 'NV-101',
      fullName: role === 'ADMIN' ? 'Nguyễn Quản Trị' : 'Đỗ Hoàng Nam',
      email: role === 'ADMIN' ? 'admin@company.com' : 'nam.dh@company.com',
      role,
      status: 'ACTIVE',
      department: role === 'ADMIN' ? 'Ban Giám Đốc' : 'Phòng Kỹ thuật',
      hasBiometric: role === 'ADMIN',
      hasPin: true,
      mustChangePassword: false,
      ...overrides,
    },
  };

  await page.addInitScript((val) => {
    window.localStorage.setItem('fas_auth_session', JSON.stringify(val));
  }, session);
}
