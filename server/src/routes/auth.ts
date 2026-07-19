import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { validate } from '../middleware/validate';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { registerSchema, loginSchema } from '../schemas/auth';
import { logAudit } from '../middleware/audit';
import { hashPassword, verifyPassword } from '../utils/password';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-iti-key-12345-secured';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', validate(registerSchema), async (req, res): Promise<void> => {
  try {
    const { email, password, name, designation } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ status: 'error', message: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        designation,
      },
      select: {
        id: true,
        email: true,
        name: true,
        designation: true,
        createdAt: true,
      },
    });

    await logAudit(user.id, 'USER_REGISTER', { email: user.email }, req);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: { user },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
router.post('/login', validate(loginSchema), async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await logAudit(user.id, 'USER_LOGIN', { email: user.email }, req);

    // Set cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          designation: user.designation,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user & clear cookie
router.post('/logout', async (req, res): Promise<void> => {
  try {
    res.clearCookie('token');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
router.get('/me', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        designation: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
