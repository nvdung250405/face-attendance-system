import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { setupMockApi, injectAuthSession } from "../fixtures/mockApi";
import {
  runAutomatedAudit,
  setupConsoleCollector,
} from "../helpers/inTestAudit";
import manifestData from "../fixtures/screens.manifest.json";

const REPO_ROOT = process.cwd();
const manifest = manifestData as any[];

const filter = (process.env.VISUAL_FILTER || "").trim().toLowerCase();
const activeScenarios = filter
  ? manifest.filter(
      (s: any) =>
        s.id.toLowerCase().includes(filter) ||
        s.name.toLowerCase().includes(filter) ||
        s.group.toLowerCase().includes(filter) ||
        (s.subgroup && s.subgroup.toLowerCase().includes(filter)) ||
        (s.featureId && s.featureId.toLowerCase().includes(filter)),
    )
  : manifest;

const screenshotDir = path.resolve(REPO_ROOT, "tests/reports/web-portal/screenshots");
const auditReportPath = path.resolve(
  REPO_ROOT,
  "tests/reports/web-portal/audit_results.json",
);

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

interface RecordedResult {
  id: string;
  name: string;
  group: string;
  passed: boolean;
  issues: any[];
}

const recordedResults: RecordedResult[] = [];

test.describe("FAS Web Portal — Modular UI Testing Pipeline (50 Scenarios)", () => {
  test.afterAll(async () => {
    if (recordedResults.length > 0) {
      let existingResults: RecordedResult[] = [];
      if (fs.existsSync(auditReportPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(auditReportPath, "utf-8"));
          if (Array.isArray(parsed.results)) {
            existingResults = parsed.results;
          }
        } catch {
          // ignore
        }
      }

      const mergedMap = new Map<string, RecordedResult>();
      for (const r of existingResults) {
        mergedMap.set(r.id, r);
      }
      for (const r of recordedResults) {
        mergedMap.set(r.id, r);
      }

      const finalResults = Array.from(mergedMap.values());
      const passedCount = finalResults.filter((r) => r.passed).length;
      const failedCount = finalResults.filter((r) => !r.passed).length;
      const issuesCount = finalResults.reduce(
        (acc, r) => acc + (r.issues?.length || 0),
        0,
      );

      const auditSummary = {
        total: finalResults.length,
        passed: passedCount,
        failed: failedCount,
        issuesCount,
        timestamp: new Date().toISOString(),
        results: finalResults,
      };

      fs.writeFileSync(
        auditReportPath,
        JSON.stringify(auditSummary, null, 2),
        "utf-8",
      );
      console.log(
        `[06-visual-responsive] Đã cập nhật audit report tại: ${auditReportPath}`,
      );
    }
  });

  for (const s of activeScenarios) {
    test(`[${s.id}] ${s.name}`, async ({ page }) => {
      // 1. Setup console collector
      const consoleCollector = setupConsoleCollector(page);

      // 2. Set viewport
      await page.setViewportSize(s.viewport);

      // 3. Freeze clock determinism
      await page.clock.setFixedTime(new Date("2026-11-10T08:00:00+07:00"));

      // 4. Setup mock API and authentication
      const isConsentPending =
        s.id === "UI-40" ||
        s.id === "UI-41" ||
        s.id === "UI-42" ||
        s.id === "UI-43";
      const mockOptions = {
        role: (s.role === "PUBLIC" ? "ADMIN" : s.role) as any,
        status: (isConsentPending ? "PENDING_CONSENT" : "ACTIVE") as any,
        hasBiometric: isConsentPending ? false : true,
        emptyNotifications: s.id === "UI-11" || s.id === "UI-71",
        emptyAttendance: s.id === "UI-16",
        longEmployeeName: s.id === "UI-48",
      };
      await setupMockApi(page, mockOptions);

      if (s.role !== "PUBLIC") {
        await injectAuthSession(page, s.role, {
          status: isConsentPending ? "PENDING_CONSENT" : "ACTIVE",
          hasBiometric: isConsentPending ? false : true,
        });
      }

      // Automatically accept confirm dialogs if any (e.g. reissue token window.confirm)
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      // 5. Navigate to route
      await page.goto(s.route, { waitUntil: "domcontentloaded" });

      // 6. Disable animations & transitions & caret for visual stability
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
            caret-color: transparent !important;
          }
        `,
      });

      // Wait for network idle or reasonable DOM stabilization
      await page.waitForLoadState("networkidle").catch(() => {});

      // 7. Scenario-specific interaction dispatch
      switch (s.id) {
        case "UI-01":
        case "UI-02": {
          await expect(
            page
              .getByRole("heading", {
                name: /đăng nhập cổng web|cổng quản trị/i,
              })
              .first(),
          ).toBeVisible();
          break;
        }

        case "UI-03": {
          await page.locator('button[type="submit"]').click();
          await page.waitForTimeout(100);
          break;
        }

        case "UI-04": {
          await page
            .locator('#email-input, input[type="email"], input[type="text"]')
            .first()
            .fill("invalid@company.com");
          await page
            .locator('#password-input, input[type="password"]')
            .first()
            .fill("wrong");
          await page.locator('button[type="submit"]').click();
          await expect(
            page.getByText(/không chính xác|thất bại/i).first(),
          ).toBeVisible();
          break;
        }

        case "UI-05": {
          await expect(
            page.getByText(/403|không có quyền/i).first(),
          ).toBeVisible();
          break;
        }

        case "UI-06": {
          await expect(page.getByText(/404/i).first()).toBeVisible();
          break;
        }

        case "UI-07": {
          await page.locator("#header-avatar").click();
          await expect(page.locator('[role="menu"]')).toBeVisible();
          break;
        }

        case "UI-08": {
          await page.locator("#header-avatar").click();
          await page.locator("#header-change-password").click();
          await expect(
            page.locator('[data-testid="change-password-modal"]'),
          ).toBeVisible();
          break;
        }

        case "UI-09": {
          await page.locator("#header-avatar").click();
          await page.locator("#header-manage-pin").click();
          await expect(
            page.locator('[data-testid="pin-management-modal"]'),
          ).toBeVisible();
          break;
        }

        case "UI-10": {
          await page.locator("#header-notifications").click();
          await expect(
            page.locator('[data-testid="close-notification-drawer-btn"]'),
          ).toBeVisible();
          break;
        }

        case "UI-11": {
          await page.locator("#header-notifications").click();
          await expect(page.getByText(/chưa có thông báo nào/i)).toBeVisible();
          break;
        }

        case "UI-12": {
          await page.locator("#header-mobile-menu").click();
          await page.waitForTimeout(150);
          break;
        }

        case "UI-13": {
          await expect(
            page.locator('[data-testid="admin-dashboard-view"]'),
          ).toBeVisible();
          break;
        }

        case "UI-14": {
          await expect(
            page.locator('[data-testid="admin-dashboard-view"]'),
          ).toBeVisible();
          await page.evaluate(() => {
            const row = document.querySelector("tbody tr");
            if (row) {
              row.className =
                row.className +
                " bg-emerald-50/90 ring-2 ring-emerald-400 ring-inset";
            }
          });
          break;
        }

        case "UI-15": {
          await expect(
            page
              .getByRole("heading", {
                name: /bảng chấm công hr trực tiếp|chấm công hr/i,
              })
              .first(),
          ).toBeVisible();
          break;
        }

        case "UI-16": {
          await expect(
            page
              .getByText(
                /chưa có lượt điểm danh nào phù hợp|không có dữ liệu|chưa có lượt/i,
              )
              .first(),
          ).toBeVisible();
          break;
        }

        case "UI-17": {
          const adjustBtn = page.locator(
            '[data-testid="adjust-record-btn-1001"]',
          );
          await expect(adjustBtn).toBeVisible();
          await adjustBtn.click();
          await expect(
            page
              .getByRole("heading", { name: /điều chỉnh|sửa quẹt thẻ/i })
              .first(),
          ).toBeVisible();
          break;
        }

        case "UI-18": {
          await expect(
            page.getByRole("heading", { name: /hồ sơ nhân sự/i }),
          ).toBeVisible();
          await expect(page.getByText("Đỗ Hoàng Nam").first()).toBeVisible();
          break;
        }

        case "UI-19": {
          const addBtn = page.locator('[data-testid="btn-add-employee"]');
          await expect(addBtn).toBeVisible();
          await addBtn.click();
          await expect(page.locator("#employee-drawer-title")).toBeVisible();
          break;
        }

        case "UI-20": {
          const deactivateBtn = page
            .locator('button[title="Vô hiệu hóa"]')
            .first();
          await expect(deactivateBtn).toBeVisible();
          await deactivateBtn.click();
          await expect(
            page.locator('[data-testid="btn-confirm-action"]'),
          ).toBeVisible();
          break;
        }

        case "UI-21": {
          await expect(
            page.locator('[data-testid="admin-shift-management-view"]'),
          ).toBeVisible();
          await expect(page.getByText("Ca Hành Chính").first()).toBeVisible();
          break;
        }

        case "UI-22": {
          await page
            .locator('[data-testid="open-create-shift-drawer-btn"]')
            .click();
          await expect(
            page.getByText(/tạo mới ca làm việc|tạo ca làm việc/i).first(),
          ).toBeVisible();
          break;
        }

        case "UI-23": {
          await page.locator('[data-testid="tab-assignments-btn"]').click();
          await expect(
            page.locator('[data-testid="open-assign-shift-drawer-btn"]'),
          ).toBeVisible();
          break;
        }

        case "UI-24": {
          await page.locator('[data-testid="tab-assignments-btn"]').click();
          await page
            .locator('[data-testid="open-assign-shift-drawer-btn"]')
            .click();
          await expect(
            page.locator('[data-testid="assign-shift-drawer"]'),
          ).toBeVisible();
          break;
        }

        case "UI-25": {
          await page.locator('[data-testid="tab-assignments-btn"]').click();
          await page
            .locator('[data-testid="open-assign-shift-drawer-btn"]')
            .click();
          await expect(
            page.locator('[data-testid="assign-shift-drawer"]'),
          ).toBeVisible();
          await page.locator('[data-testid="mode-multi-btn"]').click();
          await page.locator('[data-testid="checkbox-employee-101"]').check();
          await page.locator('[data-testid="checkbox-employee-102"]').check();
          await expect(
            page.locator('[data-testid="submit-assign-shift-btn"]'),
          ).toBeEnabled();
          break;
        }

        case "UI-26": {
          await expect(
            page.locator('[data-testid="admin-payroll-period-view"]'),
          ).toBeVisible();
          break;
        }

        case "UI-27": {
          const lockBtn = page.locator('[data-testid="lock-period-btn-1"]');
          await expect(lockBtn).toBeVisible();
          await lockBtn.click();
          await expect(
            page.locator('[data-testid="lock-payroll-modal"]'),
          ).toBeVisible();
          break;
        }

        case "UI-28": {
          await expect(
            page.locator('[data-testid="admin-excuse-management-view"]'),
          ).toBeVisible();
          break;
        }

        case "UI-29": {
          await page.locator('[data-testid="tab-approved"]').click();
          await page.waitForTimeout(100);
          break;
        }

        case "UI-30": {
          const approveBtn = page.locator('[data-testid="approve-btn-1"]');
          await expect(approveBtn).toBeVisible();
          await approveBtn.click();
          await expect(
            page.getByRole("heading", { name: /phê duyệt đơn giải trình #1/i }),
          ).toBeVisible();
          break;
        }

        case "UI-31": {
          const rejectBtn = page.locator('[data-testid="reject-btn-1"]');
          await expect(rejectBtn).toBeVisible();
          await rejectBtn.click();
          await expect(
            page.getByRole("heading", { name: /từ chối đơn giải trình #1/i }),
          ).toBeVisible();
          break;
        }

        case "UI-32": {
          await expect(
            page.locator('[data-testid="kiosk-management-table"]'),
          ).toBeVisible();
          break;
        }

        case "UI-33": {
          const registerBtn = page.locator(
            '[data-testid="open-register-kiosk-btn"]',
          );
          await expect(registerBtn).toBeVisible();
          await registerBtn.click();
          await expect(page.locator("#kiosk-registration-title")).toBeVisible();
          break;
        }

        case "UI-34": {
          const reissueBtn = page.locator(
            '[data-testid="reissue-token-btn-KIOSK-LOBBY-01"]',
          );
          await expect(reissueBtn).toBeVisible();
          await reissueBtn.click();
          await expect(
            page.locator('[data-testid="reissued-token-value"]'),
          ).toBeVisible();
          break;
        }

        case "UI-35": {
          await expect(
            page.locator('[data-testid="audit-logs-table"]'),
          ).toBeVisible();
          break;
        }

        case "UI-36": {
          const diffBtn = page
            .getByRole("button", { name: /xem diff/i })
            .first();
          await expect(diffBtn).toBeVisible();
          await diffBtn.click();
          await expect(
            page.getByRole("heading", { name: /chi tiết kiểm toán/i }).first(),
          ).toBeVisible();
          break;
        }

        case "UI-37": {
          await page.locator('[data-testid="tab-dpo-consents"]').click();
          await expect(
            page.locator('[data-testid="dpo-consents-table"]'),
          ).toBeVisible();
          break;
        }

        case "UI-38": {
          await page.locator('[data-testid="tab-retention-schedule"]').click();
          await expect(
            page.locator('[data-testid="retention-schedule-table"]'),
          ).toBeVisible();
          break;
        }

        case "UI-39": {
          await expect(
            page.locator('[data-testid="employee-dashboard-view"]'),
          ).toBeVisible();
          break;
        }

        case "UI-40": {
          await expect(
            page.getByRole("heading", {
              name: /đăng ký sinh trắc & informed consent/i,
            }),
          ).toBeVisible();
          break;
        }

        case "UI-41": {
          const openConsentBtn = page.locator(
            '[data-testid="open-consent-modal-btn"]',
          );
          await expect(openConsentBtn).toBeVisible();
          await openConsentBtn.click();
          await expect(page.locator("#consent-modal-title")).toBeVisible();
          break;
        }

        case "UI-42": {
          const openConsentBtn = page.locator(
            '[data-testid="open-consent-modal-btn"]',
          );
          await expect(openConsentBtn).toBeVisible();
          await openConsentBtn.click();
          const termsContainer = page.locator(
            '[data-testid="terms-container"]',
          );
          await termsContainer.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
            el.dispatchEvent(new Event("scroll"));
          });
          await page
            .locator('[data-testid="consent-agreement-checkbox"]')
            .check();
          await expect(
            page.locator('[data-testid="submit-consent-btn"]'),
          ).toBeEnabled();
          break;
        }

        case "UI-43": {
          const openConsentBtn = page.locator(
            '[data-testid="open-consent-modal-btn"]',
          );
          await expect(openConsentBtn).toBeVisible();
          await openConsentBtn.click();
          const termsContainer = page.locator(
            '[data-testid="terms-container"]',
          );
          await termsContainer.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
            el.dispatchEvent(new Event("scroll"));
          });
          await page
            .locator('[data-testid="consent-agreement-checkbox"]')
            .check();
          await page.locator('[data-testid="submit-consent-btn"]').click();
          await expect(page.locator("#consent-modal-title")).toHaveText(
            "Mã OTP Kích hoạt tại Trạm Kiosk",
          );
          break;
        }

        case "UI-44": {
          await expect(
            page.locator('[data-testid="employee-excuse-history-view"]'),
          ).toBeVisible();
          break;
        }

        case "UI-45": {
          await page.locator('[data-testid="create-excuse-btn"]').click();
          await expect(
            page.getByRole("heading", { name: /nộp đơn giải trình công/i }),
          ).toBeVisible();
          break;
        }

        case "UI-46": {
          await page.locator('[data-testid="create-excuse-btn"]').click();
          await expect(
            page.getByRole("heading", { name: /nộp đơn giải trình công/i }),
          ).toBeVisible();
          await page
            .locator('[data-testid="excuse-reason-input"]')
            .fill("Gặp khách hàng đột xuất buổi sáng tại chi nhánh Ba Đình");
          break;
        }

        case "UI-47": {
          await expect(
            page
              .getByRole("heading", {
                name: /yêu cầu dữ liệu cá nhân|quyền chủ thể dữ liệu/i,
              })
              .first(),
          ).toBeVisible();
          break;
        }

        case "UI-48": {
          await expect(
            page.getByRole("heading", { name: /hồ sơ nhân sự/i }),
          ).toBeVisible();
          await expect(
            page
              .getByText(
                "Nguyễn Hoàng Công Tằng Tôn Nữ Long Vân Trúc Mai Thị Hoa",
              )
              .first(),
          ).toBeVisible();
          break;
        }

        case "UI-49": {
          await expect(
            page.locator('[data-testid="admin-dashboard-view"]'),
          ).toBeVisible();
          break;
        }

        case "UI-50": {
          await page.locator('[data-testid="create-excuse-btn"]').click();
          await expect(
            page.getByRole("heading", { name: /nộp đơn giải trình công/i }),
          ).toBeVisible();
          break;
        }

        case "UI-51": {
          await page.locator("#header-avatar").click();
          await page.locator("#header-logout").click();
          await expect(
            page.locator('[data-testid="logout-confirm-modal"]'),
          ).toBeVisible();
          break;
        }

        case "UI-52": {
          await expect(
            page.locator('[data-testid="global-footer"]'),
          ).toBeVisible();
          await page
            .locator('[data-testid="global-footer"]')
            .scrollIntoViewIfNeeded();
          await page.waitForTimeout(100);
          break;
        }

        case "UI-53": {
          await page.evaluate(() => {
            const t = (window as any).__toast;
            if (t) {
              t.success(
                "Đã lưu cấu hình ca làm việc thành công!",
                "Dữ liệu phân ca tháng 11/2026 đã sẵn sàng.",
              );
              t.warning(
                "Cảnh báo nhân viên chưa ký cam kết",
                "3 nhân viên mới chưa hoàn tất Informed Consent.",
              );
              t.error(
                "Lỗi kết nối trạm Kiosk Cổng A",
                "Mất kết nối heartbeat quá 60 giây.",
              );
              t.info(
                "Phiên bản hệ thống v2.4.0",
                "Bản vá bảo mật NĐ 13/2023 đã áp dụng.",
              );
            }
          });
          await page.waitForTimeout(200);
          break;
        }

        case "UI-54": {
          await expect(
            page.locator('[data-testid="global-error-boundary-screen"]'),
          ).toBeVisible();
          break;
        }

        case "UI-55": {
          const toggleBtn = page.locator("#sidebar-toggle");
          if (await toggleBtn.isVisible()) {
            await toggleBtn.click();
            await page.waitForTimeout(200);
          }
          const firstNavItem = page.locator("aside nav a").first();
          if (await firstNavItem.isVisible()) {
            await firstNavItem.hover();
            await page.waitForTimeout(300);
          }
          break;
        }

        case "UI-56": {
          await expect(
            page.getByRole("heading", { name: /FAS Global UI|FAS Design System/i }),
          ).toBeVisible();
          break;
        }

        case "UI-57": {
          await expect(page.locator('[data-testid="top-header"]')).toBeVisible();
          await expect(page.locator('#header-mobile-menu')).toBeVisible();
          break;
        }

        case "UI-58": {
          await page.locator('#header-avatar').click();
          await page.locator('#header-logout').click();
          await expect(
            page.locator('[data-testid="logout-confirm-modal"]'),
          ).toBeVisible();
          break;
        }

        case "UI-59": {
          await page.locator('#header-avatar').click();
          await page.locator('#header-change-password').click();
          await expect(
            page.locator('[data-testid="change-password-modal"]'),
          ).toBeVisible();
          break;
        }

        case "UI-60": {
          await page.evaluate(() => {
            const t = (window as any).__toast;
            if (t) {
              t.success('Điểm danh thành công!', 'Ca làm việc sáng đã được ghi nhận.');
              t.warning('Sắp đến giờ kết thúc ca', 'Vui lòng kiểm tra lại giờ quẹt thẻ.');
            }
          });
          await page.waitForTimeout(200);
          break;
        }

        case "UI-61": {
          await page.locator('#header-avatar').click();
          await page.locator('#header-manage-pin').click();
          await expect(
            page.locator('[data-testid="pin-management-modal"]'),
          ).toBeVisible();
          break;
        }

        case "UI-62": {
          await page.locator('#header-notifications').click();
          await expect(
            page.locator('[data-testid="close-notification-drawer-btn"]'),
          ).toBeVisible();
          break;
        }

        case "UI-63": {
          await expect(
            page.locator('[data-testid="global-error-boundary-screen"]'),
          ).toBeVisible();
          break;
        }

        case "UI-64": {
          await expect(page.getByText('404')).toBeVisible();
          break;
        }

        case "UI-65": {
          await expect(page.getByText('403')).toBeVisible();
          break;
        }

        case "UI-66": {
          await expect(
            page.locator('[data-testid="global-footer"]'),
          ).toBeVisible();
          await page.locator('[data-testid="global-footer"]').scrollIntoViewIfNeeded();
          break;
        }

        case "UI-67": {
          await expect(
            page.getByRole("heading", { name: /FAS Global UI|FAS Design System/i }),
          ).toBeVisible();
          break;
        }

        case "UI-68": {
          await page.locator('button[type="submit"]').click();
          await page.waitForTimeout(100);
          break;
        }

        case "UI-69": {
          await page
            .locator('#email-input, input[type="email"], input[type="text"]')
            .first()
            .fill("invalid@company.com");
          await page
            .locator('#password-input, input[type="password"]')
            .first()
            .fill("wrong");
          await page.locator('button[type="submit"]').click();
          await expect(
            page.getByText(/không chính xác|thất bại/i).first(),
          ).toBeVisible();
          break;
        }

        case "UI-70": {
          await page.locator("#header-avatar").click();
          await expect(page.locator('[role="menu"]')).toBeVisible();
          break;
        }

        case "UI-71": {
          await page.locator("#header-notifications").click();
          await expect(page.getByText(/chưa có thông báo nào/i)).toBeVisible();
          break;
        }

        case "UI-72":
        case "UI-73": {
          await expect(
            page.locator('[data-testid="route-loading-fallback"]'),
          ).toBeVisible();
          break;
        }
      }

      // 8. Run automated in-test audit
      const auditResult = await runAutomatedAudit(page, s);
      const consoleErrors = consoleCollector.getErrors();
      for (const err of consoleErrors) {
        if (s.id !== "UI-54" && s.id !== "UI-63") {
          auditResult.issues.push({
            type: "CONSOLE_ERROR",
            message: err,
          });
        }
      }
      if (consoleErrors.length > 0 && s.id !== "UI-54" && s.id !== "UI-63") {
        auditResult.passed = false;
      }

      // 9. Take visual screenshot
      const isMobileFullPage =
        s.device === "mobile" &&
        !s.id.includes("modal") &&
        s.id !== "UI-50" &&
        s.id !== "UI-12" &&
        s.id !== "UI-58" &&
        s.id !== "UI-59" &&
        s.id !== "UI-61" &&
        s.id !== "UI-62" &&
        s.id !== "UI-70" &&
        s.id !== "UI-71";
      await page.screenshot({
        path: path.join(screenshotDir, s.outputFile),
        fullPage: isMobileFullPage,
      });

      // 10. Record result
      recordedResults.push({
        id: s.id,
        name: s.name,
        group: s.group,
        passed: auditResult.passed,
        issues: auditResult.issues,
      });

      // 11. Assert that audit passed
      expect(
        auditResult.passed,
        `Kiểm định giao diện ${s.id} không đạt chuẩn: ${JSON.stringify(auditResult.issues)}`,
      ).toBe(true);
    });
  }
});
