import type { ChatMessage, MemoryContext } from '../types/memory.types';
export declare class MemoryService {
    getContext(userId: number): MemoryContext;
    addMessage(userId: number, message: ChatMessage): void;
    updateAfterResponse(userId: number, data: {
        topic?: string;
        lastEmotion?: string;
        practiceUsed?: string;
        note?: string;
    }): void;
    clear(userId: number): void;
    formatContextForPrompt(context: MemoryContext): string;
}
export declare const memoryService: MemoryService;
//# sourceMappingURL=memory_service.d.ts.map