import { PrismaClient } from '@prisma/client';

declare global {
  var prismaSingleton: PrismaClient | undefined;
}

const prisma =
  globalThis.prismaSingleton ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalThis.prismaSingleton = prisma;

export default prisma;
