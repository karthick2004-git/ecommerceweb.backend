import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendOTPEmail } from '@/lib/mail';
import { rateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    const ip = getClientIP(req);
    const { success, resetIn } = rateLimit(`send-otp:${ip}`, 3, 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: `Too many OTP requests. Try again in ${Math.ceil(resetIn / 1000)}s.` },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to DB
    await prisma.oTP.deleteMany({ where: { email } }); // Clear old OTPs
    await prisma.oTP.create({
      data: { email, otp, expires_at }
    });

    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      console.error(`[ERROR] Failed to send OTP email to ${email}`);
      return NextResponse.json({ error: 'Failed to send verification email. Please check server configuration.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
