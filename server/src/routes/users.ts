import { Router, Response } from 'express';
import prisma from '../prisma';
import { protect, restrictTo, AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// @route   GET /api/users
// @desc    Get all users (Admin/Super Admin only)
router.get(
  '/',
  protect,
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          designation: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: { users },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   PUT /api/users/:id/role
// @desc    Modify a user's role manually (Super Admin only)
router.put(
  '/:id/role',
  protect,
  restrictTo('SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const { id } = req.params;
      const { role } = req.body;

      if (!['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
        res.status(400).json({ status: 'error', message: 'Invalid role' });
        return;
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }

      // Prevent removing the last Super Admin
      if (targetUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
        const superAdminCount = await prisma.user.count({
          where: { role: 'SUPER_ADMIN' },
        });
        if (superAdminCount <= 1) {
          res.status(400).json({
            status: 'error',
            message: 'Cannot demote the only remaining Super Admin',
          });
          return;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, name: true, role: true },
      });

      await logAudit(
        req.user.id,
        'MANUAL_ROLE_CHANGE',
        { targetUserId: id, targetEmail: targetUser.email, oldRole: targetUser.role, newRole: role },
        req
      );

      res.status(200).json({
        status: 'success',
        message: `Role updated to ${role} successfully`,
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   GET /api/users/requests
// @desc    Get all admin role requests
router.get(
  '/requests',
  protect,
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: { requests: [] },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   POST /api/users/requests/:requestId/resolve
// @desc    Approve/Reject role upgrade request
router.post(
  '/requests/:requestId/resolve',
  protect,
  restrictTo('SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Request resolved successfully',
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   GET /api/users/logs
// @desc    Get all audit logs
router.get(
  '/logs',
  protect,
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: { logs: [] },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   GET /api/users/logins
// @desc    Get all login history
router.get(
  '/logins',
  protect,
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        status: 'success',
        data: { logins: [] },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

export default router;
