'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get('session_id');
    setSessionId(id);
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="max-w-md rounded-lg bg-white p-8 text-center dark:bg-gray-800">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold dark:text-white">
          Payment Successful!
        </h1>

        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Thank you for your purchase. Your subscription is now active.
        </p>

        {sessionId && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Session ID: {sessionId}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/billing"
            className="block rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
          >
            View My Subscriptions
          </a>
          <a
            href="/dashboard"
            className="block rounded-lg border border-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Back to Dashboard
          </a>
        </div>

        <p className="mt-8 text-xs text-gray-500 dark:text-gray-500">
          A confirmation email has been sent to your inbox with details about your subscription.
        </p>
      </div>
    </div>
  );
}
