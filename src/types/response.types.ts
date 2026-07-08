import type { EmotionAnalysis } from './emotion.types';
import type { FaqTopic } from '../knowledge/knowledge_loader';
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
  | 'safety_protocol'
  | 'faq'
  | 'panic_stabilization'
  | 'identity_question'
  | 'post_crisis_check';

export type IdentityTopic = 'who_am_i' | 'what_gender';

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
  faqTopic?: FaqTopic | null;
}
