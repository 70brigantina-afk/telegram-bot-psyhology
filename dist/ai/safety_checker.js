"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyChecker = exports.SafetyChecker = void 0;
const ai_client_1 = require("./ai_client");
const CRISIS_MARKERS = [
    'не хочу жить',
    'хочу умереть',
    'лучше бы меня не было',
    'причинить себе вред',
    'покончить с собой',
    'суицид',
];
class SafetyChecker {
    prompts;
    init(prompts) {
        this.prompts = prompts;
    }
    async check(userMessage, memory) {
        const normalized = userMessage.toLowerCase();
        const hasCrisisMarker = CRISIS_MARKERS.some((marker) => normalized.includes(marker));
        if (hasCrisisMarker) {
            return {
                level: 'crisis',
                isCrisis: true,
                reason: 'Обнаружены признаки кризисного состояния',
                useSafetyProtocol: true,
            };
        }
        const contextSummary = memory.recentMessages
            .slice(-4)
            .map((item) => `${item.role}: ${item.content}`)
            .join('\n');
        const raw = await ai_client_1.aiClient.complete([
            {
                role: 'system',
                content: `${this.prompts.safety}\n\nОтветь только JSON: {"level":"safe|attention|crisis","isCrisis":boolean,"reason":"...","useSafetyProtocol":boolean}`,
            },
            {
                role: 'user',
                content: `Сообщение: ${userMessage}\n\nКонтекст:\n${contextSummary || 'нет'}`,
            },
        ], { json: true });
        try {
            const parsed = JSON.parse(raw);
            return {
                level: parsed.level ?? 'safe',
                isCrisis: Boolean(parsed.isCrisis),
                reason: parsed.reason,
                useSafetyProtocol: Boolean(parsed.useSafetyProtocol || parsed.isCrisis),
            };
        }
        catch {
            return {
                level: 'attention',
                isCrisis: false,
                reason: 'Не удалось разобрать ответ проверки безопасности',
                useSafetyProtocol: false,
            };
        }
    }
}
exports.SafetyChecker = SafetyChecker;
exports.safetyChecker = new SafetyChecker();
//# sourceMappingURL=safety_checker.js.map