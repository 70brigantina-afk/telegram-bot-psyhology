import type { Telegraf } from 'telegraf';
import { emotionAnalyzer } from '../ai/emotion_analyzer';
import { promptLoader } from '../ai/prompt_loader';
import { responseEngine } from '../ai/response_engine';
import { safetyChecker } from '../ai/safety_checker';
import { voiceFilter } from '../ai/voice_filter';
import { knowledgeLoader } from '../knowledge/knowledge_loader';
import { memoryService } from '../memory/memory_service';
import { mainKeyboard } from './keyboards';

let isInitialized = false;

async function ensureInitialized(): Promise<void> {
  if (isInitialized) {
    return;
  }

  const [prompts, knowledge] = await Promise.all([
    promptLoader.loadPrompts(),
    knowledgeLoader.loadKnowledge(),
  ]);

  safetyChecker.init(prompts);
  emotionAnalyzer.init(prompts);
  responseEngine.init(prompts, knowledge);
  voiceFilter.init(knowledge);

  isInitialized = true;
}

async function processUserMessage(userId: number, text: string): Promise<string> {
  await ensureInitialized();

  const memory = memoryService.getContext(userId);

  memoryService.addMessage(userId, {
    role: 'user',
    content: text,
    timestamp: Date.now(),
  });

  const safety = await safetyChecker.check(text, memory);
  const emotion = await emotionAnalyzer.analyze(text, memory);

  const generated = await responseEngine.generate({
    userMessage: text,
    memory,
    safety,
    emotion,
  });

  const finalText = await voiceFilter.apply(generated.text);

  memoryService.addMessage(userId, {
    role: 'assistant',
    content: finalText,
    timestamp: Date.now(),
  });

  memoryService.updateAfterResponse(userId, {
    topic: emotion.primary_emotion,
    lastEmotion: emotion.primary_emotion,
    practiceUsed: generated.practiceUsed,
  });

  return finalText;
}

export function registerHandlers(bot: Telegraf): void {
  bot.start(async (ctx) => {
    await ctx.reply(
      'Здравствуйте. Можно просто написать, что сейчас происходит или что вас беспокоит. Не обязательно подбирать правильные слова.',
      mainKeyboard,
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      'Я здесь, чтобы помочь вам лучше понять своё состояние и сделать следующий бережный шаг. Напишите, что сейчас чувствуете.',
      mainKeyboard,
    );
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();

    if (!text) {
      return;
    }

    try {
      await ctx.sendChatAction('typing');
      const reply = await processUserMessage(userId, text);
      await ctx.reply(reply, mainKeyboard);
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
      await ctx.reply(
        'Сейчас мне не удалось ответить. Попробуйте написать ещё раз чуть позже.',
        mainKeyboard,
      );
    }
  });
}
