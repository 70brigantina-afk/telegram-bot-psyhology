import { config } from '../config/config';
import type { UserMemory } from '../types/memory.types';

const store = new Map<number, UserMemory>();

function createEmptyMemory(userId: number): UserMemory {
  return {
    userId,
    messages: [],
    topicHits: 0,
    suggestedPractices: [],
    shortTermNotes: [],
  };
}

export class MemoryStore {
  get(userId: number): UserMemory {
    const existing = store.get(userId);
    if (existing) {
      return {
        ...existing,
        topicHits: existing.topicHits ?? 0,
        suggestedPractices: existing.suggestedPractices ?? [],
        shortTermNotes: existing.shortTermNotes ?? [],
      };
    }

    const memory = createEmptyMemory(userId);
    store.set(userId, memory);
    return memory;
  }

  save(userId: number, memory: UserMemory): void {
    const trimmedMessages = memory.messages.slice(-config.maxHistoryMessages);
    store.set(userId, {
      ...memory,
      messages: trimmedMessages,
      topicHits: memory.topicHits ?? 0,
      suggestedPractices: memory.suggestedPractices ?? [],
      shortTermNotes: memory.shortTermNotes ?? [],
    });
  }

  clear(userId: number): void {
    store.delete(userId);
  }
}

export const memoryStore = new MemoryStore();
