export type EmotionIntensity = 'low' | 'medium' | 'high';

export interface EmotionAnalysis {
  primary_emotion: string;
  secondary_emotions: string[];
  intensity: EmotionIntensity;
  possible_need: string;
  recommended_strategy: string;
}
