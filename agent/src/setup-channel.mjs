import { archiveEntry } from './archive.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes, ChannelType, PermissionFlagsBits } from 'discord.js';
import { guide } from './channel-writing.mjs';
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
const owners = (process.env.DISCORD_OWNER_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
if (!owners.length) throw new Error('請先設定 DISCORD_OWNER_IDS。');
try {
  const app = await rest.get('/applications/@me');
  if (!(app.flags & ((1 << 18) | (1 << 19)))) throw new Error('請先在 Developer Portal 的 Bot 頁面啟用 Message Content Intent。');
  const guilds = await rest.get('/users/@me/guilds');
  const guildId = process.env.DISCORD_GUILD_ID || (guilds.length === 1 ? guilds[0].id : null);
  if (!guildId) throw new Error('bot 位於多個伺服器，請先設定 DISCORD_GUILD_ID。');
  const channels = await rest.get(Routes.guildChannels(guildId));
  const topic = 'Hawks Blog 私人寫作工作室｜傳送訊息寫文章，編輯原訊息自動更新草稿。';
  let channel = channels.find(c => c.id === process.env.DISCORD_BLOG_CHANNEL_ID) || channels.find(c => c.name === 'blog-寫作' && c.topic === topic);
  if (!channel) {
    const access = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.EmbedLinks | PermissionFlagsBits.AttachFiles;
    channel = await rest.post(Routes.guildChannels(guildId), { body: { name: 'blog-寫作', type: ChannelType.GuildText, topic,
      permission_overwrites: [{ id: guildId, type: 0, deny: String(PermissionFlagsBits.ViewChannel), allow: '0' },
        ...[...new Set([...owners, app.id])].map(id => ({ id, type: 1, allow: String(access), deny: '0' }))] } });
  }
  const env = fs.readFileSync('.env', 'utf8');
  const line = `DISCORD_BLOG_CHANNEL_ID=${channel.id}`;
  fs.writeFileSync('.env', /^DISCORD_BLOG_CHANNEL_ID=/m.test(env) ? env.replace(/^DISCORD_BLOG_CHANNEL_ID=.*$/m, line) : `${env.trimEnd()}\n${line}\n`, { mode: 0o600 });
  const stateDir = path.join(process.env.AGENT_DATA_DIR || '.data', 'channel-writing');
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const setup = path.join(stateDir, 'setup.json');
  const previous = fs.existsSync(setup) ? JSON.parse(fs.readFileSync(setup, 'utf8')) : {};
  if (previous.channelId !== channel.id || !previous.guideId) {
    const sent = await rest.post(Routes.channelMessages(channel.id), { body: { ...guide, components: [archiveEntry().toJSON()], allowed_mentions: { parse: [] } } });
    fs.writeFileSync(setup, JSON.stringify({ channelId: channel.id, guideId: sent.id }), { mode: 0o600 });
  }
  if (previous.channelId === channel.id && previous.guideId) await rest.patch(Routes.channelMessage(channel.id, previous.guideId), { body: { ...guide, components: [archiveEntry().toJSON()], allowed_mentions: { parse: [] } } });
  console.log(`寫作頻道已就緒：https://discord.com/channels/${guildId}/${channel.id}`);
} catch (error) {
  console.error(error.status ? `頻道設定失敗（HTTP ${error.status}），請檢查管理頻道權限。` : error.message);
  process.exitCode = 1;
}
