"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryService = exports.MemoryService = void 0;
const memory_store_1 = require("./memory_store");
class MemoryService {
    getContext(userId) {
        const memory = memory_store_1.memoryStore.get(userId);
        return {
            recentMessages: memory.messages,
            topic: memory.topic,
            lastEmotion: memory.lastEmotion,
            suggestedPractices: memory.suggestedPractices,
            shortTermNotes: memory.shortTermNotes,
        };
    }
    addMessage(userId, message) {
        const memory = memory_store_1.memoryStore.get(userId);
        memory.messages.push(message);
        memory_store_1.memoryStore.save(userId, memory);
    }
    updateAfterResponse(userId, data) {
        const memory = memory_store_1.memoryStore.get(userId);
        if (data.topic) {
            memory.topic = data.topic;
        }
        if (data.lastEmotion) {
            memory.lastEmotion = data.lastEmotion;
        }
        if (data.practiceUsed && !memory.suggestedPractices.includes(data.practiceUsed)) {
            memory.suggestedPractices.push(data.practiceUsed);
        }
        if (data.note && !memory.shortTermNotes.includes(data.note)) {
            memory.shortTermNotes.push(data.note);
        }
        memory_store_1.memoryStore.save(userId, memory);
    }
    clear(userId) {
        memory_store_1.memoryStore.clear(userId);
    }
    formatContextForPrompt(context) {
        if (context.recentMessages.length === 0) {
            return 'Контекст разговора: новый диалог.';
        }
        const history = context.recentMessages
            .map((item) => `${item.role === 'user' ? 'Человек' : 'Помощник'}: ${item.content}`)
            .join('\n');
        const parts = [
            'Контекст разговора:',
            history,
        ];
        if (context.topic) {
            parts.push(`Тема: ${context.topic}`);
        }
        if (context.lastEmotion) {
            parts.push(`Последнее состояние: ${context.lastEmotion}`);
        }
        if (context.suggestedPractices.length > 0) {
            parts.push(`Уже предложенные практики: ${context.suggestedPractices.join(', ')}`);
        }
        return parts.join('\n');
    }
}
exports.MemoryService = MemoryService;
exports.memoryService = new MemoryService();
//# sourceMappingURL=memory_service.js.map