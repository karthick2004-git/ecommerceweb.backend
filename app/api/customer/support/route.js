import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req) {
  try {
    const { name, phone, city, pincode, message, type } = await req.json();

    if (!name || !phone || !city || !pincode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supportRequest = await prisma.support.create({
      data: {
        name,
        phone,
        city,
        pincode,
        message: message || '',
        type: type || 'Support',
      }
    });

    return NextResponse.json({ message: 'Support request submitted successfully', supportRequest });
  } catch (error) {
    console.error('Support submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
