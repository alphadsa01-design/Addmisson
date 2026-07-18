import { createAuthClient } from '@neondatabase/auth';

export const authClient = createAuthClient(
  (import.meta as any).env?.VITE_NEON_AUTH_URL || 'https://ep-lucky-dust-aveiwjlq.neonauth.c-11.us-east-1.aws.neon.tech/neondb/auth'
);
