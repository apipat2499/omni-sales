'use client';

/**
 * Error Boundary Component
 * Catches React errors and reports them to Sentry
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { captureException } from '@/lib/sentry/init';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    captureException(error, {
      extra: {
        errorInfo,
        componentStack: errorInfo.componentStack,
      },
      tags: {
        errorBoundary: 'true',
      },
    });

    // Show user feedback dialog if enabled
    if (this.props.showDialog) {
      Sentry.showReportDialog({
        title: 'เกิดข้อผิดพลาด',
        subtitle: 'ทีมของเราได้รับแจ้งเรื่องนี้แล้ว',
        subtitle2: 'หากคุณต้องการช่วยเหลือ โปรดอธิบายสิ่งที่เกิดขึ้น',
        labelName: 'ชื่อ',
        labelEmail: 'อีเมล',
        labelComments: 'คำอธิบายเพิ่มเติม',
        labelClose: 'ปิด',
        labelSubmit: 'ส่ง',
        errorGeneric: 'เกิดข้อผิดพลาดในการส่งความคิดเห็นของคุณ กรุณาลองอีกครั้ง',
        successMessage: 'ความคิดเห็นของคุณถูกส่งแล้ว ขอบคุณ!',
      });
    }

    // Update state with error details
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                เกิดข้อผิดพลาด
              </h1>

              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                ขออภัย เกิดข้อผิดพลาดขึ้น เราได้รับแจ้งเรื่องนี้แล้วและกำลังดำเนินการแก้ไข
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto">
                  <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ลองอีกครั้ง
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  กลับหน้าหลัก
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  showDialog?: boolean
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback} showDialog={showDialog}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
