"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseEngine = exports.ResponseEngine = void 0;
const ai_client_1 = require("./ai_client");
const practice_selector_1 = require("../knowledge/practice_selector");
class ResponseEngine {
    prompts;
    knowledge;
    init(prompts, knowledge) {
        this.prompts = prompts;
        this.knowledge = knowledge;
    }
    async generate(input) {
        if (input.safety.useSafetyProtocol) {
            return this.generateSafetyResponse(input);
        }
        const practice = this.shouldUsePractice(input.emotion)
            ? practice_selector_1.practiceSelector.select(input.emotion, input.memory)
            : null;
        const strategy = this.resolveStrategy(input.emotion, practice);
        const text = await ai_client_1.aiClient.complete([
            {
                role: 'system',
                content: this.buildSystemPrompt(strategy, practice),
            },
            {
                role: 'user',
                content: this.buildUserPrompt(input, strategy, practice),
            },
        ]);
        return {
            text,
            strategy,
            practiceUsed: practice ?? undefined,
        };
    }
    async generateSafetyResponse(input) {
        const text = await ai_client_1.aiClient.complete([
            {
                role: 'system',
                content: `${this.prompts.safety}\n\nСформируй короткий, спокойный и безопасный ответ. Не предлагай обычные практики.`,
            },
            {
                role: 'user',
                content: `Сообщение человека: ${input.userMessage}`,
            },
        ]);
        return {
            text,
            strategy: 'safety_protocol',
        };
    }
    shouldUsePractice(emotion) {
        return (emotion.recommended_strategy === 'practice' ||
            (emotion.intensity === 'high' && ['тревога', 'страх', 'злость', 'истощение'].includes(emotion.primary_emotion.toLowerCase())));
    }
    resolveStrategy(emotion, practice) {
        if (practice) {
            return 'practice';
        }
        const strategy = emotion.recommended_strategy;
        const allowed = [
            'support',
            'name_emotion',
            'practice',
            'reframe',
            'marina_referral',
        ];
        return allowed.includes(strategy) ? strategy : 'support';
    }
    buildSystemPrompt(strategy, practice) {
        return [
            this.prompts.master,
            this.prompts.system,
            this.prompts.behaviorRules,
            this.prompts.responseEngine,
            this.knowledge.marinaPersonality,
            this.knowledge.voiceOfMarina,
            this.knowledge.conversationMemory,
            this.knowledge.dialogueScenarios,
            this.knowledge.realDialogueExamples,
            practice ? `Подходящая практика из базы:\n${this.knowledge.practices}` : '',
            `Выбранная стратегия: ${strategy}`,
            practice ? `Предложи одну практику: ${practice}` : 'Практику не предлагай, если она не нужна.',
            'Ответ должен быть коротким, живым и человечным. Один хороший вопрос в конце, если уместно.',
        ]
            .filter(Boolean)
            .join('\n\n');
    }
    buildUserPrompt(input, strategy, practice) {
        const history = input.memory.recentMessages
            .map((item) => `${item.role}: ${item.content}`)
            .join('\n');
        return [
            `Сообщение человека: ${input.userMessage}`,
            `Эмоция: ${input.emotion.primary_emotion}`,
            `Интенсивность: ${input.emotion.intensity}`,
            `Потребность: ${input.emotion.possible_need}`,
            `Стратегия: ${strategy}`,
            practice ? `Практика: ${practice}` : '',
            history ? `История:\n${history}` : '',
            input.memory.topic ? `Тема: ${input.memory.topic}` : '',
        ]
            .filter(Boolean)
            .join('\n\n');
    }
}
exports.ResponseEngine = ResponseEngine;
exports.responseEngine = new ResponseEngine();
//# sourceMappingURL=response_engine.js.map