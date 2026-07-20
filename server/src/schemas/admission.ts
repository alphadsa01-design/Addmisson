import { z } from 'zod';

export const createAdmissionSchema = z.object({
  body: z.object({
    // Simplified Input Fields (10 inputs)
    sno: z.string().optional().nullable(),
    admissionNumber: z.string().optional().nullable(),
    name: z.string().min(2, 'Student name is required'),
    fatherName: z.string().min(2, 'Father name is required'),
    gender: z.string().min(1, 'Gender is required'),
    category: z.string().min(1, 'Category is required'),
    tradeId: z.string().min(1, 'Please select a valid course trade'),
    address: z.string().min(5, 'Address is required'),
    mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
    admissionDate: z.string().optional().nullable(),

    // Unused/Optional fields made fully optional in schema for compatibility
    dateOfBirth: z.string().optional().nullable(),
    religion: z.string().optional().nullable(),
    motherName: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    pinCode: z.string().optional().nullable(),
    alternateMobile: z.string().optional().nullable(),
    bloodGroup: z.string().optional().nullable(),
    nationality: z.string().optional().nullable(),

    instituteId: z.string().optional().nullable(),
    academicYear: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),

    tenthMarksheetNumber: z.string().optional().nullable(),
    tenthMarksheetVerified: z.boolean().optional().default(false),
    aadhaarNumber: z.string().optional().nullable(),
    aadhaarVerified: z.boolean().optional().default(false),
    categoryCertificateNumber: z.string().optional().nullable(),
    categoryCertificateVerified: z.boolean().optional().default(false),
    transferCertificateNumber: z.string().optional().nullable(),
    transferCertificateVerified: z.boolean().optional().default(false),
  }),
});

export const updateAdmissionSchema = z.object({
  body: z.object({
    sno: z.string().optional().nullable(),
    admissionNumber: z.string().optional().nullable(),
    name: z.string().min(2, 'Student name is required').optional(),
    fatherName: z.string().optional(),
    gender: z.string().optional(),
    category: z.string().optional(),
    tradeId: z.string().optional(),
    address: z.string().optional(),
    mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits').optional(),
    admissionDate: z.string().optional().nullable(),

    dateOfBirth: z.string().optional().nullable(),
    religion: z.string().optional().nullable(),
    motherName: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    pinCode: z.string().optional().nullable(),
    alternateMobile: z.string().optional().nullable(),
    bloodGroup: z.string().optional().nullable(),
    nationality: z.string().optional().nullable(),

    instituteId: z.string().optional().nullable(),
    academicYear: z.string().optional().nullable(),
    status: z.enum(['PENDING', 'VERIFIED', 'COMPLETED', 'CANCELLED']).optional(),
    feeStatus: z.enum(['PAID', 'UNPAID', 'PARTIAL']).optional(),
    remarks: z.string().optional().nullable(),

    tenthMarksheetNumber: z.string().optional().nullable(),
    tenthMarksheetVerified: z.boolean().optional(),
    aadhaarNumber: z.string().optional().nullable(),
    aadhaarVerified: z.boolean().optional(),
    categoryCertificateNumber: z.string().optional().nullable(),
    categoryCertificateVerified: z.boolean().optional(),
    transferCertificateNumber: z.string().optional().nullable(),
    transferCertificateVerified: z.boolean().optional(),
  }),
});
