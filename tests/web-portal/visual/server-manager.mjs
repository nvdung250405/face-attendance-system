import http from 'node:http';
import net from 'node:net';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

export const DEFAULT_PORT = 5199;
export const DEFAULT_URL = `http://127.0.0.1:${DEFAULT_PORT}`;

let serverProcess = null;
let serverPid = null;
let weStartedServer = false;

/**
 * Kiểm tra xem cổng TCP có đang mở không
 */
export function checkPort(port = DEFAULT_PORT) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, '127.0.0.1');
  });
}

/**
 * Kiểm tra HTTP GET xem phản hồi có phải là ứng dụng FAS Web Portal không
 */
export function probeApp(url = DEFAULT_URL) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const isFas = data.includes('root') || data.includes('FAS') || data.includes('vite');
        resolve(res.statusCode === 200 && isFas);
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Đợi server sẵn sàng trả về HTTP 200
 */
async function waitForServerReady(url = DEFAULT_URL, maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const ok = await probeApp(url);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

/**
 * Dọn dẹp an toàn cây tiến trình trên Windows bằng taskkill /T /F
 */
export function stopServer() {
  if (serverPid && weStartedServer) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${serverPid} /T /F`, { stdio: 'ignore' });
      } else {
        process.kill(serverPid, 'SIGKILL');
      }
      console.log(`[01_server_manager] Đã dừng server trên cổng ${DEFAULT_PORT} (PID: ${serverPid}) sạch sẽ.`);
    } catch {
      // Tiến trình có thể đã tự thoát
    }
  }
  serverProcess = null;
  serverPid = null;
  weStartedServer = false;
}

/**
 * Khởi động Vite Dev Server trên cổng cô lập 5199
 */
export async function startServer(port = DEFAULT_PORT) {
  const url = `http://127.0.0.1:${port}`;
  const isPortBusy = await checkPort(port);

  if (isPortBusy) {
    const isOurApp = await probeApp(url);
    if (isOurApp) {
      console.log(`[01_server_manager] Tái sử dụng server FAS đang chạy sẵn tại ${url}`);
      return { url, reused: true };
    } else {
      console.warn(`[01_server_manager] Cảnh báo: Cổng ${port} đang bị ứng dụng khác chiếm.`);
    }
  }

  // Ràng buộc nghiêm ngặt: Nếu test chỉ định cổng 3000 (Staging), BẮT BUỘC phải là Docker Staging Nginx
  if (port === 3000) {
    throw new Error(
      `[01_server_manager] LỖI: Cụm Docker Staging (port 3000) đang không chạy! ` +
      `Tuyệt đối không tự ý bật Vite dev server thay thế cho Staging. ` +
      `Hãy khởi động Docker Staging bằng lệnh: docker compose -f docker-compose.staging.yml up -d`
    );
  }

  console.log(`[01_server_manager] Khởi động Vite Dev Server ngầm tại ${url}...`);

  const webPortalDir = path.resolve(REPO_ROOT, 'apps/web-portal');
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  serverProcess = spawn(npmCmd, ['run', 'dev', '--', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: webPortalDir,
    stdio: ['ignore', 'ignore', 'ignore'],
    shell: isWin,
    detached: false,
  });

  serverPid = serverProcess.pid;
  weStartedServer = true;

  // Lắng nghe tín hiệu hệ thống để dọn dẹp sạch sẽ
  const cleanup = () => {
    stopServer();
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  const ready = await waitForServerReady(url, 25000);
  if (!ready) {
    stopServer();
    throw new Error(`[01_server_manager] Timeout: Không thể kết nối tới Vite dev server tại ${url} sau 25s`);
  }

  console.log(`[01_server_manager] Server sẵn sàng tại ${url} (PID: ${serverPid})`);
  return { url, pid: serverPid, reused: false };
}

// Cho phép chạy độc lập từ CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const action = process.argv[2] || '--start';
  if (action === '--stop') {
    stopServer();
  } else {
    startServer()
      .then((res) => {
        console.log(`[01_server_manager] Đang phục vụ tại ${res.url}. Bấm Ctrl+C để dừng.`);
      })
      .catch((err) => {
        console.error(`[01_server_manager] Lỗi:`, err.message);
        process.exit(1);
      });
  }
}
