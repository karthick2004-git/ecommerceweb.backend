const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Create Admins
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.admin.upsert({
    where: { email: 'admin@cozyhood.com' },
    update: {},
    create: {
      email: 'admin@cozyhood.com',
      password: adminPassword,
      name: 'Primary Admin',
    },
  });

  await prisma.admin.upsert({
    where: { email: 'staff@cozyhood.com' },
    update: {},
    create: {
      email: 'staff@cozyhood.com',
      password: adminPassword,
      name: 'Staff Admin',
    },
  });

  // 2. Create Initial Payment Settings
  await prisma.paymentSetting.upsert({
    where: { method: 'upi' },
    update: {},
    create: {
      method: 'upi',
      enabled: true,
      config: { id: 'shop@ybl', name: 'Cozy Hood Store' },
    },
  });

  await prisma.paymentSetting.upsert({
    where: { method: 'qr' },
    update: {},
    create: {
      method: 'qr',
      enabled: false,
      config: { image: '' },
    },
  });

  await prisma.paymentSetting.upsert({
    where: { method: 'cod' },
    update: {},
    create: {
      method: 'cod',
      enabled: true,
      config: { charges: 50, maxOrder: 5000 },
    },
  });

  // 3. Create Sample Products
  const sampleProducts = [
    {
      name: 'Premium Cotton T-Shirt',
      category: 't-shirts',
      price: 799,
      old_price: 999,
      discount: 20,
      stock: 150,
      sizes: ['S', 'M', 'L', 'XL'],
      description: 'High-quality premium cotton t-shirt with modern fit.',
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    },
    {
      name: 'Classic Denim Jacket',
      category: 'new-arrivals',
      price: 2299,
      old_price: 2499,
      discount: 8,
      stock: 75,
      sizes: ['M', 'L', 'XL'],
      description: 'Classic denim jacket with modern styling.',
      image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    },
  ];

  for (const p of sampleProducts) {
    await prisma.product.create({ data: p });
  }

  console.log('Seeding complete! Admin: admin@cozyhood.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
