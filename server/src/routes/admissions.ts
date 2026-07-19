import { Router, Response } from 'express';
import prisma from '../prisma';
import { validate } from '../middleware/validate';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { createAdmissionSchema, updateAdmissionSchema } from '../schemas/admission';
import { logAudit } from '../middleware/audit';

const router = Router();

// @route   POST /api/admissions
// @desc    Create a new student and admission record
router.post(
  '/',
  protect,
  validate(createAdmissionSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const {
        sno,
        admissionNumber,
        admissionDate,
        name,
        dateOfBirth,
        gender,
        category,
        religion,
        fatherName,
        motherName,
        mobileNumber,
        email,
        address,
        state,
        district,
        pinCode,
        alternateMobile,
        bloodGroup,
        nationality,
        instituteId,
        tradeId,
        academicYear,
        remarks,
        tenthMarksheetNumber,
        tenthMarksheetVerified,
        aadhaarNumber,
        aadhaarVerified,
        categoryCertificateNumber,
        categoryCertificateVerified,
        transferCertificateNumber,
        transferCertificateVerified,
      } = req.body;

      // Handle missing instituteId
      let finalInstituteId = instituteId;
      if (!finalInstituteId) {
        const defaultInst = await prisma.institute.findFirst();
        if (defaultInst) {
          finalInstituteId = defaultInst.id;
        } else {
          const newInst = await prisma.institute.create({
            data: {
              name: "Government ITI Punhana",
              code: "ITI-PUNHANA",
              district: "Mewat",
              state: "Haryana",
            }
          });
          finalInstituteId = newInst.id;
        }
      }

      const finalAcademicYear = academicYear || '2026-2027';

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Student
        const student = await tx.student.create({
          data: {
            name,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender,
            category,
            religion: religion || null,
            fatherName,
            motherName: motherName || null,
            mobileNumber,
            email: email || null,
            address,
            state: state || null,
            district: district || null,
            pinCode: pinCode || null,
            alternateMobile: alternateMobile || null,
            bloodGroup: bloodGroup || null,
            nationality: nationality || "Indian",
          },
        });

        const count = await tx.admission.count({
          where: { academicYear: finalAcademicYear },
        });

        // 2. Generate Unique Admission Number if not provided
        let finalAdmissionNumber = admissionNumber;
        if (!finalAdmissionNumber) {
          const currentYear = finalAcademicYear.split('-')[0];
          const seqNumber = String(count + 1).padStart(4, '0');
          finalAdmissionNumber = `ITI/${currentYear}/${seqNumber}`;
        }

        // 3. Create Admission
        const admission = await tx.admission.create({
          data: {
            sno: sno || String(count + 1),
            admissionNumber: finalAdmissionNumber,
            admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
            studentId: student.id,
            instituteId: finalInstituteId,
            tradeId,
            academicYear: finalAcademicYear,
            status: 'PENDING',
            feeStatus: 'UNPAID',
            admittedById: req.user!.id,
            remarks: remarks || null,
          },
        });

        return { student, admission };
      });

      await logAudit(
        req.user.id,
        'CREATE_ADMISSION',
        { admissionId: result.admission.id, admissionNumber: result.admission.admissionNumber },
        req
      );

      res.status(201).json({
        status: 'success',
        message: 'Admission registered successfully',
        data: result,
      });
    } catch (error) {
      console.error('Create admission error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   GET /api/admissions/stats
// @desc    Get metrics for dashboard reports
router.get(
  '/stats',
  protect,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const [
        totalCount,
        pendingCount,
        verifiedCount,
        completedCount,
        cancelledCount,
        feePaidCount,
        feeUnpaidCount,
        feePartialCount,
        tradeBreakdown,
        districtBreakdown,
      ] = await Promise.all([
        prisma.admission.count(),
        prisma.admission.count({ where: { status: 'PENDING' } }),
        prisma.admission.count({ where: { status: 'VERIFIED' } }),
        prisma.admission.count({ where: { status: 'COMPLETED' } }),
        prisma.admission.count({ where: { status: 'CANCELLED' } }),
        prisma.admission.count({ where: { feeStatus: 'PAID' } }),
        prisma.admission.count({ where: { feeStatus: 'UNPAID' } }),
        prisma.admission.count({ where: { feeStatus: 'PARTIAL' } }),
        prisma.admission.groupBy({
          by: ['tradeId'],
          _count: { id: true },
        }),
        prisma.student.groupBy({
          by: ['district'],
          _count: { id: true },
        }),
      ]);

      // Resolve trade names
      const trades = await prisma.trade.findMany();
      const tradeStats = tradeBreakdown.map((t) => {
        const trade = trades.find((tr) => tr.id === t.tradeId);
        return {
          tradeName: trade ? trade.name : 'Unknown',
          tradeCode: trade ? trade.code : 'N/A',
          count: t._count.id,
        };
      });

      res.status(200).json({
        status: 'success',
        data: {
          total: totalCount,
          byStatus: {
            PENDING: pendingCount,
            VERIFIED: verifiedCount,
            COMPLETED: completedCount,
            CANCELLED: cancelledCount,
          },
          byFee: {
            PAID: feePaidCount,
            UNPAID: feeUnpaidCount,
            PARTIAL: feePartialCount,
          },
          tradeStats,
          districtStats: districtBreakdown.map((d) => ({
            district: d.district,
            count: d._count.id,
          })),
        },
      });
    } catch (error) {
      console.error('Stats fetching error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   GET /api/admissions
// @desc    Get filtered list of admissions
router.get(
  '/',
  protect,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        search,
        status,
        feeStatus,
        tradeId,
        instituteId,
        academicYear,
        gender,
        category,
        startDate,
        endDate,
        page = '1',
        limit = '10',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const whereClause: any = {};

      if (status) whereClause.status = status;
      if (feeStatus) whereClause.feeStatus = feeStatus;
      if (tradeId) whereClause.tradeId = tradeId;
      if (instituteId) whereClause.instituteId = instituteId;
      if (academicYear) whereClause.academicYear = academicYear;

      if (gender || category) {
        whereClause.student = {};
        if (gender) whereClause.student.gender = gender;
        if (category) whereClause.student.category = category;
      }

      if (startDate || endDate) {
        whereClause.admissionDate = {};
        if (startDate) {
          whereClause.admissionDate.gte = new Date(startDate as string);
        }
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          whereClause.admissionDate.lte = end;
        }
      }

      if (search) {
        whereClause.OR = [
          { admissionNumber: { contains: search as string, mode: 'insensitive' } },
          {
            student: {
              OR: [
                { name: { contains: search as string, mode: 'insensitive' } },
                { fatherName: { contains: search as string, mode: 'insensitive' } },
                { mobileNumber: { contains: search as string } },
              ],
            },
          },
        ];
      }

      const [total, admissions] = await Promise.all([
        prisma.admission.count({ where: whereClause }),
        prisma.admission.findMany({
          where: whereClause,
          include: {
            student: true,
            institute: true,
            trade: true,
            admittedBy: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
      ]);

      res.status(200).json({
        status: 'success',
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        data: { admissions },
      });
    } catch (error) {
      console.error('Fetch admissions error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   GET /api/admissions/:id
// @desc    Get detailed admission
router.get(
  '/:id',
  protect,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const admission = await prisma.admission.findUnique({
        where: { id },
        include: {
          student: true,
          institute: true,
          trade: true,
          admittedBy: { select: { name: true, email: true } },
        },
      });

      if (!admission) {
        res.status(404).json({ status: 'error', message: 'Admission not found' });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { admission },
      });
    } catch (error) {
      console.error('Fetch single admission error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   PUT /api/admissions/:id
// @desc    Update admission details & student info
router.put(
  '/:id',
  protect,
  validate(updateAdmissionSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const { id } = req.params;

      const currentAdmission = await prisma.admission.findUnique({
        where: { id },
        include: { student: true },
      });

      if (!currentAdmission) {
        res.status(404).json({ status: 'error', message: 'Admission not found' });
        return;
      }

      const body = req.body;

      // Extract Student fields
      const studentFields = [
        'name',
        'dateOfBirth',
        'gender',
        'category',
        'religion',
        'fatherName',
        'motherName',
        'mobileNumber',
        'email',
        'address',
        'state',
        'district',
        'pinCode',
        'alternateMobile',
        'bloodGroup',
        'nationality',
      ];
      const studentUpdateData: any = {};
      studentFields.forEach((field) => {
        if (body[field] !== undefined) {
          if (field === 'dateOfBirth') {
            studentUpdateData[field] = new Date(body[field]);
          } else {
            studentUpdateData[field] = body[field];
          }
        }
      });

      // Extract Admission fields
      const admissionFields = ['sno', 'admissionNumber', 'admissionDate', 'instituteId', 'tradeId', 'academicYear', 'status', 'feeStatus', 'remarks'];
      const admissionUpdateData: any = {};
      admissionFields.forEach((field) => {
        if (body[field] !== undefined) {
          if (field === 'admissionDate') {
            admissionUpdateData[field] = body[field] ? new Date(body[field]) : null;
          } else {
            admissionUpdateData[field] = body[field];
          }
        }
      });

      // Extract Verification checklist fields
      const docFields = [
        'tenthMarksheetNumber',
        'tenthMarksheetVerified',
        'aadhaarNumber',
        'aadhaarVerified',
        'categoryCertificateNumber',
        'categoryCertificateVerified',
        'transferCertificateNumber',
        'transferCertificateVerified',
      ];
      // Execute update transaction
      const updated = await prisma.$transaction(async (tx) => {
        // Update Student if there is data
        if (Object.keys(studentUpdateData).length > 0) {
          await tx.student.update({
            where: { id: currentAdmission.studentId },
            data: studentUpdateData,
          });
        }

        // Update Admission if there is data
        let admissionResult = currentAdmission;
        if (Object.keys(admissionUpdateData).length > 0) {
          admissionResult = await tx.admission.update({
            where: { id },
            data: admissionUpdateData,
            include: {
              student: true,
              institute: true,
              trade: true,
            },
          });
        }

        return admissionResult;
      });

      await logAudit(req.user.id, 'UPDATE_ADMISSION', { admissionId: id }, req);

      res.status(200).json({
        status: 'success',
        message: 'Admission updated successfully',
        data: { admission: updated },
      });
    } catch (error) {
      console.error('Update admission error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// @route   DELETE /api/admissions/:id
// @desc    Delete an admission and associated student profile
router.delete(
  '/:id',
  protect,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const { id } = req.params;

      const admission = await prisma.admission.findUnique({
        where: { id },
      });

      if (!admission) {
        res.status(404).json({ status: 'error', message: 'Admission not found' });
        return;
      }

      // Delete Student (cascades to Admission and DocumentVerification)
      await prisma.student.delete({
        where: { id: admission.studentId },
      });

      await logAudit(
        req.user.id,
        'DELETE_ADMISSION',
        { admissionId: id, admissionNumber: admission.admissionNumber },
        req
      );

      res.status(200).json({
        status: 'success',
        message: 'Admission deleted successfully',
      });
    } catch (error) {
      console.error('Delete admission error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// Helper routes for reference lists
// @route   GET /api/institutes
// @desc    Get all ITI institutes
router.get('/meta/institutes', protect, async (req, res) => {
  try {
    const institutes = await prisma.institute.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json({ status: 'success', data: { institutes } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// @route   GET /api/trades
// @desc    Get all course trades
router.get('/meta/trades', protect, async (req, res) => {
  try {
    const trades = await prisma.trade.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json({ status: 'success', data: { trades } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
