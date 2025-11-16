'use client';

/**
 * File Management Page
 * Main page for browsing, uploading, and managing files
 */

import React, { useState, useEffect } from 'react';
import {
  Upload as UploadIcon,
  FolderPlus,
  HardDrive,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import FileUploader from '@/components/files/FileUploader';
import FileBrowser from '@/components/files/FileBrowser';
import FilePreview from '@/components/files/FilePreview';
import ShareDialog from '@/components/files/ShareDialog';

export default function FilesPage() {
  const [showUploader, setShowUploader] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // TODO: Replace with actual user authentication
  const userId = 'demo-user-id';
  const tenantId = 'demo-tenant-id';

  useEffect(() => {
    loadStorageUsage();
  }, []);

  const loadStorageUsage = async () => {
    try {
      const response = await fetch(
        `/api/files/usage?userId=${userId}&tenantId=${tenantId}`
      );
      if (!response.ok) throw new Error('Failed to load usage');

      const data = await response.json();
      setStorageUsage(data);
    } catch (error) {
      console.error('Error loading storage usage:', error);
    }
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    setRefreshKey((prev) => prev + 1);
    loadStorageUsage();
  };

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setRefreshKey((prev) => prev + 1);
      loadStorageUsage();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  const handleFileShare = (fileId: string) => {
    const file = { id: fileId };
    setSelectedFile(file);
    setShowShareDialog(true);
  };

  const handleDownload = async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/files/${selectedFile.id}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
              <p className="mt-1 text-sm text-gray-500">
                Upload, organize, and share your files
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setRefreshKey((prev) => prev + 1)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Refresh
              </button>

              <button
                onClick={() => setShowUploader(!showUploader)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UploadIcon className="h-5 w-5" />
                Upload Files
              </button>
            </div>
          </div>

          {/* Storage Usage */}
          {storageUsage && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Storage Usage
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatBytes(storageUsage.usage?.total_size_bytes || 0)} /{' '}
                  {formatBytes(storageUsage.usage?.quota_bytes || 0)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    storageUsage.percentUsed > 90
                      ? 'bg-red-500'
                      : storageUsage.percentUsed > 75
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(storageUsage.percentUsed, 100)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{storageUsage.usage?.total_files || 0} files</span>
                <span>
                  {formatBytes(storageUsage.remaining || 0)} remaining
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {showUploader && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Files
              </h2>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-sm">Cancel</span>
              </button>
            </div>

            <FileUploader
              userId={userId}
              tenantId={tenantId}
              path={currentPath}
              onUploadComplete={handleUploadComplete}
              onUploadError={(error) => alert(error)}
              multiple={true}
            />
          </div>
        )}

        {/* File Browser */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <FileBrowser
            key={refreshKey}
            userId={userId}
            tenantId={tenantId}
            currentPath={currentPath}
            onFileSelect={handleFileSelect}
            onFileDelete={handleFileDelete}
            onFileShare={handleFileShare}
            onPathChange={setCurrentPath}
          />
        </div>
      </div>

      {/* File Preview Modal */}
      {selectedFile && showPreview && (
        <FilePreview
          file={selectedFile}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          onShare={() => {
            setShowPreview(false);
            setShowShareDialog(true);
          }}
        />
      )}

      {/* Share Dialog */}
      {selectedFile && showShareDialog && (
        <ShareDialog
          fileId={selectedFile.id}
          fileName={selectedFile.name || 'File'}
          userId={userId}
          tenantId={tenantId}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
      )}
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
