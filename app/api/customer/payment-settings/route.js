import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.paymentSetting.findMany();
    
    const publicSettings = {};
    const upiSetting = settings.find(s => s.method === 'upi');
    const qrSetting = settings.find(s => s.method === 'qr');
    const codSetting = settings.find(s => s.method === 'cod');

    if (upiSetting?.enabled) {
      const resolvedUpiId = upiSetting.config.upiId || upiSetting.config.id || '';
      publicSettings.upi = {
        upiId: resolvedUpiId,
        id: resolvedUpiId,
        name: upiSetting.config.name || ''
      };
    }

    if (qrSetting?.enabled) {
      const resolvedUpiId = upiSetting?.config?.upiId || upiSetting?.config?.id || '';
      publicSettings.qr = {
        image: qrSetting.config.image || '',
        upiId: resolvedUpiId,
        id: resolvedUpiId,
        name: upiSetting?.config?.name || ''
      };
      
      if (!publicSettings.upi && resolvedUpiId) {
        publicSettings.upi = {
          upiId: resolvedUpiId,
          id: resolvedUpiId,
          name: upiSetting.config.name || ''
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
