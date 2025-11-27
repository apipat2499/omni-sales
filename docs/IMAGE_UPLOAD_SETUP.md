# Image Upload System Setup Guide

This guide explains how to set up and use the Image Upload system with Supabase Storage.

## Overview

The Omni Sales Image Upload system provides:
- Client-side and server-side image uploads
- Automatic image optimization and resizing
- Thumbnail generation
- Multiple storage buckets (products, logos, banners, etc.)
- Support for PNG, JPG, WEBP, GIF formats
- Drag-and-drop interface
- Upload progress tracking

## Supabase Storage Setup

### 1. Create Storage Buckets

In your Supabase project dashboard:

1. Go to **Storage** in the left sidebar
2. Click **New bucket** and create the following buckets:

| Bucket Name | Public | Description |
|------------|--------|-------------|
| `products` | ✓ Yes | Product images |
| `logos` | ✓ Yes | Company and brand logos |
| `banners` | ✓ Yes | Hero banners and promotional images |
| `documents` | ✗ No | Private documents and invoices |
| `avatars` | ✓ Yes | User profile pictures |

### 2. Configure Bucket Policies

For each **public** bucket, set up the following policies:

#### Public Read Policy
```sql
-- Allow anyone to read files
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products'); -- Repeat for each public bucket
```

#### Authenticated Upload Policy
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);
```

#### Owner Delete Policy
```sql
-- Allow users to delete their own uploads
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.uid() = owner
);
```

### 3. Set File Size Limits

In Supabase Dashboard:
1. Go to **Storage** → **Settings**
2. Set maximum file size (recommended: 5-10MB for images)

## Usage

### Client-Side Upload Component

```tsx
import ImageUpload from '@/components/ImageUpload';
import { STORAGE_BUCKETS } from '@/lib/storage/upload';

export default function MyComponent() {
  const handleUploadComplete = (result) => {
    console.log('Uploaded!', result.url);
    // Save URL to database, etc.
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
    // Show error to user
  };

  return (
    <ImageUpload
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      bucket={STORAGE_BUCKETS.PRODUCTS}
      folder="featured"
      maxSizeBytes={5 * 1024 * 1024}
      label="Product Image"
      description="PNG, JPG, WEBP up to 5MB"
      showPreview={true}
      generateThumbnail={true}
    />
  );
}
```

### Server-Side Upload API

```typescript
// Upload endpoint: POST /api/upload
const formData = new FormData();
formData.append('file', file);
formData.append('bucket', 'products');
formData.append('folder', 'featured');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('Uploaded:', result.url);
```

### Direct Upload with Utility

```typescript
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage/upload';

const handleFileChange = async (event) => {
  const file = event.target.files[0];

  const result = await uploadFile(file, {
    bucket: STORAGE_BUCKETS.PRODUCTS,
    folder: 'featured',
    maxSizeBytes: 5 * 1024 * 1024,
    generateThumbnail: true,
    optimize: true,
  });

  if (result.success) {
    console.log('URL:', result.url);
    console.log('Thumbnail:', result.thumbnailUrl);
  } else {
    console.error('Error:', result.error);
  }
};
```

## Features

### Image Optimization

Images are automatically optimized before upload:
- Resized to max 1920x1080 (maintaining aspect ratio)
- Compressed to 85% quality
- Converted to optimal format

Disable optimization:
```typescript
uploadFile(file, { optimize: false });
```

### Thumbnail Generation

Generate thumbnails (300x300) automatically:
```typescript
uploadFile(file, { generateThumbnail: true });
```

Result will include both URLs:
```json
{
  "url": "https://...main_image.jpg",
  "thumbnailUrl": "https://...main_image_thumb.jpg"
}
```

### Multiple File Upload

Upload multiple files at once:
```typescript
import { uploadMultipleFiles } from '@/lib/storage/upload';

const results = await uploadMultipleFiles(files, {
  bucket: STORAGE_BUCKETS.PRODUCTS,
  folder: 'gallery',
});

results.forEach((result, index) => {
  if (result.success) {
    console.log(`File ${index + 1}:`, result.url);
  }
});
```

### File Deletion

Delete uploaded files:
```typescript
import { deleteFile } from '@/lib/storage/upload';

const success = await deleteFile(
  'featured/image_123456.jpg',
  STORAGE_BUCKETS.PRODUCTS
);
```

## Integration Examples

### Product Image Upload

```tsx
'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { STORAGE_BUCKETS } from '@/lib/storage/upload';

export default function AddProduct() {
  const [productData, setProductData] = useState({
    name: '',
    imageUrl: '',
    thumbnailUrl: '',
  });

  return (
    <form>
      <input
        type="text"
        value={productData.name}
        onChange={(e) => setProductData({ ...productData, name: e.target.value })}
        placeholder="Product Name"
      />

      <ImageUpload
        onUploadComplete={(result) => {
          setProductData({
            ...productData,
            imageUrl: result.url!,
            thumbnailUrl: result.thumbnailUrl!,
          });
        }}
        bucket={STORAGE_BUCKETS.PRODUCTS}
        folder="products"
        generateThumbnail={true}
        label="Product Image"
      />

      <button type="submit">Save Product</button>
    </form>
  );
}
```

### Logo Upload for Storefront Settings

```tsx
import ImageUpload from '@/components/ImageUpload';
import { STORAGE_BUCKETS } from '@/lib/storage/upload';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';

export default function StorefrontSettings() {
  const { settings, updateStorefront } = useAdvancedSettings();

  return (
    <ImageUpload
      onUploadComplete={(result) => {
        updateStorefront({ logo_url: result.url });
      }}
      bucket={STORAGE_BUCKETS.LOGOS}
      currentImageUrl={settings.storefront.logo_url}
      maxSizeBytes={2 * 1024 * 1024} // 2MB for logos
      label="Company Logo"
      description="PNG or SVG recommended, max 2MB"
    />
  );
}
```

## Storage Buckets Reference

```typescript
import { STORAGE_BUCKETS } from '@/lib/storage/upload';

// Available buckets:
STORAGE_BUCKETS.PRODUCTS   // Product images
STORAGE_BUCKETS.LOGOS      // Company/brand logos
STORAGE_BUCKETS.BANNERS    // Hero banners, promotions
STORAGE_BUCKETS.DOCUMENTS  // Private documents (invoices, etc.)
STORAGE_BUCKETS.AVATARS    // User profile pictures
```

## File Type Support

### Supported Image Formats

- JPEG/JPG
- PNG
- WEBP
- GIF

### Recommended Formats

- **Photos/Products**: JPEG (smaller file size)
- **Graphics/Logos**: PNG (transparency support)
- **Modern browsers**: WEBP (best compression)
- **Animations**: GIF

## Best Practices

### 1. Image Optimization

- Always enable optimization for web images
- Use appropriate dimensions (don't upload 4K images for thumbnails)
- Consider WEBP format for modern browsers

### 2. Storage Organization

Use folders to organize images:
```typescript
folder: 'products/featured'
folder: 'products/gallery'
folder: 'banners/homepage'
folder: 'banners/seasonal'
```

### 3. Naming Convention

Files are automatically named:
```
{original_name}_{timestamp}_{random}.{ext}
Example: product_123_1234567890_abc123.jpg
```

### 4. Security

- Never expose storage API keys in client code
- Use RLS policies to restrict access
- Validate file types and sizes on both client and server
- Scan uploaded files for malware (advanced)

### 5. Performance

- Generate thumbnails for gallery views
- Use CDN for faster delivery (Supabase provides this)
- Lazy load images on the frontend
- Use appropriate caching headers

## Troubleshooting

### Error: "Upload failed"

**Possible causes:**
1. File too large
2. Wrong file type
3. Missing Supabase bucket
4. RLS policy blocking upload

**Solution:**
1. Check file size and type
2. Verify bucket exists in Supabase
3. Check RLS policies allow authenticated uploads

### Error: "Unauthorized"

**Cause:** User not authenticated

**Solution:** Ensure user is logged in before uploading

### Error: "Bucket not found"

**Cause:** Storage bucket doesn't exist

**Solution:** Create bucket in Supabase Dashboard

### Images not loading

**Possible causes:**
1. Bucket is set to private
2. Wrong URL
3. CORS issues

**Solution:**
1. Make bucket public for public images
2. Verify URL is correct
3. Check Supabase CORS settings

## API Reference

### `uploadFile(file, options)`

Upload a single file to Supabase Storage.

**Parameters:**
- `file` (File): The file to upload
- `options` (UploadOptions): Upload configuration

**Returns:** `Promise<UploadResult>`

### `uploadMultipleFiles(files, options)`

Upload multiple files at once.

**Parameters:**
- `files` (File[]): Array of files to upload
- `options` (UploadOptions): Upload configuration

**Returns:** `Promise<UploadResult[]>`

### `deleteFile(path, bucket)`

Delete a file from storage.

**Parameters:**
- `path` (string): File path in storage
- `bucket` (string): Bucket name

**Returns:** `Promise<boolean>`

### `getFileUrl(path, bucket)`

Get public URL for a file.

**Parameters:**
- `path` (string): File path in storage
- `bucket` (string): Bucket name

**Returns:** `string` (Public URL)

## Support

For technical support:
- Email: support@omnisales.com
- Documentation: [docs.omnisales.com](https://docs.omnisales.com)
- GitHub: [github.com/omnisales/omni-sales](https://github.com/omnisales/omni-sales)
