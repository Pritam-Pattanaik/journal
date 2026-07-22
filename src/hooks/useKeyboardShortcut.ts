import { useEffect } from 'react';

type ShortcutCallback = (e: KeyboardEvent) => void;

export function useKeyboardShortcut(
  key: string,
  callback: ShortcutCallback,
  options: { ctrlCmd?: boolean; shift?: boolean; alt?: boolean; preventDefault?: boolean } = { ctrlCmd: true, preventDefault: true }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchCtrlCmd = options.ctrlCmd ? (event.metaKey || event.ctrlKey) : true;
      const matchShift = options.shift ? event.shiftKey : true;
      const matchAlt = options.alt ? event.altKey : true;

      if (
        matchCtrlCmd &&
        matchShift &&
        matchAlt &&
        event.key.toLowerCase() === key.toLowerCase()
      ) {
        if (options.preventDefault !== false) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options]);
}
