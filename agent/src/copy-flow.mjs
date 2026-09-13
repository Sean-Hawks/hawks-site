import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { templateText } from './writing-template.mjs';
import { UserError } from './store.mjs';

export function copyChunks(text, limit = 1800) {
  const chunks = [];
  while (text.length) {
    let end = Math.min(limit, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf('\n\n', end);
      if (boundary > limit / 3) end = boundary + 2;
      else if (/^[\uDC00-\uDFFF]$/.test(text[end])) end--;
    }
    const raw = text.slice(0, end);
    chunks.push({ text: raw.trim(), prefix: raw.match(/^\s*/)[0], suffix: raw.match(/\s*$/)[0] });
    text = text.slice(end);
  }
  return chunks;
}
export async function releaseCopy(writer, b) {
  if (!b.copyPlan) return;
  const cards = b.copyPlan.slots.map(s => s.cardId).filter(Boolean);
  // Preserve the original source and all revision history; proposals are never authoritative.
  b.copyAdvice = { cards };
  delete b.copyPlan;
  writer.save();
  const channel = await writer.channel();
  for (const id of cards) {
    try {
      await (await channel.messages.fetch(id)).edit({ embeds: [{ title: '整理建議（可自由略過）', description: '請直接編輯原訊息，草稿以你的文字為準。不必逐段貼齊，也不必與建議完全相同。', color: 0x8b9cff }], components: [] });
    } catch (error) { if (error.code !== 10008) throw error; }
  }
}
export async function prepareCopy(writer, draft, update) {
  const b = Object.values(writer.state.bindings).find(b => b.draftId === draft.id);
  if (!b) throw new UserError('請先把這份草稿帶回寫作頻道。');
  await releaseCopy(writer, b);
  const channel = await writer.channel();
  const text = templateText({ ...draft, ...update }, update.body ?? draft.body);
  const slots = copyChunks(text);
  const cards = b.copyAdvice?.cards || [];
  const url = `https://discord.com/channels/${channel.guildId}/${writer.channelId}/${b.rootId}`;
  for (let n = 0; n < slots.length; n++) {
    const fence = '`'.repeat(Math.max(3, ...(slots[n].text.match(/`+/g) || []).map(s => s.length + 1)));
    const payload = { embeds: [{ title: `可複製建議 · ${n + 1} / ${slots.length}`, color: 0x8b9cff,
      description: `需要的部分再複製到原訊息，可以自行修改或略過。長文可回覆原文續寫。草稿永遠以你的訊息為準。\n\n${fence}text\n${slots[n].text}\n${fence}` }], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('編輯原訊息').setStyle(ButtonStyle.Link).setURL(url))] };
    let previous;
    if (cards[n]) { try { previous = await channel.messages.fetch(cards[n]); } catch (error) { if (error.code !== 10008) throw error; } }
    if (previous) await previous.edit(payload);
    else cards[n] = (await channel.send(payload)).id;
  }
  for (const id of cards.slice(slots.length)) {
    try { await (await channel.messages.fetch(id)).edit({ embeds: [{ title: '舊建議已更新', description: '請參考前面的最新建議，或直接編輯原訊息。', color: 0x8b9cff }], components: [] }); }
    catch (error) { if (error.code !== 10008) throw error; }
  }
  b.copyAdvice = { cards }; writer.save();
  await writer.panel(b);
  return { embeds: [{ title: '建議已整理，可自由採用', description: '建議尚未套用。記得把想採用的內容複製到原訊息；可以只採用一部分或自行改寫。無需完成任何貼回核對，隨時都能預覽與發布原訊息的內容。', color: 0x8b9cff }], files: [new AttachmentBuilder(Buffer.from(text), { name: `${draft.slug}-整理建議.txt` })], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('前往原訊息').setStyle(ButtonStyle.Link).setURL(url))] };
}
