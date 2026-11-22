/**
 * FAS Staging API RBAC Matrix Automated Verification
 * Tests all 4 personas + unauthenticated across all sensitive REST endpoints.
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

const PERSONAS = {
  ADMIN: { email: 'staging-admin@fas.company.com', pass: 'Staging@FAS2026!' },
  HR_MANAGER: { email: 'hr.manager@fas.company.com', pass: 'Staging@FAS2026!' },
  DPO: { email: 'dpo.officer@fas.company.com', pass: 'Staging@FAS2026!' },
  EMPLOYEE: { email: 'tech.lead@fas.company.com', pass: 'Staging@FAS2026!' }
};

const ENDPOINTS = [
  { path: '/admin/employees', method: 'GET', description: 'Quản lý danh sách nhân sự' },
  { path: '/admin/shifts', method: 'GET', description: 'Cấu hình ca kíp' },
  { path: '/admin/payroll-periods', method: 'GET', description: 'Kỳ tính lương' },
  { path: '/admin/kiosks', method: 'GET', description: 'Quản lý trạm Kiosk' },
  { path: '/admin/audit-logs', method: 'GET', description: 'Nhật ký kiểm toán toàn hệ thống' },
  { path: '/admin/excuse-requests', method: 'GET', description: 'Duyệt đơn giải trình nhân viên' },
  { path: '/admin/reports/daily-attendance', method: 'GET', description: 'Xuất báo cáo điểm danh' },
  { path: '/dpo/consents', method: 'GET', description: 'DPO tra cứu Informed Consent' },
  { path: '/dpo/retention-schedule', method: 'GET', description: 'DPO lịch trình tiêu hủy sinh trắc' },
  { path: '/employee/excuse-requests', method: 'GET', description: 'Nhân viên gửi/xem đơn giải trình' },
  { path: '/employee/attendance/today', method: 'GET', description: 'Nhân viên xem điểm danh cá nhân' }
];

async function run() {
  console.log('Logging in personas...');
  const tokens = {};
  for (const [role, cred] of Object.entries(PERSONAS)) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cred.email, password: cred.pass })
    });
    if (!res.ok) {
      throw new Error(`Failed to login as ${role}: ${res.status}`);
    }
    const data = await res.json();
    tokens[role] = data.data.accessToken;
  }

  const results = [];

  for (const ep of ENDPOINTS) {
    const epResult = {
      path: ep.path,
      method: ep.method,
      description: ep.description,
      status: {}
    };

    // 1. Unauthenticated
    const unauthRes = await fetch(`${BASE_URL}${ep.path}`);
    epResult.status.UNAUTHENTICATED = unauthRes.status;

    // 2. Each persona
    for (const role of ['ADMIN', 'HR_MANAGER', 'DPO', 'EMPLOYEE']) {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        headers: { 'Authorization': `Bearer ${tokens[role]}` }
      });
      epResult.status[role] = res.status;
    }

    results.push(epResult);
  }

  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
