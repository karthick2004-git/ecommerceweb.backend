import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: { email, otp }
    });

    // Master OTP for testing
    const isMasterOtp = otp === '111111';

    if (!otpRecord && !isMasterOtp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (otpRecord && !isMasterOtp && new Date() > otpRecord.expires_at) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    // Success: verify customer
    await prisma.customer.updateMany({
      where: { email },
      data: { is_verified: true }
    });

    // Cleanup
    await prisma.oTP.delete({ where: { id: otpRecord.id } });

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
