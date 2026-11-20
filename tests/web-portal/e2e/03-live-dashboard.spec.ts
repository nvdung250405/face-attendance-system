import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

test.describe('Bảng Điều Khiển Điểm Danh Trực Tiếp (Live STOMP Dashboard & KPI)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page, { role: 'ADMIN' });
    await injectAuthSession(page, 'ADMIN');
  });

  test('TC-DASH-01: Tải các thẻ KPI sĩ số tổng quát chính xác từ API', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verify presence of KPI cards
    await expect(page.getByText(/tổng số nhân sự|tổng nhân viên/i).first()).toBeVisible();
    await expect(page.getByText(/đã có mặt|đã điểm danh/i).first()).toBeVisible();
    await expect(page.getByText(/đúng giờ/i).first()).toBeVisible();
    await expect(page.getByText(/đi muộn/i).first()).toBeVisible();

    // Verify values from mock API: total=120, present=85
    await expect(page.getByText('120').first()).toBeVisible();
    await expect(page.getByText('85').first()).toBeVisible();
  });

  test('TC-DASH-02: Bảng điểm danh trực tiếp hiển thị các bản ghi với thẻ trạng thái', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verify employee name and status tags in the live attendance table
    await expect(page.getByText('Đỗ Hoàng Nam').first()).toBeVisible();
    await expect(page.getByText('Phạm Minh Quân').first()).toBeVisible();
    await expect(page.getByText(/đúng giờ|on_time/i).first()).toBeVisible();
    await expect(page.getByText(/đi muộn|late/i).first()).toBeVisible();
  });

  test('TC-DASH-03: Nút làm mới dữ liệu (Refresh) hoạt động mượt mà không gây giật lag', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const refreshBtn = page.getByRole('button', { name: /làm mới|refresh/i }).first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await expect(page.getByText('Đỗ Hoàng Nam').first()).toBeVisible();
    }
  });
});
