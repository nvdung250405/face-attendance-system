import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

test.describe('Quản Lý Ca Kíp & Phân Ca Hàng Loạt (Shift Management)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page, { role: 'ADMIN' });
    await injectAuthSession(page, 'ADMIN');
  });

  test('TC-SHIFT-01: Tải danh mục ca làm việc thành công', async ({ page }) => {
    await page.goto('/admin/shifts');
    await expect(page.locator('[data-testid="admin-shift-management-view"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: /quản lý ca làm việc/i })).toBeVisible();
    await expect(page.getByText('Ca Hành Chính').first()).toBeVisible();
  });

  test('TC-SHIFT-02: Chuyển đổi giữa Tab Danh Mục Ca và Tab Lịch Phân Ca', async ({ page }) => {
    await page.goto('/admin/shifts');
    await expect(page.locator('[data-testid="admin-shift-management-view"]')).toBeVisible();

    const assignmentTab = page.locator('[data-testid="tab-assignments-btn"]');
    await expect(assignmentTab).toBeVisible();
    await assignmentTab.click();

    await expect(page.locator('[data-testid="open-assign-shift-drawer-btn"]')).toBeVisible();
  });

  test('TC-SHIFT-03: Mở Drawer Phân Ca Nhân Sự', async ({ page }) => {
    await page.goto('/admin/shifts');
    await expect(page.locator('[data-testid="admin-shift-management-view"]')).toBeVisible();

    // Chuyển sang tab Lịch Phân Ca
    await page.locator('[data-testid="tab-assignments-btn"]').click();
    const assignBtn = page.locator('[data-testid="open-assign-shift-drawer-btn"]');
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    // Xác nhận Drawer/Modal phân ca mở ra
    await expect(page.getByRole('heading', { name: /phân ca cho nhân sự|phân ca nhân sự/i }).first()).toBeVisible();
  });
});
