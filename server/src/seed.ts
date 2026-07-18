import prisma from './prisma';

export const seedMetadata = async (): Promise<void> => {
  try {
    console.log('Clearing old metadata and admissions for fresh seeding...');
    
    // Clear all relations first
    await prisma.loginHistory.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.documentVerification.deleteMany({});
    await prisma.admission.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.trade.deleteMany({});
    await prisma.institute.deleteMany({});

    console.log('Seeding strictly ITI Punhana...');
    await prisma.institute.create({
      data: { name: 'ITI Punhana', code: 'ITI-PUN', district: 'Mewat', state: 'Haryana' },
    });
    console.log('ITI Punhana seeded.');

    console.log('Seeding new Trade list (NCVT)...');
    await prisma.trade.createMany({
      data: [
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
      ],
    });
    console.log('Trades seeded successfully.');
  } catch (error) {
    console.error('Seeding metadata error:', error);
  }
};
