'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export default function RouteGuard({
  children,
  requireAdmin = false,
  fallbackPath = '/dashboard'
}: RouteGuardProps) {
  const { user, userRole, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Check authentication
      if (!user) {
        router.push('/login');
        return;
      }

      // Check admin requirement
      if (requireAdmin && !isAdmin) {
        console.warn('Unauthorized access attempt to admin route');
        router.push(fallbackPath);
        return;
      }

      setIsAuthorized(true);
      setCheckingAuth(false);
    }
  }, [user, isAdmin, loading, requireAdmin, fallbackPath, router]);

  // Loading state
  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Unauthorized state (shouldn't normally show due to redirect, but just in case)
  if (!isAuthorized) {
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
              ? 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น คุณต้องมี role Owner หรือ Manager'
              : 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'}
          </p>
          {userRole && (
            <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Role ปัจจุบันของคุณ: <span className="font-semibold text-gray-900 dark:text-white">{userRole}</span>
              </p>
            </div>
          )}
          <button
            onClick={() => router.push(fallbackPath)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            กลับไปหน้าหลัก
          </button>
        </div>
      </div>
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
