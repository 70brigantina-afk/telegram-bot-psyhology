export interface ChatCompletionMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare class AiClient {
    complete(messages: ChatCompletionMessage[], options?: {
        json?: boolean;
    }): Promise<string>;
}
export declare const aiClient: AiClient;
//# sourceMappingURL=ai_client.d.ts.map