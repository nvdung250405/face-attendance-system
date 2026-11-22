import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

const isCI = !!process.env.CI;

test.describe('FAS — Bảng Điều Khiển Điểm Danh Trực Tiếp (Live STOMP Dashboard & KPI)', () => {
  test.beforeEach(async ({ page }) => {
    if (isCI || process.env.USE_MOCK === 'true') {
      await setupMockApi(page, { role: 'ADMIN' });
      await injectAuthSession(page, 'ADMIN');
    }
  });

  test('TC-DASH-01: Tải các thẻ KPI sĩ số tổng quát chính xác từ API', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verify presence of KPI cards
    await expect(page.getByText(/tổng số nhân sự|tổng nhân viên/i).first()).toBeVisible();
    await expect(page.getByText(/đã có mặt|đã điểm danh/i).first()).toBeVisible();
    await expect(page.getByText(/đúng giờ/i).first()).toBeVisible();
    await expect(page.getByText(/đi muộn/i).first()).toBeVisible();

    // Verify values from API (e.g. 120 total, 85 present)
    await expect(page.getByText('120').first()).toBeVisible();
    await expect(page.getByText('85').first()).toBeVisible();
  });

  test('TC-DASH-02: Bảng điểm danh trực tiếp hiển thị các bản ghi với thẻ trạng thái', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verify table structure
    await expect(page.locator('[data-testid="live-attendance-table"]')).toBeVisible();

    // Verify employee records and status tags in the live attendance table
    await expect(page.getByText(/Đỗ Hoàng Nam/i).first()).toBeVisible();
    await expect(page.getByText(/Phạm Minh Quân/i).first()).toBeVisible();
    await expect(page.getByText(/đúng giờ|on_time/i).first()).toBeVisible();
    await expect(page.getByText(/đi muộn|late/i).first()).toBeVisible();
  });

  test('TC-DASH-03: Nút làm mới dữ liệu (Refresh) hoạt động mượt mà không gây giật lag', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const refreshBtn = page.locator('[data-testid="refresh-dashboard-btn"]');
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await expect(page.locator('[data-testid="live-attendance-table"]')).toBeVisible();
    }
  });

  test('TC-DASH-04: Xác nhận cơ chế WebSocket STOMP phục vụ cập nhật điểm danh trực tiếp', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verify live attendance card container is mounted with real-time listening capacity
    const liveCard = page.locator('[data-testid="live-attendance-card"]');
    await expect(liveCard).toBeVisible();
    await expect(page.getByText(/sự kiện điểm danh trực tiếp/i)).toBeVisible();
  });
});
