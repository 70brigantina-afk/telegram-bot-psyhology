"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceFilter = exports.VoiceFilter = void 0;
const ai_client_1 = require("./ai_client");
class VoiceFilter {
    knowledge;
    init(knowledge) {
        this.knowledge = knowledge;
    }
    async apply(responseText) {
        if (!this.knowledge.voiceOfMarina.trim()) {
            return responseText;
        }
        const refined = await ai_client_1.aiClient.complete([
            {
                role: 'system',
                content: [
                    'Проверь и при необходимости слегка отредактируй ответ, чтобы он звучал голосом Марины.',
                    'Не меняй смысл поддержки.',
                    'Не добавляй продажу консультации.',
                    'Не используй шаблонные фразы.',
                    this.knowledge.voiceOfMarina,
                ].join('\n\n'),
            },
            {
                role: 'user',
                content: responseText,
            },
        ]);
        return refined;
    }
}
exports.VoiceFilter = VoiceFilter;
exports.voiceFilter = new VoiceFilter();
//# sourceMappingURL=voice_filter.js.map