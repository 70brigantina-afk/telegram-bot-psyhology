import type { Telegraf } from 'telegraf';
import { emotionAnalyzer } from '../ai/emotion_analyzer';
import { promptLoader } from '../ai/prompt_loader';
import { responseEngine } from '../ai/response_engine';
import {
  POST_CRISIS_FOLLOWUP_REPLY,
  SAFETY_FALLBACK_REPLY,
  safetyChecker,
} from '../ai/safety_checker';
import { voiceFilter } from '../ai/voice_filter';
import {
  buildFaqAnswer,
  buildIdentityAnswer,
  detectFaqTopic,
  detectIdentityTopic,
  detectPanic,
  knowledgeLoader,
  PANIC_REPLY,
  type KnowledgeBundle,
} from '../knowledge/knowledge_loader';
import { memoryService } from '../memory/memory_service';
import type { MemoryContext, MemoryUpdateData } from '../types/memory.types';
import {
  getPracticeAnswer,
  isPracticeChoiceCallback,
  isPracticeMenuCallback,
  isPracticeRequest,
  mainInlineKeyboard,
  normalizeKeyboardText,
  PRACTICE_CHOICE_MESSAGE,
  practiceChoiceKeyboard,
  resolveCallbackText,
} from './keyboards';

function extractQuestion(text: string): string | undefined {
  const matches = text.match(/[^.!?\n]+\?/g);
  if (!matches || matches.length === 0) {
    return undefined;
  }
  return matches[matches.length - 1].trim();
}

function inferTopicFromMessage(text: string, fallbackEmotion: string): string {
  const normalized = text.toLowerCase();
  if (/работ/.test(normalized)) return 'работа';
  if (/муж|жен|отношен/.test(normalized)) return 'отношения';
  if (/деньг|финанс/.test(normalized)) return 'деньги';
  if (/устал/.test(normalized)) return 'усталость';
  if (/тревож/.test(normalized)) return 'тревога';
  if (/тяжел/.test(normalized)) return 'тяжесть';
  return fallbackEmotion;
}

let isInitialized = false;
let knowledgeCache: KnowledgeBundle | null = null;

const recentCrisisUsers = new Map<number, number>();
const CRISIS_FOLLOWUP_WINDOW_MS = 30 * 60 * 1000;

/** Защита от случайного двойного клика по одной и той же inline-кнопке. */
const recentCallbackClicks = new Map<number, { callbackData: string; timestamp: number }>();
const CALLBACK_DEBOUNCE_MS = 2500;

function isDuplicateCallbackClick(userId: number, callbackData: string): boolean {
  const now = Date.now();
  const previous = recentCallbackClicks.get(userId);

  if (
    previous &&
    previous.callbackData === callbackData &&
    now - previous.timestamp < CALLBACK_DEBOUNCE_MS
  ) {
    return true;
  }

  recentCallbackClicks.set(userId, { callbackData, timestamp: now });
  return false;
}

async function ensureInitialized(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    const knowledge = await knowledgeLoader.loadKnowledge();
    knowledgeCache = knowledge;
    voiceFilter.init(knowledge);

    try {
      const prompts = await promptLoader.loadPrompts();
      safetyChecker.init(prompts);
      emotionAnalyzer.init(prompts);
      responseEngine.init(prompts, knowledge);
    } catch (error) {
      // FAQ / panic / identity / local safety должны работать даже без промптов.
      console.error('[init] Prompts failed to load; AI branches may be unavailable:', error);
    }

    isInitialized = true;
  } catch (error) {
    console.error('[init] Failed to initialize bot modules:', error);
    // Даже при ошибке инициализации FAQ fallback остаётся доступным.
    isInitialized = true;
  }
}

function markCrisis(userId: number): void {
  recentCrisisUsers.set(userId, Date.now());
}

function hasRecentCrisis(userId: number): boolean {
  const stamped = recentCrisisUsers.get(userId);
  if (!stamped) {
    return false;
  }
  if (Date.now() - stamped > CRISIS_FOLLOWUP_WINDOW_MS) {
    recentCrisisUsers.delete(userId);
    return false;
  }
  return true;
}

function clearRecentCrisis(userId: number): void {
  recentCrisisUsers.delete(userId);
}

function looksLikeSafetyClearance(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    /я\s+в\s+безопасности/.test(normalized) ||
    /мне\s+уже\s+лучше/.test(normalized) ||
    /риска\s+нет/.test(normalized) ||
    /уже\s+не\s+хочу\s+умирать/.test(normalized)
  );
}

function saveAssistantReply(
  userId: number,
  finalText: string,
  data: MemoryUpdateData,
): void {
  memoryService.addMessage(userId, {
    role: 'assistant',
    content: finalText,
    timestamp: Date.now(),
  });
  memoryService.updateAfterResponse(userId, {
    ...data,
    lastBotQuestion:
      data.lastBotQuestion === null
        ? null
        : data.lastBotQuestion ?? extractQuestion(finalText),
  });
}

async function processUserMessage(userId: number, rawText: string): Promise<string> {
  await ensureInitialized();

  // Кнопки с эмодзи приводим к обычному тексту до всех веток пайплайна.
  const text = normalizeKeyboardText(rawText);
  const memory: MemoryContext = memoryService.getContext(userId);

  memoryService.addMessage(userId, {
    role: 'user',
    content: text,
    timestamp: Date.now(),
  });

  let branch = 'normalize';
  let intent: string | null = null;

  try {
    // 1) Local crisis markers first (no OpenAI).
    branch = 'safety_local';
    if (safetyChecker.hasLocalCrisisMarker(text)) {
      intent = 'crisis';
      markCrisis(userId);
      const finalText = SAFETY_FALLBACK_REPLY;
      saveAssistantReply(userId, finalText, {
        topic: 'безопасность',
        lastEmotion: 'кризис',
        lastIntent: 'crisis',
        lastResponseType: 'safety',
        dialogueStage: 'neutral',
        lastBotQuestion: extractQuestion(finalText) ?? null,
      });
      console.log('[pipeline] branch=safety_local intent=crisis');
      return finalText;
    }

    // FAQ / identity / panic должны отвечать без OpenAI, до AI-safety.
    branch = 'faq_detect';
    const faqTopic = detectFaqTopic(text);
    if (faqTopic) {
      intent = `faq:${faqTopic}`;
      branch = 'faq_answer';
      const finalText = buildFaqAnswer(faqTopic, knowledgeCache);
      saveAssistantReply(userId, finalText, {
        topic: faqTopic,
        lastEmotion: 'нейтрально',
        lastIntent: intent,
        lastResponseType: 'faq',
        dialogueStage: 'neutral',
        lastBotQuestion: null,
      });
      console.log(`[pipeline] branch=faq_answer intent=${intent}`);
      return finalText;
    }

    branch = 'identity_detect';
    const identityTopic = detectIdentityTopic(text);
    if (identityTopic) {
      intent = `identity:${identityTopic}`;
      branch = 'identity_answer';
      const finalText = buildIdentityAnswer(identityTopic);
      saveAssistantReply(userId, finalText, {
        topic: identityTopic,
        lastEmotion: 'нейтрально',
        lastIntent: intent,
        lastResponseType: 'identity',
        dialogueStage: 'neutral',
        lastBotQuestion: extractQuestion(finalText),
      });
      console.log(`[pipeline] branch=identity_answer intent=${intent}`);
      return finalText;
    }

    branch = 'panic_detect';
    if (detectPanic(text)) {
      intent = 'panic';
      branch = 'panic_answer';
      const finalText = PANIC_REPLY;
      saveAssistantReply(userId, finalText, {
        topic: 'паника',
        lastEmotion: 'паника',
        practiceUsed: 'Заземление через 5 предметов и удлинённый выдох',
        lastPractice: 'panic_fixed',
        lastIntent: 'panic',
        lastResponseType: 'panic',
        dialogueStage: 'after_practice',
        lastBotQuestion: extractQuestion(finalText),
      });
      console.log('[pipeline] branch=panic_answer intent=panic');
      return finalText;
    }

    // После недавнего кризиса — мягкий follow-up без обрезки текста.
    branch = 'post_crisis_check';
    if (hasRecentCrisis(userId) && !looksLikeSafetyClearance(text)) {
      intent = 'post_crisis_check';
      const finalText = POST_CRISIS_FOLLOWUP_REPLY;
      saveAssistantReply(userId, finalText, {
        topic: 'безопасность',
        lastEmotion: 'внимание_к_безопасности',
        lastIntent: intent,
        lastResponseType: 'safety',
        dialogueStage: 'neutral',
        lastBotQuestion: extractQuestion(finalText),
      });
      console.log('[pipeline] branch=post_crisis_check');
      return finalText;
    }
    if (looksLikeSafetyClearance(text)) {
      clearRecentCrisis(userId);
    }

    // 2) AI safety (для неочевидных случаев).
    branch = 'safety_ai';
    const safety = await safetyChecker.check(text, memory);
    if (safety.useSafetyProtocol) {
      intent = 'crisis_ai';
      markCrisis(userId);
      const finalText = SAFETY_FALLBACK_REPLY;
      saveAssistantReply(userId, finalText, {
        topic: 'безопасность',
        lastEmotion: 'кризис',
        lastIntent: intent,
        lastResponseType: 'safety',
        dialogueStage: 'neutral',
        lastBotQuestion: extractQuestion(finalText),
      });
      console.log('[pipeline] branch=safety_ai intent=crisis_ai');
      return finalText;
    }

    // 3) Emotion + response engine with dialogue continuity.
    branch = 'emotion_analysis';
    const emotion = await emotionAnalyzer.analyze(text, memory);

    branch = 'response_engine';
    const generated = await responseEngine.generate({
      userMessage: text,
      memory,
      safety,
      emotion,
      faqTopic: null,
    });

    branch = 'voice_filter';
    const finalText = await voiceFilter.apply(generated.text, {
      skipAi: false,
      preserveExact: false,
    });

    const topic = inferTopicFromMessage(text, emotion.primary_emotion);
    saveAssistantReply(userId, finalText, {
      topic,
      lastEmotion: emotion.primary_emotion,
      practiceUsed: generated.practiceUsed,
      lastPractice: generated.practiceUsed,
      lastIntent: generated.lastIntent,
      lastResponseType: generated.lastResponseType,
      dialogueStage: generated.dialogueStage,
      lastBotQuestion: generated.lastBotQuestion ?? extractQuestion(finalText) ?? null,
      lastOpeningStyle: generated.openingStyle,
      incrementTopicHit: Boolean(memory.topic && memory.topic === topic),
    });

    console.log(
      `[pipeline] branch=response_engine emotion=${emotion.primary_emotion} stage=${generated.dialogueStage}`,
    );
    return finalText;
  } catch (error) {
    console.error('[pipeline] Failed while processing message:', {
      branch,
      intent,
      userId,
      textPreview: text.slice(0, 80),
      error,
    });
    throw error;
  }
}

const MENU_MESSAGE =
  'Можно написать своими словами или выбрать, что ближе сейчас:';

function isMenuRequest(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized === 'меню' ||
    normalized === 'кнопки' ||
    normalized === 'показать меню'
  );
}

function rememberPracticeChoicePrompt(userId: number, userText: string): void {
  memoryService.addMessage(userId, {
    role: 'user',
    content: userText,
    timestamp: Date.now(),
  });
  memoryService.addMessage(userId, {
    role: 'assistant',
    content: PRACTICE_CHOICE_MESSAGE,
    timestamp: Date.now(),
  });
  memoryService.updateAfterResponse(userId, {
    topic: 'выбор_практики',
    lastEmotion: 'нейтрально',
    lastIntent: 'practice_menu',
    lastResponseType: 'practice_menu',
    dialogueStage: 'practice',
    lastBotQuestion: 'С чем сейчас нужна практика?',
  });
}

function rememberPracticeAnswer(userId: number, label: string, answer: string): void {
  memoryService.addMessage(userId, {
    role: 'user',
    content: label,
    timestamp: Date.now(),
  });
  saveAssistantReply(userId, answer, {
    topic: 'практика',
    lastEmotion: 'нейтрально',
    practiceUsed: label,
    lastPractice: label,
    lastIntent: `practice:${label}`,
    lastResponseType: 'practice',
    dialogueStage: 'after_practice',
    lastBotQuestion: extractQuestion(answer),
  });
}

export function registerHandlers(bot: Telegraf): void {
  bot.start(async (ctx) => {
    await ctx.reply(
      'Здравствуйте. Я рядом, чтобы помочь вам немного разобраться в состоянии.\n\nМожно написать своими словами или выбрать, что ближе сейчас:',
      mainInlineKeyboard,
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      'Я могу помочь назвать чувство, чуть снизить тревогу, предложить короткую практику или рассказать о Марине.\n\nМожно написать своими словами или выбрать кнопку ниже.',
      mainInlineKeyboard,
    );
  });

  bot.on('callback_query', async (ctx) => {
    const callback = ctx.callbackQuery;
    if (!('data' in callback) || !callback.data) {
      await ctx.answerCbQuery();
      return;
    }

    if (!ctx.from) {
      await ctx.answerCbQuery();
      return;
    }

    const userId = ctx.from.id;
    const data = callback.data;

    // Игнорировать повторный клик по той же кнопке в короткий интервал.
    if (isDuplicateCallbackClick(userId, data)) {
      await ctx.answerCbQuery('Уже обрабатываю…');
      return;
    }

    await ctx.answerCbQuery();

    try {
      // Выбор практики: только уточняющие кнопки, без OpenAI.
      if (isPracticeMenuCallback(data)) {
        rememberPracticeChoicePrompt(userId, 'Хочу практику');
        await ctx.reply(PRACTICE_CHOICE_MESSAGE, practiceChoiceKeyboard);
        return;
      }

      if (isPracticeChoiceCallback(data)) {
        const answer = getPracticeAnswer(data);
        rememberPracticeAnswer(userId, data, answer);
        await ctx.reply(answer);
        return;
      }

      const mappedText = resolveCallbackText(data);
      if (!mappedText) {
        return;
      }

      await ctx.sendChatAction('typing');
      // Ответ без нового главного меню — старое под /start остаётся кликабельным.
      const reply = await processUserMessage(userId, mappedText);
      await ctx.reply(reply);
    } catch (error) {
      console.error('Ошибка обработки callback:', {
        callbackData: data,
        error,
      });
      await ctx.reply(
        'Сейчас мне не удалось ответить. Попробуйте написать ещё раз чуть позже.',
      );
    }
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();

    if (!text) {
      return;
    }

    // /start и /help обрабатываются отдельными хендлерами
    if (text.startsWith('/')) {
      return;
    }

    if (isMenuRequest(text)) {
      await ctx.reply(MENU_MESSAGE, mainInlineKeyboard);
      return;
    }

    const normalized = normalizeKeyboardText(text);

    // Safety всегда выше практик.
    if (safetyChecker.hasLocalCrisisMarker(normalized)) {
      try {
        await ctx.sendChatAction('typing');
        const reply = await processUserMessage(userId, normalized);
        await ctx.reply(reply);
      } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
        await ctx.reply(
          'Сейчас мне не удалось ответить. Попробуйте написать ещё раз чуть позже.',
        );
      }
      return;
    }

    if (isPracticeRequest(normalized)) {
      rememberPracticeChoicePrompt(userId, normalized);
      await ctx.reply(PRACTICE_CHOICE_MESSAGE, practiceChoiceKeyboard);
      return;
    }

    try {
      await ctx.sendChatAction('typing');
      // Обычные ответы без повторного меню.
      const reply = await processUserMessage(userId, text);
      await ctx.reply(reply);
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
      await ctx.reply(
        'Сейчас мне не удалось ответить. Попробуйте написать ещё раз чуть позже.',
      );
    }
  });
}
