import { aiClient } from './ai_client';
import type { PromptBundle } from './prompt_loader';
import type { KnowledgeBundle } from '../knowledge/knowledge_loader';
import { practiceSelector } from '../knowledge/practice_selector';
import type { EmotionAnalysis } from '../types/emotion.types';
import type { MemoryContext } from '../types/memory.types';
import type { GeneratedResponse, ResponseEngineInput, ResponseStrategy } from '../types/response.types';

export class ResponseEngine {
  private prompts!: PromptBundle;
  private knowledge!: KnowledgeBundle;

  init(prompts: PromptBundle, knowledge: KnowledgeBundle): void {
    this.prompts = prompts;
    this.knowledge = knowledge;
  }

  async generate(input: ResponseEngineInput): Promise<GeneratedResponse> {
    if (input.safety.useSafetyProtocol) {
      return this.generateSafetyResponse(input);
    }

    const practice = this.shouldUsePractice(input.emotion)
      ? practiceSelector.select(input.emotion, input.memory)
      : null;

    const strategy = this.resolveStrategy(input.emotion, practice);

    const text = await aiClient.complete([
      {
        role: 'system',
        content: this.buildSystemPrompt(strategy, practice),
      },
      {
        role: 'user',
        content: this.buildUserPrompt(input, strategy, practice),
      },
    ]);

    return {
      text,
      strategy,
      practiceUsed: practice ?? undefined,
    };
  }

  private async generateSafetyResponse(input: ResponseEngineInput): Promise<GeneratedResponse> {
    const text = await aiClient.complete([
      {
        role: 'system',
        content: `${this.prompts.safety}\n\nСформируй короткий, спокойный и безопасный ответ. Не предлагай обычные практики.`,
      },
      {
        role: 'user',
        content: `Сообщение человека: ${input.userMessage}`,
      },
    ]);

    return {
      text,
      strategy: 'safety_protocol',
    };
  }

  private shouldUsePractice(emotion: EmotionAnalysis): boolean {
    return (
      emotion.recommended_strategy === 'practice' ||
      (emotion.intensity === 'high' && ['тревога', 'страх', 'злость', 'истощение'].includes(emotion.primary_emotion.toLowerCase()))
    );
  }

  private resolveStrategy(
    emotion: EmotionAnalysis,
    practice: string | null,
  ): ResponseStrategy {
    if (practice) {
      return 'practice';
    }

    const strategy = emotion.recommended_strategy as ResponseStrategy;
    const allowed: ResponseStrategy[] = [
      'support',
      'name_emotion',
      'practice',
      'reframe',
      'marina_referral',
    ];

    return allowed.includes(strategy) ? strategy : 'support';
  }

  private buildSystemPrompt(strategy: ResponseStrategy, practice: string | null): string {
    return [
      this.prompts.master,
      this.prompts.system,
      this.prompts.behaviorRules,
      this.prompts.responseEngine,
      this.knowledge.marinaPersonality,
      this.knowledge.voiceOfMarina,
      this.knowledge.conversationMemory,
      this.knowledge.dialogueScenarios,
      this.knowledge.realDialogueExamples,
      practice ? `Подходящая практика из базы:\n${this.knowledge.practices}` : '',
      `Выбранная стратегия: ${strategy}`,
      practice ? `Предложи одну практику: ${practice}` : 'Практику не предлагай, если она не нужна.',
      'Ответ должен быть коротким, живым и человечным. Один хороший вопрос в конце, если уместно.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private buildUserPrompt(
    input: ResponseEngineInput,
    strategy: ResponseStrategy,
    practice: string | null,
  ): string {
    const history = input.memory.recentMessages
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n');

    return [
      `Сообщение человека: ${input.userMessage}`,
      `Эмоция: ${input.emotion.primary_emotion}`,
      `Интенсивность: ${input.emotion.intensity}`,
      `Потребность: ${input.emotion.possible_need}`,
      `Стратегия: ${strategy}`,
      practice ? `Практика: ${practice}` : '',
      history ? `История:\n${history}` : '',
      input.memory.topic ? `Тема: ${input.memory.topic}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }
}

export const responseEngine = new ResponseEngine();
