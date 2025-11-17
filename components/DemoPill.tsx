'use client';

import { Sparkles } from 'lucide-react';

export function DemoPill() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
      <Sparkles className="w-3 h-3" />
      โหมดทดลอง
    </span>
  );
}
