import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort'); // 0: popularity (default), 1: price asc, 2: price desc

    const where = {
      stock: { gt: 0 } // Only show in-stock products to customers
    };
    
    if (category && category !== 'collection' && category !== 'new-arrivals') {
      where.category = category;
    }

    let orderBy = { created_at: 'desc' };
    if (sort === '1') orderBy = { price: 'asc' };
    if (sort === '2') orderBy = { price: 'desc' };

    const products = await prisma.product.findMany({
      where,
      orderBy
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Customer products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
