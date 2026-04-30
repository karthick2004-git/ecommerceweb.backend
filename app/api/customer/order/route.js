import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateCustomer } from '@/lib/auth';

export async function POST(req) {
  try {
    const customer = await authenticateCustomer(req);
    const body = await req.json();
    const { items, name, phone, address, city, state, district, pincode, paymentMethod, email: guestEmail } = body;

    if (!items || items.length === 0 || !phone || !address || !name) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const orderEmail = customer ? customer.email : (guestEmail || 'guest@example.com');

    // Calculate total and verify stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItemsData = [];

      for (const item of items) {
        const productId = Number(item.id);
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product) throw new Error(`Product ${productId} not found`);
        if (product.stock < (item.quantity || 1)) throw new Error(`Insufficient stock for ${product.name}`);

        const itemPrice = product.price; // Use DB price for security
        total += itemPrice * (item.quantity || 1);

        orderItemsData.push({
          product_id: product.id,
          product_name: product.name,
          quantity: item.quantity || 1,
          price: itemPrice
        });

        // Decrease stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity || 1 } }
        });
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          customer_id: customer ? customer.id : null,
          customer_name: name,
          email: orderEmail,
          phone,
          address,
          city: city || '',
          state: state || '',
          district: district || '',
          pincode: pincode || '',
          payment_method: paymentMethod,
          total_amount: total,
          status: 'Placed',
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });

      return order;
    });

    return NextResponse.json({ message: 'Order placed successfully', order: result });
  } catch (error) {
    console.error('Order placement error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
