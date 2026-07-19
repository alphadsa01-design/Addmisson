import { Request } from 'express';
import prisma from '../prisma';

export const logAudit = async (
  userId: string | null,
  action: string,
  details: Record<string, any>,
  req?: Request
): Promise<void> => {
  // Audit log recording deactivated per schema simplification
};
