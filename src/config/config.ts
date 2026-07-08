import path from 'path';
import './env';
import { projectRoot } from './env';

function normalizeEnvValue(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '');
}

function requireEnv(name: string): string {
  const raw = process.env[name];
  if (!raw) {
    throw new Error(`Переменная окружения ${name} не задана`);
  }

  const value = normalizeEnvValue(raw);
  if (!value) {
    throw new Error(`Переменная окружения ${name} пуста после trim`);
  }

  return value;
}

function debugTelegramToken(token: string): void {
  console.log('[debug] TELEGRAM_BOT_TOKEN length:', token.length);
  console.log('[debug] TELEGRAM_BOT_TOKEN prefix:', token.slice(0, 10));
  console.log('[debug] TELEGRAM_BOT_TOKEN suffix:', token.slice(-6));
  console.log('[debug] TELEGRAM_BOT_TOKEN has leading/trailing spaces:', token !== token.trim());
  console.log('[debug] TELEGRAM_BOT_TOKEN wrapped in quotes:', /^["']|["']$/.test(token));
}

const telegramBotToken = requireEnv('TELEGRAM_BOT_TOKEN');
debugTelegramToken(telegramBotToken);

export const config = {
  telegramBotToken,
  aiApiKey: requireEnv('AI_API_KEY'),
  aiApiUrl: process.env.AI_API_URL ?? 'https://api.openai.com/v1/chat/completions',
  aiModel: process.env.AI_MODEL ?? 'gpt-4o-mini',
  projectRoot: path.resolve(process.env.PROJECT_ROOT ?? projectRoot),
  promptsDir: path.resolve(process.env.PROJECT_ROOT ?? projectRoot, '1. prompts'),
  knowledgeDir: path.resolve(process.env.PROJECT_ROOT ?? projectRoot, '2. knowledge_base'),
  scenariosDir: path.resolve(process.env.PROJECT_ROOT ?? projectRoot, '3. scenarios'),
  maxHistoryMessages: 12,
};
