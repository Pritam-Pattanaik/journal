import React, { useEffect, useRef } from 'react';
import { useInsightStore, startCoachMemoryPolling, stopCoachMemoryPolling } from '../stores/insightStore';
import AICoachSidebar from '../components/ai/AICoachSidebar';
import EmptyWorkspace from '../components/ai/EmptyWorkspace';
import AIChatWorkspace from '../components/ai/AIChatWorkspace';

export default function AICoach() {
  const {
    activeConversationId,
    createConversation,
    setActiveConversation,
    sendMessage,
    fetchConversations,
  } = useInsightStore();

  const restoredRef = useRef(false);

  // On mount: fetch conversations + restore last active session (RCA-A10 fix)
  useEffect(() => {
    const init = async () => {
      await fetchConversations();

      if (!restoredRef.current) {
        restoredRef.current = true;
        try {
          const lastId = localStorage.getItem('lastActiveConversationId');
          if (lastId) {
            // Verify it still exists in the fetched list
            const convs = useInsightStore.getState().conversations;
            if (convs.some(c => c.id === lastId)) {
              setActiveConversation(lastId);
              return;
            }
          }
      } catch { /* if restore fails, start with empty state */ }
      }
    };
    init();
  }, [fetchConversations, setActiveConversation]);

  // Start coach memory background polling on mount, stop on unmount (RCA-A03 fix)
  useEffect(() => {
    startCoachMemoryPolling();
    return () => stopCoachMemoryPolling();
  }, []);

  // Handle quick actions from EmptyWorkspace — direct prop, no event bus (RCA-A07 fix)
  const handleQuickAction = async (prompt: string) => {
    let convId = activeConversationId;

    // Create a new session if none exists
    if (!convId) {
      try {
        convId = await createConversation();
        await setActiveConversation(convId);
      } catch {
        return;
      }
    }

    // Directly send the message — no setTimeout, no window event
    sendMessage(prompt);
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* AI Session Sidebar */}
      <AICoachSidebar />

      {/* AI Workspace */}
      <div className="flex-1 flex flex-col h-full bg-canvas relative overflow-hidden">
        {activeConversationId ? (
          <AIChatWorkspace
            conversationId={activeConversationId}
          />
        ) : (
          <EmptyWorkspace onSelectAction={handleQuickAction} />
        )}
      </div>
    </div>
  );
}
