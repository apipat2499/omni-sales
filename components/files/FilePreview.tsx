'use client';

/**
 * File Preview Component
 * Preview different file types
 */

import React from 'react';
import { X, Download, Share2 } from 'lucide-react';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    mime_type: string;
    size_bytes: number;
    public_url?: string;
    storage_path: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function FilePreview({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
}: FilePreviewProps) {
  if (!isOpen) return null;

  const renderPreview = () => {
    // Image preview
    if (file.mime_type.startsWith('image/')) {
      return (
        <img
          src={file.public_url || `/api/files/${file.id}/download`}
          alt={file.name}
          className="max-w-full max-h-[70vh] mx-auto"
        />
      );
    }

    // Video preview
    if (file.mime_type.startsWith('video/')) {
      return (
        <video
          controls
          className="max-w-full max-h-[70vh] mx-auto"
          src={file.public_url || `/api/files/${file.id}/download`}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    // Audio preview
    if (file.mime_type.startsWith('audio/')) {
      return (
        <div className="flex items-center justify-center h-64">
          <audio
            controls
            className="w-full max-w-md"
            src={file.public_url || `/api/files/${file.id}/download`}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // PDF preview
    if (file.mime_type === 'application/pdf') {
      return (
        <iframe
          src={file.public_url || `/api/files/${file.id}/download`}
          className="w-full h-[70vh]"
          title={file.name}
        />
      );
    }

    // Text file preview
    if (file.mime_type.startsWith('text/')) {
      return (
        <iframe
          src={file.public_url || `/api/files/${file.id}/download`}
          className="w-full h-[70vh] bg-white"
          title={file.name}
        />
      );
    }

    // Default: No preview available
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg mb-4">Preview not available for this file type</p>
        <button
          onClick={onDownload}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Download File
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {file.name}
            </h2>
            <p className="text-sm text-gray-500">
              {formatBytes(file.size_bytes)} • {file.mime_type}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
            )}

            {onShare && (
              <button
                onClick={onShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
