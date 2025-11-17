'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, X } from 'lucide-react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      key: '/',
      description: 'ค้นหา',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      key: 'h',
      description: 'หน้าหลัก',
      action: () => router.push('/'),
    },
    {
      key: 'o',
      description: 'คำสั่งซื้อ',
      action: () => router.push('/orders'),
    },
    {
      key: 'p',
      description: 'สินค้า',
      action: () => router.push('/products'),
    },
    {
      key: 'c',
      description: 'ลูกค้า',
      action: () => router.push('/customers'),
    },
    {
      key: 'a',
      description: 'Analytics',
      action: () => router.push('/analytics'),
    },
    {
      key: '?',
      shift: true,
      description: 'แสดงคีย์ลัด',
      action: () => setShowHelp(true),
    },
    {
      key: 'Escape',
      description: 'ปิด Modal/Dialog',
      action: () => setShowHelp(false),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
        title="Keyboard Shortcuts (Shift + ?)"
      >
        <Command className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Command className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.ctrl && (
                    <kbd className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500">
                      Ctrl
                    </kbd>
                  )}
                  {shortcut.shift && (
                    <kbd className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500">
                      Shift
                    </kbd>
                  )}
                  {shortcut.alt && (
                    <kbd className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500">
                      Alt
                    </kbd>
                  )}
                  <kbd className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500">
                    {shortcut.key === ' ' ? 'Space' : shortcut.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>เคล็ดลับ:</strong> คีย์ลัดทำงานได้เมื่อไม่ได้พิมพ์ในช่องกรอกข้อมูล
              กด <kbd className="px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 rounded">Escape</kbd> เพื่อออกจากช่องกรอกข้อมูล
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
