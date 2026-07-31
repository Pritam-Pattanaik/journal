export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  /**
   * Streams a chat completion response token-by-token.
   */
  streamChat(messages: AIMessage[], onChunk: (chunk: string) => void, signal?: AbortSignal): Promise<void>;

  /**
   * Generates a single text response (e.g., for title generation).
   */
  generateText(messages: AIMessage[]): Promise<string>;

  /**
   * Generates a strictly formatted JSON response.
   */
  generateJSON(messages: AIMessage[]): Promise<any>;
}
