import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

export async function POST(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    console.log('Adding product with data:', JSON.stringify(data, (key, value) => key === 'image_url' ? value.substring(0, 50) + '...' : value));
    
    const { name, category, description, price, old_price, discount, stock, sizes, image_url, gst_percent, colors, images } = data;

    if (!name || !category || !price) {
      console.log('Missing fields:', { name, category, price });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
