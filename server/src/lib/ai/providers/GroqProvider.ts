import Groq from 'groq-sdk';
import { AIProvider, AIMessage } from '../AIProvider';

export class GroqProvider implements AIProvider {
  private groq: Groq;
  private defaultModel = 'llama-3.3-70b-versatile';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing from environment variables.');
    }
    this.groq = new Groq({ apiKey });
  }

  async streamChat(messages: AIMessage[], onChunk: (chunk: string) => void, signal?: AbortSignal): Promise<void> {
    console.log('[GROQ-PROVIDER] streamChat called. Messages count:', messages.length);
    
    const completion = await this.groq.chat.completions.create({
      model: this.defaultModel,
      messages,
      temperature: 0.1, // Highly deterministic for trading coach
      top_p: 0.95,
      max_tokens: 4096,
      stream: true,
    }, { signal });

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }
  }

  async generateText(messages: AIMessage[]): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      model: this.defaultModel,
      messages,
      temperature: 0.7, // slightly more creative for titles
      top_p: 0.95,
      max_tokens: 50,
    });

    return completion.choices[0]?.message?.content || 'New Conversation';
  }

  async generateJSON(messages: AIMessage[]): Promise<any> {
    // Inject instructions to ensure JSON output
    const systemMessage: AIMessage = {
      role: 'system',
      content: 'You are an AI assistant that only responds in valid JSON format. Do not include markdown formatting like ```json. Do not include any explanations outside of the JSON object.'
    };

    const completion = await this.groq.chat.completions.create({
      model: this.defaultModel,
      messages: [systemMessage, ...messages],
      temperature: 0.1,
      top_p: 0.95,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse Groq JSON response:', content);
      throw new Error('AI returned invalid JSON');
    }
  }
}
