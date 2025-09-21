import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user with plaintext password per requirement
  await prisma.user.upsert({
    where: { email: "admin@civicconnect.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@civicconnect.local",
      passwordHash: "admin123",
      role: UserRole.ADMIN,
    },
  });

  // Create sample NGO user with hashed password
  const ngoPasswordHash = await bcrypt.hash("ngo12345", 10);
  await prisma.user.upsert({
    where: { email: "help@ngoaid.local" },
    update: {},
    create: {
      name: "Helping Hands",
      email: "help@ngoaid.local",
      passwordHash: ngoPasswordHash,
      role: UserRole.NGO,
    },
  });

  console.log("Seed completed:", {
    accounts: {
      admin: "admin@civicconnect.local / admin123",
      ngo: "help@ngoaid.local / ngo12345",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
