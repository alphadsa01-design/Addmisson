import prisma from './prisma';
import { hashPassword } from './utils/password';

export const seedMetadata = async (): Promise<void> => {
  try {
    // Seed Institute safely
    await prisma.institute.upsert({
      where: { code: 'ITI-PUN' },
      update: {},
      create: { name: 'ITI Punhana', code: 'ITI-PUN', district: 'Mewat', state: 'Haryana' },
    });

    // Seed Trades safely
    const trades = [
      { name: 'Machinist (NCVT)', code: 'TRADE_MACHINIST', durationYears: 2 },
      { name: 'Fitter (NCVT)', code: 'TRADE_FITTER', durationYears: 2 },
      { name: 'Electrician (NCVT)', code: 'TRADE_ELECTRICIAN', durationYears: 2 },
      { name: 'MMV (NCVT)', code: 'TRADE_MMV', durationYears: 2 },
      { name: 'DMM (NCVT)', code: 'TRADE_DMM', durationYears: 2 },
      { name: 'DMC (NCVT)', code: 'TRADE_DMC', durationYears: 2 },
      { name: 'Mechanic Diesel (NCVT)', code: 'TRADE_MECH_DIESEL', durationYears: 1 },
      { name: 'Welder (NCVT)', code: 'TRADE_WELDER', durationYears: 1 },
      { name: 'Plumber (NCVT)', code: 'TRADE_PLUMBER', durationYears: 1 },
      { name: 'PPO (NCVT)', code: 'TRADE_PPO', durationYears: 1 },
      { name: 'Steno Hindi (NCVT)', code: 'TRADE_STENO_HINDI', durationYears: 1 },
      { name: 'COPA (NCVT)', code: 'TRADE_COPA', durationYears: 1 },
      { name: 'Turner (NCVT)', code: 'TRADE_TURNER', durationYears: 2 },
    ];

    for (const trade of trades) {
      await prisma.trade.upsert({
        where: { code: trade.code },
        update: { name: trade.name, durationYears: trade.durationYears },
        create: trade,
      });
    }

    // Seed default Admin user
    const defaultPasswordHash = await hashPassword('admin');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@iti.gov.in' },
      update: {
        password: defaultPasswordHash,
        isVerified: true,
      },
      create: {
        email: 'admin@iti.gov.in',
        name: 'System Admin',
        password: defaultPasswordHash,
        designation: 'Principal / ITI Administrator',
        isVerified: true,
      },
    });

    // Clean up all other users safely to enforce single user account policy
    const otherUsers = await prisma.user.findMany({
      where: {
        email: { not: 'admin@iti.gov.in' },
      },
    });

    if (otherUsers.length > 0) {
      console.log(`Cleaning up ${otherUsers.length} extra user accounts...`);
      const otherUserIds = otherUsers.map((u) => u.id);

      // Re-assign admissions created by these users to the single admin account to preserve DB integrity
      await prisma.admission.updateMany({
        where: { admittedById: { in: otherUserIds } },
        data: { admittedById: adminUser.id },
      });

      // Now delete the extra users
      await prisma.user.deleteMany({
        where: { id: { in: otherUserIds } },
      });
      console.log('Extra users deleted successfully.');
    }

    console.log('Metadata & default admin account seeded cleanly.');
  } catch (error) {
    console.error('Seeding metadata error:', error);
  }
};
