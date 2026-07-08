export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UserMemory {
  userId: number;
  messages: ChatMessage[];
  topic?: string;
  lastEmotion?: string;
  suggestedPractices: string[];
  shortTermNotes: string[];
}

export interface MemoryContext {
  recentMessages: ChatMessage[];
  topic?: string;
  lastEmotion?: string;
  suggestedPractices: string[];
  shortTermNotes: string[];
}
