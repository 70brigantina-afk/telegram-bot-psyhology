"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeKeyboard = exports.mainKeyboard = void 0;
const telegraf_1 = require("telegraf");
exports.mainKeyboard = telegraf_1.Markup.keyboard([
    ['Мне тревожно', 'Мне тяжело'],
    ['Хочу практику', 'Кто такая Марина?'],
])
    .resize()
    .oneTime();
exports.removeKeyboard = telegraf_1.Markup.removeKeyboard();
//# sourceMappingURL=keyboards.js.map