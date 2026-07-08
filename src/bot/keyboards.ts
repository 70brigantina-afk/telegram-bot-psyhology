import { Markup } from 'telegraf';

export const mainKeyboard = Markup.keyboard([
  ['Мне тревожно', 'Мне тяжело'],
  ['Хочу практику', 'Кто такая Марина?'],
])
  .resize()
  .oneTime();

export const removeKeyboard = Markup.removeKeyboard();
