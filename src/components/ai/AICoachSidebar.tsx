import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, Pin, Archive, Trash2, Edit2, Search, MoreVertical, Check, X, Copy, Download } from 'lucide-react';
import { useInsightStore } from '../../stores/insightStore';
import { AiConversation } from '../../types';
import { cn } from '../../lib/cn';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

export default function AICoachSidebar() {
  const {
    conversations,
    activeConversationId,
    fetchConversations,
    createConversation,
    setActiveConversation,
    deleteConversation,
    renameConversation,
    pinConversation,
    archiveConversation,
    duplicateConversation,
    exportConversation,
  } = useInsightStore();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleCreate = async () => {
    const id = await createConversation();
    setActiveConversation(id);
  };

  const startEdit = (e: React.MouseEvent, conv: AiConversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const saveEdit = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editingId && editTitle.trim()) {
      await renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteConversation(id);
      if (activeConversationId === id) setActiveConversation(null);
    }
    setMenuOpenId(null);
  };

  const togglePin = async (e: React.MouseEvent, conv: AiConversation) => {
    e.stopPropagation();
    await pinConversation(conv.id, !conv.isPinned);
    setMenuOpenId(null);
  };

  const toggleArchive = async (e: React.MouseEvent, conv: AiConversation) => {
    e.stopPropagation();
    await archiveConversation(conv.id, !conv.isArchived);
    if (activeConversationId === conv.id) setActiveConversation(null);
    setMenuOpenId(null);
  };

  const handleDuplicate = (e: React.MouseEvent, conv: AiConversation) => {
    e.stopPropagation();
    duplicateConversation(conv.id);
  };

  const handleExport = (e: React.MouseEvent, conv: AiConversation) => {
    e.stopPropagation();
    exportConversation(conv.id);
  };

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const pinned = filtered.filter(c => c.isPinned && !c.isArchived);
  const unpinned = filtered.filter(c => !c.isPinned && !c.isArchived);
  const archived = filtered.filter(c => c.isArchived);

  // Group unpinned
  const today = unpinned.filter(c => isToday(new Date(c.updatedAt)));
  const yesterday = unpinned.filter(c => isYesterday(new Date(c.updatedAt)));
  const thisWeek = unpinned.filter(c => !isToday(new Date(c.updatedAt)) && !isYesterday(new Date(c.updatedAt)) && isThisWeek(new Date(c.updatedAt)));
  const older = unpinned.filter(c => !isToday(new Date(c.updatedAt)) && !isYesterday(new Date(c.updatedAt)) && !isThisWeek(new Date(c.updatedAt)));

  const renderGroup = (title: string, list: AiConversation[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 px-3">{title}</h3>
        <div className="space-y-0.5">
          {list.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={cn(
                "group relative flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                activeConversationId === conv.id ? "bg-accent/10 text-primary" : "text-secondary hover:bg-surface-1 hover:text-primary"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
              
              {editingId === conv.id ? (
                <div className="flex-1 flex items-center gap-1 min-w-0">
                  <input
                    type="text"
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && setEditingId(null)}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 min-w-0 bg-surface-1 border border-tv-border rounded px-1.5 py-0.5 text-xs text-primary outline-none"
                  />
                  <button onClick={saveEdit} className="p-1 hover:text-success"><Check className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 hover:text-loss"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <span className="flex-1 min-w-0 truncate text-[13px] font-medium leading-tight">
                  {conv.title}
                </span>
              )}

              {/* Actions Menu */}
              {editingId !== conv.id && (
                <div className={cn(
                  "absolute right-2 flex items-center gap-1 bg-gradient-to-l from-surface-0 via-surface-0 to-transparent pl-4 opacity-0 group-hover:opacity-100 transition-opacity",
                  activeConversationId === conv.id && "from-accent/[0.15] via-accent/[0.15]"
                )}>
                  <button onClick={(e) => togglePin(e, conv)} className="p-1 text-tertiary hover:text-accent" title={conv.isPinned ? "Unpin" : "Pin"}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => startEdit(e, conv)} className="p-1 text-tertiary hover:text-primary" title="Rename">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => handleDuplicate(e, conv)} className="p-1 text-tertiary hover:text-accent" title="Duplicate">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => handleExport(e, conv)} className="p-1 text-tertiary hover:text-success" title="Export Markdown">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => toggleArchive(e, conv)} className="p-1 text-tertiary hover:text-warning" title={conv.isArchived ? "Unarchive" : "Archive"}>
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => handleDelete(e, conv.id)} className="p-1 text-tertiary hover:text-loss" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-[280px] bg-surface-0 border-r border-border shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 bg-primary text-base-dark py-2.5 rounded-lg font-bold hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Coaching Session
        </button>
        
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-1 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-primary placeholder:text-tertiary focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {pinned.length > 0 && renderGroup('Pinned', pinned)}
        {today.length > 0 && renderGroup('Today', today)}
        {yesterday.length > 0 && renderGroup('Yesterday', yesterday)}
        {thisWeek.length > 0 && renderGroup('Previous 7 Days', thisWeek)}
        {older.length > 0 && renderGroup('Older', older)}
        {archived.length > 0 && renderGroup('Archived', archived)}
        
        {filtered.length === 0 && (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-8 h-8 text-tertiary mx-auto mb-3 opacity-20" />
            <p className="text-sm text-secondary font-medium">No sessions found</p>
            <p className="text-[11px] text-tertiary mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
