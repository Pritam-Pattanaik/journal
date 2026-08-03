import { create } from 'zustand';
import { api } from '../lib/api';
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
  exportConversation: (id: string) => Promise<void>;
}

// Per-conversation abort controllers — fixes P0 race condition (RCA-A01)
// Module-level AbortController caused token interleaving when regenerating
const abortControllers = new Map<string, AbortController>();

// Coach memory polling interval ref
let coachMemoryInterval: ReturnType<typeof setInterval> | null = null;

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
      // Persist last active conversation id for auto-restore (RCA-A10 fix)
      try { localStorage.setItem('lastActiveConversationId', response.id); } catch { /* non-critical */ }
      return response.id;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create conversation', loading: false });
      throw error;
    }
  },

  setActiveConversation: async (id: string | null) => {
    set({ activeConversationId: id, messages: [], streamingMessage: '', isTyping: false, error: null });

    // Persist for auto-restore
    try {
      if (id) localStorage.setItem('lastActiveConversationId', id);
      else localStorage.removeItem('lastActiveConversationId');
    } catch { /* non-critical */ }

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
      // Cancel any active stream for this conversation
      const ctrl = abortControllers.get(id);
      if (ctrl) { ctrl.abort(); abortControllers.delete(id); }

      set(state => {
        const nextConvs = state.conversations.filter(c => c.id !== id);
        const isActive = state.activeConversationId === id;
        const newActiveId = isActive ? (nextConvs[0]?.id ?? null) : state.activeConversationId;
        if (isActive) {
          try { localStorage.removeItem('lastActiveConversationId'); } catch { /* non-critical */ }
        }
        return {
          conversations: nextConvs,
          activeConversationId: newActiveId,
          messages: isActive ? [] : state.messages,
        };
      });
    } catch { /* Non-critical — ignore delete failures silently */ }
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

  // Fixed: fetch messages for non-active conversations before exporting (RCA-A06 fix)
  exportConversation: async (id: string) => {
    const state = get();
    const conv = state.conversations.find(c => c.id === id);
    if (!conv) return;
    
    let exportMessages: AiMessage[] = [];

    if (state.activeConversationId === id) {
      exportMessages = state.messages;
    } else {
      try {
        exportMessages = await api.get<AiMessage[]>(`/ai/conversations/${id}/messages`);
      } catch {
        import('../lib/notify').then(m => m.notify.error('Failed to fetch conversation for export'));
        return;
      }
    }
    
    let exportText = `# ${conv.title}\n\n`;
    exportMessages.forEach(m => {
      exportText += `### ${m.role === 'user' ? 'You' : 'AI Mentor'}\n${m.content}\n\n`;
    });

    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },

  sendMessage: async (content: string) => {
    let { activeConversationId } = get();
    const isFirstMessage = get().messages.length === 0;
    
    // Auto-create conversation if none exists
    if (!activeConversationId) {
      try {
        const cleanContent = content.replace(/^\[.*?\]\s*/, '');
        activeConversationId = await get().createConversation(cleanContent.substring(0, 30));
      } catch (e) {
        return;
      }
    }

    const conversationId = activeConversationId;

    // Cancel any existing stream for this conversation (P0 race condition fix — RCA-A01)
    const existingCtrl = abortControllers.get(conversationId);
    if (existingCtrl) {
      existingCtrl.abort();
      abortControllers.delete(conversationId);
    }

    // Optimistically add user message
    const tempUserMsg: AiMessage = { role: 'user', content };
    set(state => ({
      messages: [...state.messages, tempUserMsg],
      isTyping: true,
      streamingMessage: '',
      error: null
    }));

    const controller = new AbortController();
    abortControllers.set(conversationId, controller);

    try {
      await streamAIInference({
        endpoint: '/api/ai/chat',
        payload: { conversationId, message: content },
        signal: controller.signal,
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
        // Commit whatever was generated so far
        set(state => ({
          messages: [...state.messages, { role: 'assistant', content: state.streamingMessage }],
          streamingMessage: '',
          isTyping: false
        }));
      } else {
        set({ error: error.message || 'Chat request failed', isTyping: false });
        import('../lib/notify').then(m => m.notify.error(error.message || 'Failed to generate response'));
      }
    } finally {
      abortControllers.delete(conversationId);

      // Auto-generate title if this was the first message — non-blocking
      if (isFirstMessage && conversationId) {
        get().generateConversationTitle(conversationId);
      }
      // Coach memory is NOT fetched per-message anymore (RCA-A03 fix)
      // It is polled every 5 minutes via startCoachMemoryPolling()
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
      // Non-critical — title generation is a best-effort
    }
  },

  stopGeneration: () => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;
    const ctrl = abortControllers.get(activeConversationId);
    if (ctrl) {
      ctrl.abort();
      abortControllers.delete(activeConversationId);
    }
  },

  regenerateResponse: async () => {
    const { messages, activeConversationId } = get();
    if (!activeConversationId || messages.length < 2) return;
    
    // Cancel any existing stream first
    const existingCtrl = abortControllers.get(activeConversationId);
    if (existingCtrl) {
      existingCtrl.abort();
      abortControllers.delete(activeConversationId);
    }

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
    const newMessages = messages.slice(0, lastUserMessageIndex + 1);
    
    set({ messages: newMessages, isTyping: true, streamingMessage: '', error: null });
    
    const controller = new AbortController();
    abortControllers.set(activeConversationId, controller);

    try {
      await streamAIInference({
        endpoint: '/api/ai/chat',
        payload: { conversationId: activeConversationId, message: lastUserMessage, isRegeneration: true },
        signal: controller.signal,
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
        set({ error: error.message || 'Regeneration failed', isTyping: false });
      }
    } finally {
      abortControllers.delete(activeConversationId);
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

// Start background coach memory polling (every 5 minutes)
// This replaces per-message fetching (RCA-A03 fix)
export function startCoachMemoryPolling() {
  if (coachMemoryInterval) return;
  const { fetchCoachMemory } = useInsightStore.getState();
  fetchCoachMemory(); // Initial fetch
  coachMemoryInterval = setInterval(fetchCoachMemory, 5 * 60_000);
}

export function stopCoachMemoryPolling() {
  if (coachMemoryInterval) {
    clearInterval(coachMemoryInterval);
    coachMemoryInterval = null;
  }
}
