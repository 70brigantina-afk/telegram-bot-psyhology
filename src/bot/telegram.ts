import { Telegraf } from 'telegraf';
import { config } from '../config/config';
import { registerHandlers } from './handlers';

export function createBot(): Telegraf {
  const bot = new Telegraf(config.telegramBotToken);
  registerHandlers(bot);
  return bot;
}

export async function startBot(bot: Telegraf): Promise<void> {
  await bot.launch();
  console.log('Telegram-бот запущен');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
