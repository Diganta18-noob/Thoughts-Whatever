import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const realPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = realPrisma;
}

function createDynamicPrisma(): PrismaClient {
  return new Proxy(realPrisma, {
    get(target, prop: string) {
      // If DATABASE_URL is present, always use real Prisma client
      if (process.env.DATABASE_URL) {
        const val = (target as any)[prop];
        if (typeof val === "function") {
          return val.bind(target);
        }
        return val;
      }

      // Mock Prisma only if DATABASE_URL is completely missing
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      if (prop.startsWith("$")) {
        return async () => [];
      }
      return new Proxy(
        {},
        {
          get(_modelTarget, method: string) {
            return async () => {
              if (method.includes("count")) return 0;
              if (method.includes("findUnique") || method.includes("findFirst")) return null;
              if (method.includes("groupBy") || method.includes("aggregate")) return [];
              return [];
            };
          },
        },
      );
    },
  });
}

export const prisma: PrismaClient = createDynamicPrisma();
