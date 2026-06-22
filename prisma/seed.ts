import { AuthProvider, PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const email = process.env.SEED_EMAIL?.toLowerCase();
const password = process.env.SEED_PASSWORD;
if (email && password) {
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: process.env.SEED_NAME ?? "Demo User",
      emailVerifiedAt: new Date(),
    },
    update: {},
  });
  await prisma.authAccount.upsert({
    where: {
      userId_provider: { userId: user.id, provider: AuthProvider.EMAIL },
    },
    create: {
      userId: user.id,
      provider: AuthProvider.EMAIL,
      providerAccountId: email,
      passwordHash: await argon2.hash(password),
    },
    update: {},
  });
}
await prisma.$disconnect();
