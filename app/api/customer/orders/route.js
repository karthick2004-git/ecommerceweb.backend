import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateCustomer } from '@/lib/auth';

// List customer orders
export async function GET(req) {
  try {
    const customer = await authenticateCustomer(req);
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { customer_id: customer.id },
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get customer orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Cancel an order
export async function PUT(req) {
  try {
    const customer = await authenticateCustomer(req);
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { order_id },
      include: { items: true }
    });

    if (!order || order.customer_id !== customer.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (['Delivered', 'Cancelled', 'Shipped'].includes(order.status)) {
      return NextResponse.json({ error: `Cannot cancel an order that is already ${order.status}` }, { status: 400 });
    }

    // Cancel order and restore stock in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { order_id },
        data: { status: 'Cancelled' }
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } }
        });
      }

      return o;
    });

    return NextResponse.json({ message: 'Order cancelled successfully', order: updated });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
