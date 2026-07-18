import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import prisma from '../prisma';

// Create Remote JWK Set for Neon Auth JWKS token verification
const JWKS_URL = process.env.JWKS_URL || 'https://ep-lucky-dust-aveiwjlq.neonauth.c-11.us-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json';
const JWKS = jose.createRemoteJWKSet(new URL(JWKS_URL));

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
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

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.',
      });
      return;
    }

    // Verify token using Neon Auth JWKS
    const { payload } = await jose.jwtVerify(token, JWKS);
    
    const email = payload.email as string;
    if (!email) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token payload: missing email.',
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
          name: (payload.name as string) || (payload.preferred_username as string) || email.split('@')[0],
          password: 'NEON_AUTH_MANAGED_PASS', // Dummy password
          role: 'STAFF',
          designation: 'Operator',
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'STAFF' | 'ADMIN' | 'SUPER_ADMIN',
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

export const restrictTo = (...roles: ('STAFF' | 'ADMIN' | 'SUPER_ADMIN')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
};
