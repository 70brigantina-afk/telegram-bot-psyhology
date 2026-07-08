import './config/env';
import { createBot, startBot } from './bot/telegram';

async function main(): Promise<void> {
  try {
    const bot = createBot();
    await startBot(bot);
  } catch (error) {
    console.error('Не удалось запустить приложение:', error);
    process.exit(1);
  }
}

main();
