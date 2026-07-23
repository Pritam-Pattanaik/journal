import { create } from 'zustand';
import { api, BASE_URL } from '../lib/api';
import { AiConversation, AiMessage } from '../types';

export interface CoachMemory {
  id: string;
  userId: string;
  patternType: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'improving' | 'positive';
  count: number;
  previousCount: number;
  avgPnl: string | null;
  detectedAt: string;
  updatedAt: string;
}

interface InsightState {
  conversations: AiConversation[];
  activeConversationId: string | null;
  messages: AiMessage[];
  streamingMessage: string;
  isTyping: boolean;
  coachMemory: CoachMemory[];
  loading: boolean;
  error: string | null;
  
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  generateConversationTitle: (id: string) => Promise<void>;
  setActiveConversation: (id: string | null) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  pinConversation: (id: string, isPinned: boolean) => Promise<void>;
  archiveConversation: (id: string, isArchived: boolean) => Promise<void>;
  fetchCoachMemory: () => Promise<void>;
  stopGeneration: () => void;
}

let abortController: AbortController | null = null;

export const useInsightStore = create<InsightState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  streamingMessage: '',
  isTyping: false,
  coachMemory: [],
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<AiConversation[]>('/ai/conversations');
      set({ conversations: response || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch conversations', loading: false });
    }
  },

  createConversation: async (title?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<AiConversation>('/ai/conversations', { title: title || 'New Chat' });
      set(state => ({
        conversations: [response, ...state.conversations],
        activeConversationId: response.id,
        messages: [],
        loading: false
      }));
      return response.id;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create conversation', loading: false });
      throw error;
    }
  },

  setActiveConversation: async (id: string | null) => {
    set({ activeConversationId: id, messages: [], streamingMessage: '', isTyping: false, error: null });
    if (!id) return;
    
    set({ loading: true });
    try {
      const response = await api.get<AiMessage[]>(`/ai/conversations/${id}/messages`);
      set({ messages: response || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch messages', loading: false });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await api.delete(`/ai/conversations/${id}`);
      set(state => {
        const nextConvs = state.conversations.filter(c => c.id !== id);
        return {
          conversations: nextConvs,
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          messages: state.activeConversationId === id ? [] : state.messages
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete conversation' });
    }
  },

  renameConversation: async (id: string, title: string) => {
    try {
      const updated = await api.put<AiConversation>(`/ai/conversations/${id}`, { title });
      set(state => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, title: updated.title } : c)
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to rename conversation' });
    }
  },

  pinConversation: async (id: string, isPinned: boolean) => {
    try {
      const updated = await api.patch<AiConversation>(`/ai/conversations/${id}/pin`, { isPinned });
      set(state => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, isPinned: updated.isPinned } : c)
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to pin conversation' });
    }
  },

  archiveConversation: async (id: string, isArchived: boolean) => {
    try {
      const updated = await api.patch<AiConversation>(`/ai/conversations/${id}/archive`, { isArchived });
      set(state => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, isArchived: updated.isArchived } : c)
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to archive conversation' });
    }
  },

  sendMessage: async (content: string) => {
    let { activeConversationId } = get();
    const isFirstMessage = get().messages.length === 0;
    
    // Auto-create conversation if none exists
    if (!activeConversationId) {
      try {
        const cleanContent = content.replace(/^\[.*?\]\s*/, '');
        activeConversationId = await get().createConversation(cleanContent.substring(0, 30) + '...');
      } catch (e) {
        return; // error handled in createConversation
      }
    }

    // Optimistically add user message
    const tempUserMsg: AiMessage = { role: 'user', content };
    set(state => ({
      messages: [...state.messages, tempUserMsg],
      isTyping: true,
      streamingMessage: '',
      error: null
    }));

    abortController = new AbortController();

    try {
      // We cannot use standard API wrapper for SSE, use native fetch
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ conversationId: activeConversationId, message: content }),
        signal: abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start chat stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullAssistantMessage = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) {
          done = true;
          break;
        }

        const chunkString = decoder.decode(value, { stream: true });
        const lines = chunkString.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.chunk) {
                  fullAssistantMessage += parsed.chunk;
                  set({ streamingMessage: fullAssistantMessage });
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }

      // Finish streaming, commit to messages array
      set(state => ({
        messages: [...state.messages, { role: 'assistant', content: state.streamingMessage }],
        streamingMessage: '',
        isTyping: false
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped');
        // Commit whatever was generated so far
        set(state => ({
          messages: [...state.messages, { role: 'assistant', content: state.streamingMessage }],
          streamingMessage: '',
          isTyping: false
        }));
      } else {
        set({ error: error.message || 'Chat request failed', isTyping: false });
        // Import notify dynamically to avoid circular dependency if any
        import('../lib/notify').then(m => m.notify.error(error.message || 'Failed to generate response'));
      }
    } finally {
      abortController = null;
      // Refresh memory in case the AI detected patterns behind the scenes (legacy)
      get().fetchCoachMemory();
      
      // Auto-generate title if this was the first message in a new conversation
      if (isFirstMessage && activeConversationId) {
        get().generateConversationTitle(activeConversationId);
      }
    }
  },

  generateConversationTitle: async (id: string) => {
    try {
      const response = await api.patch<AiConversation>(`/ai/conversations/${id}/generate-title`, {});
      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, title: response.title } : c
        )
      }));
    } catch (e) {
      console.error('Failed to generate title:', e);
    }
  },

  stopGeneration: () => {
    if (abortController) {
      abortController.abort();
    }
  },

  fetchCoachMemory: async () => {
    try {
      const response = await api.get<CoachMemory[]>('/ai/coach-memory');
      set({ coachMemory: response || [] });
    } catch {
      // Non-blocking
    }
  },
}));
