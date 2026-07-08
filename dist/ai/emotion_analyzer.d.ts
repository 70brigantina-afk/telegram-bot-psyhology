import type { PromptBundle } from './prompt_loader';
import type { EmotionAnalysis } from '../types/emotion.types';
import type { MemoryContext } from '../types/memory.types';
export declare class EmotionAnalyzer {
    private prompts;
    init(prompts: PromptBundle): void;
    analyze(userMessage: string, memory: MemoryContext): Promise<EmotionAnalysis>;
    private normalizeIntensity;
}
export declare const emotionAnalyzer: EmotionAnalyzer;
//# sourceMappingURL=emotion_analyzer.d.ts.map