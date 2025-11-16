import { useEffect, useCallback, useState } from 'react';
import {
  getAllShortcuts,
  matchesKeyboardEvent,
  getShortcutsByCategory,
  saveShortcuts,
  type KeyboardShortcut,
} from '@/lib/utils/keyboard-shortcuts';

export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(() => getAllShortcuts());
  const [isEnabled, setIsEnabled] = useState(true);

  const registerHandler = useCallback(
    (shortcutId: string, handler: () => void | Promise<void>) => {
      const shortcut = shortcuts.find((s) => s.id === shortcutId);
      if (shortcut) {
        shortcut.handler = handler;
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (matchesKeyboardEvent(shortcut, event) && shortcut.handler) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isEnabled]);

  const updateShortcut = useCallback((id: string, updates: Partial<KeyboardShortcut>) => {
    setShortcuts((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveShortcuts(updated);
      return updated;
    });
  }, []);

  const toggleShortcut = useCallback((id: string) => {
    const shortcut = shortcuts.find((s) => s.id === id);
    if (shortcut) {
      updateShortcut(id, { enabled: !shortcut.enabled });
    }
  }, [shortcuts, updateShortcut]);

  return {
    shortcuts,
    isEnabled,
    setIsEnabled,
    registerHandler,
    updateShortcut,
    toggleShortcut,
    getByCategory: (category: string) =>
      getShortcutsByCategory(category as any),
  };
}
