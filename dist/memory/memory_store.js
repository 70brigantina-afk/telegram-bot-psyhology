"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryStore = exports.MemoryStore = void 0;
const config_1 = require("../config/config");
const store = new Map();
function createEmptyMemory(userId) {
    return {
        userId,
        messages: [],
        suggestedPractices: [],
        shortTermNotes: [],
    };
}
class MemoryStore {
    get(userId) {
        const existing = store.get(userId);
        if (existing) {
            return existing;
        }
        const memory = createEmptyMemory(userId);
        store.set(userId, memory);
        return memory;
    }
    save(userId, memory) {
        const trimmedMessages = memory.messages.slice(-config_1.config.maxHistoryMessages);
        store.set(userId, {
            ...memory,
            messages: trimmedMessages,
        });
    }
    clear(userId) {
        store.delete(userId);
    }
}
exports.MemoryStore = MemoryStore;
exports.memoryStore = new MemoryStore();
//# sourceMappingURL=memory_store.js.map