import { REST, Routes } from 'discord.js';
import { command } from './commands.mjs';
if (!process.env.DISCORD_BOT_TOKEN) throw new Error('請在 agent/.env 設定 DISCORD_BOT_TOKEN');
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
try {
  const app = await rest.get('/oauth2/applications/@me');
  const route = process.env.DISCORD_GUILD_ID ? Routes.applicationGuildCommands(app.id, process.env.DISCORD_GUILD_ID) : Routes.applicationCommands(app.id);
  // POST upserts only /blog, preserving the application's other commands.
  await rest.post(route, { body: command.toJSON() });
  console.log('已註冊 /blog。');
  console.log(`邀請連結：https://discord.com/oauth2/authorize?client_id=${app.id}&scope=bot%20applications.commands&permissions=0`);
} catch (error) {
  console.error(`註冊失敗（${error.status ?? error.code ?? 'network'}），請檢查 token 與網路。`);
  process.exitCode = 1;
}
