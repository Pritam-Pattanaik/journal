import { getCsrfToken, BASE_URL } from './api';

export interface StreamOptions {
  endpoint: string;
  payload: Record<string, any>;
  onToken: (token: string, accumulated: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Edge Server-Sent Events (SSE) / Web Stream reader client.
 * Eliminates Vercel 10s Serverless Execution Timeouts by consuming tokenized chunks
 * directly over low-latency ReadableStream connections (TTFB < 400ms).
 */
export async function streamAIInference({
  endpoint,
  payload,
  onToken,
  onComplete,
  onError,
  signal,
}: StreamOptions): Promise<string> {
  let accumulatedText = '';
  const baseUrl = endpoint.startsWith('/api') ? endpoint : `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token') || '';
  const csrf = await getCsrfToken();

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        ...(csrf ? { 'CSRF-Token': csrf } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept': 'text/event-stream, application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'AI streaming endpoint error');
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    // Check if server responded with standard JSON (fallback to synchronous REST)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json') && !response.body) {
      const json = await response.json();
      const text = json.message || json.insight || JSON.stringify(json);
      accumulatedText = text;
      onToken(text, accumulatedText);
      onComplete?.(accumulatedText);
      return accumulatedText;
    }

    // Consume ReadableStream token chunks for zero-timeout Edge streaming
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported by backend response.');
    }

    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: !done });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Handle Server-Sent Events (SSE) formatting
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.substring(6).trim();
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const tokenContent = parsed.chunk || parsed.token || parsed.text || parsed.content || '';
              accumulatedText += tokenContent;
              onToken(tokenContent, accumulatedText);
            } catch {
              accumulatedText += dataStr;
              onToken(dataStr, accumulatedText);
            }
          } else if (!trimmed.startsWith('event:') && !trimmed.startsWith('id:')) {
            // Raw text chunk stream
            accumulatedText += trimmed + ' ';
            onToken(trimmed + ' ', accumulatedText);
          }
        }
      }
    }

    onComplete?.(accumulatedText.trim());
    return accumulatedText.trim();
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.debug('AI Stream consumption terminated by client cancellation.');
      return accumulatedText;
    }
    console.error('AI Edge Streaming execution fault:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
