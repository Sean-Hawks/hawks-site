import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
if (process.platform !== 'darwin') throw new Error('此安裝工具適用 macOS，Linux 請參閱 README。');
const root = fileURLToPath(new URL('../', import.meta.url));
const label = 'tw.hawks.blog-agent';
const dir = path.join(os.homedir(), 'Library/LaunchAgents');
const plist = path.join(dir, `${label}.plist`);
const domain = `gui/${process.getuid()}`;
const run = args => spawnSync('launchctl', args, { encoding: 'utf8' });
if (process.argv.includes('--stop')) {
  run(['bootout', `${domain}/${label}`]);
  if (fs.existsSync(plist)) fs.unlinkSync(plist);
  console.log('已停止背景服務；草稿與設定保留。');
} else {
  spawnSync(process.execPath, [path.join(root, 'src/background.mjs'), 'stop'], { stdio: 'ignore' });
  if (!fs.existsSync(path.join(root, '.env'))) throw new Error('請先建立 agent/.env。');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(root, '.data'), { recursive: true, mode: 0o700 });
  const xml = v => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  fs.writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>--env-file=.env</string><string>src/bot.mjs</string></array>
<key>WorkingDirectory</key><string>${xml(root)}</string>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>30</integer>
<key>StandardOutPath</key><string>${xml(path.join(root, '.data/service.log'))}</string>
<key>StandardErrorPath</key><string>${xml(path.join(root, '.data/service-error.log'))}</string>
</dict></plist>`, { mode: 0o600 });
  run(['bootout', `${domain}/${label}`]);
  const result = run(['bootstrap', domain, plist]);
  if (result.status !== 0) throw new Error(`服務安裝失敗：${result.stderr.trim()}`);
  console.log('Hawks Agent 已設為登入後自動啟動，並於中斷後重新連線。');
}
