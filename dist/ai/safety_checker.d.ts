import type { PromptBundle } from './prompt_loader';
import type { MemoryContext } from '../types/memory.types';
import type { SafetyResult } from '../types/response.types';
export declare class SafetyChecker {
    private prompts;
    init(prompts: PromptBundle): void;
    check(userMessage: string, memory: MemoryContext): Promise<SafetyResult>;
}
export declare const safetyChecker: SafetyChecker;
//# sourceMappingURL=safety_checker.d.ts.map