"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiClient = exports.AiClient = void 0;
const config_1 = require("../config/config");
class AiClient {
    async complete(messages, options) {
        const response = await fetch(config_1.config.aiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config_1.config.aiApiKey}`,
            },
            body: JSON.stringify({
                model: config_1.config.aiModel,
                messages,
                temperature: 0.7,
                ...(options?.json ? { response_format: { type: 'json_object' } } : {}),
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI API error ${response.status}: ${errorText}`);
        }
        const data = (await response.json());
        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new Error('AI API вернул пустой ответ');
        }
        return content.trim();
    }
}
exports.AiClient = AiClient;
exports.aiClient = new AiClient();
//# sourceMappingURL=ai_client.js.map