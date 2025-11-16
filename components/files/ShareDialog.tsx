'use client';

/**
 * Share Dialog Component
 * Create and manage file share links
 */

import React, { useState } from 'react';
import { X, Link as LinkIcon, Copy, Check, Calendar, Download } from 'lucide-react';

interface ShareDialogProps {
  fileId: string;
  fileName: string;
  userId: string;
  tenantId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareDialog({
  fileId,
  fileName,
  userId,
  tenantId,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number>(3600); // 1 hour
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>();
  const [password, setPassword] = useState<string>('');
  const [canDownload, setCanDownload] = useState(true);

  const createShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files/${fileId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tenantId,
          expiresIn,
          maxDownloads,
          password: password || undefined,
          canDownload,
          canPreview: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to create share link');

      const data = await response.json();
      setShareUrl(data.share.shareUrl);
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share File</h2>
            <p className="text-sm text-gray-500 mt-1">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!shareUrl ? (
            <>
              {/* Expiry Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Link Expiry
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={3600}>1 hour</option>
                  <option value={21600}>6 hours</option>
                  <option value={86400}>24 hours</option>
                  <option value={604800}>7 days</option>
                  <option value={2592000}>30 days</option>
                  <option value={0}>Never</option>
                </select>
              </div>

              {/* Max Downloads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Download className="inline h-4 w-4 mr-1" />
                  Maximum Downloads (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxDownloads || ''}
                  onChange={(e) =>
                    setMaxDownloads(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Password Protection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Protection (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={canDownload}
                    onChange={(e) => setCanDownload(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow downloads
                  </span>
                </label>
              </div>

              {/* Create Button */}
              <button
                onClick={createShareLink}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-5 w-5" />
                    Create Share Link
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Share URL Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Anyone with this link can access the file
                  {expiresIn > 0 &&
                    ` for the next ${formatDuration(expiresIn)}`}
                  {maxDownloads && ` (max ${maxDownloads} downloads)`}.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}
