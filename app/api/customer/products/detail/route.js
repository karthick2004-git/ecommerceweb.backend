import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

function normalizeImageList(images) {
  if (Array.isArray(images)) return images.filter(Boolean);
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(id) }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const normalizedProduct = {
      ...product,
      images: normalizeImageList(product.images)
    };

    return NextResponse.json({ product: normalizedProduct });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
