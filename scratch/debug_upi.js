const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const upiSetting = await prisma.paymentSetting.findFirst({ where: { method: 'upi' } });
  console.log('type of config:', typeof upiSetting.config);
  console.log('config:', JSON.stringify(upiSetting.config));
  console.log('upiId:', upiSetting.config.upiId);
  console.log('name:', upiSetting.config.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
