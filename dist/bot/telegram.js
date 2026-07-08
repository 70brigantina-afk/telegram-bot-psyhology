"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBot = createBot;
exports.startBot = startBot;
const telegraf_1 = require("telegraf");
const config_1 = require("../config/config");
const handlers_1 = require("./handlers");
function createBot() {
    const bot = new telegraf_1.Telegraf(config_1.config.telegramBotToken);
    (0, handlers_1.registerHandlers)(bot);
    return bot;
}
async function startBot(bot) {
    await bot.launch();
    console.log('Telegram-бот запущен');
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
//# sourceMappingURL=telegram.js.map