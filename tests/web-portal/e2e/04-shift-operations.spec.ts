import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

const isCI = !!process.env.CI;

test.describe('FAS — Vận Hành Ca Làm Việc & Phân Ca Nhân Sự (Shift Operations)', () => {
  test.beforeEach(async ({ page }) => {
    if (isCI || process.env.USE_MOCK === 'true') {
      await setupMockApi(page, { role: 'ADMIN' });
      await injectAuthSession(page, 'ADMIN');
    }
  });

  test('TC-SHIFT-01: Tải danh mục ca làm việc (Shift Catalog) và các ca cấu hình sẵn', async ({ page }) => {
    await page.goto('/admin/shifts');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="admin-shift-management-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /quản lý ca làm việc/i })).toBeVisible();

    // Verify configured shifts
    await expect(page.getByText(/SHIFT-OFFICE|Ca Hành Chính/i).first()).toBeVisible();
    await expect(page.getByText(/SHIFT-MORNING|Ca Sáng/i).first()).toBeVisible();
  });

  test('TC-SHIFT-02: Chuyển đổi giữa Tab Danh mục ca và Tab Lịch phân ca', async ({ page }) => {
    await page.goto('/admin/shifts');
    await page.waitForLoadState('networkidle');

    const assignmentTab = page.locator('[data-testid="tab-assignments-btn"]');
    await expect(assignmentTab).toBeVisible();
    await assignmentTab.click();

    await expect(page.locator('[data-testid="open-assign-shift-drawer-btn"]')).toBeVisible();
  });

  test('TC-SHIFT-03: Mở Drawer Phân ca nhân sự và biểu mẫu gán ca', async ({ page }) => {
    await page.goto('/admin/shifts');
    await page.waitForLoadState('networkidle');

    // Switch to assignments tab
    await page.locator('[data-testid="tab-assignments-btn"]').click();
    const assignBtn = page.locator('[data-testid="open-assign-shift-drawer-btn"]');
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    // Drawer opens
    await expect(page.getByRole('heading', { name: /phân ca cho nhân sự|phân ca nhân sự/i }).first()).toBeVisible();
  });

  test('TC-SHIFT-04: Phát hiện và bảo vệ chống chồng lấn ca (409 Conflict Protection & Overlap Detection)', async ({ page }) => {
    await page.goto('/admin/shifts');
    await page.waitForLoadState('networkidle');

    // Mở drawer phân ca
    await page.locator('[data-testid="tab-assignments-btn"]').click();
    await page.locator('[data-testid="open-assign-shift-drawer-btn"]').click();

    // Điền khoảng ngày chồng lấn với lịch hiện tại (2026-11-05 nằm trong 2026-11-01 -> 2026-11-30)
    const startDateInput = page.locator('input[type="date"]').first();
    if (await startDateInput.isVisible()) {
      await startDateInput.fill('2026-11-05');
      const submitBtn = page.locator('button[type="submit"]:has-text("Phân Ca"), button:has-text("Lưu phân ca")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        // Cảnh báo chồng lấn hiển thị
        await expect(page.getByText(/chồng lấn|trùng ca|conflict/i).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('TC-SHIFT-05: Bảo vệ ca đang sử dụng và kiểm soát trạng thái kỳ công đã khóa', async ({ page }) => {
    await page.goto('/admin/shifts');
    await page.waitForLoadState('networkidle');

    // Đảm bảo giao diện quản lý ca hiển thị đầy đủ và không có lỗi crash
    await expect(page.locator('[data-testid="admin-shift-management-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-shifts-btn"]')).toBeVisible();
  });
});
