import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

// Allow large body for base64 images
export const maxDuration = 30;

export async function PUT(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.text();
    console.log('Update product - raw body size:', Math.round(body.length / 1024) + 'KB');
    
    const data = JSON.parse(body);
    const { id, name, category, description, price, old_price, discount, stock, sizes, image_url, gst_percent, colors, images } = data;

    console.log('Update product:', id, 'images type:', typeof images, 'isArray:', Array.isArray(images), 'length:', Array.isArray(images) ? images.length : 'N/A');

    let normalizedImages = [];
    if (images !== undefined) {
      if (Array.isArray(images)) {
        normalizedImages = images.filter(Boolean);
      } else if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images);
          normalizedImages = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          normalizedImages = [];
        }
      }
      console.log('Normalized images count:', normalizedImages.length);
    }

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        category,
        description,
        price: price ? Number(price) : undefined,
        old_price: old_price !== undefined ? (old_price ? Number(old_price) : null) : undefined,
        discount: discount !== undefined ? Number(discount) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        sizes: sizes || undefined,
        image_url,
        images: normalizedImages,
        colors: colors !== undefined ? colors : undefined,
        gst_percent: gst_percent !== undefined ? Number(gst_percent) : undefined,
      },
    });

    // Verify images were saved
    const verified = await prisma.product.findUnique({ where: { id: Number(id) }, select: { images: true } });
    console.log('Verified saved images count:', Array.isArray(verified?.images) ? verified.images.length : 'NOT_ARRAY', typeof verified?.images);

    return NextResponse.json({ message: 'Product updated successfully', product, savedImagesCount: Array.isArray(verified?.images) ? verified.images.length : 0 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    console.error('Update product error details:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
