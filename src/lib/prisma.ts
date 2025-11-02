// home/ubuntu/impaktrweb/src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure connection pool for serverless environments (Neon)
// https://neon.tech/docs/serverless/serverless-driver#connection-pooling
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}