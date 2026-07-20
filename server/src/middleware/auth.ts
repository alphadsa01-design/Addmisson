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

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      email = decoded.email;
    } catch (err) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    if (!email) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    // Lookup user in database
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User account not found. Please register or sign in again.',
      });
      return;
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
