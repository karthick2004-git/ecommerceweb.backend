import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

export async function DELETE(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Note: We might want to handle cascading or restrictions if they have orders
    // For now, following requested delete functionality
    await prisma.customer.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
