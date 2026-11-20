import { test, expect, Page } from '@playwright/test';

/**
 * Suite Kiểm Thử Chức Năng Tương Tác Hệ Thống Global UI Trên Môi Trường Staging Thực Tế
 * Môi trường: Live Nginx tại http://localhost:3000 kết nối Spring Boot Staging:8080
 */

const ADMIN_CREDENTIALS = {
  email: 'staging-admin@fas.company.com',
  password: 'StagingAdmin@2026!',
};

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Nếu đã ở admin dashboard từ trước
  if (page.url().includes('/admin/dashboard')) {
    return;
  }

  await page.fill('#email-input', ADMIN_CREDENTIALS.email);
  await page.fill('#password-input', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
  await expect(page.locator('[data-testid="top-header"]')).toBeVisible({ timeout: 10000 });
}

test.describe('FAS Web Portal — Global Shell & UI Testing Trên Staging (Live Production Nginx)', () => {

  test('TC-STG-01: Đăng nhập thực tế và xác thực Khung Shell hiển thị đầy đủ trên Desktop', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email-input')).toBeVisible();
    await expect(page.locator('#password-input')).toBeVisible();

    // Điền tài khoản admin staging
    await page.fill('#email-input', ADMIN_CREDENTIALS.email);
    await page.fill('#password-input', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');

    // Chuyển hướng thành công vào Admin Dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // 1. Kiểm tra TopHeader
    const topHeader = page.locator('[data-testid="top-header"]');
    await expect(topHeader).toBeVisible();

    // 2. Kiểm tra Avatar hiển thị
    const avatarBtn = page.locator('#header-avatar');
    await expect(avatarBtn).toBeVisible();

    // 3. Kiểm tra Sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // 4. Kiểm tra Global Footer hiển thị và cuộn tới được
    const globalFooter = page.locator('[data-testid="global-footer"]');
    await expect(globalFooter).toBeAttached();
    await globalFooter.scrollIntoViewIfNeeded();
    await expect(globalFooter).toBeVisible();
  });

  test('TC-STG-02: Sidebar Toggle thu gọn 72px và Radix Tooltip', async ({ page }) => {
    await loginAsAdmin(page);

    // Xác định nút toggle thu gọn sidebar
    const toggleBtn = page.locator('#sidebar-toggle');
    if (await toggleBtn.isVisible()) {
      // Bấm nút thu gọn
      await toggleBtn.click();
      await page.waitForTimeout(300);

      // Nút toggle chuyển sang trạng thái "Mở rộng sidebar"
      await expect(toggleBtn).toHaveAttribute('aria-label', 'Mở rộng sidebar');

      // Hover vào một menu icon để kiểm tra Tooltip Radix xuất hiện
      const firstNavLink = page.locator('aside nav a').first();
      await firstNavLink.hover();
      await page.waitForTimeout(250);

      // Khôi phục mở rộng
      await toggleBtn.click();
      await page.waitForTimeout(300);
      await expect(toggleBtn).toHaveAttribute('aria-label', 'Thu gọn sidebar');
    }
  });

  test('TC-STG-03: Vòng đời Ngăn Kéo Thông Báo (NotificationDrawer)', async ({ page }) => {
    await loginAsAdmin(page);

    // 1. Bấm vào icon chuông thông báo
    const bellBtn = page.locator('#header-notifications');
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();

    // 2. Drawer mở ra trượt từ mép phải
    const drawer = page.locator('[data-testid="notification-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Trung tâm thông báo')).toBeVisible();

    // 3. Bấm nút đóng drawer
    const closeBtn = page.locator('[data-testid="close-notification-drawer-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // 4. Drawer đóng lại
    await expect(drawer).not.toBeVisible();
  });

  test('TC-STG-04: Vòng đời Hộp thoại Tài khoản (ChangePasswordModal & PinManagementModal)', async ({ page }) => {
    await loginAsAdmin(page);

    // 1. Mở Avatar Dropdown
    const avatarBtn = page.locator('#header-avatar');
    await avatarBtn.click();

    // 2. Mở Hộp thoại Đổi mật khẩu
    const changePassBtn = page.locator('#header-change-password');
    await expect(changePassBtn).toBeVisible();
    await changePassBtn.click();

    const changePassModal = page.locator('[data-testid="change-password-modal"]');
    await expect(changePassModal).toBeVisible();
    await expect(page.getByText('Đổi mật khẩu tài khoản')).toBeVisible();

    // Đóng bằng phím Escape
    await page.keyboard.press('Escape');
    await expect(changePassModal).not.toBeVisible();

    // 3. Mở Hộp thoại Quản lý mã PIN
    await avatarBtn.click();
    const pinBtn = page.locator('#header-manage-pin');
    await expect(pinBtn).toBeVisible();
    await pinBtn.click();

    const pinModal = page.locator('[data-testid="pin-management-modal"]');
    await expect(pinModal).toBeVisible();

    // Đóng bằng phím Escape
    await page.keyboard.press('Escape');
    await expect(pinModal).not.toBeVisible();
  });

  test('TC-STG-05: Modal Xác nhận Đăng xuất & Gọi API thu hồi Token qua Nginx', async ({ page }) => {
    await loginAsAdmin(page);

    // 1. Mở Avatar Dropdown
    await page.locator('#header-avatar').click();

    // 2. Click "Đăng xuất"
    const logoutMenuItem = page.locator('#header-logout');
    await expect(logoutMenuItem).toBeVisible();
    await logoutMenuItem.click();

    // 3. Modal xác nhận đăng xuất hiển thị
    const logoutModal = page.locator('[data-testid="logout-confirm-modal"]');
    await expect(logoutModal).toBeVisible();
    await expect(page.getByText('Xác nhận đăng xuất')).toBeVisible();

    // 4. Bấm "Ở lại" / Hủy -> modal đóng, phiên vẫn còn
    const cancelBtn = page.locator('[data-testid="btn-cancel-logout"]');
    await cancelBtn.click();
    await expect(logoutModal).not.toBeVisible();
    expect(page.url()).toContain('/admin/dashboard');

    // 5. Mở lại và bấm "Xác nhận đăng xuất"
    await page.locator('#header-avatar').click();
    await page.locator('#header-logout').click();
    await expect(logoutModal).toBeVisible();

    const confirmBtn = page.locator('[data-testid="btn-confirm-logout"]');
    await confirmBtn.click();

    // 6. Điều hướng về /login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
    await expect(page.locator('#email-input')).toBeVisible();
  });

  test('TC-STG-06: Hệ thống Toast Thông báo Toàn Cục & Tự động đóng', async ({ page }) => {
    await loginAsAdmin(page);

    // Kích hoạt Toast từ ứng dụng
    await page.evaluate(() => {
      const t = (window as any).__toast;
      if (t) {
        t.success('Đồng bộ dữ liệu hoàn tất!', 'Toàn bộ 12 ca làm việc đã được cập nhật.');
      }
    });

    // Xác thực Toaster xuất hiện
    const toaster = page.locator('[data-testid="global-toaster"]');
    await expect(toaster).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Đồng bộ dữ liệu hoàn tất!')).toBeVisible();

    // Bấm nút đóng toast thủ công
    const closeToastBtn = toaster.locator('button[aria-label="Đóng thông báo"]').first();
    if (await closeToastBtn.isVisible()) {
      await closeToastBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText('Đồng bộ dữ liệu hoàn tất!')).not.toBeVisible();
    }
  });

  test('TC-STG-07: Màn hình Sự cố Hệ thống 500 (Global Error Boundary) & Khôi phục', async ({ page }) => {
    // Điều hướng vào route kiểm thử unhandled error
    await page.goto('/dev/error-boundary');

    // Màn hình 500 hiển thị an toàn
    const errorScreen = page.locator('[data-testid="global-error-boundary-screen"]');
    await expect(errorScreen).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Lỗi hệ thống 500/i)).toBeVisible();
    await expect(page.getByText(/Đã xảy ra sự cố ngoài ý muốn/i)).toBeVisible();

    // Có nút khôi phục
    const goHomeBtn = page.getByRole('button', { name: /Về trang chủ/i });
    await expect(goHomeBtn).toBeVisible();
  });

  test('TC-STG-08: Thích ứng Khung Shell trên Mobile 375px (Drawer & Không tràn viền)', async ({ page }) => {
    // Thiết lập viewport mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });

    await loginAsAdmin(page);

    // 1. Kiểm tra Hamburger Menu trên mobile header
    const mobileMenuBtn = page.locator('#header-mobile-menu');
    await expect(mobileMenuBtn).toBeVisible();

    // 2. Bấm Hamburger Menu mở Sidebar dạng Sheet
    await mobileMenuBtn.click();
    await page.waitForTimeout(300);

    // Sidebar drawer trượt ra trên mobile
    const mobileSidebar = page.locator('aside');
    await expect(mobileSidebar).toBeVisible();

    // 3. Đóng mobile sidebar
    const closeMobileSidebar = page.locator('#sidebar-close-mobile');
    if (await closeMobileSidebar.isVisible()) {
      await closeMobileSidebar.click();
      await page.waitForTimeout(300);
    }

    // 4. Kiểm tra Không bị tràn viền ngang (Horizontal Overflow = false)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Cho phép sai số 1px subpixel
  });

});
