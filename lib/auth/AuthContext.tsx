'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { trackClientTelemetry } from '@/lib/telemetry';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  supabaseReady: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      console.warn('Supabase credentials not configured. Skipping auth initialization.');
      setSupabaseReady(false);
      setAuthError('ระบบยังไม่ได้ตั้งค่า Supabase จึงปิดการยืนยันตัวตนชั่วคราว');
      setLoading(false);
      return;
    }
    setSupabaseReady(true);
    setAuthError(null);

    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthError('ไม่สามารถเชื่อมต่อ Supabase ได้ ตรวจสอบค่า Environment');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      trackClientTelemetry({
        type: 'supabase_offline',
        level: 'warning',
        message: authError || 'Supabase not configured',
        context: {
          path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        },
      });
    }
  }, [supabaseReady, authError]);

  const login = async (email: string, password: string) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error('ระบบยังไม่ได้ตั้งค่า Supabase กรุณาติดต่อผู้ดูแลระบบ');
      setSupabaseReady(false);
      setAuthError(error.message);
      return { error };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { error };
      }

      setAuthError(null);
      return { error: null };
    } catch (error) {
      const err = error as Error;
      setAuthError(err.message);
      return { error: err };
    }
  };

  const logout = async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setSupabaseReady(false);
      setAuthError('ระบบยังไม่ได้ตั้งค่า Supabase กรุณาติดต่อผู้ดูแลระบบ');
      router.push('/login');
      return;
    }

    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    loading,
    supabaseReady,
    authError,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
