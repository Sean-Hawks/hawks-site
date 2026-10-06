const id = process.argv[2];
if (!/^[1-9]\d*$/.test(id || "") || !process.env.COMMENTS_ADMIN_TOKEN) {
  throw new Error(
    "用法：npm run delete -- <訊息 ID>；請先設定 COMMENTS_ADMIN_TOKEN",
  );
}
const response = await fetch(
  `http://127.0.0.1:${process.env.COMMENTS_PORT || 8790}/v1/comments/messages/${id}`,
  {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.COMMENTS_ADMIN_TOKEN}` },
    signal: AbortSignal.timeout(8000),
  },
);
if (!response.ok) throw new Error(`刪除失敗：HTTP ${response.status}`);
console.log(`已刪除訊息 ${id}`);
