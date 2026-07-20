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
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// @route   POST /api/auth/register
// @desc    Register a new user (DISABLED)
router.post('/register', async (req, res): Promise<void> => {
  res.status(403).json({
    status: 'error',
    message: 'User registration is disabled. Only the default administrator account is permitted to log in.'
  });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP (DISABLED)
router.post('/verify-otp', async (req, res): Promise<void> => {
  res.status(403).json({
    status: 'error',
    message: 'User registration is disabled. Only the default administrator account is permitted to log in.'
  });
});

// @route   POST /api/auth/login
// @desc    Login user & get token
router.post('/login', validate(loginSchema), async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const ADMIN_EMAIL = 'admin@iti.gov.in';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

    // Admin account fast-path: zero database dependency for instant login
    if (cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Sync admin record in background if database is available (non-blocking)
      prisma.user
        .upsert({
          where: { email: ADMIN_EMAIL },
          update: { lastLogin: new Date() },
          create: {
            email: ADMIN_EMAIL,
            name: 'System Admin',
            password: 'admin',
            designation: 'Principal / ITI Administrator',
            isVerified: true,
          },
        })
        .catch((err) => console.warn('Background admin DB sync notice:', err?.message));

      const adminUser = {
        id: 'admin-001',
        email: ADMIN_EMAIL,
        name: 'System Admin',
        designation: 'Principal / ITI Administrator',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, name: adminUser.name },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.cookie('token', token, COOKIE_OPTIONS);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          token,
          user: adminUser,
        },
      });
      return;
    }

    // Database fallback for standard users
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    } catch (dbErr) {
      console.warn('DB lookup failed during login:', dbErr);
    }

    if (!user) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
      return;
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        status: 'error',
        message: 'Account email is not verified yet. Please enter the OTP code sent during registration.',
        unverified: true,
        otpCode: user.otpCode,
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

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
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: error?.message || 'Login processing error',
    });
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

    // Instant response from verified JWT payload (Zero DB dependency)
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          designation: 'Principal / ITI Administrator',
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
