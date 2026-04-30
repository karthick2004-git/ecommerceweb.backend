import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalOrders, totalProducts, totalCustomers, orders] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.findMany({
        where: { NOT: { status: 'Cancelled' } },
        select: { total_amount: true }
      })
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

    // Recent orders for the dashboard table
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        order_id: true,
        customer_name: true,
        email: true,
        address: true,
        phone: true,
        total_amount: true,
        status: true,
        created_at: true
      }
    });

    return NextResponse.json({
      stats: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue
      },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
