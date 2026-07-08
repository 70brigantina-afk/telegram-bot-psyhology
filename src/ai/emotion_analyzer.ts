import { aiClient } from './ai_client';
import type { PromptBundle } from './prompt_loader';
import type { EmotionAnalysis, EmotionIntensity } from '../types/emotion.types';
import type { MemoryContext } from '../types/memory.types';

const DEFAULT_EMOTION: EmotionAnalysis = {
  primary_emotion: 'растерянность',
  secondary_emotions: [],
  intensity: 'medium',
  possible_need: 'поддержка и понимание',
  recommended_strategy: 'support',
};

export class EmotionAnalyzer {
  private prompts!: PromptBundle;

  init(prompts: PromptBundle): void {
    this.prompts = prompts;
  }

  async analyze(userMessage: string, memory: MemoryContext): Promise<EmotionAnalysis> {
    const normalized = userMessage.trim().toLowerCase();
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    const isShortContinuation =
      wordCount <= 5 &&
      Boolean(memory.lastEmotion || memory.topic || memory.lastBotQuestion) &&
      !/[?]/.test(normalized);

    // Короткий ответ на вопрос бота — не переписываем эмоцию «с нуля».
    if (isShortContinuation && memory.lastEmotion) {
      const inherited: EmotionAnalysis = {
        primary_emotion: memory.lastEmotion,
        secondary_emotions: [],
        intensity: this.inferShortIntensity(normalized, memory),
        possible_need: this.inferShortNeed(normalized, memory),
        recommended_strategy: 'support',
      };

      if (
        /^(не\s*знаю|незнаю|работа|муж|жена|деньги|устала|устал|опять|из[- ]?за)/i.test(
          normalized,
        )
      ) {
        return inherited;
      }
    }

    const contextSummary = memory.recentMessages
      .slice(-6)
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n');

    const raw = await aiClient.complete(
      [
        {
          role: 'system',
          content: [
            this.prompts.emotions || 'Определи ведущую эмоцию человека по сообщению.',
            'Не путай информационные вопросы (кто такая Марина, что ты умеешь, как записаться) с тревогой.',
            'Не трактуй вопросы «кто я?» / «какого я пола?» как запрос на диагностику личности — это отдельные intents.',
            'Если сообщение короткое и явно продолжает прошлую тему (работа / не знаю / устала), сохраняй прошлую эмоцию и уточняй контекст.',
            'Для паники/панической атаки: primary_emotion="паника", intensity="high", recommended_strategy="practice".',
            'Ответь только JSON: {"primary_emotion":"...","secondary_emotions":["..."],"intensity":"low|medium|high","possible_need":"...","recommended_strategy":"support|name_emotion|practice|reframe|marina_referral"}',
          ].join('\n\n'),
        },
        {
          role: 'user',
          content: [
            `Сообщение: ${userMessage}`,
            `Контекст:\n${contextSummary || 'нет'}`,
            memory.lastEmotion ? `Прошлая эмоция: ${memory.lastEmotion}` : '',
            memory.topic ? `Тема: ${memory.topic}` : '',
            memory.lastBotQuestion ? `Последний вопрос бота: ${memory.lastBotQuestion}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      ],
      { json: true },
    );

    try {
      const parsed = JSON.parse(raw) as Partial<EmotionAnalysis>;
      return {
        primary_emotion:
          parsed.primary_emotion ?? memory.lastEmotion ?? DEFAULT_EMOTION.primary_emotion,
        secondary_emotions: parsed.secondary_emotions ?? [],
        intensity: this.normalizeIntensity(parsed.intensity),
        possible_need: parsed.possible_need ?? DEFAULT_EMOTION.possible_need,
        recommended_strategy:
          parsed.recommended_strategy ?? DEFAULT_EMOTION.recommended_strategy,
      };
    } catch {
      if (memory.lastEmotion) {
        return {
          ...DEFAULT_EMOTION,
          primary_emotion: memory.lastEmotion,
        };
      }
      return DEFAULT_EMOTION;
    }
  }

  private inferShortIntensity(message: string, memory: MemoryContext): EmotionIntensity {
    if (/очень|сильно|совсем|совсем плохо|невыносимо/.test(message)) {
      return 'high';
    }
    if (memory.lastResponseType === 'practice') {
      return 'medium';
    }
    return 'medium';
  }

  private inferShortNeed(message: string, memory: MemoryContext): string {
    if (/не\s*знаю|незнаю/.test(message)) {
      return 'мягкая помощь выбрать направление без давления';
    }
    if (/устал/.test(message)) {
      return 'признание усталости и ясность, что забирает силы';
    }
    if (/работ|муж|жен|деньг|дет|семь/.test(message)) {
      return `прояснить аспект темы «${memory.topic || message}»`;
    }
    if (/легче|помогло/.test(message)) {
      return 'закрепить маленькое облегчение после практики';
    }
    if (/не помог|ничего не помог/.test(message)) {
      return 'признать, что не помогло, и уточнить, где напряжение сильнее';
    }
    return 'продолжение текущего разговора';
  }

  private normalizeIntensity(value: unknown): EmotionIntensity {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }
    return 'medium';
  }
}

export const emotionAnalyzer = new EmotionAnalyzer();
