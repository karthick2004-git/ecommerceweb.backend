import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supportRequests = await prisma.support.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ supportRequests });
  } catch (error) {
    console.error('Fetch support requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await req.json();

    const updated = await prisma.support.update({
      where: { id: Number(id) },
      data: { status }
    });

    return NextResponse.json({ message: 'Status updated', supportRequest: updated });
  } catch (error) {
    console.error('Update support status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
