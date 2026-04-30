import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          orderBy: { created_at: 'desc' },
          take: 5
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
