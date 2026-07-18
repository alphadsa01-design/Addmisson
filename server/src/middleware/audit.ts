import { Request } from 'express';
import prisma from '../prisma';

export const logAudit = async (
  userId: string | null,
  action: string,
  details: Record<string, any>,
  req?: Request
): Promise<void> => {
  try {
    const ipAddress = req ? (req.ip || req.socket.remoteAddress || null) : null;
    const userAgent = req ? (req.headers['user-agent'] || null) : null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
