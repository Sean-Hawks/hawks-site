import { SlashCommandBuilder } from 'discord.js';
const draftOption = o => o.setName('draft').setDescription('選擇草稿或貼上草稿 ID').setRequired(true).setAutocomplete(true);
export const command = new SlashCommandBuilder().setName('blog').setDescription('Hawks 寫作工作室')
  .addSubcommand(s => s.setName('new').setDescription('開始寫作，前往 blog 專用頻道').addStringOption(o => o.setName('kind').setDescription('文章類型').addChoices({ name: '部落格', value: 'post' }, { name: '近況 / Talk', value: 'talk' })))
  .addSubcommand(s => s.setName('list').setDescription('草稿匣與全文搜尋').addStringOption(o => o.setName('query').setDescription('搜尋標題、標籤或內文')))
  .addSubcommand(s => s.setName('open').setDescription('開啟草稿與操作按鈕').addStringOption(draftOption))
  .addSubcommand(s => s.setName('import').setDescription('將 Markdown 附件存成新草稿').addAttachmentOption(o => o.setName('file').setDescription('.md 或 .txt，最大 800 KB').setRequired(true)))
  .addSubcommand(s => s.setName('restore').setDescription('將歷史版本還原成新版本').addStringOption(draftOption).addIntegerOption(o => o.setName('version').setDescription('要還原的版本號').setMinValue(1).setRequired(true)))
  .addSubcommand(s => s.setName('browse').setDescription('瀏覽與搜尋以前發布的 Blog 和近況').addStringOption(o => o.setName('query').setDescription('搜尋標題、標籤或內文')).addStringOption(o => o.setName('kind').setDescription('文章類型').addChoices({ name: '全部', value: 'all' }, { name: 'Blog', value: 'post' }, { name: '近況', value: 'talk' })))
  .addSubcommand(s => s.setName('help').setDescription('寫作指南'));
