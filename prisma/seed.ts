import "dotenv/config";                                                                                                      
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dtfbaskicim.com" },
    update: {},
    create: {
      email: "admin@dtfbaskicim.com",
      name: "Admin",
      surname: "User",
      passwordHash: adminPassword,
      authProvider: "EMAIL",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log("Admin user created:", admin.email);

  // Create pricing tiers
  const tiers = [
    { minMeters: 0, maxMeters: 1, pricePerMeter: 500 },
    { minMeters: 1, maxMeters: 3, pricePerMeter: 450 },
    { minMeters: 3, maxMeters: 5, pricePerMeter: 400 },
    { minMeters: 5, maxMeters: 10, pricePerMeter: 350 },
    { minMeters: 10, maxMeters: null, pricePerMeter: 300 },
  ];

  for (const tier of tiers) {
    await prisma.pricingTier.create({
      data: {
        minMeters: tier.minMeters,
        maxMeters: tier.maxMeters,
        pricePerMeter: tier.pricePerMeter,
        isActive: true,
      },
    });
  }
  console.log("Pricing tiers created:", tiers.length);

  // Create a sample discount code
  await prisma.discountCode.create({
    data: {
      code: "HOSGELDIN10",
      discountPercent: 10,
      minOrderMeters: 1,
      maxUses: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });
  console.log("Sample discount code created: HOSGELDIN10");

  // Create default shipping config
  await prisma.shippingConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shippingCost: 49.90,
      freeShippingMin: 500,
      isActive: true,
    },
  });
  console.log("Default shipping config created");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
