import Groq from 'groq-sdk';

// Create a singleton instance of the Groq client
let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (groqInstance) return groqInstance;
  
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing from environment variables.');
  }

  groqInstance = new Groq({
    apiKey,
  });

  return groqInstance;
}

export async function streamGroqChat(messages: any[], onChunk: (chunk: string) => void, signal?: AbortSignal) {
  console.log('[GROQ-DEBUG-1] streamGroqChat called. Messages count:', messages.length);
  const groq = getGroqClient();
  console.log('[GROQ-DEBUG-2] Client obtained. API key present:', !!process.env.GROQ_API_KEY);
  console.log('[GROQ-DEBUG-3] Sending request to Groq...');

  const completion = await groq.chat.completions.create({
    // Using llama-3.3-70b-versatile for high quality coaching
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.1, // Very low temperature for highly deterministic analysis
    top_p: 0.95,
    max_tokens: 4096,
    stream: true,
  }, { signal });

  console.log('[GROQ-DEBUG-4] Stream object obtained. Iterating chunks...');
  let chunkCount = 0;
  for await (const chunk of completion) {
    chunkCount++;
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      if (chunkCount <= 3) console.log('[GROQ-DEBUG-6] Content chunk:', content.substring(0, 80));
      onChunk(content);
    }
  }
  console.log('[GROQ-DEBUG-7] Stream iteration complete. Total chunks:', chunkCount);
}

export async function generateGroqJSON(messages: any[]): Promise<any> {
  const groq = getGroqClient();
  
  // Inject instructions to ensure JSON output
  const systemMessage = {
    role: 'system',
    content: 'You are an AI assistant that only responds in valid JSON format. Do not include markdown formatting like ```json. Do not include any explanations outside of the JSON object.'
  };

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
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

export async function generateGroqText(messages: any[]): Promise<string> {
  const groq = getGroqClient();
  
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7, // slightly more creative for titles
    top_p: 0.95,
    max_tokens: 30,
  });

  return completion.choices[0]?.message?.content || 'New Conversation';
}
