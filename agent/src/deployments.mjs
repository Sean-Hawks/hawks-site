import fs from 'node:fs';
import path from 'node:path';
export class DeploymentTracker {
  constructor({ dir, publisher, client, workflow = 'deploy.yml', onUpdate }) {
    Object.assign(this, { publisher, client, workflow, onUpdate });
    this.dir = path.join(dir, 'deployments'); fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    this.running = false;
  }
  save(job) {
    const file = path.join(this.dir, `${job.commit}.json`);
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(job), { mode: 0o600 }); fs.renameSync(`${file}.tmp`, file);
  }
  async track(published, channelId, title, draftId) {
    const job = { ...published, channelId, title, draftId, status: 'queued', createdAt: Date.now() };
    this.save(job);
    await this.notify(job, '已提交，等待網站部署', 0x8b9cff);
  }
  async notify(job, text, color) {
    if (this.onUpdate && await this.onUpdate(job, text, color)) { this.save(job); return; }
    const channel = await this.client.channels.fetch(job.channelId);
    const payload = { content: null, embeds: [{ title: job.title.slice(0, 200), description: `${text}\n[文章](${job.url}) · [部署進度](${job.runUrl || `https://github.com/${this.publisher.repository}/actions`})`, color, footer: { text: `Commit ${job.commit.slice(0, 7)}` } }] };
    if (job.messageId) {
      try { await (await channel.messages.fetch(job.messageId)).edit(payload); this.save(job); return; }
      catch (e) { if (e.code !== 10008) throw e; }
    }
    job.messageId = (await channel.send(payload)).id; this.save(job);
  }
  async poll() {
    if (this.running) return; this.running = true;
    try {
      for (const name of fs.readdirSync(this.dir).filter(n => /^[a-f0-9]+\.json$/.test(n))) {
        const job = JSON.parse(fs.readFileSync(path.join(this.dir, name), 'utf8'));
        if (job.done) continue;
        try {
          const data = await this.publisher.request(`actions/workflows/${encodeURIComponent(this.workflow)}/runs?head_sha=${job.commit}&per_page=10`);
          if (!data) throw new Error('Cannot read deployment workflow');
          const run = data.workflow_runs?.filter(r => r.head_sha === job.commit).sort((a, b) => b.run_attempt - a.run_attempt || b.id - a.id)[0];
          const next = run?.status === 'completed' ? run.conclusion : run?.status || 'queued';
          job.runUrl = run?.html_url;
          if (run?.status === 'completed') {
            await this.notify(job, next === 'success' ? '網站部署完成 ✅' : `網站部署未成功（${next}），草稿與 GitHub 提交仍保留。`, next === 'success' ? 0x57bf8e : 0xe78a85);
            job.status = next; job.done = true; this.save(job);
          } else if (Date.now() - job.createdAt > 3600000) {
            await this.notify(job, '超過一小時仍未確認部署完成，請查看 Actions。', 0xf2b84b);
            job.done = true; this.save(job);
          } else if (next !== job.status || !job.messageId || job.warning) {
            await this.notify(job, run ? '網站正在建置與部署…' : '已提交，等待網站部署', 0x8b9cff);
            job.status = next; job.warning = false; this.save(job);
          }
        } catch {
          if (!job.warning) {
            try { await this.notify(job, '暫時無法讀取部署狀態；請確認 GitHub token 有 Actions 讀取權限，稍後會再檢查。', 0xf2b84b); job.warning = true; this.save(job); } catch { /* Retry after reconnect. */ }
          }
          if (Date.now() - job.createdAt > 3600000) { job.done = true; this.save(job); }
        }
      }
    } finally { this.running = false; }
  }
}
