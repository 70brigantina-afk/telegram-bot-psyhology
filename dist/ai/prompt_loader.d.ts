export interface PromptBundle {
    master: string;
    system: string;
    behaviorRules: string;
    emotions: string;
    responseEngine: string;
    safety: string;
}
export declare class PromptLoader {
    loadPrompts(): Promise<PromptBundle>;
}
export declare const promptLoader: PromptLoader;
//# sourceMappingURL=prompt_loader.d.ts.map