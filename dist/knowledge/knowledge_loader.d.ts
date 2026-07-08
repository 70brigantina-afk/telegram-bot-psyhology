export interface KnowledgeBundle {
    marinaPersonality: string;
    voiceOfMarina: string;
    faq: string;
    practices: string;
    conversationMemory: string;
    dialogueScenarios: string;
    realDialogueExamples: string;
}
export declare class KnowledgeLoader {
    loadKnowledge(): Promise<KnowledgeBundle>;
}
export declare const knowledgeLoader: KnowledgeLoader;
//# sourceMappingURL=knowledge_loader.d.ts.map