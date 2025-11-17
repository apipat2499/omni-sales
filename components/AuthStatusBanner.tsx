'use client';

import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export function AuthStatusBanner() {
  const { supabaseReady, authError } = useAuth();

  if (supabaseReady) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">โหมดออฟไลน์</p>
        <p className="text-xs opacity-90">
          {authError || 'ระบบ Supabase ยังไม่ถูกตั้งค่า จึงเปิดให้ดูข้อมูลสาธารณะเท่านั้น'}
        </p>
      </div>
    </div>
  );
}
