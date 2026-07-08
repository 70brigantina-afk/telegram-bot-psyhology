import type { KnowledgeBundle } from '../knowledge/knowledge_loader';
export declare class VoiceFilter {
    private knowledge;
    init(knowledge: KnowledgeBundle): void;
    apply(responseText: string): Promise<string>;
}
export declare const voiceFilter: VoiceFilter;
//# sourceMappingURL=voice_filter.d.ts.map