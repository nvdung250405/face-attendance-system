import { startServer, stopServer, DEFAULT_PORT } from './server-manager.mjs';
import { runCrawler } from './crawler.mjs';

async function main() {
  const args = process.argv.slice(2);
  let filter = '';
  let updateBaseline = false;
  let port = DEFAULT_PORT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--filter' && args[i + 1]) {
      filter = args[i + 1];
      i++;
    } else if (args[i].startsWith('--filter=')) {
      filter = args[i].split('=')[1];
    } else if (args[i] === '--update-baseline') {
      updateBaseline = true;
    } else if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10) || DEFAULT_PORT;
      i++;
    } else if (!args[i].startsWith('-')) {
      filter = args[i];
    }
  }

  console.log(`================================================================`);
  console.log(`[run_all] KHỞI ĐỘNG MODULAR UI TESTING PIPELINE — FAS WEB PORTAL`);
  console.log(`================================================================`);

  let serverRes = null;
  let crawlerRes = null;

  try {
    // 1. Quản lý Server cổng 5199 hoặc Staging 3000
    serverRes = await startServer(port);

    // 2. Chạy Crawler chụp ảnh và kiểm định tự động
    crawlerRes = await runCrawler({
      filter,
      port,
      updateBaseline,
    });
  } catch (err) {
    console.error(`[run_all] Lỗi nghiêm trọng trong chu trình kiểm thử:`, err);
    process.exitCode = 1;
  } finally {
    // 3. Luôn luôn dọn dẹp tắt server nếu do test tự bật
    if (serverRes && !serverRes.reused) {
      stopServer();
    }
  }

  console.log(`================================================================`);
  if (crawlerRes) {
    const statusText = crawlerRes.success ? 'THÀNH CÔNG (PASS)' : 'CẦN CHÚ Ý (FAIL / DIFF)';
    console.log(`[run_all] TRẠNG THÁI: ${statusText}`);
    console.log(`[run_all] KẾT QUẢ: ${crawlerRes.passed}/${crawlerRes.total} kịch bản đạt chuẩn (${crawlerRes.issuesCount} cảnh báo)`);
    process.exitCode = crawlerRes.success ? 0 : 1;
  } else {
    console.error(`[run_all] Chu trình kiểm thử chưa hoàn tất.`);
    process.exitCode = 1;
  }
  console.log(`================================================================`);
}

main();
