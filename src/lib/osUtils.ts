export const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
export const CMD_KEY = isMac ? '⌘' : 'Ctrl';
