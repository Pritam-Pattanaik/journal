import React from 'react';
import { cn } from '../../lib/cn';
import { Bold, Italic, Underline, List, ListOrdered, Link2 } from 'lucide-react';
import { CMD_KEY } from '../../lib/osUtils';

interface JournalEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function JournalEditor({ content, onChange, placeholder, className, minHeight = "min-h-[120px]" }: JournalEditorProps) {
  // Currently a simple textarea, ready to be replaced by a block editor (like TipTap or Slate)
  return (
    <div className={cn("flex flex-col w-full rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-surface-1 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/50 transition-all shadow-sm", className)}>
      {/* Future Rich Text Toolbar Structure */}
      <div className="flex items-center gap-1 p-2 border-b border-black/5 dark:border-white/5 bg-surface-2/50" role="toolbar" aria-label="Text formatting options">
        <button type="button" aria-label="Bold" className="p-1.5 text-tertiary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none" title={`Bold (${CMD_KEY}B)`}>
          <Bold size={14} />
        </button>
        <button type="button" aria-label="Italic" className="p-1.5 text-tertiary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none" title={`Italic (${CMD_KEY}I)`}>
          <Italic size={14} />
        </button>
        <button type="button" aria-label="Underline" className="p-1.5 text-tertiary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none" title={`Underline (${CMD_KEY}U)`}>
          <Underline size={14} />
        </button>
        <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
        <button type="button" aria-label="Bullet list" className="p-1.5 text-tertiary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none" title="Bullet List">
          <List size={14} />
        </button>
        <button type="button" aria-label="Numbered list" className="p-1.5 text-tertiary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none" title="Numbered List">
          <ListOrdered size={14} />
        </button>
        <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
        <button type="button" aria-label="Insert link" className="p-1.5 text-tertiary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-accent outline-none" title={`Link (${CMD_KEY}K)`}>
          <Link2 size={14} />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-full p-4 bg-transparent resize-y outline-none text-sm text-primary placeholder:text-tertiary leading-relaxed",
          minHeight
        )}
      />
    </div>
  );
}
