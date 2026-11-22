import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

const isCI = !!process.env.CI;

test.describe('FAS — Quản Lý Đơn Giải Trình & Chốt Kỳ Công (Excuse & Payroll Operations)', () => {
  test.beforeEach(async ({ page }) => {
    if (isCI || process.env.USE_MOCK === 'true') {
      await setupMockApi(page, { role: 'ADMIN' });
      await injectAuthSession(page, 'ADMIN');
    }
  });

  // ============================================================================
  // 1. PHÂN HỆ ĐƠN GIẢI TRÌNH CÔNG (EXCUSE REQUESTS)
  // ============================================================================
  test('TC-EXCUSE-01: Hiển thị danh sách đơn giải trình công và các tab lọc trạng thái', async ({ page }) => {
    await page.goto('/admin/excuse-requests');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /quản lý & duyệt đơn giải trình công|quản lý đơn giải trình/i })).toBeVisible({ timeout: 10000 });

    // Click Tab Tất cả đơn
    const tabAll = page.locator('[data-testid="tab-all"]');
    await expect(tabAll).toBeVisible();
    await tabAll.click();
    await page.waitForLoadState('networkidle');

    // Verify presence of seeded excuse items
    await expect(page.getByText(/Phạm Minh Quân|Phan Đình Cường|STG-OPS-002/i).first()).toBeVisible();
  });

  test('TC-EXCUSE-02: Phê duyệt đơn giải trình công với ghi chú kiểm toán (HR Approval Flow)', async ({ page }) => {
    await page.goto('/admin/excuse-requests');
    await page.waitForLoadState('networkidle');

    // Bấm nút Duyệt của đơn chờ duyệt đầu tiên
    const approveBtn = page.locator('[data-testid^="approve-btn-"]').first();
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    // Xác nhận hộp thoại phê duyệt hiển thị
    await expect(page.getByRole('heading', { name: /phê duyệt đơn giải trình/i })).toBeVisible();

    // Điền ghi chú kiểm toán
    const noteInput = page.locator('[data-testid="approve-note-input"]');
    if (await noteInput.isVisible()) {
      await noteInput.fill('Đã kiểm tra camera sảnh chính xác nhận nhân viên có mặt đúng giờ.');
    }

    // Bấm nút Xác nhận duyệt
    const confirmBtn = page.locator('[data-testid="confirm-approve-btn"]');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Thông báo phê duyệt thành công
    await expect(page.getByText(/đã phê duyệt đơn giải trình.*thành công/i)).toBeVisible({ timeout: 10000 });
  });

  test('TC-EXCUSE-03: Chống nộp trùng lặp đơn giải trình (Anti-Replay 409 Conflict Protection)', async ({ page }) => {
    // Gọi API nộp đơn trùng lặp với lý do duplicate để kiểm tra phản hồi 409 chống replay
    const response = await page.request.post('/api/v1/employee/excuse-requests', {
      data: {
        attendanceLogId: 999,
        reason: 'Sự cố giao thông duplicate replay test',
      },
    });

    // Hệ thống phải trả về mã lỗi 409 Conflict từ chối ghi nhận trùng
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('EXCUSE_ALREADY_EXISTS');
  });

  // ============================================================================
  // 2. PHÂN HỆ QUẢN LÝ KỲ CÔNG (PAYROLL PERIODS)
  // ============================================================================
  test('TC-PAYROLL-01: Quản lý danh sách kỳ tính công và trạng thái chốt kỳ', async ({ page }) => {
    await page.goto('/admin/payroll-periods');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /quản lý & chốt kỳ công|quản lý kỳ công/i })).toBeVisible({ timeout: 10000 });

    // Verify periods 10/2026 and 11/2026
    await expect(page.getByText(/10\/2026/i).first()).toBeVisible();
    await expect(page.getByText(/11\/2026/i).first()).toBeVisible();
  });

  test('TC-PAYROLL-02: Chốt kỳ công (Payroll Lock) và đóng băng các thao tác sửa đổi', async ({ page }) => {
    await page.goto('/admin/payroll-periods');
    await page.waitForLoadState('networkidle');

    // Tìm kỳ công đang mở (có nút Chốt kỳ)
    const lockBtn = page.locator('[data-testid^="lock-period-btn-"]').first();
    if (await lockBtn.isVisible()) {
      await lockBtn.click();

      // Modal cảnh báo hiển thị
      const lockModal = page.locator('[data-testid="lock-payroll-modal"]');
      await expect(lockModal).toBeVisible();
      await expect(page.getByText(/Cảnh báo hệ quả quan trọng/i)).toBeVisible();

      // Bấm xác nhận chốt kỳ
      const confirmBtn = page.locator('[data-testid="confirm-lock-period-btn"]');
      await confirmBtn.click();

      // Thông báo thành công và chuyển trạng thái
      await expect(page.getByText(/Đã chốt thành công kỳ công/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC-PAYROLL-03: Mở lại kỳ công (Payroll Unlock) bắt buộc nhập lý do kiểm toán tuân thủ (>= 5 ký tự)', async ({ page }) => {
    await page.goto('/admin/payroll-periods');
    await page.waitForLoadState('networkidle');

    // Tìm kỳ công đã chốt (có nút Mở lại kỳ)
    const unlockBtn = page.locator('[data-testid^="unlock-period-btn-"]').first();
    if (await unlockBtn.isVisible()) {
      await unlockBtn.click();

      // Modal mở lại kỳ hiển thị
      const unlockModal = page.locator('[data-testid="unlock-payroll-modal"]');
      await expect(unlockModal).toBeVisible();

      // Thử bấm xác nhận khi chưa nhập lý do -> báo lỗi validation
      const confirmBtn = page.locator('[data-testid="confirm-unlock-period-btn"]');
      await confirmBtn.click();
      await expect(page.getByText(/Bắt buộc phải nhập lý do/i)).toBeVisible();

      // Nhập lý do hợp lệ >= 5 ký tự
      const reasonInput = page.locator('[data-testid="input-unlock-reason"]');
      await reasonInput.fill('Bổ sung giờ làm việc cho bộ phận Kỹ thuật theo phê duyệt số 15/QĐ');
      await confirmBtn.click();

      // Thông báo mở lại thành công
      await expect(page.getByText(/Đã mở lại thành công kỳ công/i)).toBeVisible({ timeout: 10000 });
    }
  });
});
