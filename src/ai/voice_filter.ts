import { aiClient } from './ai_client';
import type { KnowledgeBundle } from '../knowledge/knowledge_loader';

const FORBIDDEN_PHRASES = [
  'мне жаль слышать',
  'ты не один',
  'вы не один',
  'ты не одна',
  'вы не одна',
  'это нормально',
  'я здесь, чтобы поддержать',
  'я здесь чтобы поддержать',
  'жизнь подбрасывает испытания',
  'это пройдет',
  'это пройдёт',
  'постарайся расслабиться',
  'постарайтесь расслабиться',
  'постарайся успокоиться',
  'постарайтесь успокоиться',
];

export class VoiceFilter {
  private knowledge!: KnowledgeBundle;

  init(knowledge: KnowledgeBundle): void {
    this.knowledge = knowledge;
  }

  async apply(
    responseText: string,
    options?: { skipAi?: boolean; preserveExact?: boolean },
  ): Promise<string> {
    const text = responseText.trim();
    if (!text) {
      return text;
    }

    // Готовые ответы (FAQ / safety / identity / panic) нельзя резать кусками.
    if (options?.preserveExact || options?.skipAi) {
      return text;
    }

    if (!this.knowledge.voiceOfMarina.trim()) {
      return text;
    }

    const refined = await aiClient.complete([
      {
        role: 'system',
        content: [
          'Проверь и при необходимости слегка отредактируй ответ, чтобы он звучал голосом Марины.',
          'Голос: тёплый, взрослый, спокойный, без клише и без «поддержки из учебника».',
          'Не меняй смысл. Не добавляй продажу консультации.',
          'Не делай ответ длиннее. Можно только улучшить формулировки.',
          'Если видишь шаблонные фразы — перепиши их целиком, не вырезай куски посередине предложения.',
          `Не используй: ${FORBIDDEN_PHRASES.join('; ')}.`,
          this.knowledge.voiceOfMarina,
        ].join('\n\n'),
      },
      {
        role: 'user',
        content: text,
      },
    ]);

    return refined.trim() || text;
  }
}

export const voiceFilter = new VoiceFilter();
