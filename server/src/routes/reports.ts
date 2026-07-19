import { Router, Response } from 'express';
import exceljs from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../prisma';
import { protect, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// @route   GET /api/reports/excel
// @desc    Export filtered admissions to Excel
router.get(
  '/excel',
  protect,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { search, status, feeStatus, tradeId, instituteId, academicYear, gender, category, startDate, endDate } = req.query;

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

      const admissions = await prisma.admission.findMany({
        where: whereClause,
        include: {
          student: true,
          institute: true,
          trade: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Create Excel Workbook
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Admissions');

      // Setup Columns
      worksheet.columns = [
        { header: 'Admission No', key: 'admissionNumber', width: 20 },
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Date of Birth', key: 'dob', width: 15 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Category', key: 'category', width: 12 },
        { header: 'Father Name', key: 'fatherName', width: 25 },
        { header: 'Mobile Number', key: 'mobile', width: 15 },
        { header: 'Institute Name', key: 'instituteName', width: 30 },
        { header: 'Trade Name', key: 'tradeName', width: 25 },
        { header: 'Academic Year', key: 'academicYear', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Fee Status', key: 'feeStatus', width: 15 },
        { header: 'Admitted On', key: 'admittedOn', width: 20 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0F172A' }, // Slate-900 / dark blue
        };
      });

      // Add Data
      admissions.forEach((a) => {
        worksheet.addRow({
          admissionNumber: a.admissionNumber,
          studentName: a.student.name,
          dob: a.student.dateOfBirth ? a.student.dateOfBirth.toISOString().split('T')[0] : '-',
          gender: a.student.gender,
          category: a.student.category,
          fatherName: a.student.fatherName,
          mobile: a.student.mobileNumber,
          instituteName: a.institute.name,
          tradeName: a.trade.name,
          academicYear: a.academicYear,
          status: a.status,
          feeStatus: a.feeStatus,
          admittedOn: a.createdAt.toISOString().split('T')[0],
        });
      });

      // Set Response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + `admissions_report_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Export Excel error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to export Excel report' });
    }
  }
);

// @route   GET /api/reports/pdf/:id
// @desc    Generate printable PDF receipt for single admission
router.get(
  '/pdf/:id',
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
        },
      });

      if (!admission) {
        res.status(404).json({ status: 'error', message: 'Admission records not found' });
        return;
      }

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename=receipt_${admission.admissionNumber.replace(/\//g, '_')}.pdf`
      );

      doc.pipe(res);

      // --- PDF CONTENT DESIGN ---
      // Header Banner
      doc.rect(50, 45, 512, 60).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold');
      doc.text('GOVERNMENT OF INDIA', 50, 55, { align: 'center', width: 512 });
      doc.fontSize(12).text('DEPARTMENT OF TRAINING & EMPLOYMENT', 50, 72, { align: 'center', width: 512 });
      doc.fontSize(10).font('Helvetica').text('ITI INTERNAL ADMISSION ACKNOWLEDGEMENT RECEIPT', 50, 88, { align: 'center', width: 512 });

      doc.moveDown(3);
      doc.fillColor('#000000');

      // Primary Metadata
      const topY = 130;
      doc.fontSize(10).font('Helvetica-Bold').text(`Admission No: ${admission.admissionNumber}`, 50, topY);
      doc.text(`Academic Year: ${admission.academicYear}`, 350, topY);
      doc.text(`Date of Admission: ${admission.createdAt.toLocaleDateString()}`, 50, topY + 18);
      doc.text(`Admission Status: ${admission.status}`, 350, topY + 18);

      // Separator Line
      doc.moveTo(50, topY + 40).lineTo(562, topY + 40).strokeColor('#CCCCCC').stroke();

      // Section: Candidate Details
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text('1. CANDIDATE PERSONAL INFORMATION', 50, topY + 50);
      doc.fillColor('#000000').fontSize(10).font('Helvetica');

      const detailsY = topY + 70;
      const leftCol = 70;
      const rightCol = 320;

      doc.text('Candidate Name:', leftCol, detailsY);
      doc.font('Helvetica-Bold').text(admission.student.name, leftCol + 100, detailsY).font('Helvetica');

      doc.text('Father\'s Name:', leftCol, detailsY + 18);
      doc.text(admission.student.fatherName, leftCol + 100, detailsY + 18);

      doc.text('Mother\'s Name:', leftCol, detailsY + 36);
      doc.text(admission.student.motherName || '-', leftCol + 100, detailsY + 36);

      doc.text('Date of Birth:', leftCol, detailsY + 54);
      doc.text(admission.student.dateOfBirth ? admission.student.dateOfBirth.toLocaleDateString() : '-', leftCol + 100, detailsY + 54);

      doc.text('Gender:', leftCol, detailsY + 72);
      doc.text(admission.student.gender, leftCol + 100, detailsY + 72);

      doc.text('Category / Religion:', leftCol, detailsY + 90);
      doc.text(`${admission.student.category} / ${admission.student.religion || '-'}`, leftCol + 100, detailsY + 90);

      // Contact column
      doc.text('Mobile Number:', rightCol, detailsY);
      doc.text(admission.student.mobileNumber, rightCol + 100, detailsY);

      doc.text('Email Address:', rightCol, detailsY + 18);
      doc.text(admission.student.email || 'N/A', rightCol + 100, detailsY + 18);

      doc.text('Permanent Address:', rightCol, detailsY + 36);
      doc.text(admission.student.address, rightCol + 100, detailsY + 36, { width: 140 });

      doc.text('District / PIN:', rightCol, detailsY + 72);
      doc.text(`${admission.student.district} - ${admission.student.pinCode}`, rightCol + 100, detailsY + 72);

      // Separator Line
      doc.moveTo(50, detailsY + 115).lineTo(562, detailsY + 115).strokeColor('#CCCCCC').stroke();

      // Section: Allocation Info
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text('2. ALLOCATED INSTITUTE & TRADE', 50, detailsY + 125);
      doc.fillColor('#000000').fontSize(10).font('Helvetica');

      const allocY = detailsY + 145;
      doc.text('ITI Institute:', leftCol, allocY);
      doc.font('Helvetica-Bold').text(`${admission.institute.name} (Code: ${admission.institute.code})`, leftCol + 100, allocY).font('Helvetica');

      doc.text('Trade Course:', leftCol, allocY + 18);
      doc.font('Helvetica-Bold').text(`${admission.trade.name}`, leftCol + 100, allocY + 18).font('Helvetica');

      doc.text('Duration:', leftCol, allocY + 36);
      doc.text(`${admission.trade.durationYears} Year(s)`, leftCol + 100, allocY + 36);

      doc.text('Fee Payment Status:', rightCol, allocY);
      doc.font('Helvetica-Bold').text(admission.feeStatus, rightCol + 120, allocY).font('Helvetica');

      // Separator Line
      doc.moveTo(50, allocY + 60).lineTo(562, allocY + 60).strokeColor('#CCCCCC').stroke();

      // Footnote & signatures
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666')
         .text('This is a computer-generated admission confirmation slip. No physical signature is mandatory, however stamp verification can be done at the designated ITI branch.', 50, 700, { align: 'center', width: 512 });

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
         .text('Prepared By (Staff)', 80, 660)
         .text('Authorised Signatory / Principal', 380, 660);

      doc.moveTo(80, 655).lineTo(180, 655).stroke();
      doc.moveTo(380, 655).lineTo(520, 655).stroke();

      // End document stream
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to generate PDF document' });
    }
  }
);

// @route   GET /api/reports/pdf-list
// @desc    Export filtered admissions to printable PDF List
router.get(
  '/pdf-list',
  protect,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { search, status, feeStatus, tradeId, instituteId, academicYear, gender, category, startDate, endDate } = req.query;

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

      const admissions = await prisma.admission.findMany({
        where: whereClause,
        include: {
          student: true,
          institute: true,
          trade: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Create PDF
      const doc = new PDFDocument({ layout: 'landscape', margin: 30 });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename=admissions_report_${Date.now()}.pdf`
      );

      doc.pipe(res);

      const drawHeader = (pageNum: number) => {
        // Top banner
        doc.rect(30, 25, 732, 50).fill('#1E293B');
        doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold');
        doc.text('GOVERNMENT OF INDIA • DEPARTMENT OF TRAINING & EMPLOYMENT', 30, 32, { align: 'center', width: 732 });
        doc.fontSize(10).font('Helvetica').text('CANDIDATE ADMISSION REGISTRY REPORT', 30, 48, { align: 'center', width: 732 });

        doc.fillColor('#000000');
        
        // Draw Page number
        doc.fontSize(8).font('Helvetica-Bold').text(`Page: ${pageNum}`, 710, 85);
      };

      let pageNum = 1;
      drawHeader(pageNum);

      // Print Filters info
      let filtersStr = `Filters applied: [ Academic Session: ${academicYear || 'All'} ]`;
      if (tradeId) {
        const tradeObj = admissions[0]?.trade;
        filtersStr += ` [ Trade: ${tradeObj ? tradeObj.name : 'Selected'} ]`;
      }
      if (status) filtersStr += ` [ Status: ${status} ]`;
      if (feeStatus) filtersStr += ` [ Fee: ${feeStatus} ]`;
      if (gender) filtersStr += ` [ Gender: ${gender} ]`;
      if (category) filtersStr += ` [ Category: ${category} ]`;
      if (startDate) filtersStr += ` [ From: ${startDate} ]`;
      if (endDate) filtersStr += ` [ To: ${endDate} ]`;
      if (search) filtersStr += ` [ Search: "${search}" ]`;

      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#555555').text(filtersStr, 30, 85);

      // Table layout parameters
      // Total available width: 732
      const columns = [
        { label: 'S.No', width: 35 },
        { label: 'Admission No', width: 80 },
        { label: 'Candidate Name', width: 95 },
        { label: 'Father\'s Name', width: 95 },
        { label: 'Gender', width: 40 },
        { label: 'Category', width: 50 },
        { label: 'Allocated Trade', width: 105 },
        { label: 'Mobile No', width: 70 },
        { label: 'Address', width: 97 },
        { label: 'Date', width: 65 },
      ];

      const startX = 30;
      let startY = 105;

      const drawTableHeaders = (y: number) => {
        doc.rect(startX, y, 732, 20).fill('#334155');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
        
        let currentX = startX;
        columns.forEach(col => {
          doc.text(col.label, currentX + 5, y + 6, { width: col.width - 10, lineBreak: false });
          currentX += col.width;
        });
        
        doc.fillColor('#000000').font('Helvetica');
      };

      drawTableHeaders(startY);
      startY += 20;

      // Draw rows
      admissions.forEach((a, index) => {
        // If row goes near the bottom, add a new page
        if (startY > 500) {
          doc.addPage({ layout: 'landscape', margin: 30 });
          pageNum++;
          drawHeader(pageNum);
          startY = 105;
          drawTableHeaders(startY);
          startY += 20;
        }

        // Alternate row background coloring
        if (index % 2 === 1) {
          doc.rect(startX, startY, 732, 20).fill('#F8FAFC');
          doc.fillColor('#000000');
        }

        // Draw cells
        let currentX = startX;
        doc.fontSize(8);

        const rowData = [
          a.sno || String(index + 1),
          a.admissionNumber,
          a.student.name,
          a.student.fatherName,
          a.student.gender,
          a.student.category,
          a.trade.name,
          a.student.mobileNumber,
          a.student.address,
          a.admissionDate ? new Date(a.admissionDate).toLocaleDateString() : new Date(a.createdAt).toLocaleDateString(),
        ];

        rowData.forEach((val, colIdx) => {
          doc.text(val || '-', currentX + 5, startY + 6, { width: columns[colIdx].width - 10, height: 12, lineBreak: false });
          currentX += columns[colIdx].width;
        });

        // Draw bottom border for the row
        doc.moveTo(startX, startY + 20).lineTo(startX + 732, startY + 20).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        startY += 20;
      });

      doc.end();
    } catch (error) {
      console.error('Export PDF list error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to export PDF list report' });
    }
  }
);

export default router;
