'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { trackClientTelemetry } from '@/lib/telemetry';
import { UserRole, getRoleFromSession } from './getRoleFromSession';

interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  isAdmin: boolean;
  loading: boolean;
  supabaseReady: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Set timeout to force stop loading after 3 seconds
    const loadingTimeout = setTimeout(() => {
      console.warn('[AuthContext] Loading timeout - forcing loading state to false');
      setLoading(false);
    }, 3000);

    const supabase = getSupabaseClient();

    if (!supabase) {
      console.warn('Supabase credentials not configured. Skipping auth initialization.');
      setSupabaseReady(false);
      setAuthError('ระบบยังไม่ได้ตั้งค่า Supabase จึงปิดการยืนยันตัวตนชั่วคราว');
      setLoading(false);
      clearTimeout(loadingTimeout);
      return;
    }
    setSupabaseReady(true);
    setAuthError(null);

    // Check active session
    const checkSession = async () => {
      try {
        console.log('[AuthContext] Checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        console.log('[AuthContext] Session check complete. User:', currentUser ? 'logged in' : 'not logged in');
        setUser(currentUser);

        // Get user role (skip if no user to avoid unnecessary API calls)
        if (currentUser) {
          // Try to get role, but gracefully handle if RBAC tables don't exist
          try {
            const roleInfo = await getRoleFromSession(supabase, currentUser);
            const role = roleInfo?.role ?? null;
            setUserRole(role);
            setIsAdmin(role === 'owner' || role === 'manager');
          } catch (roleError) {
            // Silently fail - RBAC not configured
            console.warn('RBAC tables not found - running in demo mode');
            setUserRole(null);
            setIsAdmin(false);
          }
        } else {
          setUserRole(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthError('ไม่สามารถเชื่อมต่อ Supabase ได้ ตรวจสอบค่า Environment');
      } finally {
        console.log('[AuthContext] Setting loading to false');
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Get user role (skip if no user to avoid unnecessary API calls)
        if (currentUser) {
          // Try to get role, but gracefully handle if RBAC tables don't exist
          try {
            const roleInfo = await getRoleFromSession(supabase, currentUser);
            const role = roleInfo?.role ?? null;
            setUserRole(role);
            setIsAdmin(role === 'owner' || role === 'manager');
          } catch (roleError) {
            // Silently fail - RBAC not configured
            setUserRole(null);
            setIsAdmin(false);
          }
        } else {
          setUserRole(null);
          setIsAdmin(false);
        }

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
    userRole,
    isAdmin,
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
