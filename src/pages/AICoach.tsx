import React, { useEffect } from 'react';
import { useInsightStore } from '../stores/insightStore';
import AICoachSidebar from '../components/ai/AICoachSidebar';
import EmptyWorkspace from '../components/ai/EmptyWorkspace';
import AIChatWorkspace from '../components/ai/AIChatWorkspace';

export default function AICoach() {
  const { activeConversationId, createConversation, setActiveConversation, fetchCoachMemory } = useInsightStore();

  useEffect(() => {
    fetchCoachMemory(); // pre-fetch memory for any future context if needed
  }, [fetchCoachMemory]);

  const handleQuickAction = async (prompt: string) => {
    // 1. Create a new session
    const id = await createConversation();
    setActiveConversation(id);
    
    // 2. The chat workspace component will automatically mount and we can pass the prompt to it, 
    // or we can store an "initialPrompt" state somewhere. For simplicity, we can dispatch it through a global event or simply rely on the store.
    // We will use a custom event for this quick action.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ai-quick-action', { detail: { prompt } }));
    }, 100);
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* Column 2: AI Session Sidebar */}
      <AICoachSidebar />

      {/* Column 3: AI Workspace */}
      <div className="flex-1 flex flex-col h-full bg-canvas relative overflow-hidden">
        {activeConversationId ? (
          <AIChatWorkspace conversationId={activeConversationId} />
        ) : (
          <EmptyWorkspace onSelectAction={handleQuickAction} />
        )}
      </div>
    </div>
  );
}
