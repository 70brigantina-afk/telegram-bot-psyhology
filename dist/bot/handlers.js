"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = registerHandlers;
const emotion_analyzer_1 = require("../ai/emotion_analyzer");
const prompt_loader_1 = require("../ai/prompt_loader");
const response_engine_1 = require("../ai/response_engine");
const safety_checker_1 = require("../ai/safety_checker");
const voice_filter_1 = require("../ai/voice_filter");
const knowledge_loader_1 = require("../knowledge/knowledge_loader");
const memory_service_1 = require("../memory/memory_service");
const keyboards_1 = require("./keyboards");
let isInitialized = false;
async function ensureInitialized() {
    if (isInitialized) {
        return;
    }
    const [prompts, knowledge] = await Promise.all([
        prompt_loader_1.promptLoader.loadPrompts(),
        knowledge_loader_1.knowledgeLoader.loadKnowledge(),
    ]);
    safety_checker_1.safetyChecker.init(prompts);
    emotion_analyzer_1.emotionAnalyzer.init(prompts);
    response_engine_1.responseEngine.init(prompts, knowledge);
    voice_filter_1.voiceFilter.init(knowledge);
    isInitialized = true;
}
async function processUserMessage(userId, text) {
    await ensureInitialized();
    const memory = memory_service_1.memoryService.getContext(userId);
    memory_service_1.memoryService.addMessage(userId, {
        role: 'user',
        content: text,
        timestamp: Date.now(),
    });
    const safety = await safety_checker_1.safetyChecker.check(text, memory);
    const emotion = await emotion_analyzer_1.emotionAnalyzer.analyze(text, memory);
    const generated = await response_engine_1.responseEngine.generate({
        userMessage: text,
        memory,
        safety,
        emotion,
    });
    const finalText = await voice_filter_1.voiceFilter.apply(generated.text);
    memory_service_1.memoryService.addMessage(userId, {
        role: 'assistant',
        content: finalText,
        timestamp: Date.now(),
    });
    memory_service_1.memoryService.updateAfterResponse(userId, {
        topic: emotion.primary_emotion,
        lastEmotion: emotion.primary_emotion,
        practiceUsed: generated.practiceUsed,
    });
    return finalText;
}
function registerHandlers(bot) {
    bot.start(async (ctx) => {
        await ctx.reply('Здравствуйте. Можно просто написать, что сейчас происходит или что вас беспокоит. Не обязательно подбирать правильные слова.', keyboards_1.mainKeyboard);
    });
    bot.command('help', async (ctx) => {
        await ctx.reply('Я здесь, чтобы помочь вам лучше понять своё состояние и сделать следующий бережный шаг. Напишите, что сейчас чувствуете.', keyboards_1.mainKeyboard);
    });
    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const text = ctx.message.text.trim();
        if (!text) {
            return;
        }
        try {
            await ctx.sendChatAction('typing');
            const reply = await processUserMessage(userId, text);
            await ctx.reply(reply, keyboards_1.mainKeyboard);
        }
        catch (error) {
            console.error('Ошибка обработки сообщения:', error);
            await ctx.reply('Сейчас мне не удалось ответить. Попробуйте написать ещё раз чуть позже.', keyboards_1.mainKeyboard);
        }
    });
}
//# sourceMappingURL=handlers.js.map