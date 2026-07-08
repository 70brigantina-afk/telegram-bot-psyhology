import { memoryStore } from './memory_store';
import type { ChatMessage, MemoryContext } from '../types/memory.types';

export class MemoryService {
  getContext(userId: number): MemoryContext {
    const memory = memoryStore.get(userId);

    return {
      recentMessages: memory.messages,
      topic: memory.topic,
      lastEmotion: memory.lastEmotion,
      suggestedPractices: memory.suggestedPractices,
      shortTermNotes: memory.shortTermNotes,
    };
  }

  addMessage(userId: number, message: ChatMessage): void {
    const memory = memoryStore.get(userId);
    memory.messages.push(message);
    memoryStore.save(userId, memory);
  }

  updateAfterResponse(
    userId: number,
    data: {
      topic?: string;
      lastEmotion?: string;
      practiceUsed?: string;
      note?: string;
    },
  ): void {
    const memory = memoryStore.get(userId);

    if (data.topic) {
      memory.topic = data.topic;
    }
    if (data.lastEmotion) {
      memory.lastEmotion = data.lastEmotion;
    }
    if (data.practiceUsed && !memory.suggestedPractices.includes(data.practiceUsed)) {
      memory.suggestedPractices.push(data.practiceUsed);
    }
    if (data.note && !memory.shortTermNotes.includes(data.note)) {
      memory.shortTermNotes.push(data.note);
    }

    memoryStore.save(userId, memory);
  }

  clear(userId: number): void {
    memoryStore.clear(userId);
  }

  formatContextForPrompt(context: MemoryContext): string {
    if (context.recentMessages.length === 0) {
      return 'Контекст разговора: новый диалог.';
    }

    const history = context.recentMessages
      .map((item) => `${item.role === 'user' ? 'Человек' : 'Помощник'}: ${item.content}`)
      .join('\n');

    const parts = [
      'Контекст разговора:',
      history,
    ];

    if (context.topic) {
      parts.push(`Тема: ${context.topic}`);
    }
    if (context.lastEmotion) {
      parts.push(`Последнее состояние: ${context.lastEmotion}`);
    }
    if (context.suggestedPractices.length > 0) {
      parts.push(`Уже предложенные практики: ${context.suggestedPractices.join(', ')}`);
    }

    return parts.join('\n');
  }
}

export const memoryService = new MemoryService();
