const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.paymentSetting.update({
    where: { method: 'upi' },
    data: { enabled: true }
  });
  console.log('UPI payment method enabled');
}

main().catch(console.error).finally(() => prisma.$disconnect());
