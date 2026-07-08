import { aiClient } from './ai_client';
import type { PromptBundle } from './prompt_loader';
import type { MemoryContext } from '../types/memory.types';
import type { SafetyResult } from '../types/response.types';

const CRISIS_MARKERS = [
  'не хочу жить',
  'хочу умереть',
  'лучше бы меня не было',
  'причинить себе вред',
  'покончить с собой',
  'суицид',
];

export class SafetyChecker {
  private prompts!: PromptBundle;

  init(prompts: PromptBundle): void {
    this.prompts = prompts;
  }

  async check(userMessage: string, memory: MemoryContext): Promise<SafetyResult> {
    const normalized = userMessage.toLowerCase();
    const hasCrisisMarker = CRISIS_MARKERS.some((marker) => normalized.includes(marker));

    if (hasCrisisMarker) {
      return {
        level: 'crisis',
        isCrisis: true,
        reason: 'Обнаружены признаки кризисного состояния',
        useSafetyProtocol: true,
      };
    }

    const contextSummary = memory.recentMessages
      .slice(-4)
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n');

    const raw = await aiClient.complete(
      [
        {
          role: 'system',
          content: `${this.prompts.safety}\n\nОтветь только JSON: {"level":"safe|attention|crisis","isCrisis":boolean,"reason":"...","useSafetyProtocol":boolean}`,
        },
        {
          role: 'user',
          content: `Сообщение: ${userMessage}\n\nКонтекст:\n${contextSummary || 'нет'}`,
        },
      ],
      { json: true },
    );

    try {
      const parsed = JSON.parse(raw) as SafetyResult;
      return {
        level: parsed.level ?? 'safe',
        isCrisis: Boolean(parsed.isCrisis),
        reason: parsed.reason,
        useSafetyProtocol: Boolean(parsed.useSafetyProtocol || parsed.isCrisis),
      };
    } catch {
      return {
        level: 'attention',
        isCrisis: false,
        reason: 'Не удалось разобрать ответ проверки безопасности',
        useSafetyProtocol: false,
      };
    }
  }
}

export const safetyChecker = new SafetyChecker();
