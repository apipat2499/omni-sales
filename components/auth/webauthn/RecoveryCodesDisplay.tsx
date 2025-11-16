'use client';

/**
 * Recovery Codes Display Component
 * Displays and manages recovery codes for account recovery
 */

import { useState, useEffect } from 'react';

interface RecoveryCodesDisplayProps {
  codes?: string[];
  onGenerate?: () => void;
  onDownload?: (codes: string[]) => void;
}

export default function RecoveryCodesDisplay({
  codes: initialCodes,
  onGenerate,
  onDownload,
}: RecoveryCodesDisplayProps) {
  const [codes, setCodes] = useState<string[]>(initialCodes || []);
  const [loading, setLoading] = useState(false);
  const [hasExistingCodes, setHasExistingCodes] = useState(false);
  const [existingCodesCount, setExistingCodesCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!initialCodes) {
      checkExistingCodes();
    } else {
      setCodes(initialCodes);
    }
  }, [initialCodes]);

  const checkExistingCodes = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token');

      const response = await fetch('/api/auth/webauthn/recovery-codes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasExistingCodes(data.has_codes);
        setExistingCodesCount(data.count);
      }
    } catch (error) {
      console.error('Failed to check existing codes:', error);
    }
  };

  const handleGenerate = async (regenerate: boolean = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase.auth.token');

      const response = await fetch('/api/auth/webauthn/recovery-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ regenerate }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recovery codes');
      }

      const data = await response.json();
      setCodes(data.codes);
      setHasExistingCodes(true);
      setExistingCodesCount(data.codes.length);
      onGenerate?.();
    } catch (error) {
      console.error('Failed to generate codes:', error);
      alert('Failed to generate recovery codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy codes:', error);
    }
  };

  const handleDownload = () => {
    const text = `Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n\n${codes.join('\n')}\n\nStore these codes in a safe place. You will not be able to see them again.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.(codes);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=400');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Recovery Codes</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              h1 { font-size: 18px; }
              .code { margin: 10px 0; font-size: 16px; }
              .warning { color: #dc2626; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Recovery Codes</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            ${codes.map(code => `<div class="code">${code}</div>`).join('')}
            <p class="warning">Store these codes in a safe place. You will not be able to see them again.</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (codes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {hasExistingCodes ? 'Recovery Codes Generated' : 'Generate Recovery Codes'}
            </h3>
            <div className="mt-2 text-sm text-gray-700">
              {hasExistingCodes ? (
                <p>
                  You have {existingCodesCount} unused recovery codes. You cannot view them again,
                  but you can generate new ones if needed.
                </p>
              ) : (
                <p>
                  Generate recovery codes to regain access to your account if you lose your passkeys.
                  Store them in a safe place.
                </p>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={() => handleGenerate(hasExistingCodes)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  hasExistingCodes ? 'Regenerate Codes' : 'Generate Codes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-yellow-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm font-medium text-yellow-800">
            Save these codes now! You won't be able to see them again.
          </p>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {codes.map((code, index) => (
            <div
              key={index}
              className="font-mono text-lg bg-gray-50 p-3 rounded-md border border-gray-200 text-center"
            >
              {code}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {copied ? (
              <>
                <svg className="-ml-1 mr-2 h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How to use recovery codes</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Each code can only be used once</li>
                  <li>Keep them in a secure location like a password manager</li>
                  <li>Use them to regain access if you lose your passkeys</li>
                  <li>Generate new codes if you run out</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
