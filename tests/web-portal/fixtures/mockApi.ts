import type { Page } from '@playwright/test';

export interface MockUserOptions {
  role?: 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'DPO';
  status?: 'ACTIVE' | 'PENDING_CONSENT' | 'SUSPENDED' | 'TERMINATED';
  fullName?: string;
  email?: string;
  employeeCode?: string;
  hasBiometric?: boolean;
  hasPin?: boolean;
  longEmployeeName?: boolean;
  emptyNotifications?: boolean;
  emptyAttendance?: boolean;
}

const PRESET_USERS: Record<string, any> = {
  'staging-admin@fas.company.com': {
    id: 1,
    employeeCode: 'STG-ADM-001',
    fullName: 'Quản Trị Viên Staging',
    email: 'staging-admin@fas.company.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Ban Giám Đốc',
    hasBiometric: true,
    hasPin: true,
    mustChangePassword: false,
  },
  'admin@company.com': {
    id: 2,
    employeeCode: 'ADM-001',
    fullName: 'Nguyễn Quản Trị',
    email: 'admin@company.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Ban Giám Đốc',
    hasBiometric: true,
    hasPin: true,
    mustChangePassword: false,
  },
  'hr.manager@fas.company.com': {
    id: 3,
    employeeCode: 'STG-HR-001',
    fullName: 'Nguyễn Quản Trị Nhân Sự',
    email: 'hr.manager@fas.company.com',
    role: 'HR_MANAGER',
    status: 'ACTIVE',
    department: 'Phòng Nhân sự',
    hasBiometric: true,
    hasPin: true,
    mustChangePassword: false,
  },
  'dpo.officer@fas.company.com': {
    id: 4,
    employeeCode: 'STG-DPO-001',
    fullName: 'Cán Bộ DPO',
    email: 'dpo.officer@fas.company.com',
    role: 'DPO',
    status: 'ACTIVE',
    department: 'Ban Pháp Chế & DPO',
    hasBiometric: true,
    hasPin: true,
    mustChangePassword: false,
  },
  'tech.lead@fas.company.com': {
    id: 5,
    employeeCode: 'STG-ENG-001',
    fullName: 'Kỹ Sư Trưởng',
    email: 'tech.lead@fas.company.com',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    department: 'Phòng Kỹ thuật',
    hasBiometric: true,
    hasPin: true,
    mustChangePassword: false,
  },
  'intern.hung@fas.company.com': {
    id: 6,
    employeeCode: 'STG-OPS-001',
    fullName: 'Thực Tập Sinh Hùng',
    email: 'intern.hung@fas.company.com',
    role: 'EMPLOYEE',
    status: 'PENDING_CONSENT',
    department: 'Phòng Vận hành',
    hasBiometric: false,
    hasPin: false,
    mustChangePassword: false,
  },
  'worker.thao@fas.company.com': {
    id: 7,
    employeeCode: 'STG-OPS-004',
    fullName: 'Công Nhân Thảo',
    email: 'worker.thao@fas.company.com',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    department: 'Phòng Vận hành',
    hasBiometric: false,
    hasPin: true,
    mustChangePassword: false,
  },
  'nam.dh@company.com': {
    id: 101,
    employeeCode: 'NV-101',
    fullName: 'Đỗ Hoàng Nam',
    email: 'nam.dh@company.com',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    department: 'Phòng Kỹ thuật',
    hasBiometric: true,
    hasPin: true,
    mustChangePassword: false,
  },
};

export async function setupMockApi(page: Page, options: MockUserOptions = {}) {
  const role = options.role ?? 'ADMIN';
  const status = options.status ?? 'ACTIVE';
  const email = options.email ?? (role === 'ADMIN' ? 'staging-admin@fas.company.com' : 'tech.lead@fas.company.com');
  const fullName = options.fullName ?? (role === 'ADMIN' ? 'Quản Trị Viên Staging' : 'Kỹ Sư Trưởng');
  const employeeCode = options.employeeCode ?? (role === 'ADMIN' ? 'STG-ADM-001' : 'STG-ENG-001');
  const hasBiometric = options.hasBiometric ?? (status === 'ACTIVE' && role !== 'DPO');
  const hasPin = options.hasPin ?? (status === 'ACTIVE');

  let activeUser = {
    id: role === 'ADMIN' ? 1 : 101,
    employeeCode,
    fullName,
    email,
    role,
    status,
    department: role === 'ADMIN' ? 'Ban Giám Đốc' : 'Phòng Kỹ thuật',
    hasBiometric,
    hasPin,
    mustChangePassword: false,
  };

  // Mock server-sent events / websockets
  await page.route('**/eventsource**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'retry: 1000000\n\n' })
  );
  await page.route('**/ws/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"websocket":false,"origins":["*:*"],"cookie_needed":false,"entropy":123456}',
    })
  );
  await page.route('**/ws-attendance/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"websocket":false,"origins":["*:*"],"cookie_needed":false,"entropy":123456}',
    })
  );

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    const jsonOk = (data: any, code = 'OK', message = 'Success') =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code,
          message,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

    const jsonError = (status: number, code: string, message: string, data?: any) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code,
          message,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

    // 1. Auth Login
    if (path.endsWith('/auth/login') && method === 'POST') {
      const body = route.request().postDataJSON() || {};
      const username = body.username || body.email || '';

      if (
        username.includes('invalid') ||
        username.includes('nonexistent') ||
        body.password === 'wrong' ||
        body.password === 'WrongPassword@999'
      ) {
        return jsonError(401, 'AUTH_INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }

      const matched = PRESET_USERS[username];
      if (matched) {
        activeUser = { ...matched };
      }

      return jsonOk({
        accessToken: 'mock-jwt-token-123456',
        refreshToken: 'mock-refresh-token-123456',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: activeUser,
      }, 'AUTH_SUCCESS', 'Đăng nhập thành công');
    }

    // 2. Auth Logout
    if (path.endsWith('/auth/logout') && method === 'POST') {
      return jsonOk({ success: true });
    }

    // 3. User Me
    if (path.endsWith('/auth/me') && method === 'GET') {
      return jsonOk(activeUser);
    }

    // 4. Consent Endpoints
    if (path.includes('/consent')) {
      if (method === 'GET') {
        return jsonOk({
          hasSignedConsent: activeUser.hasBiometric,
          consentVersion: 'v1.0',
        });
      }
      if (method === 'POST') {
        activeUser.hasBiometric = true;
        activeUser.status = 'ACTIVE';
        return jsonOk({
          otp: '839201',
          qrCodeData: 'FAS:839201:EMP101',
          qrCodeDataUrl:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
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
            verificationMethod: 'VERIFICATION_FACE',
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

    // 7. Shifts Catalog
    if (path.includes('/admin/shifts')) {
      if (method === 'DELETE') {
        const parts = path.split('/');
        const id = parts[parts.length - 1];
        if (id === '1') {
          return jsonError(409, 'SHIFT_IN_USE', 'Ca làm việc đang có nhân sự được phân bổ, không thể xóa hoặc vô hiệu hóa.');
        }
        return jsonOk({ success: true });
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON() || {};
        return jsonOk({
          id: 99,
          shiftCode: body.shiftCode || 'CA-NEW',
          name: body.shiftName || body.name || 'Ca Mới',
          shiftName: body.shiftName || body.name || 'Ca Mới',
          startTime: body.startTime || '08:00',
          endTime: body.endTime || '17:00',
          gracePeriodMinutes: body.gracePeriodMinutes || 15,
          isActive: true,
        });
      }
      return jsonOk([
        {
          id: 1,
          shiftCode: 'SHIFT-OFFICE',
          name: 'Ca Hành Chính',
          shiftName: 'Ca Hành Chính',
          startTime: '08:00',
          endTime: '17:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
        {
          id: 2,
          shiftCode: 'SHIFT-MORNING',
          name: 'Ca Sáng',
          shiftName: 'Ca Sáng',
          startTime: '06:00',
          endTime: '14:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
        {
          id: 3,
          shiftCode: 'SHIFT-AFTERNOON',
          name: 'Ca Chiều',
          shiftName: 'Ca Chiều',
          startTime: '14:00',
          endTime: '22:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
        {
          id: 4,
          shiftCode: 'SHIFT-NIGHT',
          name: 'Ca Đêm',
          shiftName: 'Ca Đêm',
          startTime: '22:00',
          endTime: '06:00',
          gracePeriodMinutes: 15,
          isActive: true,
        },
        {
          id: 5,
          shiftCode: 'SHIFT-FLEXI',
          name: 'Ca Linh Hoạt',
          shiftName: 'Ca Linh Hoạt',
          startTime: '09:00',
          endTime: '18:00',
          gracePeriodMinutes: 30,
          isActive: true,
        },
      ]);
    }

    // 8. Employee Shifts (Shift Assignments)
    if (path.includes('/admin/employee-shifts')) {
      if (path.includes('/batch') && method === 'POST') {
        return jsonOk({
          total: 2,
          successCount: 2,
          failedCount: 0,
          failures: [],
          assignments: [],
        });
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON() || {};
        if (body.triggerConflict || (body.effectiveFrom && body.effectiveFrom.includes('2026-11-05'))) {
          return jsonError(409, 'SHIFT_OVERLAP_CONFLICT', 'Lịch phân ca bị chồng lấn khoảng ngày hiệu lực.', {
            conflictingAssignmentId: 1,
            suggestedStartDate: '2026-12-01',
            suggestedEndDate: '2026-12-31',
          });
        }
        return jsonOk({
          id: 99,
          employeeId: body.userId || 101,
          shiftId: body.shiftId || 1,
          shiftName: 'Ca Hành Chính',
          effectiveStartDate: body.effectiveFrom || '2026-12-01',
          effectiveEndDate: body.effectiveTo || '2026-12-31',
          success: true,
        });
      }
      if (method === 'DELETE') {
        return jsonOk({ success: true });
      }
      return jsonOk([
        {
          id: 1,
          employeeId: 101,
          userId: 101,
          employeeCode: 'NV-101',
          fullName: 'Đỗ Hoàng Nam',
          shiftId: 1,
          shiftCode: 'SHIFT-OFFICE',
          shiftName: 'Ca Hành Chính',
          effectiveStartDate: '2026-11-01',
          effectiveEndDate: '2026-11-30',
          effectiveFrom: '2026-11-01',
          effectiveTo: '2026-11-30',
        },
        {
          id: 2,
          employeeId: 102,
          userId: 102,
          employeeCode: 'NV-102',
          fullName: 'Phạm Minh Quân',
          shiftId: 2,
          shiftCode: 'SHIFT-MORNING',
          shiftName: 'Ca Sáng',
          effectiveStartDate: '2026-11-01',
          effectiveEndDate: '2026-11-30',
          effectiveFrom: '2026-11-01',
          effectiveTo: '2026-11-30',
        },
      ]);
    }

    // 9. Employees List for Admin
    if (path.includes('/admin/employees')) {
      const content = [
        {
          id: 101,
          employeeCode: 'NV-101',
          fullName: 'Đỗ Hoàng Nam',
          email: 'nam.dh@company.com',
          department: 'Phòng Kỹ thuật',
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
        {
          id: 201,
          employeeCode: 'STG-OPS-001',
          fullName: 'Thực Tập Sinh Hùng',
          email: 'intern.hung@fas.company.com',
          department: 'Phòng Vận hành',
          status: 'PENDING_CONSENT',
        },
        {
          id: 202,
          employeeCode: 'STG-OPS-002',
          fullName: 'Phan Đình Cường',
          email: 'cuong.pd@fas.company.com',
          department: 'Phòng Vận hành',
          status: 'ACTIVE',
        },
        {
          id: 203,
          employeeCode: 'STG-ENG-003',
          fullName: 'Hoàng Thúy Bình',
          email: 'binh.ht@fas.company.com',
          department: 'Phòng Kỹ thuật',
          status: 'ACTIVE',
        },
        {
          id: 204,
          employeeCode: 'STG-OPS-003',
          fullName: 'Nguyễn Văn Dũng',
          email: 'dung.nv@fas.company.com',
          department: 'Phòng Vận hành',
          status: 'ACTIVE',
        },
        {
          id: 205,
          employeeCode: 'STG-OPS-004',
          fullName: 'Công Nhân Thảo',
          email: 'worker.thao@fas.company.com',
          department: 'Phòng Vận hành',
          status: 'ACTIVE',
        },
      ];
      return jsonOk({
        content,
        page: 0,
        size: 20,
        totalElements: content.length,
        totalPages: 1,
        first: true,
        last: true,
      });
    }

    // 10. Excuse Requests (Admin & Employee)
    if (path.includes('/admin/excuse-requests')) {
      if (path.includes('/approve') && method === 'POST') {
        return jsonOk({ success: true, status: 'APPROVED' });
      }
      if (path.includes('/reject') && method === 'POST') {
        return jsonOk({ success: true, status: 'REJECTED' });
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
            originalPunchTimestamp: '2026-11-08T08:35:00',
            requestedPunchTimestamp: '2026-11-08T08:00:00',
          },
          {
            id: 2,
            employeeId: 202,
            employeeCode: 'STG-OPS-002',
            employeeName: 'Phan Đình Cường',
            fullName: 'Phan Đình Cường',
            date: '2026-11-09',
            reason: 'Sự cố giao thông đường ngập nước',
            status: 'PENDING',
            createdAt: '2026-11-09T08:45:00',
            originalPunchTimestamp: '2026-11-09T08:45:00',
            requestedPunchTimestamp: '2026-11-09T08:00:00',
          },
          {
            id: 3,
            employeeId: 203,
            employeeCode: 'STG-ENG-003',
            employeeName: 'Hoàng Thúy Bình',
            fullName: 'Hoàng Thúy Bình',
            date: '2026-11-07',
            reason: 'Đi công tác bàn giao thiết bị',
            status: 'APPROVED',
            createdAt: '2026-11-07T09:00:00',
            originalPunchTimestamp: '2026-11-07T08:40:00',
            decidedByName: 'Nguyễn Quản Trị Nhân Sự',
          },
          {
            id: 4,
            employeeId: 204,
            employeeCode: 'STG-OPS-003',
            employeeName: 'Nguyễn Văn Dũng',
            fullName: 'Nguyễn Văn Dũng',
            date: '2026-11-06',
            reason: 'Kiosk lỗi nhận diện',
            status: 'REJECTED',
            createdAt: '2026-11-06T09:00:00',
            originalPunchTimestamp: '2026-11-06T08:50:00',
            decidedByName: 'Nguyễn Quản Trị Nhân Sự',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 4,
        totalPages: 1,
      });
    }

    if (path.includes('/employee/excuse-requests')) {
      if (method === 'POST') {
        const body = route.request().postDataJSON() || {};
        if (body.reason && (body.reason.includes('replay') || body.reason.includes('duplicate') || body.attendanceLogId === 999)) {
          return jsonError(409, 'EXCUSE_ALREADY_EXISTS', 'Lượt chấm công này đã có đơn giải trình đang được xử lý hoặc đã duyệt.');
        }
        return jsonOk({ id: 105, status: 'PENDING', success: true });
      }
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

    // 11. Payroll Periods
    if (path.includes('/admin/payroll-periods')) {
      if (path.includes('/lock') && method === 'POST') {
        return jsonOk({
          success: true,
          status: 'LOCKED',
          lockedByName: 'Quản trị viên',
          lockedAt: new Date().toISOString(),
        });
      }
      if (path.includes('/unlock') && method === 'POST') {
        const body = route.request().postDataJSON() || {};
        return jsonOk({
          success: true,
          status: 'OPEN',
          unlockReason: body.reason,
          unlockedByName: 'Quản trị viên',
          unlockedAt: new Date().toISOString(),
        });
      }
      return jsonOk([
        {
          id: 1,
          periodMonth: 10,
          periodYear: 2026,
          month: 10,
          year: 2026,
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          status: 'LOCKED',
          lockedByName: 'Quản trị viên Staging',
          lockedAt: '2026-11-01T00:00:00',
        },
        {
          id: 2,
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

    // 12. Kiosk Endpoints
    if (path.includes('/kiosk/gallery')) {
      return jsonOk({
        items: [
          { employeeCode: 'STG-ADM-001' },
          { employeeCode: 'STG-ENG-001' },
          { employeeCode: 'STG-OPS-001' },
        ],
      });
    }

    if (path.includes('/kiosk/verify-pin') && method === 'POST') {
      const body = route.request().postDataJSON() || {};
      if (body.employeeCode === 'STG-OPS-004' && body.pin === '123456') {
        return jsonOk({ employeeCode: 'STG-OPS-004' }, 'PIN_VERIFIED', 'Xác thực mã PIN thành công');
      }
      return jsonError(401, 'PIN_INVALID', 'Mã PIN không chính xác');
    }

    if (path.includes('/admin/kiosks')) {
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
      ]);
    }

    // 13. Audit Logs
    if (path.includes('/admin/audit-logs')) {
      return jsonOk({
        content: [
          {
            id: 1,
            action: 'LOGIN_SUCCESS',
            actor: 'staging-admin@fas.company.com',
            actorEmail: 'staging-admin@fas.company.com',
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
            actor: 'intern.hung@fas.company.com',
            actorEmail: 'intern.hung@fas.company.com',
            target: 'BIOMETRIC_DATA',
            targetResource: 'BIOMETRIC_DATA',
            ipAddress: '192.168.1.105',
            timestamp: '2026-11-09T22:30:00',
            createdAt: '2026-11-09T22:30:00',
            details: 'Ký thỏa thuận đồng thuận NĐ 13/2023',
            status: 'SUCCESS',
          },
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 20,
      });
    }

    // 14. Data Requests
    if (path.includes('/data-requests')) {
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            code: 'DSR_CREATED',
            data: { id: 101, status: 'SUBMITTED' },
          }),
        });
      }
      if (method === 'PATCH') {
        const body = route.request().postDataJSON() || {};
        return jsonOk({ id: 101, status: body.status || 'IN_PROGRESS' });
      }
      return jsonOk({
        content: [
          {
            id: 1,
            requestType: 'ACCESS',
            status: 'COMPLETED',
            details: 'Yêu cầu trích xuất lịch sử chấm công sinh trắc cá nhân',
            submittedAt: '2026-11-05T10:00:00',
            createdAt: '2026-11-05T10:00:00',
          },
        ],
        totalElements: 1,
        totalPages: 1,
      }, 'DPO_REQUESTS_FETCHED');
    }

    // 15. DPO Consents & Retention Schedule
    if (path.includes('/dpo/consents')) {
      return jsonOk({
        content: [
          {
            id: 1,
            employeeId: 101,
            employeeCode: 'STG-OPS-001',
            fullName: 'Thực Tập Sinh Hùng',
            agreedAt: '2026-11-05T10:00:00',
            ipAddress: '192.168.1.105',
            consentVersion: 'v1.0',
            status: 'ACTIVE',
          },
        ],
        totalElements: 1,
        totalPages: 1,
      });
    }

    if (path.includes('/dpo/retention-schedule')) {
      return jsonOk({
        content: [
          {
            id: 1,
            employeeId: 99,
            employeeCode: 'STG-OPS-005',
            fullName: 'Trần Đình Tuấn',
            withdrawnAt: '2026-11-01T09:00:00',
            scheduledDeletionAt: '2026-11-21T09:00:00',
            triggerDate: '2026-11-01T09:00:00',
            scheduledDisposalDate: '2026-11-21T09:00:00',
            retentionType: 'EMPLOYEE_TERMINATION',
            isDisposed: true,
            status: 'DISPOSED',
            daysRemaining: 0,
          },
        ],
        totalElements: 1,
        totalPages: 1,
      }, 'RETENTION_SCHEDULE_FETCHED');
    }

    // 16. Notifications
    if (path.includes('/notifications')) {
      if (options.emptyNotifications) {
        return jsonOk([]);
      }
      return jsonOk([
        {
          id: 1,
          userId: 1,
          eventType: 'ATTENDANCE_LATE',
          title: 'Cảnh báo đi muộn',
          body: 'Nhân viên NV-102 (Phạm Minh Quân) vừa điểm danh muộn 24 phút.',
          readAt: null,
          createdAt: '2026-11-10T08:24:45',
        },
      ]);
    }

    // Default fallback
    return jsonOk({});
  });
}

/**
 * Inject auth session into localStorage before page load
 */
export async function injectAuthSession(
  page: Page,
  role: 'ADMIN' | 'EMPLOYEE' | 'HR_MANAGER' | 'DPO' = 'ADMIN',
  overrides: Record<string, any> = {}
) {
  let user = PRESET_USERS['staging-admin@fas.company.com'];
  if (role === 'HR_MANAGER') {
    user = PRESET_USERS['hr.manager@fas.company.com'];
  } else if (role === 'DPO') {
    user = PRESET_USERS['dpo.officer@fas.company.com'];
  } else if (role === 'EMPLOYEE') {
    user = PRESET_USERS['tech.lead@fas.company.com'];
  }

  const session = {
    accessToken: 'mock-jwt-token-123456',
    refreshToken: 'mock-refresh-token-123456',
    tokenType: 'Bearer',
    expiresAt: Date.now() + 3600 * 1000,
    user: {
      ...user,
      ...overrides,
    },
  };

  await page.addInitScript((val) => {
    window.localStorage.setItem('fas_auth_session', JSON.stringify(val));
  }, session);
}
