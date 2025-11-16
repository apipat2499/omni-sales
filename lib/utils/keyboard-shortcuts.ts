/**
 * Keyboard shortcuts system
 */

export type ShortcutCategory = 'navigation' | 'editing' | 'filtering' | 'export' | 'selection';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  category: ShortcutCategory;
  key: string;
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  enabled: boolean;
  handler?: () => void | Promise<void>;
}

export interface ShortcutConfig {
  id: string;
  shortcut: KeyboardShortcut;
  customKey?: string;
  enabled: boolean;
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    id: 'save_order',
    name: 'Save Order',
    description: 'Save the current order',
    category: 'editing',
    key: 's',
    ctrl: true,
    enabled: true,
  },
  {
    id: 'new_order',
    name: 'New Order',
    description: 'Create a new order',
    category: 'navigation',
    key: 'n',
    ctrl: true,
    enabled: true,
  },
  {
    id: 'add_item',
    name: 'Add Item',
    description: 'Add a new item to order',
    category: 'editing',
    key: 'a',
    alt: true,
    enabled: true,
  },
  {
    id: 'delete_item',
    name: 'Delete Item',
    description: 'Delete selected item',
    category: 'editing',
    key: 'Delete',
    enabled: true,
  },
  {
    id: 'duplicate_item',
    name: 'Duplicate Item',
    description: 'Duplicate selected item',
    category: 'editing',
    key: 'd',
    ctrl: true,
    enabled: true,
  },
  {
    id: 'open_filter',
    name: 'Open Filter',
    description: 'Open filter panel',
    category: 'filtering',
    key: 'f',
    ctrl: true,
    enabled: true,
  },
  {
    id: 'export_csv',
    name: 'Export as CSV',
    description: 'Export current items as CSV',
    category: 'export',
    key: 'e',
    ctrl: true,
    shift: true,
    enabled: true,
  },
  {
    id: 'select_all',
    name: 'Select All',
    description: 'Select all items',
    category: 'selection',
    key: 'a',
    ctrl: true,
    enabled: true,
  },
  {
    id: 'clear_selection',
    name: 'Clear Selection',
    description: 'Clear all selections',
    category: 'selection',
    key: 'Escape',
    enabled: true,
  },
  {
    id: 'help',
    name: 'Help',
    description: 'Show help and shortcuts',
    category: 'navigation',
    key: 'h',
    ctrl: true,
    shift: true,
    enabled: true,
  },
];

export function getDefaultShortcuts(): KeyboardShortcut[] {
  return [...defaultShortcuts];
}

export function getAllShortcuts(): KeyboardShortcut[] {
  try {
    const stored = localStorage.getItem('keyboard_shortcuts');
    if (!stored) return getDefaultShortcuts();
    return JSON.parse(stored) as KeyboardShortcut[];
  } catch {
    return getDefaultShortcuts();
  }
}

export function saveShortcuts(shortcuts: KeyboardShortcut[]): void {
  localStorage.setItem('keyboard_shortcuts', JSON.stringify(shortcuts));
}

export function getShortcutById(id: string): KeyboardShortcut | undefined {
  return getAllShortcuts().find((s) => s.id === id);
}

export function getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
  return getAllShortcuts().filter((s) => s.category === category);
}

export function matchesKeyboardEvent(shortcut: KeyboardShortcut, event: KeyboardEvent): boolean {
  if (!shortcut.enabled) return false;

  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
    event.code === shortcut.key;

  if (!keyMatch) return false;

  if (shortcut.ctrl && !event.ctrlKey) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;

  return true;
}

export function resetToDefaults(): void {
  saveShortcuts(getDefaultShortcuts());
}

export function exportShortcuts(): string {
  return JSON.stringify(getAllShortcuts(), null, 2);
}

export function importShortcuts(jsonString: string): boolean {
  try {
    const shortcuts = JSON.parse(jsonString) as KeyboardShortcut[];
    saveShortcuts(shortcuts);
    return true;
  } catch {
    return false;
  }
}
