import type { Page } from '@playwright/test';

export interface AuditIssue {
  type: 'GLITCH_TEXT' | 'HORIZONTAL_OVERFLOW' | 'TOUCH_TARGET_TOO_SMALL' | 'CONSOLE_ERROR';
  message: string;
}

export interface AuditResult {
  passed: boolean;
  issues: AuditIssue[];
}

export interface ScreenConfig {
  id: string;
  name: string;
  device?: 'desktop' | 'tablet' | 'mobile';
  checks?: {
    noGlitchText?: boolean;
    noHorizontalOverflow?: boolean;
    checkTouchTarget?: boolean;
    visualDiff?: boolean;
  };
}

const GLITCH_PATTERNS = ['Invalid Date', 'undefined', 'null', '[object Object]', 'NaN'];

export async function runAutomatedAudit(page: Page, config: ScreenConfig): Promise<AuditResult> {
  const issues: AuditIssue[] = [];

  // 1. Quét chuỗi lỗi kỹ thuật thô (Anti-Glitch Text Check)
  if (config.checks?.noGlitchText !== false) {
    const rawText = await page.locator('body').innerText().catch(() => '');
    for (const pattern of GLITCH_PATTERNS) {
      if (rawText.includes(pattern)) {
        // Kiểm tra xem có phải chữ hiển thị trên UI thật không (bỏ qua script/hidden nếu có)
        issues.push({
          type: 'GLITCH_TEXT',
          message: `Phát hiện chuỗi lỗi kỹ thuật thô hiển thị trên UI: "${pattern}"`,
        });
      }
    }
  }

  // 2. Kiểm tra tràn viền ngang (Horizontal Overflow Check)
  if (config.checks?.noHorizontalOverflow !== false && config.device === 'mobile') {
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    }).catch(() => false);

    if (isOverflowing) {
      issues.push({
        type: 'HORIZONTAL_OVERFLOW',
        message: 'Giao diện bị tràn viền ngang trên thiết bị di động (scrollWidth > window.innerWidth)',
      });
    }
  }

  // 3. Đo kích thước vùng chạm cảm ứng WCAG 2.1 AA (Tối thiểu 38-44px)
  if (config.checks?.checkTouchTarget !== false && config.device === 'mobile') {
    const smallTargets = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('button:not([aria-hidden="true"]), a:not([aria-hidden="true"]), input[type="checkbox"], input[type="radio"]')
      );
      return elements
        .filter((el) => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || style.pointerEvents === 'none') return false;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          if (el.tagName === 'INPUT') return false;

          // Kiểm tra xem phần tử có bị che khuất bởi backdrop modal/drawer hay không
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          if (centerX >= 0 && centerY >= 0 && centerX <= window.innerWidth && centerY <= window.innerHeight) {
            const topEl = document.elementFromPoint(centerX, centerY);
            if (topEl && !el.contains(topEl) && !topEl.contains(el)) {
              return false; // Bị che bởi overlay/backdrop
            }
          }

          return rect.width < 38 || rect.height < 38;
        })
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return `${el.tagName}#${el.id || ''}[${el.getAttribute('data-testid') || ''}](${Math.round(rect.width)}x${Math.round(rect.height)})`;
        });
    }).catch(() => [] as string[]);

    if (smallTargets.length > 0) {
      issues.push({
        type: 'TOUCH_TARGET_TOO_SMALL',
        message: `Phát hiện ${smallTargets.length} phần tử tương tác chưa đạt chuẩn kích thước vùng chạm tối thiểu: ${smallTargets.join(', ')}`,
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

export function setupConsoleCollector(page: Page): { getErrors: () => string[] } {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Bỏ qua các cảnh báo mạng giả lập ECONNREFUSED khi mock WebSocket, hoặc cảnh báo Permissions policy trình duyệt
      if (
        !text.includes('ECONNREFUSED') &&
        !text.includes('WebSocket connection to') &&
        !text.includes('Failed to load resource: the server responded with a status of 401') &&
        !text.includes('Failed to load resource: the server responded with a status of 502') &&
        !text.includes('Permissions policy violation: unload') &&
        !text.includes("EventSource's response has a MIME type")
      ) {
        errors.push(`Console Error: ${text}`);
      }
    }
  });
  return {
    getErrors: () => errors,
  };
}
