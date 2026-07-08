"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env");
const telegram_1 = require("./bot/telegram");
async function main() {
    try {
        const bot = (0, telegram_1.createBot)();
        await (0, telegram_1.startBot)(bot);
    }
    catch (error) {
        console.error('Не удалось запустить приложение:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map