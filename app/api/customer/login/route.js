import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer || !(await comparePassword(password, customer.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!customer.is_verified) {
      return NextResponse.json({ error: 'Please verify your email first', unverified: true }, { status: 403 });
    }

    const token = signToken({ id: customer.id, email: customer.email, role: 'customer' });

    return NextResponse.json({
      message: 'Login successful',
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
