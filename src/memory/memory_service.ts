import { memoryStore } from './memory_store';
import type { ChatMessage, MemoryContext, MemoryUpdateData } from '../types/memory.types';

export class MemoryService {
  getContext(userId: number): MemoryContext {
    const memory = memoryStore.get(userId);

    return {
      recentMessages: memory.messages,
      topic: memory.topic,
      lastEmotion: memory.lastEmotion,
      lastBotQuestion: memory.lastBotQuestion,
      lastPractice: memory.lastPractice,
      lastIntent: memory.lastIntent,
      lastResponseType: memory.lastResponseType,
      dialogueStage: memory.dialogueStage,
      topicHits: memory.topicHits ?? 0,
      lastOpeningStyle: memory.lastOpeningStyle,
      suggestedPractices: memory.suggestedPractices,
      shortTermNotes: memory.shortTermNotes,
    };
  }

  addMessage(userId: number, message: ChatMessage): void {
    const memory = memoryStore.get(userId);
    memory.messages.push(message);
    memoryStore.save(userId, memory);
  }

  updateAfterResponse(userId: number, data: MemoryUpdateData): void {
    const memory = memoryStore.get(userId);

    if (data.topic) {
      const sameTopic =
        memory.topic &&
        memory.topic.toLowerCase() === data.topic.toLowerCase();
      memory.topic = data.topic;
      if (data.incrementTopicHit || sameTopic) {
        memory.topicHits = (memory.topicHits ?? 0) + 1;
      } else if (!sameTopic) {
        memory.topicHits = 1;
      }
    }

    if (data.lastEmotion) {
      memory.lastEmotion = data.lastEmotion;
    }
    if (data.practiceUsed) {
      memory.lastPractice = data.practiceUsed;
      if (!memory.suggestedPractices.includes(data.practiceUsed)) {
        memory.suggestedPractices.push(data.practiceUsed);
      }
    }
    if (data.lastPractice) {
      memory.lastPractice = data.lastPractice;
    }
    if (data.note && !memory.shortTermNotes.includes(data.note)) {
      memory.shortTermNotes.push(data.note);
    }
    if (data.lastBotQuestion === null) {
      memory.lastBotQuestion = undefined;
    } else if (typeof data.lastBotQuestion === 'string') {
      memory.lastBotQuestion = data.lastBotQuestion;
    }
    if (data.lastIntent) {
      memory.lastIntent = data.lastIntent;
    }
    if (data.lastResponseType) {
      memory.lastResponseType = data.lastResponseType;
    }
    if (data.dialogueStage) {
      memory.dialogueStage = data.dialogueStage;
    }
    if (data.lastOpeningStyle) {
      memory.lastOpeningStyle = data.lastOpeningStyle;
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

    const parts = ['Контекст разговора:', history];

    if (context.topic) {
      parts.push(`Тема: ${context.topic}`);
    }
    if (context.lastEmotion) {
      parts.push(`Последнее состояние: ${context.lastEmotion}`);
    }
    if (context.lastBotQuestion) {
      parts.push(`Последний вопрос бота: ${context.lastBotQuestion}`);
    }
    if (context.lastPractice) {
      parts.push(`Последняя практика: ${context.lastPractice}`);
    }
    if (context.lastResponseType) {
      parts.push(`Тип последнего ответа: ${context.lastResponseType}`);
    }
    if (context.dialogueStage) {
      parts.push(`Этап диалога: ${context.dialogueStage}`);
    }
    if (context.topicHits > 0) {
      parts.push(`Сколько раз возвращалась тема: ${context.topicHits}`);
    }
    if (context.suggestedPractices.length > 0) {
      parts.push(`Уже предложенные практики: ${context.suggestedPractices.join(', ')}`);
    }

    return parts.join('\n');
  }
}

export const memoryService = new MemoryService();
