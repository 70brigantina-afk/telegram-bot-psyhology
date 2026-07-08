export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type DialogueStage =
  | 'reflect'
  | 'clarify_cause'
  | 'deepen'
  | 'practice'
  | 'after_practice'
  | 'marina_soft'
  | 'neutral';

export type ResponseType =
  | 'support'
  | 'faq'
  | 'practice'
  | 'practice_menu'
  | 'panic'
  | 'safety'
  | 'identity'
  | 'marina_referral'
  | 'menu';

export interface UserMemory {
  userId: number;
  messages: ChatMessage[];
  topic?: string;
  lastEmotion?: string;
  lastBotQuestion?: string;
  lastPractice?: string;
  lastIntent?: string;
  lastResponseType?: ResponseType;
  dialogueStage?: DialogueStage;
  topicHits: number;
  lastOpeningStyle?: string;
  suggestedPractices: string[];
  shortTermNotes: string[];
}

export interface MemoryContext {
  recentMessages: ChatMessage[];
  topic?: string;
  lastEmotion?: string;
  lastBotQuestion?: string;
  lastPractice?: string;
  lastIntent?: string;
  lastResponseType?: ResponseType;
  dialogueStage?: DialogueStage;
  topicHits: number;
  lastOpeningStyle?: string;
  suggestedPractices: string[];
  shortTermNotes: string[];
}

export interface MemoryUpdateData {
  topic?: string;
  lastEmotion?: string;
  practiceUsed?: string;
  note?: string;
  lastBotQuestion?: string | null;
  lastPractice?: string;
  lastIntent?: string;
  lastResponseType?: ResponseType;
  dialogueStage?: DialogueStage;
  lastOpeningStyle?: string;
  incrementTopicHit?: boolean;
}
