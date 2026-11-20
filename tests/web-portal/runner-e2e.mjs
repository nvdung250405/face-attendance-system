import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const NODE_MODULES = path.resolve(REPO_ROOT, 'app/web-portal/node_modules');

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const args = ['--prefix', 'app/web-portal', 'playwright', 'test', ...process.argv.slice(2)];

const proc = spawn(npxCmd, args, {
  cwd: REPO_ROOT,
  env: {
    ...process.env,
    NODE_PATH: NODE_MODULES,
  },
  stdio: 'inherit',
  shell: isWin,
});

proc.on('close', (code) => {
  process.exit(code ?? 0);
});
