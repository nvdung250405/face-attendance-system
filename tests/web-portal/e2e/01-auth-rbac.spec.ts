import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

test.describe('Phân Hệ Xác Thực & Phân Quyền (RBAC & Auth Guard)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
  });

  test('TC-AUTH-01: Chuyển hướng người dùng chưa đăng nhập về trang /login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('#email-input')).toBeVisible();
    await expect(page.locator('#password-input')).toBeVisible();
  });

  test('TC-AUTH-02: Báo lỗi khi nhập sai thông tin xác thực', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email-input', 'invalid@company.com');
    await page.fill('#password-input', 'wrong');
    await page.click('button[type="submit"]');

    const errorAlert = page.locator('div[class*="text-status-danger"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/không chính xác|không thành công/i);
  });

  test('TC-AUTH-03: Đăng nhập thành công với vai trò ADMIN và điều hướng vào Admin Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email-input', 'admin@company.com');
    await page.fill('#password-input', 'Admin@123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    await expect(page.locator('[data-testid="admin-dashboard-view"]')).toBeVisible();
  });

  test('TC-AUTH-04: Đăng nhập thành công với vai trò EMPLOYEE và điều hướng vào Employee Dashboard', async ({ page }) => {
    await setupMockApi(page, { role: 'EMPLOYEE' });
    await page.goto('/login');
    await page.fill('#email-input', 'nam.dh@company.com');
    await page.fill('#password-input', 'Employee@123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/employee\/dashboard/);
    await expect(page.getByText(/bảng công|thông tin cá nhân|điểm danh/i).first()).toBeVisible();
  });

  test('TC-AUTH-05: Bảo vệ đường dẫn Admin - Employee không thể truy cập /admin/audit-logs', async ({ page }) => {
    await injectAuthSession(page, 'EMPLOYEE');
    await page.goto('/admin/audit-logs');
    // Router either redirects to unauthorized or back to employee dashboard
    await expect(page).not.toHaveURL(/.*\/admin\/audit-logs/);
  });
});
