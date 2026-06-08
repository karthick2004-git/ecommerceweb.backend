import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.text();
    console.log('Add product - raw body size:', Math.round(body.length / 1024) + 'KB');
    
    const data = JSON.parse(body);
    const { name, category, description, price, old_price, discount, stock, sizes, image_url, gst_percent, colors, images } = data;

    if (!name || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Add product images type:', typeof images, 'isArray:', Array.isArray(images), 'length:', Array.isArray(images) ? images.length : 'N/A');

    let normalizedImages = [];
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

    const final_image_url = image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a4bc4?q=80&w=2070&auto=format&fit=crop';

    const product = await prisma.product.create({
      data: {
        name,
        category,
        description: description || '',
        price: Number(price),
        old_price: old_price ? Number(old_price) : null,
        discount: Number(discount) || 0,
        stock: Number(stock) || 0,
        sizes: sizes || [],
        image_url: final_image_url,
        images: normalizedImages,
        colors: colors || [],
        gst_percent: Number(gst_percent) || 0,
      },
    });

    return NextResponse.json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Add product error details:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
