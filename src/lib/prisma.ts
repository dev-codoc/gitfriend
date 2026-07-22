// A singleton Prisma client. In Next.js dev mode, hot-reloading re-runs
// your modules constantly — without this pattern, you'd open a new DB
// connection on every single file save, and quickly hit connection limits.
// This is the standard, official Prisma+Next.js pattern.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
