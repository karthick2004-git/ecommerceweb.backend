import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';

// Get all payment settings
export async function GET(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.paymentSetting.findMany();
    
    // Format to match the admin frontend expectation
    const formattedSettings = {};
    settings.forEach(s => {
      formattedSettings[s.method] = {
        enabled: s.enabled,
        ...s.config
      };
    });

    return NextResponse.json({ paymentSettings: formattedSettings });
  } catch (error) {
    console.error('Get payment settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update payment settings
export async function PUT(req) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { method, enabled, config } = await req.json();

    if (!method) {
      return NextResponse.json({ error: 'Method is required' }, { status: 400 });
    }

    // Build update data - only include fields that were actually sent
    const updateData = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (config !== undefined && config !== null) updateData.config = config;

    const updated = await prisma.paymentSetting.upsert({
      where: { method },
      update: updateData,
      create: {
        method,
        enabled: enabled !== undefined ? enabled : true,
        config: config || {}
      }
    });

    return NextResponse.json({ message: 'Payment settings updated successfully', settings: updated });
  } catch (error) {
    console.error('Update payment settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
