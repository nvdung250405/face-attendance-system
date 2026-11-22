import { test, expect, Page } from '@playwright/test';
import { setupMockApi } from '../fixtures/mockApi';

/**
 * FAS RBAC & Authentication Guard Verification Test Suite
 * Dual-Mode: Live Staging (http://localhost:3000) or Mock API for fast CI.
 */

const CREDENTIALS = {
  ADMIN: {
    email: 'staging-admin@fas.company.com',
    password: 'Staging@FAS2026!',
    role: 'ADMIN',
    defaultPath: '/admin/dashboard',
  },
  HR_MANAGER: {
    email: 'hr.manager@fas.company.com',
    password: 'Staging@FAS2026!',
    role: 'HR_MANAGER',
    defaultPath: '/admin/dashboard',
  },
  DPO: {
    email: 'dpo.officer@fas.company.com',
    password: 'Staging@FAS2026!',
    role: 'DPO',
    defaultPath: '/admin/dashboard',
  },
  EMPLOYEE: {
    email: 'tech.lead@fas.company.com',
    password: 'Staging@FAS2026!',
    role: 'EMPLOYEE',
    defaultPath: '/employee/dashboard',
  },
};

const isCI = !!process.env.CI;

async function loginAs(page: Page, user: { email: string; password: string; defaultPath: string }) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('#email-input', user.email);
  await page.fill('#password-input', user.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(`**${user.defaultPath}**`, { timeout: 15000 });
}

async function ensureSidebarOpen(page: Page) {
  const sidebar = page.locator('[data-testid="sidebar"]');
  await sidebar.waitFor({ state: 'attached', timeout: 5000 });
  const isCollapsed = await sidebar.getAttribute('data-collapsed');
  if (isCollapsed === 'true') {
    const mobileMenuBtn = page.locator('#header-mobile-menu');
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
      await page.waitForTimeout(250);
    }
  }
}

test.describe('FAS — Phân Hệ Xác Thực & Phân Quyền (RBAC & Auth Guard)', () => {
  test.beforeEach(async ({ page }) => {
    if (isCI || process.env.USE_MOCK === 'true') {
      await setupMockApi(page);
    }
  });

  test('TC-AUTH-01: Chuyển hướng người dùng chưa đăng nhập về /login khi truy cập Protected Routes', async ({ page }) => {
    const protectedRoutes = [
      '/admin/dashboard',
      '/admin/employees',
      '/admin/shifts',
      '/admin/payroll-periods',
      '/admin/kiosks',
      '/admin/attendance',
      '/admin/reports',
      '/admin/excuse-requests',
      '/admin/audit-logs',
      '/employee/dashboard',
      '/employee/consent',
      '/employee/excuse-requests',
      '/employee/data-requests',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page.locator('#email-input')).toBeVisible();
      await expect(page.locator('#password-input')).toBeVisible();
    }
  });

  test('TC-AUTH-02: Xử lý thông tin xác thực sai (Negative Authentication)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Sai mật khẩu
    await page.fill('#email-input', 'staging-admin@fas.company.com');
    await page.fill('#password-input', 'WrongPassword@999');
    await page.click('button[type="submit"]');

    const errorAlert = page.locator('div[class*="text-status-danger"], [role="alert"], div:has-text("không chính xác")').first();
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*\/login/);

    // Tài khoản không tồn tại
    await page.fill('#email-input', 'nonexistent.user@fas.company.com');
    await page.fill('#password-input', 'Staging@FAS2026!');
    await page.click('button[type="submit"]');

    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('TC-AUTH-03: Persona ADMIN — Truy cập toàn bộ 9 khu vực quản trị qua Sidebar (/admin/*)', async ({ page }) => {
    await loginAs(page, CREDENTIALS.ADMIN);

    const adminNavLinks = [
      { href: '/admin/dashboard', name: 'Bảng điều khiển Live' },
      { href: '/admin/attendance', name: 'Lịch sử điểm danh' },
      { href: '/admin/employees', name: 'Hồ sơ nhân sự' },
      { href: '/admin/shifts', name: 'Ca & Phân ca' },
      { href: '/admin/payroll-periods', name: 'Chốt kỳ công' },
      { href: '/admin/excuse-requests', name: 'Duyệt giải trình' },
      { href: '/admin/reports', name: 'Báo cáo tổng hợp' },
      { href: '/admin/kiosks', name: 'Quản lý Kiosk' },
      { href: '/admin/audit-logs', name: 'Nhật ký kiểm toán' },
    ];

    for (const link of adminNavLinks) {
      await ensureSidebarOpen(page);
      const navItem = page.locator(`aside a[href="${link.href}"]`);
      await expect(navItem).toBeVisible({ timeout: 5000 });
      await navItem.click();
      await expect(page).toHaveURL(new RegExp(`.*${link.href}`));
      await expect(page.locator('[data-testid="main-viewport"]')).toBeVisible();
    }
  });

  test('TC-AUTH-04: Persona HR_MANAGER — Truy cập chức năng nhân sự, ca kíp, giải trình, bảng lương', async ({ page }) => {
    await loginAs(page, CREDENTIALS.HR_MANAGER);

    const hrNavLinks = [
      { href: '/admin/attendance', name: 'Lịch sử điểm danh' },
      { href: '/admin/employees', name: 'Hồ sơ nhân sự' },
      { href: '/admin/shifts', name: 'Ca & Phân ca' },
      { href: '/admin/payroll-periods', name: 'Chốt kỳ công' },
      { href: '/admin/excuse-requests', name: 'Duyệt giải trình' },
    ];

    for (const link of hrNavLinks) {
      await ensureSidebarOpen(page);
      const navItem = page.locator(`aside a[href="${link.href}"]`);
      await expect(navItem).toBeVisible({ timeout: 5000 });
      await navItem.click();
      await expect(page).toHaveURL(new RegExp(`.*${link.href}`));
      await expect(page.locator('[data-testid="main-viewport"]')).toBeVisible();
    }
  });

  test('TC-AUTH-05: Persona DPO — Truy cập Nhật ký kiểm toán & Chặn hiển thị menu Quản lý Nhân sự', async ({ page }) => {
    await loginAs(page, CREDENTIALS.DPO);

    // 1. DPO được phép truy cập Nhật ký kiểm toán
    await ensureSidebarOpen(page);
    const auditLogLink = page.locator('aside a[href="/admin/audit-logs"]');
    await expect(auditLogLink).toBeVisible({ timeout: 5000 });
    await auditLogLink.click();
    await expect(page).toHaveURL(/.*\/admin\/audit-logs/);
    await expect(page.locator('[data-testid="main-viewport"]')).toBeVisible();

    // 2. Chặn hiển thị trên Sidebar các mục Quản lý Nhân sự, Ca kíp, Kỳ lương, Kiosk
    await expect(page.locator('aside a[href="/admin/employees"]')).not.toBeAttached();
    await expect(page.locator('aside a[href="/admin/shifts"]')).not.toBeAttached();
    await expect(page.locator('aside a[href="/admin/payroll-periods"]')).not.toBeAttached();
    await expect(page.locator('aside a[href="/admin/kiosks"]')).not.toBeAttached();
  });

  test('TC-AUTH-06: Persona EMPLOYEE — Truy cập Tự phục vụ & Chặn hoàn toàn khỏi /admin/*', async ({ page }) => {
    await loginAs(page, CREDENTIALS.EMPLOYEE);

    // 1. Quyền truy cập các trang Employee hợp lệ qua Sidebar
    const employeeNavLinks = [
      { href: '/employee/dashboard', name: 'Bảng công của tôi' },
      { href: '/employee/excuse-requests', name: 'Đơn giải trình' },
      { href: '/employee/consent', name: 'Đăng ký sinh trắc & OTP' },
      { href: '/employee/data-requests', name: 'Yêu cầu dữ liệu cá nhân' },
    ];

    for (const link of employeeNavLinks) {
      await ensureSidebarOpen(page);
      const navItem = page.locator(`aside a[href="${link.href}"]`);
      await expect(navItem).toBeVisible({ timeout: 5000 });
      await navItem.click();
      await expect(page).toHaveURL(new RegExp(`.*${link.href}`));
      await expect(page.locator('[data-testid="main-viewport"]')).toBeVisible();
    }

    // 2. Sidebar của Employee không chứa bất kỳ liên kết /admin/* nào
    await expect(page.locator('aside a[href^="/admin"]')).not.toBeAttached();
  });
});
