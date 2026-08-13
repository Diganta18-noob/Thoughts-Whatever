import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const realPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Always reuse the same PrismaClient instance across warm serverless/build workers
globalForPrisma.prisma = realPrisma;

export const prisma = realPrisma;
