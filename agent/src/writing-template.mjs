import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { markdown } from './store.mjs';
import { toObsidianBody } from './obsidian-format.mjs';
export function templateText(draft, body) {
  return markdown({ ...draft, body: '' }, 'draft').trimEnd() + '\n' + toObsidianBody(body);
}
export function templatePanel(draft, body, { url, section = false } = {}) {
  const text = templateText(draft, body);
  const compact = text.length <= 1800 && !text.includes('```');
  const display = compact ? text : templateText(draft, '');
  return { content: null, embeds: [{ title: '這篇文章的可複製模板', color: 0x8b9cff,
    description: `${compact ? '複製下面整段，只改你想調整的欄位。' : '下方只顯示文章開頭：只替換設定區，保留原內文。附件是未截斷的完整版本。'}\n${section ? '按「前往修改」，回覆該張卡貼上修改後的內容。' : '按「前往原訊息」→ 編輯 → 貼上，原本的照片附件留著即可。'}\n\n\`\`\`text\n${display}\n\`\`\`\n\n標籤用逗號分隔；摘要可留空。儲存後 bot 會自動更新，接著重新按「發布前檢查」。` }],
    files: [new AttachmentBuilder(Buffer.from(text), { name: `${draft.slug}-message.txt` })],
    components: url ? [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(section ? '前往修改' : '前往原訊息').setStyle(ButtonStyle.Link).setURL(url))] : [] };
}
export function blankTemplate(channelId, kind = 'post') {
  const text = `在這裡填文章標題\n類型：${kind === 'talk' ? '近況' : '部落格'}\n標籤：\n摘要：\n\n在這裡寫正文。`;
  return { content: null, embeds: [{ title: '複製這份模板就能開始寫', color: 0x8b9cff, description: `複製下方模板，改好後貼到 <#${channelId}>。日期與網址會自動使用今天的日期，不必填。\n\n\`\`\`text\n${text}\n\`\`\`\n\n可以在同一則訊息附照片。發出後直接編輯自己的訊息，長文用回覆續寫。` }], files: [new AttachmentBuilder(Buffer.from(text), { name: 'blog-template.txt' })] };
}
