# Cloud File Management System

A comprehensive cloud file management system with support for AWS S3 and Supabase Storage, featuring secure uploads, file sharing, version control, and quota management.

## Features

### Core Functionality
- **Multi-File Upload**: Drag-and-drop or browse to upload multiple files simultaneously
- **File Browser**: Grid and list view for browsing files with search and filtering
- **File Preview**: Built-in preview for images, videos, PDFs, and text files
- **File Sharing**: Create secure, time-limited share links with password protection
- **Version History**: Track file versions and restore previous versions
- **Storage Quota**: Per-user storage quotas with usage tracking
- **Download Tracking**: Monitor file downloads and access patterns

### File Types Support
- **Documents**: PDF, Word, Excel, PowerPoint, TXT, CSV
- **Images**: JPG, PNG, GIF, WebP, SVG, BMP
- **Videos**: MP4, WebM, OGG, MOV
- **Archives**: ZIP, RAR, 7Z, TAR, GZ
- **Data**: JSON, CSV, XML

### Security Features
- **File Validation**: Type and size validation before upload
- **Access Control**: Row-level security with tenant isolation
- **Share Link Security**: Password protection, expiry dates, download limits
- **File Integrity**: MD5 and SHA256 checksums for verification
- **Dangerous File Blocking**: Automatically blocks executable and script files

### Storage Providers
- **Supabase Storage**: Integrated storage with the Supabase ecosystem
- **AWS S3**: Enterprise-scale object storage with multi-region support
- **Configurable Backend**: Easy switching between storage providers

## Architecture

### Database Schema

#### Files Table
Stores metadata for all uploaded files:
- File information (name, size, MIME type, path)
- Organization (folders, tags, labels)
- Access control (public/private, deleted status)
- Version control (version number, previous version reference)
- Integrity checksums (MD5, SHA256)

#### File Shares Table
Manages file sharing links:
- Share tokens and URLs
- Access control (password, email whitelist)
- Download limits and expiry dates
- Usage tracking (download count, last accessed)

#### File Versions Table
Maintains version history:
- Version snapshots with metadata
- Change descriptions
- Storage paths for each version

#### File Downloads Table
Tracks download activity:
- User identification (authenticated or anonymous)
- Location data (IP, country, city)
- Download method (direct, share link, API)

#### File Storage Usage Table
Monitors quota usage:
- Total files and storage size
- Breakdown by file type (documents, images, videos, etc.)
- Quota limits and calculations

## API Routes

### Upload Files
```
POST /api/files/upload
```
Upload single or multiple files with metadata.

**Request Body** (multipart/form-data):
- `files`: File(s) to upload
- `path`: Directory path (default: "/")
- `userId`: User ID
- `tenantId`: Tenant ID (optional)
- `tags`: JSON array of tags
- `metadata`: JSON object with additional metadata
- `isPublic`: Boolean for public access

**Response**:
```json
{
  "success": true,
  "uploaded": [
    {
      "id": "uuid",
      "name": "file.pdf",
      "size": 1024,
      "mimeType": "application/pdf",
      "path": "/path/to/file",
      "publicUrl": "https://..."
    }
  ],
  "errors": [],
  "totalUploaded": 1,
  "totalErrors": 0
}
```

### List Files
```
GET /api/files
```
List files with filtering and pagination.

**Query Parameters**:
- `userId`: User ID (required)
- `tenantId`: Tenant ID
- `path`: Directory path
- `search`: Search query
- `mimeType`: Filter by MIME type
- `tags`: Comma-separated tags
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset
- `sortBy`: Sort field (default: "created_at")
- `sortOrder`: "asc" or "desc" (default: "desc")

### Get File
```
GET /api/files/:id
```
Get file metadata.

### Delete File
```
DELETE /api/files/:id?permanent=false
```
Delete file (soft delete by default, permanent with `permanent=true`).

### Update File
```
PATCH /api/files/:id
```
Update file metadata (name, description, tags, labels, isPublic).

### Download File
```
GET /api/files/:id/download?token=<share-token>
```
Download file (requires share token for shared files).

### Create Share Link
```
POST /api/files/:id/share
```
Create a secure share link.

**Request Body**:
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "expiresIn": 3600,
  "maxDownloads": 10,
  "password": "optional-password",
  "canDownload": true,
  "canPreview": true
}
```

### Get File Versions
```
GET /api/files/:id/versions
```
Get version history for a file.

### Restore Version
```
POST /api/files/:id/restore
```
Restore a previous version.

**Request Body**:
```json
{
  "versionNumber": 2,
  "userId": "uuid"
}
```

### Get Storage Usage
```
GET /api/files/usage?userId=<id>&tenantId=<id>
```
Get storage usage and quota information.

## Components

### FileUploader
Drag-and-drop file upload component with progress tracking.

**Props**:
```typescript
{
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  path?: string;
  userId: string;
  tenantId?: string;
}
```

### FileBrowser
File browsing component with grid/list view, search, and filtering.

**Props**:
```typescript
{
  userId: string;
  tenantId?: string;
  currentPath?: string;
  onFileSelect?: (file: FileItem) => void;
  onFileDelete?: (fileId: string) => void;
  onFileShare?: (fileId: string) => void;
  onPathChange?: (path: string) => void;
}
```

### FilePreview
File preview modal for images, videos, PDFs, and more.

**Props**:
```typescript
{
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}
```

### ShareDialog
Create and manage file share links.

**Props**:
```typescript
{
  fileId: string;
  fileName: string;
  userId: string;
  tenantId?: string;
  isOpen: boolean;
  onClose: () => void;
}
```

## Setup Instructions

### 1. Database Migration

Run the database migration to create the necessary tables:

```bash
# Using Supabase CLI
supabase migration up

# Or run the SQL file directly
psql -d your_database -f supabase/migrations/20250116_file_management.sql
```

### 2. Storage Bucket Setup

#### For Supabase Storage:
1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `files`
4. Configure bucket policies:
   - Public access: Disabled (for private files)
   - File size limit: 100MB (or your preferred limit)

#### For AWS S3:
1. Create an S3 bucket in your AWS account
2. Configure CORS policy:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```
3. Set up IAM user with S3 access permissions
4. Get Access Key ID and Secret Access Key

### 3. Environment Variables

Add the following to your `.env` file:

```bash
# Storage Provider
STORAGE_PROVIDER=supabase  # or 's3'
STORAGE_BUCKET=files

# For Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For AWS S3 (if using S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# File Upload Limits
MAX_FILE_SIZE=104857600  # 100MB
STORAGE_QUOTA_PER_USER=10737418240  # 10GB

# Security
ENABLE_VIRUS_SCANNING=false
ENABLE_FILE_ENCRYPTION=false
```

### 4. Install Dependencies (if using AWS S3)

If you plan to use AWS S3, install the AWS SDK:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Then uncomment the S3-related code in `/lib/storage/storage-manager.ts`.

## Usage Examples

### Upload Files
```typescript
import FileUploader from '@/components/files/FileUploader';

<FileUploader
  userId={currentUser.id}
  tenantId={currentTenant.id}
  path="/documents"
  onUploadComplete={(files) => {
    console.log('Uploaded:', files);
  }}
  onUploadError={(error) => {
    console.error('Error:', error);
  }}
/>
```

### Browse Files
```typescript
import FileBrowser from '@/components/files/FileBrowser';

<FileBrowser
  userId={currentUser.id}
  tenantId={currentTenant.id}
  currentPath="/documents"
  onFileSelect={(file) => {
    console.log('Selected:', file);
  }}
  onFileDelete={(fileId) => {
    // Handle deletion
  }}
  onFileShare={(fileId) => {
    // Handle sharing
  }}
/>
```

### Create Share Link
```typescript
const response = await fetch(`/api/files/${fileId}/share`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    expiresIn: 86400, // 24 hours
    maxDownloads: 10,
    password: 'secret',
    canDownload: true,
  }),
});

const { share } = await response.json();
console.log('Share URL:', share.shareUrl);
```

## Performance Optimizations

- **Lazy Loading**: Files are loaded on-demand with pagination
- **Caching**: File metadata is cached for faster retrieval
- **CDN Integration**: Public files can be served via CloudFront or similar CDN
- **Thumbnail Generation**: Automatic thumbnail generation for images
- **Database Indexing**: Optimized indexes for fast queries
- **Row-Level Security**: PostgreSQL RLS for efficient access control

## Security Considerations

1. **File Validation**: All files are validated before upload
2. **Dangerous Files**: Executables and scripts are automatically blocked
3. **Access Control**: Row-level security ensures tenant isolation
4. **Share Links**: Time-limited with optional password protection
5. **File Integrity**: Checksums verify file integrity
6. **Rate Limiting**: Prevent abuse with download rate limiting
7. **Encryption**: Optional encryption at rest (configurable)

## Monitoring and Analytics

The system tracks:
- Upload/download activity
- Storage usage by user and tenant
- Popular files (most downloaded)
- File statistics by type
- Share link usage

Query these views for analytics:
```sql
SELECT * FROM file_statistics_by_tenant;
SELECT * FROM popular_files;
```

## Troubleshooting

### Upload Fails
- Check storage quota: `GET /api/files/usage`
- Verify file size is under MAX_FILE_SIZE
- Ensure file type is allowed
- Check network connection

### Download Fails
- Verify file exists and is not deleted
- Check share link expiry and download limits
- Ensure proper authentication

### Storage Provider Issues
- **Supabase**: Verify bucket exists and credentials are correct
- **S3**: Check IAM permissions and bucket policy
- **Both**: Ensure CORS is configured correctly

## Future Enhancements

- [ ] Virus scanning integration (ClamAV)
- [ ] Automatic thumbnail generation
- [ ] File compression/optimization
- [ ] Collaborative editing
- [ ] File comments and annotations
- [ ] Advanced search with full-text indexing
- [ ] File templates
- [ ] Bulk operations
- [ ] Integration with third-party services (Dropbox, Google Drive)
- [ ] Mobile app support

## License

This file management system is part of the Omni-Sales platform.
