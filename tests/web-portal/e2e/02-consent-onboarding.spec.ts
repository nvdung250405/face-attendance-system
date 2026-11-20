import { test, expect } from '@playwright/test';
import { setupMockApi, injectAuthSession } from '../fixtures/mockApi';

test.describe('Quy Trình Onboarding & Ký Cam Kết Dữ Liệu (Informed Consent Flow)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page, {
      role: 'EMPLOYEE',
      status: 'PENDING_CONSENT',
      hasBiometric: false,
    });
    await injectAuthSession(page, 'EMPLOYEE', {
      status: 'PENDING_CONSENT',
      hasBiometric: false,
    });
  });

  const ensureConsentModalOpen = async (page: any) => {
    await page.goto('/employee/consent');
    const modalTitle = page.locator('#consent-modal-title');
    if (!(await modalTitle.isVisible())) {
      const openBtn = page.locator('[data-testid="open-consent-modal-btn"]');
      await openBtn.click();
    }
    await expect(modalTitle).toBeVisible();
  };

  test('TC-CONSENT-01: Hiển thị Hộp thoại Cam kết dữ liệu cá nhân cho nhân viên mới', async ({ page }) => {
    await ensureConsentModalOpen(page);
    await expect(page.locator('#consent-modal-title')).toBeVisible();
    await expect(page.locator('[data-testid="terms-container"]')).toBeVisible();
    await expect(page.getByText(/Nghị định 13\/2023/i).first()).toBeVisible();
  });

  test('TC-CONSENT-02: Bắt buộc cuộn hoặc tích chọn đồng ý trước khi kích hoạt nút Ký điện tử', async ({ page }) => {
    await ensureConsentModalOpen(page);

    const checkbox = page.locator('[data-testid="consent-agreement-checkbox"]');
    const submitBtn = page.locator('[data-testid="submit-consent-btn"]');

    // Ban đầu chưa cuộn -> checkbox bị disabled, nút ký bị disabled
    await expect(checkbox).toBeDisabled();
    await expect(submitBtn).toBeDisabled();

    // Cuộn xuống đáy văn bản điều khoản
    const termsContainer = page.locator('[data-testid="terms-container"]');
    await termsContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });

    // Checkbox được mở khóa
    await expect(checkbox).toBeEnabled();
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Nút ký được mở khóa
    await expect(submitBtn).toBeEnabled();
  });

  test('TC-CONSENT-03: Ký cam kết thành công nhận mã OTP 6 số và QR Code kích hoạt trạm Kiosk', async ({ page }) => {
    await ensureConsentModalOpen(page);

    // Cuộn xuống đáy
    const termsContainer = page.locator('[data-testid="terms-container"]');
    await termsContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });

    // Tích chọn đồng ý và gửi
    await page.locator('[data-testid="consent-agreement-checkbox"]').check();
    await page.locator('[data-testid="submit-consent-btn"]').click();

    // Modal chuyển sang bước OTP_DISPLAY
    await expect(page.locator('#consent-modal-title')).toHaveText('Mã OTP Kích hoạt tại Trạm Kiosk');
    await expect(page.getByText(/839\s*201/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sao chép mã OTP' })).toBeVisible();
  });
});
