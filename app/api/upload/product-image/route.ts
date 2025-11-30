import { NextRequest, NextResponse } from 'next/server';
import { uploadProductImage, deleteProductImage } from '@/lib/storage/supabase-storage';

/**
 * POST /api/upload/product-image
 * Upload product image to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const result = await uploadProductImage(file, productId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/product-image
 * Delete product image from Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    const success = await deleteProductImage(filePath);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
