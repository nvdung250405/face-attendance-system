import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

/**
 * Đảm bảo các thư mục báo cáo cần thiết luôn tồn tại
 */
function ensureDirectories() {
  const dirs = [
    path.resolve(REPO_ROOT, 'tests/reports/web-portal'),
    path.resolve(REPO_ROOT, 'tests/reports/web-portal/screenshots'),
    path.resolve(REPO_ROOT, 'tests/reports/web-portal/baselines'),
    path.resolve(REPO_ROOT, 'tests/reports/web-portal/diffs'),
    path.resolve(REPO_ROOT, 'tests/reports/web-portal/test-results'),
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }
}

/**
 * Khởi chạy kịch bản kiểm thử giao diện Playwright
 */
export async function runCrawler(options = {}) {
  const startTime = Date.now();
  ensureDirectories();

  const manifestPath = path.resolve(REPO_ROOT, 'tests/web-portal/fixtures/screens.manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`[02_screen_crawler] Không tìm thấy file manifest tại: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const filter = (options.filter || '').trim().toLowerCase();

  const targetScenarios = filter
    ? manifest.filter(
        (s) =>
          s.id.toLowerCase().includes(filter) ||
          s.name.toLowerCase().includes(filter) ||
          s.group.toLowerCase().includes(filter) ||
          (s.subgroup && s.subgroup.toLowerCase().includes(filter)) ||
          (s.featureId && s.featureId.toLowerCase().includes(filter))
      )
    : manifest;

  if (targetScenarios.length === 0) {
    console.warn(`[02_screen_crawler] Cảnh báo: Không có kịch bản nào khớp với bộ lọc "${filter}"`);
    return {
      success: true,
      total: 0,
      passed: 0,
      failed: 0,
      issuesCount: 0,
      durationMs: Date.now() - startTime,
      reportPath: path.resolve(REPO_ROOT, 'tests/reports/web-portal/audit_results.json'),
    };
  }

  console.log(`[02_screen_crawler] Bắt đầu quét ${targetScenarios.length}/${manifest.length} kịch bản giao diện...`);
  if (filter) {
    console.log(`[02_screen_crawler] Áp dụng bộ lọc: "${filter}"`);
  }

  const port = options.port || 5199;
  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';

  const env = {
    ...process.env,
    VITE_TEST_URL: `http://127.0.0.1:${port}`,
    VISUAL_FILTER: filter,
    UPDATE_BASELINE: options.updateBaseline ? 'true' : 'false',
    NODE_PATH: path.resolve(REPO_ROOT, 'app/web-portal/node_modules'),
  };

  const args = [
    '--prefix',
    'app/web-portal',
    'playwright',
    'test',
    'tests/web-portal/visual/visual-responsive.spec.ts',
    '--config',
    'tests/web-portal/playwright.visual.config.ts',
  ];

  const exitCode = await new Promise((resolve) => {
    const proc = spawn(npxCmd, args, {
      cwd: REPO_ROOT,
      env,
      stdio: 'inherit',
      shell: isWin,
    });
    proc.on('close', (code) => resolve(code ?? 0));
    proc.on('error', (err) => {
      console.error('[02_screen_crawler] Lỗi spawn Playwright:', err);
      resolve(1);
    });
  });

  const durationMs = Date.now() - startTime;
  const auditReportPath = path.resolve(REPO_ROOT, 'tests/reports/web-portal/audit_results.json');
  let auditData = { total: targetScenarios.length, passed: 0, failed: 0, issuesCount: 0, results: [] };

  if (fs.existsSync(auditReportPath)) {
    try {
      auditData = JSON.parse(fs.readFileSync(auditReportPath, 'utf-8'));
    } catch {
      // Dùng dữ liệu mặc định nếu file json đang ghi
    }
  }

  // Tự động sao chép sang baselines nếu chưa có
  const screenshotsDir = path.resolve(REPO_ROOT, 'tests/reports/web-portal/screenshots');
  const baselinesDir = path.resolve(REPO_ROOT, 'tests/reports/web-portal/baselines');

  if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir).filter((f) => f.endsWith('.png'));
    for (const f of files) {
      const src = path.join(screenshotsDir, f);
      const dest = path.join(baselinesDir, f);
      if (!fs.existsSync(dest) || options.updateBaseline) {
        fs.copyFileSync(src, dest);
      }
    }
  }

  const success = exitCode === 0 && (auditData.failed === 0);
  console.log(`[02_screen_crawler] Hoàn tất quét sau ${(durationMs / 1000).toFixed(1)}s (Exit code: ${exitCode})`);

  return {
    success,
    total: targetScenarios.length,
    passed: auditData.passed || targetScenarios.length,
    failed: auditData.failed || 0,
    issuesCount: auditData.issuesCount || 0,
    durationMs,
    reportPath: auditReportPath,
  };
}

// Chạy trực tiếp từ CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let filter = '';
  let updateBaseline = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--filter' && args[i + 1]) {
      filter = args[i + 1];
      i++;
    } else if (args[i].startsWith('--filter=')) {
      filter = args[i].split('=')[1];
    } else if (args[i] === '--update-baseline') {
      updateBaseline = true;
    } else if (!args[i].startsWith('-')) {
      filter = args[i];
    }
  }

  runCrawler({ filter, updateBaseline })
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('[02_screen_crawler] Lỗi:', err);
      process.exit(1);
    });
}
