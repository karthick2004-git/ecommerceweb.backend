import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateCustomer } from '@/lib/auth';

export async function POST(req) {
  try {
    const customer = await authenticateCustomer(req);
    const contentType = req.headers.get('content-type') || '';
    
    let body;
    let paymentProofBase64 = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {
        items: JSON.parse(formData.get('items')),
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        district: formData.get('district'),
        pincode: formData.get('pincode'),
        paymentMethod: formData.get('paymentMethod'),
        transactionId: formData.get('transactionId'),
        email: formData.get('email'),
      };
      
      const file = formData.get('paymentProof');
      if (file) {
        if (typeof file === 'string') {
          paymentProofBase64 = file; // It's already a base64 string from frontend
        } else {
          // If it's a file, we can't easily save it here without a bucket, 
          // but the frontend now sends it as base64. 
          // We'll keep this as a fallback just in case.
          paymentProofBase64 = `Uploaded: ${file.name}`;
        }
      }
    } else {
      body = await req.json();
    }

    const { items, name, phone, address, city, state, district, pincode, paymentMethod, transactionId, email: guestEmail } = body;

    if (!items || items.length === 0 || !phone || !address || !name) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const orderEmail = customer ? customer.email : (guestEmail || 'guest@example.com');

    // Step 1: Verify all products and calculate total OUTSIDE the transaction
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const productId = Number(item.id);
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found (ID: ${productId})` }, { status: 400 });
      }
      if (product.stock < (item.quantity || 1)) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }

      const itemPrice = product.price;
      total += itemPrice * (item.quantity || 1);

      orderItemsData.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity || 1,
        price: itemPrice
      });
    }

    // Step 2: Create order and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Decrease stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: Number(item.id) },
          data: { stock: { decrement: item.quantity || 1 } }
        });
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          customer: customer ? { connect: { id: customer.id } } : undefined,
          customer_name: name,
          email: orderEmail,
          phone,
          address,
          city: city || '',
          state: state || '',
          district: district || '',
          pincode: pincode || '',
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          payment_proof: paymentProofBase64,
          total_amount: total,
          status: 'Placed',
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });

      return order;
    }, {
      timeout: 30000
    });

    return NextResponse.json({ message: 'Order placed successfully', order: result });
  } catch (error) {
    console.error('Order placement error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
