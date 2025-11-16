import { useEffect } from 'react';

export interface KeyboardShortcutsMap {
  [key: string]: (e: KeyboardEvent) => void;
}

/**
 * Hook for handling keyboard shortcuts
 * @param shortcuts - Object mapping key combinations to handlers
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutsMap,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Create key combination string
      const keys = [];
      if (event.ctrlKey || event.metaKey) keys.push('ctrl');
      if (event.shiftKey) keys.push('shift');
      if (event.altKey) keys.push('alt');

      // Get the actual key (normalize it)
      const key = event.key.toLowerCase();
      keys.push(key);

      const combination = keys.join('+');

      // Check if this combination matches any shortcut
      if (shortcuts[combination]) {
        event.preventDefault();
        shortcuts[combination](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Common shortcut combinations
 */
export const SHORTCUTS = {
  CTRL_S: 'ctrl+s',           // Save
  CTRL_N: 'ctrl+n',           // New
  CTRL_E: 'ctrl+e',           // Export
  CTRL_P: 'ctrl+p',           // Print
  CTRL_D: 'ctrl+d',           // Delete
  ESCAPE: 'escape',           // Close/Cancel
  ENTER: 'enter',             // Confirm
  DELETE: 'delete',           // Delete key
  PLUS: '+',                  // Increase
  MINUS: '-',                 // Decrease
  SLASH: '/',                 // Focus search
};
