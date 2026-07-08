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
    const contextSummary = memory.recentMessages
      .slice(-6)
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n');

    const raw = await aiClient.complete(
      [
        {
          role: 'system',
          content: `${this.prompts.emotions}\n\nОтветь только JSON: {"primary_emotion":"...","secondary_emotions":["..."],"intensity":"low|medium|high","possible_need":"...","recommended_strategy":"support|name_emotion|practice|reframe|marina_referral"}`,
        },
        {
          role: 'user',
          content: `Сообщение: ${userMessage}\n\nКонтекст:\n${contextSummary || 'нет'}`,
        },
      ],
      { json: true },
    );

    try {
      const parsed = JSON.parse(raw) as Partial<EmotionAnalysis>;
      return {
        primary_emotion: parsed.primary_emotion ?? DEFAULT_EMOTION.primary_emotion,
        secondary_emotions: parsed.secondary_emotions ?? [],
        intensity: this.normalizeIntensity(parsed.intensity),
        possible_need: parsed.possible_need ?? DEFAULT_EMOTION.possible_need,
        recommended_strategy: parsed.recommended_strategy ?? DEFAULT_EMOTION.recommended_strategy,
      };
    } catch {
      return DEFAULT_EMOTION;
    }
  }

  private normalizeIntensity(value: unknown): EmotionIntensity {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }
    return 'medium';
  }
}

export const emotionAnalyzer = new EmotionAnalyzer();
