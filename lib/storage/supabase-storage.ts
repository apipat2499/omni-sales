/**
 * Supabase Storage Helper
 *
 * ฟังก์ชันช่วยจัดการ file uploads กับ Supabase Storage
 */

import { supabase } from '@/lib/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

const PRODUCT_IMAGES_BUCKET = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Upload product image to Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<UploadResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        url: '',
        path: '',
        error: 'File size exceeds 5MB limit',
      };
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        url: '',
        path: '',
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${productId}-${timestamp}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        path: '',
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete product image from Supabase Storage
 */
export async function deleteProductImage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return false;
  }
}

/**
 * Update product image (delete old, upload new)
 */
export async function updateProductImage(
  file: File,
  productId: string,
  oldFilePath?: string
): Promise<UploadResult> {
  // Delete old image if exists
  if (oldFilePath) {
    await deleteProductImage(oldFilePath);
  }

  // Upload new image
  return uploadProductImage(file, productId);
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  if (!url) return '';

  // For Supabase Storage, we can add transformation parameters
  const params = new URLSearchParams();

  if (options?.width) {
    params.append('width', options.width.toString());
  }

  if (options?.height) {
    params.append('height', options.height.toString());
  }

  if (options?.quality) {
    params.append('quality', options.quality.toString());
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' };
  }

  return { valid: true };
}
