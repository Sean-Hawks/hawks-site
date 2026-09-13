import { UserError, markdown } from './store.mjs';

export class Publisher {
  constructor({ token, repository, branch = 'main', siteUrl = 'https://hawks.tw', fetcher = fetch }) {
    Object.assign(this, { token, repository, branch, siteUrl, fetcher });
  }
  async request(endpoint, init = {}) {
    if (!this.token) throw new UserError('尚未設定 GITHUB_TOKEN；草稿已保存在 bot，可先匯出 Markdown。');
    const response = await this.fetcher(`https://api.github.com/repos/${this.repository}/${endpoint}`, {
      ...init, headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...init.headers },
      signal: AbortSignal.timeout(20000)
    });
    if (response.status === 404 && !init.method) return null;
    if (!response.ok) throw new UserError(`GitHub 操作失敗（${response.status}），請檢查權限／分支後重試。`);
    return response.json();
  }
  async publish(draft) {
    if (!draft.body.trim()) throw new UserError('請先寫下內文，再發布文章。');
    const folder = draft.kind === 'post' ? 'posts' : 'talks';
    if (draft.relocation && draft.published && !draft.published.file.startsWith(`content/${folder}/`)) {
      if (draft.relocation.from !== draft.published.file || draft.relocation.kind !== draft.kind || !/^content\/(posts|talks)\/[^/]+\.md$/.test(draft.published.file) || draft.published.file.includes('..')) throw new UserError('分類搬移資料不正確。');
      const file = `content/${folder}/${draft.slug}.md`;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) throw new UserError('網址不正確。');
      const target = await this.request(`contents/${file}?ref=${encodeURIComponent(this.branch)}`);
      if (target) throw new UserError('近況或文章的新位置已有同名內容，不能覆寫。');
      return this.publishWithMedia(draft, file, null, draft.published);
    }
    const file = draft.published?.file || `content/${draft.kind === 'post' ? 'posts' : 'talks'}/${draft.slug}.md`;
    if (!new RegExp(`^content/${draft.kind === 'post' ? 'posts' : 'talks'}/[^/]+\\.md$`).test(file) || file.includes('..')) throw new UserError('文章檔案路徑不正確。');
    if (draft.published?.url && new URL(draft.published.url).pathname !== `/${draft.kind === 'post' ? 'blog' : 'talk'}/${encodeURIComponent(draft.slug)}/`) throw new UserError('已發布文章不可變更網址或類型；請複製成新草稿。');
    if (draft.published && !draft.published.url && draft.published.file !== `content/${draft.kind === 'post' ? 'posts' : 'talks'}/${draft.slug}.md`) throw new UserError('已發布文章不可變更網址或類型；請複製成新草稿。');
    const encodedFile = file.split('/').map(encodeURIComponent).join('/');
    const current = await this.request(`contents/${encodedFile}?ref=${encodeURIComponent(this.branch)}`);
    if (current && (!draft.published || current.sha !== draft.published.sha)) throw new UserError('網站上已有同名文章或有外部修改；請使用其他網址代稱，避免覆寫內容。');
    if (!current && draft.published) throw new UserError('原本發布的檔案已被移除，請先確認網站狀態。');
    if (draft.assets?.length) return this.publishWithMedia(draft, file, current);
    const result = await this.request(`contents/${encodedFile}`, {
      method: 'PUT', body: JSON.stringify({ message: `blog: ${draft.published ? 'update' : 'publish'} ${draft.slug}`, branch: this.branch,
        content: Buffer.from(markdown(draft, 'published')).toString('base64'), ...(current ? { sha: current.sha } : {}) })
    });
    return { file, sha: result.content.sha, commit: result.commit.sha,
      url: `${this.siteUrl.replace(/\/$/, '')}/${draft.kind === 'post' ? 'blog' : 'talk'}/${encodeURIComponent(draft.slug)}/`, revision: draft.revision };
  }
  async publishWithMedia(draft, file, expected, removeFrom = null) {
    if (draft.assets?.length && !this.media) throw new UserError('尚未設定照片儲存。');
    const head = await this.request(`git/ref/heads/${encodeURIComponent(this.branch)}`);
    if (!head?.object?.sha) throw new UserError('找不到發布分支。');
    const parent = head.object.sha;
    const remote = await this.request(`contents/${file.split('/').map(encodeURIComponent).join('/')}?ref=${parent}`);
    if ((remote?.sha || null) !== (expected?.sha || null)) throw new UserError('文章在準備照片時被修改，請重新確認。');
    const base = await this.request(`git/commits/${parent}`);
    const tree = [];
    if (removeFrom) {
      const previous = await this.request(`contents/${removeFrom.file}?ref=${parent}`);
      if (!previous || previous.sha !== removeFrom.sha) throw new UserError('舊位置的內容已被修改或移除，請重新確認後搬移。');
      tree.push({ path: removeFrom.file, mode: '100644', type: 'blob', sha: null });
    }
    for (const asset of [...new Map((draft.assets || []).map(a => [a.hash, a])).values()]) {
      const data = this.media.read(asset);
      const blob = await this.request('git/blobs', { method: 'POST', body: JSON.stringify({ content: data.toString('base64'), encoding: 'base64' }) });
      tree.push({ path: `public/images/blog/${asset.hash}.webp`, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const article = await this.request('git/blobs', { method: 'POST', body: JSON.stringify({ content: markdown(draft, 'published'), encoding: 'utf-8' }) });
    tree.push({ path: file, mode: '100644', type: 'blob', sha: article.sha });
    const nextTree = await this.request('git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
    const commit = await this.request('git/commits', { method: 'POST', body: JSON.stringify({ message: `blog: publish ${draft.slug} with photos`, tree: nextTree.sha, parents: [parent] }) });
    // Non-forced fast-forward: a concurrent writer cannot be overwritten.
    await this.request(`git/refs/heads/${encodeURIComponent(this.branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
    return { file, sha: article.sha, commit: commit.sha, url: `${this.siteUrl.replace(/\/$/, '')}/${draft.kind === 'post' ? 'blog' : 'talk'}/${encodeURIComponent(draft.slug)}/`, revision: draft.revision };
  }

}
