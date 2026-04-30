const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to connect to database...");
    await prisma.$connect();
    console.log("Successfully connected to the database!");
    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed to connect to the database:");
    console.error(error);
    process.exit(1);
  }
}

main();
