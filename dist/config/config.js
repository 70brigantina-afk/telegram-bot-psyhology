"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
require("./env");
const env_1 = require("./env");
function normalizeEnvValue(value) {
    return value.trim().replace(/^["']|["']$/g, '');
}
function requireEnv(name) {
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
function debugTelegramToken(token) {
    console.log('[debug] TELEGRAM_BOT_TOKEN length:', token.length);
    console.log('[debug] TELEGRAM_BOT_TOKEN prefix:', token.slice(0, 10));
    console.log('[debug] TELEGRAM_BOT_TOKEN suffix:', token.slice(-6));
    console.log('[debug] TELEGRAM_BOT_TOKEN has leading/trailing spaces:', token !== token.trim());
    console.log('[debug] TELEGRAM_BOT_TOKEN wrapped in quotes:', /^["']|["']$/.test(token));
}
const telegramBotToken = requireEnv('TELEGRAM_BOT_TOKEN');
debugTelegramToken(telegramBotToken);
exports.config = {
    telegramBotToken,
    aiApiKey: requireEnv('AI_API_KEY'),
    aiApiUrl: process.env.AI_API_URL ?? 'https://api.openai.com/v1/chat/completions',
    aiModel: process.env.AI_MODEL ?? 'gpt-4o-mini',
    projectRoot: path_1.default.resolve(process.env.PROJECT_ROOT ?? env_1.projectRoot),
    promptsDir: path_1.default.resolve(process.env.PROJECT_ROOT ?? env_1.projectRoot, '1. prompts'),
    knowledgeDir: path_1.default.resolve(process.env.PROJECT_ROOT ?? env_1.projectRoot, '2. knowledge_base'),
    scenariosDir: path_1.default.resolve(process.env.PROJECT_ROOT ?? env_1.projectRoot, '3. scenarios'),
    maxHistoryMessages: 12,
};
//# sourceMappingURL=config.js.map