import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWKS_URL = process.env.JWKS_URL || 'https://ep-lucky-dust-aveiwjlq.neonauth.c-11.us-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-iti-key-12345-secured';

let JWKS: any = null;
const getJWKS = async () => {
  if (!JWKS) {
    try {
      const { createRemoteJWKSet } = await import('jose');
      JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    } catch (e) {
      console.warn('JWKS dynamic import notice:', e);
    }
  }
  return JWKS;
};

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    // Check Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Fallback to cookie
    if (!token && (req as any).cookies?.token) {
      token = (req as any).cookies.token;
    }

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.',
      });
      return;
    }

    let email: string | undefined;
    let name: string | undefined;

    // 1. Try local JWT_SECRET verification first
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      email = decoded.email;
      name = decoded.name;
    } catch (localErr) {
      // Local verification failed
    }

    // 2. Try Neon Auth JWKS verification as fallback via dynamic ESM import
    if (!email) {
      try {
        const jwks = await getJWKS();
        if (jwks) {
          const { jwtVerify } = await import('jose');
          const { payload } = await jwtVerify(token, jwks);
          email = payload.email as string;
          name = (payload.name as string) || (payload.preferred_username as string);
        }
      } catch (jwksErr) {
        // JWKS verification fallback failed
      }
    }

    if (!email) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    // Lookup user in local database by email
    let user = await prisma.user.findUnique({ where: { email } });
    
    // Auto-create user record locally if registered externally via Neon Auth
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: 'NEON_AUTH_MANAGED_PASS', // Dummy password
          designation: 'Operator',
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};
