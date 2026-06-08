const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("Connected!");

    // Get first product
    const product = await prisma.product.findFirst();
    if (!product) {
      console.log("No products found!");
      return;
    }

    console.log("\n--- Product:", product.id, product.name);
    console.log("Current images type:", typeof product.images);
    console.log("Current images value:", JSON.stringify(product.images)?.substring(0, 200));
    console.log("Is array:", Array.isArray(product.images));
    console.log("Length:", Array.isArray(product.images) ? product.images.length : 'N/A');

    // Try to write a test image array
    const testImages = ["data:image/jpeg;base64,/9j/TEST1", "data:image/jpeg;base64,/9j/TEST2"];
    
    console.log("\n--- Writing test images to product", product.id);
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { images: testImages }
    });
    
    console.log("Write successful!");
    console.log("Updated images type:", typeof updated.images);
    console.log("Updated images length:", Array.isArray(updated.images) ? updated.images.length : 'N/A');

    // Re-read to verify
    const verify = await prisma.product.findUnique({ where: { id: product.id } });
    console.log("\n--- Re-read verification:");
    console.log("Images type:", typeof verify.images);
    console.log("Is array:", Array.isArray(verify.images));
    console.log("Length:", Array.isArray(verify.images) ? verify.images.length : 'N/A');
    console.log("First item starts with:", verify.images?.[0]?.substring(0, 30));

    // Restore original
    await prisma.product.update({
      where: { id: product.id },
      data: { images: product.images }
    });
    console.log("\n--- Restored original images");

  } catch (error) {
    console.error("ERROR:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
