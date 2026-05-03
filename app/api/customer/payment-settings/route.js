import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.paymentSetting.findMany();
    
    const publicSettings = {};
    const upiSetting = settings.find(s => s.method === 'upi');
    const qrSetting = settings.find(s => s.method === 'qr');
    const codSetting = settings.find(s => s.method === 'cod');

    if (upiSetting?.enabled) {
      publicSettings.upi = {
        upiId: upiSetting.config.id,
        name: upiSetting.config.name
      };
    }

    if (qrSetting?.enabled) {
      // If QR is enabled, we can use its image or fallback to dynamic UPI if available
      publicSettings.qr = {
        image: qrSetting.config.image,
        // Also provide dynamic details if UPI setting has them
        upiId: upiSetting?.config?.id,
        name: upiSetting?.config?.name
      };
      
      // If publicSettings.upi is missing, populate it from qr for the frontend
      if (!publicSettings.upi && upiSetting?.config?.id) {
        publicSettings.upi = {
          upiId: upiSetting.config.id,
          name: upiSetting.config.name
        };
      }
    }

    if (codSetting?.enabled) {
      publicSettings.cod = { enabled: true };
    }

    return NextResponse.json({ paymentSettings: publicSettings });
  } catch (error) {
    console.error('Get public payment settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
