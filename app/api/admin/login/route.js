import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !(await comparePassword(password, admin.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ id: admin.id, email: admin.email, role: 'admin' });

    return NextResponse.json({
      message: 'Login successful',
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
