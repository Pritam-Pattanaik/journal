import { create } from 'zustand';
import { api, BASE_URL } from '../lib/api';
import { AiConversation, AiMessage } from '../types';
import { streamAIInference } from '../lib/aiStreamClient';

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
  regenerateResponse: () => Promise<void>;
  duplicateConversation: (id: string) => Promise<void>;
  exportConversation: (id: string) => void;
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
      await api.patch(`/ai/conversations/${id}/archive`, { isArchived });
      set({ conversations: get().conversations.map(c => 
        c.id === id ? { ...c, isArchived } : c
      )});
    } catch (error: any) {
      set({ error: 'Failed to archive conversation' });
    }
  },

  duplicateConversation: async (id: string) => {
    try {
      const duplicated = await api.post<AiConversation>(`/ai/conversations/${id}/duplicate`, {});
      set({ conversations: [duplicated, ...get().conversations] });
      await get().setActiveConversation(duplicated.id);
    } catch (error: any) {
      set({ error: 'Failed to duplicate conversation' });
    }
  },

  exportConversation: (id: string) => {
    const state = get();
    const conv = state.conversations.find(c => c.id === id);
    if (!conv) return;
    
    // We export whatever is currently loaded if it's the active one
    let exportText = `# ${conv.title}\n\n`;
    if (state.activeConversationId === id) {
      state.messages.forEach(m => {
        exportText += `### ${m.role === 'user' ? 'You' : 'AI Mentor'}\n${m.content}\n\n`;
      });
      const blob = new Blob([exportText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      a.click();
      URL.revokeObjectURL(url);
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
      await streamAIInference({
        endpoint: '/api/ai/chat',
        payload: { conversationId: activeConversationId, message: content },
        signal: abortController.signal,
        onToken: (_token, accumulated) => {
          set({ streamingMessage: accumulated });
        },
      });

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

  regenerateResponse: async () => {
    const { messages, activeConversationId } = get();
    if (!activeConversationId || messages.length < 2) return;
    
    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[lastUserMessageIndex].content;
    
    // Trim the messages array to keep only up to the last user message
    const newMessages = messages.slice(0, lastUserMessageIndex + 1);
    
    set({ messages: newMessages, isTyping: true, streamingMessage: '', error: null });
    
    abortController = new AbortController();

    try {
      await streamAIInference({
        endpoint: '/api/ai/chat',
        payload: { conversationId: activeConversationId, message: lastUserMessage, isRegeneration: true },
        signal: abortController.signal,
        onToken: (_token, accumulated) => {
          set({ streamingMessage: accumulated });
        },
      });

      set(state => ({
        messages: [...state.messages, { role: 'assistant', content: state.streamingMessage }],
        streamingMessage: '',
        isTyping: false
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        set(state => ({
          messages: [...state.messages, { role: 'assistant', content: state.streamingMessage }],
          streamingMessage: '',
          isTyping: false
        }));
      } else {
        set({ error: error.message || 'Chat request failed', isTyping: false });
      }
    } finally {
      abortController = null;
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
