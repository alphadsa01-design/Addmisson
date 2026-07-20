import { PrismaClient } from '@prisma/client';

declare global {
  var prismaSingleton: PrismaClient | undefined;
}

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_jMrfkQK2cV1o@ep-lucky-dust-aveiwjlq.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30";

const dbUrl =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'))
    ? process.env.DATABASE_URL
    : DEFAULT_DATABASE_URL;

const prisma =
  globalThis.prismaSingleton ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalThis.prismaSingleton = prisma;

export default prisma;
