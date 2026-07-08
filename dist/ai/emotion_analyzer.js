"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emotionAnalyzer = exports.EmotionAnalyzer = void 0;
const ai_client_1 = require("./ai_client");
const DEFAULT_EMOTION = {
    primary_emotion: 'растерянность',
    secondary_emotions: [],
    intensity: 'medium',
    possible_need: 'поддержка и понимание',
    recommended_strategy: 'support',
};
class EmotionAnalyzer {
    prompts;
    init(prompts) {
        this.prompts = prompts;
    }
    async analyze(userMessage, memory) {
        const contextSummary = memory.recentMessages
            .slice(-6)
            .map((item) => `${item.role}: ${item.content}`)
            .join('\n');
        const raw = await ai_client_1.aiClient.complete([
            {
                role: 'system',
                content: `${this.prompts.emotions}\n\nОтветь только JSON: {"primary_emotion":"...","secondary_emotions":["..."],"intensity":"low|medium|high","possible_need":"...","recommended_strategy":"support|name_emotion|practice|reframe|marina_referral"}`,
            },
            {
                role: 'user',
                content: `Сообщение: ${userMessage}\n\nКонтекст:\n${contextSummary || 'нет'}`,
            },
        ], { json: true });
        try {
            const parsed = JSON.parse(raw);
            return {
                primary_emotion: parsed.primary_emotion ?? DEFAULT_EMOTION.primary_emotion,
                secondary_emotions: parsed.secondary_emotions ?? [],
                intensity: this.normalizeIntensity(parsed.intensity),
                possible_need: parsed.possible_need ?? DEFAULT_EMOTION.possible_need,
                recommended_strategy: parsed.recommended_strategy ?? DEFAULT_EMOTION.recommended_strategy,
            };
        }
        catch {
            return DEFAULT_EMOTION;
        }
    }
    normalizeIntensity(value) {
        if (value === 'low' || value === 'medium' || value === 'high') {
            return value;
        }
        return 'medium';
    }
}
exports.EmotionAnalyzer = EmotionAnalyzer;
exports.emotionAnalyzer = new EmotionAnalyzer();
//# sourceMappingURL=emotion_analyzer.js.map