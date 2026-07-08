import { aiClient } from './ai_client';
import type { KnowledgeBundle } from '../knowledge/knowledge_loader';

export class VoiceFilter {
  private knowledge!: KnowledgeBundle;

  init(knowledge: KnowledgeBundle): void {
    this.knowledge = knowledge;
  }

  async apply(responseText: string): Promise<string> {
    if (!this.knowledge.voiceOfMarina.trim()) {
      return responseText;
    }

    const refined = await aiClient.complete([
      {
        role: 'system',
        content: [
          'Проверь и при необходимости слегка отредактируй ответ, чтобы он звучал голосом Марины.',
          'Не меняй смысл поддержки.',
          'Не добавляй продажу консультации.',
          'Не используй шаблонные фразы.',
          this.knowledge.voiceOfMarina,
        ].join('\n\n'),
      },
      {
        role: 'user',
        content: responseText,
      },
    ]);

    return refined;
  }
}

export const voiceFilter = new VoiceFilter();
