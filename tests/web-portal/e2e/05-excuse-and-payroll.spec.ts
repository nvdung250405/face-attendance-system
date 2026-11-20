import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

test.describe('Quản Lý Đơn Giải Trình & Kỳ Công (Excuse & Payroll Periods)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page, { role: 'ADMIN' });
    await injectAuthSession(page, 'ADMIN');
  });

  test('TC-EXCUSE-01: Hiển thị danh sách đơn giải trình công chờ duyệt', async ({ page }) => {
    await page.goto('/admin/excuse-requests');
    await expect(page.getByRole('heading', { name: /quản lý & duyệt đơn giải trình công/i })).toBeVisible();
    await expect(page.getByText('Phạm Minh Quân').first()).toBeVisible();
    await expect(page.getByText(/gặp khách hàng đột xuất/i).first()).toBeVisible();
    await expect(page.getByText(/chờ duyệt/i).first()).toBeVisible();
  });

  test('TC-EXCUSE-02: Mở modal phê duyệt đơn giải trình và duyệt thành công', async ({ page }) => {
    await page.goto('/admin/excuse-requests');

    // Bấm nút Duyệt của đơn #1
    const approveBtn = page.locator('[data-testid="approve-btn-1"]');
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Xác nhận hộp thoại phê duyệt hiển thị
    await expect(page.getByRole('heading', { name: /phê duyệt đơn giải trình #1/i })).toBeVisible();

    // Bấm nút Xác nhận duyệt trong dialog
    const confirmBtn = page.getByRole('button', { name: 'Xác nhận duyệt' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Thông báo phê duyệt thành công
    await expect(page.getByText(/đã phê duyệt đơn giải trình.*thành công/i)).toBeVisible();
  });

  test('TC-PAYROLL-01: Xem danh sách kỳ tính công quản trị', async ({ page }) => {
    await page.goto('/admin/payroll-periods');
    await expect(page.getByRole('heading', { name: /quản lý & chốt kỳ công/i })).toBeVisible();
    await expect(page.getByText(/11\/2026/i).first()).toBeVisible();
  });
});
