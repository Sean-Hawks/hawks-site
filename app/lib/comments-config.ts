// Giscus 留言設定（以 GitHub Discussions 為後端，零自架伺服器，適合靜態站）。
//
// 啟用步驟：
//   1. 到 GitHub repo `Sean-Hawks/hawks-site` → Settings → General → Features，勾選 Discussions。
//   2. 安裝 giscus GitHub App：https://github.com/apps/giscus （授權給該 repo）。
//   3. 打開 https://giscus.app ，在「Repository」填 Sean-Hawks/hawks-site，
//      頁面會產生 data-repo-id 與 data-category-id。
//   4. 把下面的 repoId / categoryId 填上（category 建議選一個像 "Comments" 的分類）。
//
// repoId 或 categoryId 任一為空時，文章頁不會顯示留言區（安全 no-op）。

export const giscusConfig = {
  repo: "Sean-Hawks/hawks-site" as `${string}/${string}`,
  repoId: "", // TODO: 從 giscus.app 取得後填入
  category: "Comments",
  categoryId: "", // TODO: 從 giscus.app 取得後填入
} as const;

export const commentsEnabled = Boolean(
  giscusConfig.repoId && giscusConfig.categoryId,
);
