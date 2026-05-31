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
    let totalGst = 0;
    const orderItemsData = [];
    const stockUpdates = [];

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
      const itemGstPercent = product.gst_percent || 0;
      const itemQuantity = item.quantity || 1;
      
      const itemGstAmount = Math.round(itemPrice * (itemGstPercent / 100));
      const itemTotalWithGst = (itemPrice + itemGstAmount) * itemQuantity;
      
      total += itemTotalWithGst;
      totalGst += (itemGstAmount * itemQuantity);

      // Handle size-specific stock
      let updatedSizes = product.sizes;
      if (item.size && Array.isArray(product.sizes)) {
        updatedSizes = product.sizes.map(s => {
          if (typeof s === 'object' && s.size === item.size) {
            if (s.stock < itemQuantity) {
              throw new Error(`Insufficient stock for size ${item.size} of ${product.name}`);
            }
            return { ...s, stock: s.stock - itemQuantity };
          }
          return s;
        });
      }

      stockUpdates.push({
        id: product.id,
        decrement: itemQuantity,
        sizes: updatedSizes
      });

      orderItemsData.push({
        product_id: product.id,
        product_name: product.name,
        quantity: itemQuantity,
        price: itemPrice,
        size: item.size || null,
        color: item.color || null,
        gst_amount: itemGstAmount
      });
    }

    // Step 2: Create order and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Decrease stock for each item
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.id },
          data: { 
            stock: { decrement: update.decrement },
            sizes: update.sizes
          }
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
          total_gst: totalGst,
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
