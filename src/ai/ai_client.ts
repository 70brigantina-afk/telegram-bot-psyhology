import { config } from '../config/config';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function debugAiConfig(): void {
  const { aiApiUrl, aiModel, aiApiKey } = config;
  console.log('[debug] AI_API_URL:', JSON.stringify(aiApiUrl));
  console.log('[debug] AI_API_URL length:', aiApiUrl.length);
  console.log('[debug] AI_API_URL trailing char codes:', [...aiApiUrl.slice(-3)].map((c) => c.charCodeAt(0)));
  console.log('[debug] AI_MODEL:', JSON.stringify(aiModel));
  console.log('[debug] AI_API_KEY length:', aiApiKey.length);
  console.log('[debug] AI_API_KEY prefix:', aiApiKey.slice(0, 8));
  console.log('[debug] AI_API_KEY suffix:', aiApiKey.slice(-6));
}

export class AiClient {
  async complete(messages: ChatCompletionMessage[], options?: { json?: boolean }): Promise<string> {
    debugAiConfig();

    const response = await fetch(config.aiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages,
        temperature: 0.7,
        ...(options?.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[debug] AI API error status:', response.status);
      console.error('[debug] AI API error response URL:', response.url);
      console.error('[debug] AI API full errorText:', errorText);
      throw new Error(`AI API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI API вернул пустой ответ');
    }

    return content.trim();
  }
}

export const aiClient = new AiClient();
