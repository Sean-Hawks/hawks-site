import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-interactions-'));
process.env.AGENT_DATA_DIR = dir;
process.env.DISCORD_OWNER_IDS = 'owner';
process.env.DISCORD_BOT_TOKEN = 'test-only';
const { handle } = await import('../src/bot.mjs');
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
function command(sub) {
  return { user: { id: 'owner' }, commandName: 'blog', isAutocomplete: () => false, isChatInputCommand: () => true,
    options: { getSubcommand: () => sub, getString: () => null } };
}
test('/blog new produces a valid Discord modal immediately', async () => {
  let response;
  await handle({ ...command('new'), showModal: async modal => { response = modal.toJSON(); } });
  assert.equal(response.custom_id, 'new:post:0:0');
  assert.equal(response.components.length, 2);
});
test('/blog list acknowledges before reading drafts and responds for empty inbox', async () => {
  const calls = [];
  await handle({ ...command('list'), deferReply: async () => calls.push('defer'), editReply: async content => calls.push(content) });
  assert.equal(calls[0], 'defer');
  assert.match(calls[1].embeds[0].description, /沒有符合的草稿/);
});
test('unauthorized command receives a private response', async () => {
  let response;
  await handle({ ...command('new'), user: { id: 'other' }, reply: async value => { response = value; } });
  assert.match(response.embeds[0].description, /尚未被授權/);
  assert.equal(response.flags, 64);
});
