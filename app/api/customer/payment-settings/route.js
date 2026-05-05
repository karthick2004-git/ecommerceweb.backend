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
      let config = upiSetting.config || {};
      // Handle case where config might be a string (JSON not auto-parsed)
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch(e) { config = {}; }
      }
      const resolvedUpiId = config.upiId || config.id || config.vpaId || config.upi_id || '';
      const resolvedName = config.name || config.displayName || '';
      publicSettings.upi = {
        upiId: resolvedUpiId,
        id: resolvedUpiId,
        name: resolvedName
      };
    }

    if (qrSetting?.enabled) {
      let upiConfig = upiSetting?.config || {};
      if (typeof upiConfig === 'string') {
        try { upiConfig = JSON.parse(upiConfig); } catch(e) { upiConfig = {}; }
      }
      const resolvedUpiId = upiConfig.upiId || upiConfig.id || upiConfig.vpaId || upiConfig.upi_id || '';
      let qrConfig = qrSetting.config || {};
      if (typeof qrConfig === 'string') {
        try { qrConfig = JSON.parse(qrConfig); } catch(e) { qrConfig = {}; }
      }
      publicSettings.qr = {
        image: qrConfig.image || '',
        upiId: resolvedUpiId,
        id: resolvedUpiId,
        name: upiConfig.name || upiConfig.displayName || ''
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
