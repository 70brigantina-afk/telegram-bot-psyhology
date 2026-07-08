import type { EmotionAnalysis } from './emotion.types';
import type { MemoryContext } from './memory.types';

export type SafetyLevel = 'safe' | 'attention' | 'crisis';

export interface SafetyResult {
  level: SafetyLevel;
  isCrisis: boolean;
  reason?: string;
  useSafetyProtocol: boolean;
}

export type ResponseStrategy =
  | 'support'
  | 'name_emotion'
  | 'practice'
  | 'reframe'
  | 'marina_referral'
  | 'safety_protocol';

export interface GeneratedResponse {
  text: string;
  strategy: ResponseStrategy;
  practiceUsed?: string;
}

export interface ResponseEngineInput {
  userMessage: string;
  memory: MemoryContext;
  safety: SafetyResult;
  emotion: EmotionAnalysis;
}
