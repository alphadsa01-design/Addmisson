import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-iti-key-12345-secured';

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

    // Check Cookie Header
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // Check Query Parameter (for PDF / Excel browser downloads)
    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.',
      });
      return;
    }

    let email: string | undefined;

    // Decode user details directly from signed JWT token (No DB query required)
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    if (!decoded || !decoded.email) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    req.user = {
      id: decoded.id || 'admin-001',
      email: decoded.email,
      name: decoded.name || 'System Admin',
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
