import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const entry = path.join(root, 'src/bot.mjs');
const data = path.join(root, '.data');
const pidFile = path.join(data, 'runtime.pid');
function activePid() {
  if (!fs.existsSync(pidFile)) return null;
  const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());
  if (!Number.isSafeInteger(pid) || pid < 2) return null;
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'args='], { encoding: 'utf8' });
  return result.status === 0 && result.stdout.includes(entry) ? pid : null;
}
const action = process.argv[2] || 'status';
const pid = activePid();
if (action === 'stop') {
  if (pid) process.kill(pid, 'SIGTERM');
  if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  console.log('背景 bot 已停止。');
} else if (action === 'start') {
  if (pid) { console.log(`背景 bot 已在執行（PID ${pid}）。`); }
  else {
    if (process.platform === 'darwin' && spawnSync('launchctl', ['print', `gui/${process.getuid()}/tw.hawks.blog-agent`], { stdio: 'ignore' }).status === 0) throw new Error('LaunchAgent 已安裝，請先執行 npm run service:stop，避免重複啟動。');
    fs.mkdirSync(data, { recursive: true, mode: 0o700 });
    const out = fs.openSync(path.join(data, 'service.log'), 'a', 0o600);
    const err = fs.openSync(path.join(data, 'service-error.log'), 'a', 0o600);
    const child = spawn(process.execPath, ['--env-file=.env', entry], { cwd: root, detached: true, stdio: ['ignore', out, err] });
    child.unref();
    fs.closeSync(out); fs.closeSync(err);
    fs.writeFileSync(pidFile, String(child.pid), { mode: 0o600 });
    console.log(`背景程序已啟動（PID ${child.pid}）；請查看 .data/service.log 確認 Discord 上線。`);
  }
} else if (action === 'status') {
  let health;
  try { health = JSON.parse(fs.readFileSync(path.join(data, 'health.json'), 'utf8')); } catch { /* No heartbeat yet. */ }
  const fresh = health?.pid === pid && Date.now() - Date.parse(health.checkedAt) < 45000;
  if (!pid) console.log('背景 bot 未執行。');
  else if (fresh && health.ready && health.gatewayRouting) console.log(`Discord 連線就緒（PID ${pid}，心跳 ${health.checkedAt}，延遲 ${health.ping ?? '待測'}ms）。`);
  else console.log(`程序存在（PID ${pid}），但尚未確認 Discord 連線及指令路由正常。`);
}
else throw new Error('支援 start、stop、status。');
