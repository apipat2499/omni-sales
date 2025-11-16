'use client';

/**
 * File Uploader Component
 * Supports drag-and-drop and multi-file uploads
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  id?: string;
}

interface FileUploaderProps {
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  path?: string;
  userId: string;
  tenantId?: string;
}

export default function FileUploader({
  onUploadComplete,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  allowedTypes,
  multiple = true,
  path = '/',
  userId,
  tenantId,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [multiple, allowedTypes, maxFileSize]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [multiple, allowedTypes, maxFileSize]
  );

  const handleFiles = (files: File[]) => {
    // Validate files
    const validatedFiles: FileUploadItem[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        setUploadItems((prev) => [
          ...prev,
          {
            file,
            progress: 0,
            status: 'error',
            error: `File size exceeds ${formatBytes(maxFileSize)}`,
          },
        ]);
        continue;
      }

      // Check file type
      if (allowedTypes && allowedTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isAllowed = allowedTypes.some(
          (type) =>
            file.type.match(type) || fileExtension === type.toLowerCase()
        );

        if (!isAllowed) {
          setUploadItems((prev) => [
            ...prev,
            {
              file,
              progress: 0,
              status: 'error',
              error: 'File type not allowed',
            },
          ]);
          continue;
        }
      }

      validatedFiles.push({
        file,
        progress: 0,
        status: 'pending',
      });
    }

    if (validatedFiles.length > 0) {
      setUploadItems((prev) => [...prev, ...validatedFiles]);
      uploadFiles(validatedFiles);
    }
  };

  const uploadFiles = async (items: FileUploadItem[]) => {
    const formData = new FormData();

    items.forEach((item) => {
      formData.append('files', item.file);
    });

    formData.append('path', path);
    formData.append('userId', userId);
    if (tenantId) {
      formData.append('tenantId', tenantId);
    }

    try {
      // Update status to uploading
      setUploadItems((prev) =>
        prev.map((item) =>
          items.includes(item) ? { ...item, status: 'uploading', progress: 0 } : item
        )
      );

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      // Update status to success
      setUploadItems((prev) =>
        prev.map((item) => {
          const uploadedFile = result.uploaded?.find(
            (u: any) => u.name === item.file.name
          );
          if (uploadedFile) {
            return {
              ...item,
              status: 'success',
              progress: 100,
              id: uploadedFile.id,
            };
          }

          const error = result.errors?.find(
            (e: any) => e.fileName === item.file.name
          );
          if (error) {
            return {
              ...item,
              status: 'error',
              error: error.error,
            };
          }

          return item;
        })
      );

      if (result.uploaded && result.uploaded.length > 0) {
        onUploadComplete?.(result.uploaded);
      }

      if (result.errors && result.errors.length > 0) {
        onUploadError?.(
          `${result.errors.length} file(s) failed to upload`
        );
      }
    } catch (error: any) {
      console.error('Upload error:', error);

      // Update status to error
      setUploadItems((prev) =>
        prev.map((item) =>
          items.includes(item)
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      );

      onUploadError?.(error.message || 'Upload failed');
    }
  };

  const removeItem = (index: number) => {
    setUploadItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setUploadItems((prev) =>
      prev.filter((item) => item.status !== 'success')
    );
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple={multiple}
          accept={allowedTypes?.join(',')}
          className="hidden"
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </p>

        <p className="text-sm text-gray-500 mb-4">
          or click to browse
        </p>

        <p className="text-xs text-gray-400">
          {multiple ? 'Multiple files allowed' : 'Single file only'} • Max{' '}
          {formatBytes(maxFileSize)}
        </p>

        {allowedTypes && allowedTypes.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Allowed types: {allowedTypes.join(', ')}
          </p>
        )}
      </div>

      {/* Upload Items List */}
      {uploadItems.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Uploading {uploadItems.length} file(s)
            </h3>
            {uploadItems.some((item) => item.status === 'success') && (
              <button
                onClick={clearCompleted}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploadItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <File className="h-8 w-8 text-gray-400 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(item.file.size)}
                  </p>

                  {item.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {item.error && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {item.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {(item.status === 'pending' ||
                    item.status === 'uploading') && (
                    <button
                      onClick={() => removeItem(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
