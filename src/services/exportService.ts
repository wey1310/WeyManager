import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import { ClassData, StudentData, StudentGrades, GradeColumnConfig, BackupData } from '../types';
import { calculateSemesterAverage, calculateAnnualAverage, getAcademicClassification } from './gradeEngine';
import { ZODIAC_SIGNS } from '../utils/zodiacHelper';

export interface MoETReportConfig {
  schoolName: string;
  departmentName?: string;
  teacherName: string;
  semester: 1 | 2;
  academicYear: string;
  signLocationDate?: string;
}

/**
 * 1. OFFICIAL MOET EXCEL EXPORT (.xlsx)
 * Strictly formatted according to Thông tư 22/2021/TT-BGDĐT & Thông tư 58
 */
export function exportGradebookToExcelMoET(
  classData: ClassData,
  students: StudentData[],
  gradesMap: Record<string, StudentGrades>,
  config: MoETReportConfig
): void {
  const semester = config.semester;
  const columns: GradeColumnConfig[] =
    semester === 1 ? classData.hk1Columns || [] : classData.hk2Columns || [];

  const school = config.schoolName || 'TRƯỜNG THCS / THPT';
  const dept = config.departmentName || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO';
  const semText = semester === 1 ? 'HỌC KỲ I' : 'HỌC KỲ II & CẢ NĂM';

  // Build rows array with official MoET Title block
  const aoa: any[][] = [
    [dept, '', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    [school.toUpperCase(), '', '', '', '', 'Độc lập - Tự do - Hạnh phúc'],
    ['', '', '', '', '', '---o0o---'],
    [],
    [`BẢNG TỔNG HỢP ĐIỂM ĐÁNH GIÁ MÔN HỌC - ${semText}`],
    [`NĂM HỌC: ${config.academicYear || classData.schoolYear}`],
    [],
    [
      `Lớp: ${classData.name}`,
      '',
      `Môn: ${classData.subject}`,
      '',
      `Giáo viên bộ môn: ${config.teacherName || '....................'}`,
      '',
      `Sĩ số: ${students.length} học sinh`,
    ],
    [],
  ];

  // Table Headers
  const tableHeaders = ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính'];
  columns.forEach(col => {
    tableHeaders.push(col.name);
  });
  tableHeaders.push(`ĐTB HK${semester}`);
  if (semester === 2) {
    tableHeaders.push('ĐTB Cả Năm');
    tableHeaders.push('Xếp loại');
  } else {
    tableHeaders.push('Xếp loại');
  }
  tableHeaders.push('Ghi chú');

  aoa.push(tableHeaders);

  // Statistics counters
  let countGood = 0; // Giỏi / Tốt (>= 8.0)
  let countFair = 0; // Khá (6.5 - 7.9)
  let countPass = 0; // Đạt (5.0 - 6.4)
  let countFail = 0; // Chưa đạt (< 5.0)
  let totalEvaluated = 0;

  // Student rows
  students.forEach((student, index) => {
    const grade = gradesMap[student.id];
    const row: any[] = [
      index + 1,
      student.studentCode || '',
      student.fullName,
      student.dateOfBirth || '',
      student.gender || 'Nữ',
    ];

    const scoreObj = semester === 1 ? grade?.hk1Scores : grade?.hk2Scores;
    columns.forEach(col => {
      const val = scoreObj?.[col.id];
      row.push(typeof val === 'number' ? val : '');
    });

    const semAvg = semester === 1 ? grade?.hk1Average : grade?.hk2Average;
    row.push(typeof semAvg === 'number' ? semAvg : '');

    const effectiveAvg = semester === 2 ? (grade?.annualAverage ?? semAvg) : semAvg;

    if (semester === 2) {
      const annualAvg = grade?.annualAverage;
      row.push(typeof annualAvg === 'number' ? annualAvg : '');
    }

    if (typeof effectiveAvg === 'number') {
      totalEvaluated++;
      if (effectiveAvg >= 8.0) {
        row.push('Tốt (Giỏi)');
        countGood++;
      } else if (effectiveAvg >= 6.5) {
        row.push('Khá');
        countFair++;
      } else if (effectiveAvg >= 5.0) {
        row.push('Đạt (TB)');
        countPass++;
      } else {
        row.push('Chưa đạt (Yếu)');
        countFail++;
      }
    } else {
      row.push('');
    }

    row.push(student.note || '');
    aoa.push(row);
  });

  // Summary Statistics block
  aoa.push([]);
  aoa.push(['THỐNG KÊ KẾT QUẢ XẾP LOẠI HỌC LỰC:']);
  aoa.push([
    'Tốt / Giỏi (ĐTB >= 8.0):',
    `${countGood} HS (${totalEvaluated ? ((countGood / totalEvaluated) * 100).toFixed(1) : 0}%)`,
  ]);
  aoa.push([
    'Khá (6.5 <= ĐTB < 8.0):',
    `${countFair} HS (${totalEvaluated ? ((countFair / totalEvaluated) * 100).toFixed(1) : 0}%)`,
  ]);
  aoa.push([
    'Đạt / Trung bình (5.0 <= ĐTB < 6.5):',
    `${countPass} HS (${totalEvaluated ? ((countPass / totalEvaluated) * 100).toFixed(1) : 0}%)`,
  ]);
  aoa.push([
    'Chưa đạt / Yếu (ĐTB < 5.0):',
    `${countFail} HS (${totalEvaluated ? ((countFail / totalEvaluated) * 100).toFixed(1) : 0}%)`,
  ]);

  // Signatures block
  aoa.push([]);
  aoa.push([
    '',
    '',
    '',
    '',
    '',
    config.signLocationDate || `..., Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
  ]);
  aoa.push(['HIỆU TRƯỞNG / TỔ TRƯỞNG CHUYÊN MÔN', '', '', '', '', 'GIÁO VIÊN BỘ MÔN']);
  aoa.push(['(Ký và ghi rõ họ tên)', '', '', '', '', '(Ký và ghi rõ họ tên)']);
  aoa.push([]);
  aoa.push([]);
  aoa.push(['', '', '', '', '', config.teacherName || '']);

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Column width formatting
  worksheet['!cols'] = [
    { wch: 6 }, // STT
    { wch: 12 }, // Mã HS
    { wch: 26 }, // Họ tên
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    ...columns.map(() => ({ wch: 9 })), // Điểm
    { wch: 11 }, // ĐTB
    ...(semester === 2 ? [{ wch: 12 }] : []),
    { wch: 14 }, // Xếp loại
    { wch: 20 }, // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `SoDiem_BoGD_${classData.name}`);

  const fileName = `SoDiem_BoGD_${classData.name}_HK${semester}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * 2. OFFICIAL MOET WORD EXPORT (.docx)
 * Using docx library with official national header, bordered tables and dual signatures
 */
export async function exportGradebookToDocxMoET(
  classData: ClassData,
  students: StudentData[],
  gradesMap: Record<string, StudentGrades>,
  config: MoETReportConfig
): Promise<void> {
  const semester = config.semester;
  const columns: GradeColumnConfig[] =
    semester === 1 ? classData.hk1Columns || [] : classData.hk2Columns || [];
  const semText = semester === 1 ? 'HỌC KỲ I' : 'HỌC KỲ II & CẢ NĂM';

  // Build table header cells
  const headerCells = [
    new TableCell({
      children: [new Paragraph({ text: 'STT', alignment: AlignmentType.CENTER })],
      width: { size: 600, type: WidthType.DXA },
    }),
    new TableCell({
      children: [new Paragraph({ text: 'Mã HS', alignment: AlignmentType.CENTER })],
      width: { size: 1000, type: WidthType.DXA },
    }),
    new TableCell({
      children: [new Paragraph({ text: 'Họ và tên', alignment: AlignmentType.LEFT })],
      width: { size: 2600, type: WidthType.DXA },
    }),
    new TableCell({
      children: [new Paragraph({ text: 'Ngày sinh', alignment: AlignmentType.CENTER })],
      width: { size: 1300, type: WidthType.DXA },
    }),
    new TableCell({
      children: [new Paragraph({ text: 'Giới tính', alignment: AlignmentType.CENTER })],
      width: { size: 1000, type: WidthType.DXA },
    }),
  ];

  columns.forEach(col => {
    headerCells.push(
      new TableCell({
        children: [new Paragraph({ text: col.name, alignment: AlignmentType.CENTER })],
        width: { size: 900, type: WidthType.DXA },
      })
    );
  });

  headerCells.push(
    new TableCell({
      children: [new Paragraph({ text: `ĐTB HK${semester}`, alignment: AlignmentType.CENTER })],
      width: { size: 1100, type: WidthType.DXA },
    })
  );

  if (semester === 2) {
    headerCells.push(
      new TableCell({
        children: [new Paragraph({ text: 'ĐTB Cả Năm', alignment: AlignmentType.CENTER })],
        width: { size: 1100, type: WidthType.DXA },
      })
    );
  }

  headerCells.push(
    new TableCell({
      children: [new Paragraph({ text: 'Xếp loại', alignment: AlignmentType.CENTER })],
      width: { size: 1300, type: WidthType.DXA },
    })
  );

  const tableRows: TableRow[] = [
    new TableRow({
      children: headerCells,
      tableHeader: true,
    }),
  ];

  let countGood = 0;
  let countFair = 0;
  let countPass = 0;
  let countFail = 0;
  let totalEvaluated = 0;

  students.forEach((student, index) => {
    const grade = gradesMap[student.id];
    const scoreObj = semester === 1 ? grade?.hk1Scores : grade?.hk2Scores;
    const semAvg = semester === 1 ? grade?.hk1Average : grade?.hk2Average;
    const effectiveAvg = semester === 2 ? (grade?.annualAverage ?? semAvg) : semAvg;

    let classificationStr = '';
    if (typeof effectiveAvg === 'number') {
      totalEvaluated++;
      if (effectiveAvg >= 8.0) {
        classificationStr = 'Tốt (Giỏi)';
        countGood++;
      } else if (effectiveAvg >= 6.5) {
        classificationStr = 'Khá';
        countFair++;
      } else if (effectiveAvg >= 5.0) {
        classificationStr = 'Đạt (TB)';
        countPass++;
      } else {
        classificationStr = 'Chưa đạt';
        countFail++;
      }
    }

    const rowCells = [
      new TableCell({
        children: [new Paragraph({ text: String(index + 1), alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        children: [new Paragraph({ text: student.studentCode || '', alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        children: [new Paragraph({ text: student.fullName, alignment: AlignmentType.LEFT })],
      }),
      new TableCell({
        children: [new Paragraph({ text: student.dateOfBirth || '', alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        children: [new Paragraph({ text: student.gender || 'Nữ', alignment: AlignmentType.CENTER })],
      }),
    ];

    columns.forEach(col => {
      const val = scoreObj?.[col.id];
      rowCells.push(
        new TableCell({
          children: [
            new Paragraph({
              text: typeof val === 'number' ? String(val) : '',
              alignment: AlignmentType.CENTER,
            }),
          ],
        })
      );
    });

    rowCells.push(
      new TableCell({
        children: [
          new Paragraph({
            text: typeof semAvg === 'number' ? semAvg.toFixed(1) : '',
            alignment: AlignmentType.CENTER,
          }),
        ],
      })
    );

    if (semester === 2) {
      const annualAvg = grade?.annualAverage;
      rowCells.push(
        new TableCell({
          children: [
            new Paragraph({
              text: typeof annualAvg === 'number' ? annualAvg.toFixed(1) : '',
              alignment: AlignmentType.CENTER,
            }),
          ],
        })
      );
    }

    rowCells.push(
      new TableCell({
        children: [new Paragraph({ text: classificationStr, alignment: AlignmentType.CENTER })],
      })
    );

    tableRows.push(new TableRow({ children: rowCells }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // National Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${(config.departmentName || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase()} - ${config.schoolName.toUpperCase()}`,
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '---------------', size: 18 })],
          }),
          new Paragraph({ text: '' }),
          // Main Document Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `BẢNG TỔNG HỢP ĐIỂM ĐÁNH GIÁ MÔN HỌC - ${semText}`,
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Năm học: ${config.academicYear || classData.schoolYear}`,
                italics: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          // Class metadata
          new Paragraph({
            children: [
              new TextRun({
                text: `Lớp: ${classData.name}   |   Môn học: ${classData.subject}   |   Sĩ số: ${students.length} học sinh   |   Giáo viên bộ môn: ${config.teacherName || '....................'}`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          // Grade Table
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: '' }),
          // Statistics Summary
          new Paragraph({
            children: [
              new TextRun({ text: 'THỐNG KÊ KẾT QUẢ ĐÁNH GIÁ:', bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Tốt / Giỏi (ĐTB >= 8.0): ${countGood} HS (${totalEvaluated ? ((countGood / totalEvaluated) * 100).toFixed(1) : 0}%)\n• Khá (6.5 <= ĐTB < 8.0): ${countFair} HS (${totalEvaluated ? ((countFair / totalEvaluated) * 100).toFixed(1) : 0}%)\n• Đạt / Trung bình (5.0 <= ĐTB < 6.5): ${countPass} HS (${totalEvaluated ? ((countPass / totalEvaluated) * 100).toFixed(1) : 0}%)\n• Chưa đạt / Yếu (ĐTB < 5.0): ${countFail} HS (${totalEvaluated ? ((countFail / totalEvaluated) * 100).toFixed(1) : 0}%)`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          // Signatures
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: config.signLocationDate || `Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
                italics: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'GIÁO VIÊN BỘ MÔN\n(Ký và ghi rõ họ tên)\n\n\n\n',
                bold: true,
                size: 20,
              }),
              new TextRun({
                text: config.teacherName || '',
                bold: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SoDiem_BoGD_${classData.name}_HK${semester}_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 3. OFFICIAL MOET PDF EXPORT (.pdf)
 * Using jsPDF and jsPDF-AutoTable with landscape orientation
 */
export function exportGradebookToPdfMoET(
  classData: ClassData,
  students: StudentData[],
  gradesMap: Record<string, StudentGrades>,
  config: MoETReportConfig
): void {
  const semester = config.semester;
  const columns: GradeColumnConfig[] =
    semester === 1 ? classData.hk1Columns || [] : classData.hk2Columns || [];
  const semText = semester === 1 ? 'HỌC KỲ I' : 'HỌC KỲ II & CẢ NĂM';

  // Create landscape A4 PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const school = config.schoolName || 'TRƯỜNG THCS / THPT';
  const dept = config.departmentName || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO';

  // Title and header text
  doc.setFontSize(10);
  doc.text(`${dept.toUpperCase()} - ${school.toUpperCase()}`, 15, 12);
  doc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 200, 12);
  doc.setFontSize(9);
  doc.text('Độc lập - Tự do - Hạnh phúc', 215, 17);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`BẢNG TỔNG HỢP ĐIỂM ĐÁNH GIÁ MÔN HỌC - ${semText}`, 148, 26, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Lớp: ${classData.name}   |   Môn: ${classData.subject}   |   Năm học: ${config.academicYear || classData.schoolYear}   |   Sĩ số: ${students.length} HS   |   GVBM: ${config.teacherName || '............'}`,
    148,
    32,
    { align: 'center' }
  );

  // Build table columns and rows
  const headRow: string[] = ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính'];
  columns.forEach(col => headRow.push(col.name));
  headRow.push(`ĐTB HK${semester}`);
  if (semester === 2) {
    headRow.push('ĐTB Cả Năm');
  }
  headRow.push('Xếp loại');

  let countGood = 0;
  let countFair = 0;
  let countPass = 0;
  let countFail = 0;
  let totalEvaluated = 0;

  const bodyRows: any[][] = [];

  students.forEach((student, idx) => {
    const grade = gradesMap[student.id];
    const scoreObj = semester === 1 ? grade?.hk1Scores : grade?.hk2Scores;
    const semAvg = semester === 1 ? grade?.hk1Average : grade?.hk2Average;
    const effectiveAvg = semester === 2 ? (grade?.annualAverage ?? semAvg) : semAvg;

    let classificationStr = '';
    if (typeof effectiveAvg === 'number') {
      totalEvaluated++;
      if (effectiveAvg >= 8.0) {
        classificationStr = 'Tốt';
        countGood++;
      } else if (effectiveAvg >= 6.5) {
        classificationStr = 'Khá';
        countFair++;
      } else if (effectiveAvg >= 5.0) {
        classificationStr = 'Đạt';
        countPass++;
      } else {
        classificationStr = 'Chưa đạt';
        countFail++;
      }
    }

    const row: any[] = [
      idx + 1,
      student.studentCode || '',
      student.fullName,
      student.dateOfBirth || '',
      student.gender || 'Nữ',
    ];

    columns.forEach(col => {
      const val = scoreObj?.[col.id];
      row.push(typeof val === 'number' ? val.toString() : '');
    });

    row.push(typeof semAvg === 'number' ? semAvg.toFixed(1) : '');

    if (semester === 2) {
      const annualAvg = grade?.annualAverage;
      row.push(typeof annualAvg === 'number' ? annualAvg.toFixed(1) : '');
    }

    row.push(classificationStr);
    bodyRows.push(row);
  });

  autoTable(doc, {
    startY: 36,
    head: [headRow],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      halign: 'center',
    },
    headStyles: {
      fillColor: [70, 115, 72], // Brand garden green #467348
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 18 },
      2: { cellWidth: 42, halign: 'left' },
      3: { cellWidth: 20 },
      4: { cellWidth: 16 },
    },
    margin: { left: 12, right: 12 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  // Statistics block
  if (finalY + 35 < 200) {
    doc.setFontSize(9);
    doc.text(
      `Thống kê: Tốt (Giỏi): ${countGood} HS (${totalEvaluated ? ((countGood / totalEvaluated) * 100).toFixed(1) : 0}%)  |  Khá: ${countFair} HS (${totalEvaluated ? ((countFair / totalEvaluated) * 100).toFixed(1) : 0}%)  |  Đạt (TB): ${countPass} HS (${totalEvaluated ? ((countPass / totalEvaluated) * 100).toFixed(1) : 0}%)  |  Chưa đạt: ${countFail} HS`,
      15,
      finalY + 8
    );

    // Signatures
    doc.text('HIỆU TRƯỞNG / TỔ TRƯỞNG CHUYÊN MÔN', 40, finalY + 16, { align: 'center' });
    doc.text('(Ký và ghi rõ họ tên)', 40, finalY + 21, { align: 'center' });

    doc.text('GIÁO VIÊN BỘ MÔN', 240, finalY + 16, { align: 'center' });
    doc.text('(Ký và ghi rõ họ tên)', 240, finalY + 21, { align: 'center' });
    if (config.teacherName) {
      doc.text(config.teacherName, 240, finalY + 34, { align: 'center' });
    }
  }

  const fileName = `SoDiem_BoGD_${classData.name}_HK${semester}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function exportGradebookToExcel(
  classData: ClassData,
  students: StudentData[],
  gradesMap: Record<string, StudentGrades>,
  semester: 1 | 2
): void {
  exportGradebookToExcelMoET(classData, students, gradesMap, {
    schoolName: 'Vườn của Wey',
    teacherName: 'Giáo viên bộ môn',
    semester,
    academicYear: classData.schoolYear,
  });
}

export function exportStudentsToExcel(classData: ClassData, students: StudentData[]): void {
  const headers = ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Cung hoàng đạo', 'Ghi chú'];
  const rows = students.map((s, idx) => {
    const zodiacInfo = s.zodiac ? ZODIAC_SIGNS[s.zodiac] : null;
    return [
      idx + 1,
      s.studentCode || '',
      s.fullName,
      s.dateOfBirth || '',
      s.gender || '',
      zodiacInfo ? `${zodiacInfo.nameVn} (${zodiacInfo.symbol})` : '',
      s.note || '',
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 25 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachHocSinh');

  const fileName = `DanhSach_${classData.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function downloadBackupJSON(backupData: BackupData): void {
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_vuon_cua_wey_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tải file dữ liệu sao lưu riêng cho 19 lớp Khối 8 (840 học sinh) cho hoangbang1310@gmail.com
 */
export function download19ClassesBackupFile(backupData: BackupData): void {
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `du_lieu_19_lop_khoi_8_hoangbang1310_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tạo nội dung email và đường dẫn mở Gmail soạn thư gửi đến hoangbang1310@gmail.com
 */
export function generate19ClassesMailto({
  targetEmail = 'hoangbang1310@gmail.com',
  classes,
  totalStudents = 840,
  schoolYear = '2026–2027',
}: {
  targetEmail?: string;
  classes: ClassData[];
  totalStudents?: number;
  schoolYear?: string;
}) {
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const subject = `[Vườn của Wey] Báo cáo & Dữ liệu 19 lớp Khối 8 (${totalStudents} học sinh) - ${targetEmail}`;

  const classListText = classes
    .map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. Lớp ${c.name}: Sĩ số ${c.studentCount || 0} học sinh | Môn: ${c.subject || 'Công nghệ'}`)
    .join('\n');

  const body = `Kính gửi Thầy/Cô (${targetEmail}),

Hệ thống Sổ Giáo Viên THCS 'Vườn của Wey' xin gửi báo cáo dữ liệu 19 lớp học Khối 8 đã được xử lý và chuẩn bị đồng bộ:

--------------------------------------------------
THÔNG TIN TỔNG QUAN
--------------------------------------------------
- Tài khoản nhận: ${targetEmail}
- Năm học: ${schoolYear}
- Tổng số lớp học: ${classes.length} lớp (từ 8A1 đến 8A19)
- Tổng số học sinh: ${totalStudents} học sinh
- Cơ sở dữ liệu Firebase: Dự án wey-manager (Firestore)
- Ngày kết xuất dữ liệu: ${dateStr}

--------------------------------------------------
DANH SÁCH CHI TIẾT 19 LỚP HỌC KHỐI 8
--------------------------------------------------
${classListText}

--------------------------------------------------
TÌNH TRẠNG DỮ LIỆU
--------------------------------------------------
✓ Đầy đủ họ tên, ngày sinh, giới tính của 840 học sinh.
✓ Đã gắn cung hoàng đạo và bộ ảnh đại diện Avatar WebP theo cung & giới tính.
✓ Đã tích hợp sổ điểm Thông tư 22, nề nếp điểm cộng/trừ và thời khóa biểu.
✓ Tệp dữ liệu sao lưu chi tiết (JSON) đã được tải về máy của bạn để đính kèm vào email này nếu cần.

Trân trọng,
Hệ thống Vườn của Wey · wey-manager`;

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    targetEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  return { subject, body, gmailWebUrl, mailtoUrl };
}

