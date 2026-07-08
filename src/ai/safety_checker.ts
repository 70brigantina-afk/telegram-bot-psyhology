import { aiClient } from './ai_client';
import type { PromptBundle } from './prompt_loader';
import type { MemoryContext } from '../types/memory.types';
import type { SafetyResult } from '../types/response.types';

const CRISIS_MARKERS = [
  'не хочу жить',
  'хочу умереть',
  'жить больше незачем',
  'жить незачем',
  'лучше бы меня не было',
  'причинить себе вред',
  'покончить с собой',
  'суицид',
  'самоубий',
  'не хочется жить',
  'нет смысла жить',
  'хочу исчезнуть',
  'не вижу смысла жить',
];

export const SAFETY_FALLBACK_REPLY =
  'Мне важно отнестись к этому очень серьёзно.\n\nСкажите, пожалуйста: вы сейчас в безопасности? Есть ли рядом человек, которому вы можете прямо сейчас написать или позвонить?\n\nЕсли есть риск, что вы можете причинить себе вред, пожалуйста, обратитесь в экстренную помощь или к ближайшему человеку рядом.\n\nСейчас важно не оставаться одной.';

export const POST_CRISIS_FOLLOWUP_REPLY =
  'Я помню, что только что вы писали о очень тяжёлом состоянии, поэтому сначала уточню самое важное.\n\nВы сейчас в безопасности? Есть ли рядом человек, которому вы можете написать или позвонить?\n\nЕсли непосредственного риска нет, мы можем аккуратно разобраться, что сейчас стало самым тяжёлым.';

export class SafetyChecker {
  private prompts!: PromptBundle;

  init(prompts: PromptBundle): void {
    this.prompts = prompts;
  }

  hasLocalCrisisMarker(userMessage: string): boolean {
    const normalized = userMessage.toLowerCase();
    return CRISIS_MARKERS.some((marker) => normalized.includes(marker));
  }

  async check(userMessage: string, memory: MemoryContext): Promise<SafetyResult> {
    if (this.hasLocalCrisisMarker(userMessage)) {
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

    try {
      const raw = await aiClient.complete(
        [
          {
            role: 'system',
            content: [
              this.prompts.safety ||
                'Ты проверяешь сообщения на признаки суицидального риска и самоповреждения.',
              'Оценивай высокий риск для фраз о желании умереть, отсутствии смысла жить, причинении себе вреда.',
              'Ответь только JSON: {"level":"safe|attention|crisis","isCrisis":boolean,"reason":"...","useSafetyProtocol":boolean}',
              'Если есть признаки кризиса — level="crisis", isCrisis=true, useSafetyProtocol=true.',
            ].join('\n\n'),
          },
          {
            role: 'user',
            content: `Сообщение: ${userMessage}\n\nКонтекст:\n${contextSummary || 'нет'}`,
          },
        ],
        { json: true },
      );

      const parsed = JSON.parse(raw) as SafetyResult;
      return {
        level: parsed.level ?? 'safe',
        isCrisis: Boolean(parsed.isCrisis),
        reason: parsed.reason,
        useSafetyProtocol: Boolean(
          parsed.useSafetyProtocol || parsed.isCrisis || parsed.level === 'crisis',
        ),
      };
    } catch (error) {
      console.error('[safety] AI safety check failed, continuing as safe:', error);
      return {
        level: 'attention',
        isCrisis: false,
        reason: 'Не удалось выполнить AI-проверку безопасности',
        useSafetyProtocol: false,
      };
    }
  }
}

export const safetyChecker = new SafetyChecker();
