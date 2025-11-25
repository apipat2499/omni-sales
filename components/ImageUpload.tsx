'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { uploadFile, UploadOptions, UploadResult, STORAGE_BUCKETS } from '@/lib/storage/upload';

interface ImageUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  bucket?: string;
  folder?: string;
  maxSizeBytes?: number;
  currentImageUrl?: string;
  label?: string;
  description?: string;
  showPreview?: boolean;
  generateThumbnail?: boolean;
  className?: string;
}

export default function ImageUpload({
  onUploadComplete,
  onUploadError,
  bucket = STORAGE_BUCKETS.PRODUCTS,
  folder = '',
  maxSizeBytes = 5 * 1024 * 1024,
  currentImageUrl,
  label = 'Upload Image',
  description = 'PNG, JPG, WEBP up to 5MB',
  showPreview = true,
  generateThumbnail = false,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    if (showPreview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload file
    setUploading(true);
    setUploadProgress('uploading');

    try {
      const result = await uploadFile(file, {
        bucket,
        folder,
        maxSizeBytes,
        generateThumbnail,
        optimize: true,
      });

      if (result.success && result.url) {
        setUploadProgress('success');
        onUploadComplete(result);

        // Reset to idle after 2 seconds
        setTimeout(() => {
          setUploadProgress('idle');
        }, 2000);
      } else {
        setUploadProgress('error');
        setPreview(currentImageUrl || null);
        if (onUploadError && result.error) {
          onUploadError(result.error);
        }

        // Reset to idle after 3 seconds
        setTimeout(() => {
          setUploadProgress('idle');
        }, 3000);
      }
    } catch (error: any) {
      setUploadProgress('error');
      setPreview(currentImageUrl || null);
      if (onUploadError) {
        onUploadError(error.message || 'Upload failed');
      }

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setUploadProgress('idle');
      }, 3000);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <div className="relative">
        {/* Upload Area */}
        <div
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${uploading ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
            ${uploadProgress === 'success' ? 'border-green-400 bg-green-50' : ''}
            ${uploadProgress === 'error' ? 'border-red-400 bg-red-50' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          {/* Preview Image */}
          {preview && showPreview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg shadow-sm mx-auto" />
              {!uploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearImage();
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              {uploadProgress === 'uploading' ? (
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              ) : uploadProgress === 'success' ? (
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-gray-500" />
                </div>
              )}

              <p className="text-sm font-medium text-gray-700 mb-1">
                {uploadProgress === 'uploading'
                  ? 'Uploading...'
                  : uploadProgress === 'success'
                  ? 'Upload Successful!'
                  : uploadProgress === 'error'
                  ? 'Upload Failed'
                  : 'Click to upload or drag and drop'}
              </p>

              {description && uploadProgress === 'idle' && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
            </div>
          )}
        </div>

        {/* Upload Status Indicator */}
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Maximum file size: {(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB
      </p>
    </div>
  );
}
