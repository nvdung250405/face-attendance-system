import { test, expect } from '@playwright/test';
import { setupMockApi } from '../fixtures/mockApi';

/**
 * FAS Privacy & Informed Consent Compliance Test Suite
 * Decree 13/2023 & Decree 356/2025 Verification
 * Dual-Mode: Live Staging or Mock API for fast CI.
 */

const PASSWORD = 'Staging@FAS2026!';
const isCI = !!process.env.CI;

test.describe('FAS — Privacy & Informed Consent Compliance', () => {
  test.beforeEach(async ({ page }) => {
    if (isCI || process.env.USE_MOCK === 'true') {
      await setupMockApi(page);
    }
  });

  // ============================================================================
  // 1. PERSONA: PENDING_CONSENT (intern.hung@fas.company.com)
  // ============================================================================
  test.describe('1. PENDING_CONSENT: intern.hung@fas.company.com', () => {
    test('TC-PRIV-01: Quy trình Ký cam kết dữ liệu Nghị định 13/2023, cổng cuộn đáy (scroll-to-bottom gate), mã OTP & QR kích hoạt Kiosk', async ({ page }) => {
      // Step 1: Login as intern.hung
      await page.goto('/login');
      await page.fill('#email-input', 'intern.hung@fas.company.com');
      await page.fill('#password-input', PASSWORD);
      await page.click('button[type="submit"]');

      // Directed to employee portal
      await page.waitForURL(/.*\/employee\/.*/, { timeout: 10000 });

      // Navigate to /employee/consent
      await page.goto('/employee/consent');
      await page.waitForLoadState('networkidle');

      // Verify page title and Decree 13/2023 legal notice banner
      await expect(page.locator('h1.page-title')).toContainText('Đăng ký sinh trắc');
      await expect(page.getByText(/Nghị định 13\/2023\/NĐ-CP/i).first()).toBeVisible();

      // Verify biometric status is currently CHƯA KÍCH HOẠT
      await expect(page.locator('[data-testid="biometric-status-inactive"]')).toBeVisible();

      // Open Consent Modal if not already open
      const openModalBtn = page.locator('[data-testid="open-consent-modal-btn"]');
      if (await openModalBtn.isVisible()) {
        await openModalBtn.click();
      }

      // Verify Modal Title & Terms Container
      const modalTitle = page.locator('#consent-modal-title');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });
      await expect(modalTitle).toContainText('Cam kết');

      const termsContainer = page.locator('[data-testid="terms-container"]');
      await expect(termsContainer).toBeVisible();
      await expect(termsContainer).toContainText('13/2023/NĐ-CP');

      // Verify initial state: Checkbox and Submit button are DISABLED before scrolling
      const checkbox = page.locator('[data-testid="consent-agreement-checkbox"]');
      const submitBtn = page.locator('[data-testid="submit-consent-btn"]');

      await expect(checkbox).toBeDisabled();
      await expect(submitBtn).toBeDisabled();

      // Scroll terms container to bottom (simulating user reading the agreement)
      await termsContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        el.dispatchEvent(new Event('scroll'));
      });

      // After scrolling to bottom, Checkbox must become ENABLED
      await expect(checkbox).toBeEnabled({ timeout: 5000 });
      await checkbox.check();
      await expect(checkbox).toBeChecked();

      // Submit button must now be ENABLED
      await expect(submitBtn).toBeEnabled();

      // Click submit to sign digitally
      await submitBtn.click();

      // Verify transition to OTP / QR display step
      await expect(modalTitle).toContainText('Mã OTP Kích hoạt tại Trạm Kiosk', { timeout: 10000 });
      await expect(page.getByRole('button', { name: /Sao chép mã OTP/i })).toBeVisible();

      // Verify OTP container displays 6-digit PIN
      const otpElement = page.locator('[data-testid="otp-display-box"]');
      if (await otpElement.isVisible()) {
        const otpText = await otpElement.textContent();
        expect(otpText?.replace(/\s+/g, '')).toMatch(/^\d{6}$/);
      } else {
        await expect(page.getByText(/839\s*201|\d{6}/).first()).toBeVisible();
      }
    });
  });

  // ============================================================================
  // 2. PERSONA: CONSENT_WITHDRAWN (worker.thao@fas.company.com)
  // ============================================================================
  test.describe('2. CONSENT_WITHDRAWN: worker.thao@fas.company.com', () => {
    test('TC-PRIV-02: Vô hiệu hóa sinh trắc học và cho phép mã PIN dự phòng', async ({ page }) => {
      // Step 1: Login as worker.thao
      await page.goto('/login');
      await page.fill('#email-input', 'worker.thao@fas.company.com');
      await page.fill('#password-input', PASSWORD);
      await page.click('button[type="submit"]');

      await page.waitForURL(/.*\/employee\/.*/, { timeout: 10000 });

      // Navigate to /employee/consent
      await page.goto('/employee/consent');
      await page.waitForLoadState('networkidle');

      // Verify biometric status card shows CHƯA KÍCH HOẠT (since consent was withdrawn)
      const bioStatus = page.locator('[data-testid="biometric-status-inactive"]');
      await expect(bioStatus).toBeVisible();
      await expect(bioStatus).toHaveText('CHƯA KÍCH HOẠT');

      // Verify Fallback PIN card is active and configured
      const pinCardTitle = page.getByRole('heading', { name: 'Mã PIN dự phòng' });
      await expect(pinCardTitle).toBeVisible();
      await expect(page.getByText('ĐÃ THIẾT LẬP')).toBeVisible();
    });

    test('TC-PRIV-03: Trạm Kiosk — Xác thực mã PIN dự phòng cho nhân viên đã rút đồng thuận (worker.thao)', async ({ page }) => {
      await page.goto('/login');
      // Verify worker.thao CAN authenticate via Fallback PIN at Kiosk endpoint
      const result = await page.evaluate(async () => {
        const res = await fetch('/api/v1/kiosk/verify-pin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Kiosk-Id': 'KIOSK-HN-HQ-01',
            'X-Kiosk-Secret': 'staging-kiosk-token-hn01',
          },
          body: JSON.stringify({
            employeeCode: 'STG-OPS-004',
            pin: '123456',
          }),
        });
        return {
          status: res.status,
          body: await res.json(),
        };
      });
      expect(result.status).toBe(200);
      expect(result.body.code).toBe('PIN_VERIFIED');
      expect(result.body.data.employeeCode).toBe('STG-OPS-004');
    });
  });

  // ============================================================================
  // 3. PERSONA: DPO Governance (dpo.officer@fas.company.com)
  // ============================================================================
  test.describe('3. DPO Governance: dpo.officer@fas.company.com', () => {
    test('TC-PRIV-04: Kiểm tra Nhật ký kiểm toán, Hồ sơ cam kết và Lịch tiêu hủy sinh trắc học 20 ngày (Nghị định 356/2025)', async ({ page }) => {
      // Step A: Login as DPO officer
      await page.goto('/login');
      await page.fill('#email-input', 'dpo.officer@fas.company.com');
      await page.fill('#password-input', PASSWORD);
      await page.click('button[type="submit"]');

      await page.waitForURL(/.*\/admin\/.*/, { timeout: 10000 });

      // Navigate to /admin/audit-logs
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // Verify Read-Only compliance banner
      const banner = page.locator('[data-testid="read-only-compliance-banner"]');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('Chế độ Tra cứu Chỉ Đọc');

      // Verify Tab 2: Hồ sơ Cam kết DPO
      const consentsTab = page.locator('[data-testid="tab-dpo-consents"]');
      await expect(consentsTab).toBeVisible();
      await consentsTab.click();

      const consentsTable = page.locator('[data-testid="dpo-consents-table"]');
      await expect(consentsTable).toBeVisible({ timeout: 5000 });

      // Verify Tab 3: Lịch Tiêu hủy Sinh trắc học (Decree 356/2025 20-day retention & Decree 13/2023)
      const retentionTab = page.locator('[data-testid="tab-retention-schedule"]');
      await expect(retentionTab).toBeVisible();
      await retentionTab.click();

      const retentionTable = page.locator('[data-testid="retention-schedule-table"]');
      await expect(retentionTable).toBeVisible({ timeout: 5000 });

      // Verify STG-OPS-005 (Trần Đình Tuấn - terminated employee) has scheduled 20-day disposal
      await expect(retentionTable.getByText(/STG-OPS-005|Trần Đình Tuấn/i).first()).toBeVisible();
    });
  });
});
