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
    const { name, category, description, price, old_price, discount, stock, sizes, image_url } = data;

    if (!name || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      },
    });

    return NextResponse.json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Add product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
