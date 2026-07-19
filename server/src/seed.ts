import argon2 from 'argon2';
import prisma from './prisma';

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
    const defaultPasswordHash = await argon2.hash('admin123');
    await prisma.user.upsert({
      where: { email: 'admin@iti.gov.in' },
      update: {},
      create: {
        email: 'admin@iti.gov.in',
        name: 'System Admin',
        password: defaultPasswordHash,
        role: 'SUPER_ADMIN',
        designation: 'Principal / ITI Administrator',
      },
    });

    // Seed default Staff user
    const staffPasswordHash = await argon2.hash('staff123');
    await prisma.user.upsert({
      where: { email: 'staff@iti.gov.in' },
      update: {},
      create: {
        email: 'staff@iti.gov.in',
        name: 'Admission Staff',
        password: staffPasswordHash,
        role: 'STAFF',
        designation: 'Admission Operator',
      },
    });

    console.log('Metadata & default accounts seeded cleanly.');
  } catch (error) {
    console.error('Seeding metadata error:', error);
  }
};
