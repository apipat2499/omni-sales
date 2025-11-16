/**
 * File Upload API Route
 * POST /api/files/upload
 * Handles single and multi-file uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStorageManager } from '@/lib/storage/storage-manager';
import { FileValidator } from '@/lib/storage/file-validator';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get user from session (you may need to adjust this based on your auth setup)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const path = formData.get('path') as string || '/';
    const isPublic = formData.get('isPublic') === 'true';
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {};
    const tenantId = formData.get('tenantId') as string;
    const userId = formData.get('userId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check storage quota
    const { data: usageData } = await supabase
      .from('file_storage_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    const currentUsage = usageData?.total_size_bytes || 0;
    const quota = usageData?.quota_bytes || 10 * 1024 * 1024 * 1024; // 10GB default

    // Calculate total size of files to upload
    const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);

    if (currentUsage + totalUploadSize > quota) {
      return NextResponse.json(
        { error: 'Storage quota exceeded', currentUsage, quota, requiredSpace: totalUploadSize },
        { status: 413 }
      );
    }

    // Validate files
    const validator = new FileValidator({
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB default
    });

    const uploadResults = [];
    const errors = [];

    // Initialize storage manager
    const storageManager = getStorageManager();

    for (const file of files) {
      try {
        // Validate file
        const validation = await validator.validate(file);
        if (!validation.valid) {
          errors.push({
            fileName: file.name,
            error: validation.error,
          });
          continue;
        }

        // Generate unique filename to prevent collisions
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${timestamp}_${randomString}_${sanitizedName}`;

        // Upload to storage
        const uploadResult = await storageManager.upload(file, uniqueFileName, {
          path: path.replace(/^\//, ''), // Remove leading slash
          isPublic,
          contentType: file.type,
          metadata: {
            ...metadata,
            originalName: file.name,
            uploadedBy: userId,
          },
        });

        if (!uploadResult.success || !uploadResult.file) {
          errors.push({
            fileName: file.name,
            error: uploadResult.error || 'Upload failed',
          });
          continue;
        }

        // Calculate file hash for integrity
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Get public URL if public
        let publicUrl: string | undefined;
        if (isPublic) {
          publicUrl = storageManager.getPublicUrl(uploadResult.file.path) || undefined;
        }

        // Store file metadata in database
        const { data: fileRecord, error: dbError } = await supabase
          .from('files')
          .insert({
            tenant_id: tenantId || null,
            user_id: userId,
            name: file.name,
            original_name: file.name,
            storage_path: uploadResult.file.path,
            storage_provider: process.env.STORAGE_PROVIDER || 'supabase',
            size_bytes: file.size,
            mime_type: file.type,
            file_extension: extension,
            folder_path: path,
            is_public: isPublic,
            tags,
            metadata: {
              ...metadata,
              uploadedBy: userId,
              originalName: file.name,
            },
            public_url: publicUrl,
            md5_hash: md5Hash,
            sha256_hash: sha256Hash,
            version_number: 1,
            is_latest_version: true,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Try to delete the uploaded file
          await storageManager.delete(uploadResult.file.path);
          errors.push({
            fileName: file.name,
            error: 'Failed to save file metadata',
          });
          continue;
        }

        // Create initial version record
        await supabase.from('file_versions').insert({
          file_id: fileRecord.id,
          tenant_id: tenantId || null,
          version_number: 1,
          storage_path: uploadResult.file.path,
          name: file.name,
          size_bytes: file.size,
          mime_type: file.type,
          md5_hash: md5Hash,
          sha256_hash: sha256Hash,
          change_description: 'Initial upload',
          created_by: userId,
        });

        uploadResults.push({
          id: fileRecord.id,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          path: uploadResult.file.path,
          publicUrl,
          success: true,
        });
      } catch (error: any) {
        console.error('Upload error:', error);
        errors.push({
          fileName: file.name,
          error: error.message || 'Upload failed',
        });
      }
    }

    return NextResponse.json({
      success: uploadResults.length > 0,
      uploaded: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadResults.length,
      totalErrors: errors.length,
    });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
