'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

// Development mode bypass (ปิดการใช้งานได้ผ่าน env)
const DEV_BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

export default function RouteGuard({
  children,
  requireAdmin = false,
  fallbackPath = '/dashboard'
}: RouteGuardProps) {
  const { user, userRole, isAdmin, loading, supabaseReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showContent, setShowContent] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    // Development bypass mode
    if (DEV_BYPASS) {
      console.warn('🚨 Auth bypass enabled (DEV_BYPASS=true)');
      setShowContent(true);
      return;
    }

    // Supabase not ready - bypass for now (show warning)
    if (!supabaseReady) {
      console.warn('⚠️ Supabase not configured - bypassing auth check');
      setShowContent(true);
      return;
    }

    // Wait for loading to complete
    if (loading) {
      return;
    }

    // Prevent redirect loop
    if (redirectingRef.current) {
      return;
    }

    // Check authentication
    if (!user) {
      if (pathname !== '/login') {
        console.log('🔒 No user - redirecting to login');
        redirectingRef.current = true;
        router.push('/login');
      }
      return;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
      console.warn('🚫 Unauthorized admin access attempt:', { userRole, pathname });
      redirectingRef.current = true;
      router.push(fallbackPath);
      return;
    }

    // All checks passed
    setShowContent(true);
  }, [user, isAdmin, loading, requireAdmin, fallbackPath, router, pathname, supabaseReady]);

  // Loading state - รอ AuthContext
  if (loading && !DEV_BYPASS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Unauthorized - แสดงข้อความชั่วคราว ก่อน redirect
  if (!showContent && !DEV_BYPASS && supabaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {requireAdmin
              ? 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น (Owner/Manager)'
              : 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ'}
          </p>
          {userRole && (
            <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Role ของคุณ: <span className="font-semibold text-gray-900 dark:text-white">{userRole}</span>
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            กำลังนำคุณไปยังหน้าที่เหมาะสม...
          </p>
        </div>
      </div>
    );
  }

  // Supabase not ready - show warning banner
  if (!supabaseReady) {
    return (
      <>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="max-w-7xl mx-auto py-2 px-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              ⚠️ ระบบยืนยันตัวตนยังไม่พร้อม - กำลังใช้งานในโหมด Demo
            </p>
          </div>
        </div>
        {children}
      </>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}

// Helper component for admin-only pages
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireAdmin>{children}</RouteGuard>;
}

// Helper component for authenticated pages (no role requirement)
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
