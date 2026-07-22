import React, { useEffect, useState } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { Plus, Search, Tag, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function KnowledgeVault() {
  const { notes, loading, fetchNotes, addNote, deleteNote } = useNoteStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Personal Notes');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await addNote({
      title: newTitle,
      content: newContent,
      category: newCategory,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    });
    setShowForm(false);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
  };

  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight">Knowledge Vault</h1>
          <p className="text-secondary mt-1">Your personal library of strategies, rules, and research.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
        <input 
          type="text" 
          placeholder="Search your knowledge vault..." 
          className="input-base pl-10 w-full md:w-96"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="bg-surface border border-border p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSave} className="space-y-4">
            <input required type="text" placeholder="Title" className="input-base" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <select className="input-base" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              <option>Personal Notes</option>
              <option>Strategy Playbook</option>
              <option>Market Research</option>
              <option>Trading Rules</option>
            </select>
            <textarea required rows={5} placeholder="Content" className="input-base resize-none" value={newContent} onChange={e => setNewContent(e.target.value)}></textarea>
            <input type="text" placeholder="Tags (comma separated)" className="input-base" value={newTags} onChange={e => setNewTags(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Note</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-tertiary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <div key={note.id} className="bg-surface border border-border p-5 rounded-xl flex flex-col group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-primary text-lg">{note.title}</h3>
                <button onClick={() => deleteNote(note.id)} className="text-tertiary hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary bg-surface-2 px-2 py-1 rounded inline-block w-fit mb-3">
                {note.category}
              </span>
              <p className="text-sm text-tertiary whitespace-pre-wrap flex-1">{note.content}</p>
              {note.tags && note.tags.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {note.tags.map((t: string) => (
                    <span key={t} className="flex items-center gap-1 text-[10px] uppercase font-bold text-tertiary">
                      <Tag className="w-3 h-3" /> {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!loading && filteredNotes.length === 0 && (
            <div className="col-span-full p-10 text-center text-tertiary">No notes found.</div>
          )}
        </div>
      )}
    </div>
  );
}
