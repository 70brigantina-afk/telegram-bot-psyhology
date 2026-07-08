import { Markup } from 'telegraf';

export type MenuCallback =
  | 'anxiety'
  | 'heavy'
  | 'panic'
  | 'practice'
  | 'about_marina'
  | 'booking';

export type PracticeCallback =
  | 'practice_anxiety'
  | 'practice_panic'
  | 'practice_heavy'
  | 'practice_confusion'
  | 'practice_grounding';

export const CALLBACK_TEXT_MAP: Record<Exclude<MenuCallback, 'practice'>, string> = {
  anxiety: 'Мне тревожно',
  heavy: 'Мне тяжело',
  panic: 'У меня паническая атака',
  about_marina: 'Кто такая Марина?',
  booking: 'Записаться к Марине',
};

export const PRACTICE_CHOICE_MESSAGE =
  'С чем сейчас нужна практика?\n\nВыберите, что ближе:';

export const PRACTICE_ANSWERS: Record<PracticeCallback, string> = {
  practice_anxiety:
    'Давайте немного вернём внимание в настоящий момент.\n\nПосмотрите вокруг и назовите про себя три предмета, которые видите.\n\nПотом почувствуйте стопы на полу и сделайте один спокойный выдох.\n\nЧто вы замечаете в себе сейчас?',
  practice_panic:
    'Сейчас главное — не разбираться в причинах, а вернуть ощущение опоры.\n\nПоставьте обе стопы на пол.\n\nПосмотрите вокруг и найдите пять предметов, которые вы видите.\n\nПотом сделайте медленный выдох. Не обязательно глубоко дышать — просто чуть длиннее выдох.\n\nВы сейчас в безопасном месте?',
  practice_heavy:
    'Давайте не будем требовать от себя сразу решения.\n\nПопробуйте ответить себе очень просто:\n\nчто сейчас стало самым тяжёлым?\n\nгде я слишком долго держусь?\n\nкакой один маленький шаг поддержки для себя возможен сегодня?',
  practice_confusion:
    'Когда внутри много растерянности, важно не решать всё сразу.\n\nПопробуйте разделить:\n\nчто я знаю точно?\n\nчто я предполагаю?\n\nчто сейчас находится в моей зоне влияния?\n\nКакой один маленький шаг кажется самым реальным?',
  practice_grounding:
    'Попробуйте на минуту вернуться в тело и пространство.\n\nПочувствуйте стопы на полу.\n\nНазовите про себя:\n5 предметов, которые видите;\n4 звука, которые слышите;\n3 телесных ощущения.\n\nЧто изменилось хотя бы немного?',
};

/**
 * Inline keyboard — главное меню под /start, /help, «меню».
 */
export const mainInlineKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('🌿 Мне тревожно', 'anxiety'),
    Markup.button.callback('🫶 Мне тяжело', 'heavy'),
  ],
  [
    Markup.button.callback('🫁 Паническая атака', 'panic'),
    Markup.button.callback('✨ Хочу практику', 'practice'),
  ],
  [
    Markup.button.callback('👩‍💼 Кто такая Марина', 'about_marina'),
    Markup.button.callback('📝 Записаться к Марине', 'booking'),
  ],
]);

/**
 * Выбор типа практики — без OpenAI.
 */
export const practiceChoiceKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('🌿 Тревога', 'practice_anxiety'),
    Markup.button.callback('🫁 Паника', 'practice_panic'),
  ],
  [
    Markup.button.callback('🫶 Тяжесть', 'practice_heavy'),
    Markup.button.callback('🧭 Растерянность', 'practice_confusion'),
  ],
  [Markup.button.callback('🧱 Заземление', 'practice_grounding')],
]);

export function resolveCallbackText(callbackData: string): string | null {
  if (callbackData === 'practice') {
    return null;
  }
  if (callbackData in CALLBACK_TEXT_MAP) {
    return CALLBACK_TEXT_MAP[callbackData as Exclude<MenuCallback, 'practice'>];
  }
  return null;
}

export function isPracticeMenuCallback(callbackData: string): boolean {
  return callbackData === 'practice';
}

export function isPracticeChoiceCallback(callbackData: string): callbackData is PracticeCallback {
  return callbackData in PRACTICE_ANSWERS;
}

export function getPracticeAnswer(callbackData: PracticeCallback): string {
  return PRACTICE_ANSWERS[callbackData];
}

export function isPracticeRequest(text: string): boolean {
  const normalized = normalizeKeyboardText(text).toLowerCase().replace(/[.!?…]+$/g, '').trim();
  return (
    normalized === 'хочу практику' ||
    normalized === 'нужна практика' ||
    normalized === 'дай практику' ||
    normalized === 'предложи практику'
  );
}

/**
 * На случай, если пользователь введёт текст кнопки вручную с эмодзи.
 */
export function normalizeKeyboardText(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return trimmed;
  }

  const legacyMap: Record<string, string> = {
    '🌿 Мне тревожно': 'Мне тревожно',
    '🫶 Мне тяжело': 'Мне тяжело',
    '🫁 Паническая атака': 'У меня паническая атака',
    '✨ Хочу практику': 'Хочу практику',
    '👩‍💼 Кто такая Марина': 'Кто такая Марина?',
    '📝 Записаться к Марине': 'Записаться к Марине',
  };

  return (
    legacyMap[trimmed] ??
    trimmed
      .replace(/^(?:🌿|🫶|🫁|✨|📝|👩‍💼|🧭|🧱)\s*/u, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
