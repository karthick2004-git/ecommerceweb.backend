import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

export async function PUT(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { id, name, category, description, price, old_price, discount, stock, sizes, image_url } = data;

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
      },
    });

    return NextResponse.json({ message: 'Product updated successfully', product });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
