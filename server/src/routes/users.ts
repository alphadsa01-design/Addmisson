import { Router, Response } from 'express';
import prisma from '../prisma';
import { protect, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// @route   GET /api/users
// @desc    Get all users
router.get(
  '/',
  protect,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
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

export default router;
