import type { PromptBundle } from './prompt_loader';
import type { KnowledgeBundle } from '../knowledge/knowledge_loader';
import type { GeneratedResponse, ResponseEngineInput } from '../types/response.types';
export declare class ResponseEngine {
    private prompts;
    private knowledge;
    init(prompts: PromptBundle, knowledge: KnowledgeBundle): void;
    generate(input: ResponseEngineInput): Promise<GeneratedResponse>;
    private generateSafetyResponse;
    private shouldUsePractice;
    private resolveStrategy;
    private buildSystemPrompt;
    private buildUserPrompt;
}
export declare const responseEngine: ResponseEngine;
//# sourceMappingURL=response_engine.d.ts.map