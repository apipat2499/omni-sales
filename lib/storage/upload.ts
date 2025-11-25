// Image Upload Utilities for Supabase Storage

import { createClient } from '@/lib/supabase/client';

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  optimize?: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  thumbnailUrl?: string;
  error?: string;
  size?: number;
  type?: string;
}

// Default buckets for different content types
export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  LOGOS: 'logos',
  BANNERS: 'banners',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
} as const;

// Default options
const DEFAULT_OPTIONS: UploadOptions = {
  bucket: STORAGE_BUCKETS.PRODUCTS,
  folder: '',
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  generateThumbnail: false,
  optimize: true,
};

/**
 * Validate file before upload
 */
function validateFile(file: File, options: UploadOptions): string | null {
  // Check file size
  if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
    const maxMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(1);
    return `File size exceeds ${maxMB}MB limit`;
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`;
  }

  return null;
}

/**
 * Generate unique file name
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_');
  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
}

/**
 * Optimize image before upload (client-side resize)
 */
async function optimizeImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        },
        file.type,
        0.85 // 85% quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate thumbnail from image
 */
async function generateThumbnail(file: File, size: number = 300): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const { width, height } = img;
      const ratio = Math.min(size / width, size / height);
      const newWidth = width * ratio;
      const newHeight = height * ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx?.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbName = file.name.replace(/(\.[^.]+)$/, '_thumb$1');
            const thumbnailFile = new File([blob], thumbName, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(thumbnailFile);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        file.type,
        0.8
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: Partial<UploadOptions> = {}
): Promise<UploadResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate file
    const validationError = validateFile(file, opts);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Optimize image if requested
    let fileToUpload = file;
    if (opts.optimize && file.type.startsWith('image/')) {
      try {
        fileToUpload = await optimizeImage(file);
      } catch (error) {
        console.warn('Image optimization failed, uploading original:', error);
      }
    }

    // Generate file name
    const fileName = generateFileName(file.name);
    const filePath = opts.folder ? `${opts.folder}/${fileName}` : fileName;

    // Upload to Supabase
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(opts.bucket!)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(opts.bucket!).getPublicUrl(filePath);

    const result: UploadResult = {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      size: fileToUpload.size,
      type: fileToUpload.type,
    };

    // Generate and upload thumbnail if requested
    if (opts.generateThumbnail && file.type.startsWith('image/')) {
      try {
        const thumbnail = await generateThumbnail(file);
        const thumbPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');

        const { data: thumbData, error: thumbError } = await supabase.storage
          .from(opts.bucket!)
          .upload(thumbPath, thumbnail, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from(opts.bucket!)
            .getPublicUrl(thumbPath);
          result.thumbnailUrl = thumbUrlData.publicUrl;
        }
      } catch (error) {
        console.warn('Thumbnail generation failed:', error);
      }
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Upload failed' };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  options: Partial<UploadOptions> = {}
): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadFile(file, options)));
}

/**
 * Delete file from storage
 */
export async function deleteFile(path: string, bucket: string = STORAGE_BUCKETS.PRODUCTS): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(paths: string[], bucket: string = STORAGE_BUCKETS.PRODUCTS): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.error('Delete multiple error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete multiple failed:', error);
    return false;
  }
}

/**
 * Get file URL from path
 */
export function getFileUrl(path: string, bucket: string = STORAGE_BUCKETS.PRODUCTS): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
