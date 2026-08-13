import { PrismaClient } from "@prisma/client";

const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.IS_BUILDING === "true" ||
  Boolean(process.env.NEXT_PHASE && process.env.NEXT_PHASE.includes("build"));

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createBuildMockPrisma(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop: string) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      if (prop.startsWith("$")) {
        return async () => [];
      }
      return new Proxy({}, {
        get(_modelTarget, method: string) {
          return async () => {
            if (method.includes("count")) return 0;
            if (method.includes("findUnique") || method.includes("findFirst")) return null;
            if (method.includes("groupBy") || method.includes("aggregate")) return [];
            return [];
          };
        },
      });
    },
  });
}

const realPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

export const prisma: PrismaClient = isBuildPhase
  ? createBuildMockPrisma()
  : realPrisma;

if (process.env.NODE_ENV !== "production" && !isBuildPhase) {
  globalForPrisma.prisma = prisma;
}
