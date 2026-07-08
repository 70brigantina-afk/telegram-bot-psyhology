import type { UserMemory } from '../types/memory.types';
export declare class MemoryStore {
    get(userId: number): UserMemory;
    save(userId: number, memory: UserMemory): void;
    clear(userId: number): void;
}
export declare const memoryStore: MemoryStore;
//# sourceMappingURL=memory_store.d.ts.map