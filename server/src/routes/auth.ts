import { Router, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { validate } from '../middleware/validate';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { registerSchema, loginSchema, adminRequestSchema } from '../schemas/auth';
import { logAudit } from '../middleware/audit';

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
    const hashedPassword = await argon2.hash(password);

    // Every user is registered with STAFF role (normal operator)
    const role = 'STAFF';

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        designation,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        createdAt: true,
      },
    });

    await logAudit(user.id, 'USER_REGISTER', { email: user.email, role: user.role }, req);

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
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      // Log login failure
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null,
          status: 'FAILURE',
        },
      });
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Record login history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        status: 'SUCCESS',
      },
    });

    await logAudit(user.id, 'USER_LOGIN', { email: user.email, role: user.role }, req);

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
          role: user.role,
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
router.post('/logout', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logAudit(req.user.id, 'USER_LOGOUT', { email: req.user.email }, req);
    }
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
        role: true,
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

// @route   POST /api/auth/request-admin
// @desc    Submit request for Admin or Super Admin role
router.post('/request-admin', protect, validate(adminRequestSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    const { requestedRole, remarks } = req.body;

    // Check if user already has this role
    if (req.user.role === requestedRole) {
      res.status(400).json({ status: 'error', message: 'You already have this role' });
      return;
    }

    // Check if there is an active pending request
    const pendingRequest = await prisma.adminRequest.findFirst({
      where: {
        userId: req.user.id,
        requestedRole,
        status: 'PENDING',
      },
    });

    if (pendingRequest) {
      res.status(400).json({ status: 'error', message: 'You already have a pending request for this role' });
      return;
    }

    const request = await prisma.adminRequest.create({
      data: {
        userId: req.user.id,
        requestedRole,
        remarks,
      },
    });

    await logAudit(req.user.id, 'ROLE_REQUEST_CREATE', { requestedRole }, req);

    res.status(201).json({
      status: 'success',
      message: 'Role upgrade request submitted successfully',
      data: { request },
    });
  } catch (error) {
    console.error('Role request error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// @route   GET /api/auth/my-requests
// @desc    Get role requests submitted by current user
router.get('/my-requests', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) return;
    const requests = await prisma.adminRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { requests },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
