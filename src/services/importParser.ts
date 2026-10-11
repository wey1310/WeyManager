import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  rawRows: (string | number)[][];
}

export interface FieldMapping {
  systemField: string;
  sourceColumn: string;
  label: string;
  required: boolean;
}

export const STUDENT_SYSTEM_FIELDS: { id: string; label: string; required: boolean; hints: string[] }[] = [
  { id: 'fullName', label: 'Họ và tên', required: true, hints: ['họ và tên', 'họ tên', 'tên', 'fullname', 'student name', 'họ đệm và tên'] },
  { id: 'studentCode', label: 'Mã học sinh', required: false, hints: ['mã hs', 'ma hs', 'mã học sinh', 'student id', 'mã định danh', 'mshs', 'id'] },
  { id: 'dateOfBirth', label: 'Ngày sinh', required: false, hints: ['ngày sinh', 'ngaysinh', 'dob', 'birth date', 'ngày tháng năm sinh'] },
  { id: 'gender', label: 'Giới tính', required: false, hints: ['giới tính', 'gioitinh', 'gender', 'nam/nữ', 'phái'] },
  { id: 'note', label: 'Ghi chú', required: false, hints: ['ghi chú', 'ghichu', 'note', 'notes', 'nhận xét'] },
];

/**
 * Normalizes text to assist in fuzzy header matching
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Auto-detects system field for a given column name
 */
export function guessFieldMapping(sourceCol: string, systemFields = STUDENT_SYSTEM_FIELDS): string {
  const norm = normalizeHeader(sourceCol);
  for (const field of systemFields) {
    for (const hint of field.hints) {
      const normHint = normalizeHeader(hint);
      if (norm === normHint || norm.includes(normHint) || normHint.includes(norm)) {
        return field.id;
      }
    }
  }
  return '';
}

/**
 * Parses Excel / CSV file into sheets and rows
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets: ParsedSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to array of rows
    const rawData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });
    if (!rawData || rawData.length === 0) continue;

    // Find first non-empty row as header candidate
    let headerRowIndex = 0;
    while (headerRowIndex < rawData.length && (!rawData[headerRowIndex] || rawData[headerRowIndex].length === 0)) {
      headerRowIndex++;
    }

    if (headerRowIndex >= rawData.length) continue;

    const rawHeaders = (rawData[headerRowIndex] || []).map(cell => String(cell || '').trim());
    const validHeaders = rawHeaders.filter(h => h.length > 0);

    if (validHeaders.length === 0) continue;

    const dataRows = rawData.slice(headerRowIndex + 1);
    const parsedRows: Record<string, any>[] = [];

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;
      // check if row is empty
      const hasContent = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (!hasContent) continue;

      const obj: Record<string, any> = {};
      rawHeaders.forEach((header, idx) => {
        if (header) {
          obj[header] = row[idx] !== undefined ? row[idx] : '';
        }
      });
      parsedRows.push(obj);
    }

    sheets.push({
      sheetName,
      headers: rawHeaders.filter(h => h.length > 0),
      rows: parsedRows,
      rawRows: dataRows,
    });
  }

  return sheets;
}

/**
 * Parses Word (.docx) file by extracting tables
 */
export async function parseWordDocument(file: File): Promise<ParsedSheet[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Use DOMParser to parse HTML generated from Word document
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');

  const sheets: ParsedSheet[] = [];

  if (tables.length === 0) {
    // If no table found, extract paragraphs line by line as fallback
    const paragraphs = Array.from(doc.querySelectorAll('p'))
      .map(p => p.textContent?.trim() || '')
      .filter(p => p.length > 0);

    if (paragraphs.length > 0) {
      sheets.push({
        sheetName: 'Danh sách từ văn bản',
        headers: ['Họ và tên'],
        rows: paragraphs.map(p => ({ 'Họ và tên': p })),
        rawRows: paragraphs.map(p => [p]),
      });
    }
    return sheets;
  }

  tables.forEach((table, tableIdx) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return;

    // First row is header
    const headerCells = Array.from(rows[0].querySelectorAll('th, td')).map(cell => cell.textContent?.trim() || '');
    const headers = headerCells.filter(h => h.length > 0);

    const dataRows: Record<string, any>[] = [];
    const rawRows: (string | number)[][] = [];

    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('td')).map(cell => cell.textContent?.trim() || '');
      const hasContent = cells.some(c => c.length > 0);
      if (!hasContent) continue;

      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = cells[idx] || '';
      });
      dataRows.push(obj);
      rawRows.push(cells);
    }

    sheets.push({
      sheetName: `Bảng ${tableIdx + 1}`,
      headers,
      rows: dataRows,
      rawRows,
    });
  });

  return sheets;
}

/**
 * Universal file parser for Excel, CSV, or Word documents
 */
export async function parseImportFile(file: File): Promise<ParsedSheet[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
    return parseSpreadsheetFile(file);
  }

  if (extension === 'docx') {
    return parseWordDocument(file);
  }

  throw new Error(`Định dạng file .${extension} chưa được hỗ trợ trực tiếp. Vui lòng sử dụng .xlsx, .xls, .csv hoặc .docx`);
}

/**
 * Detects duplicate students by full name or student code
 */
export function checkDuplicates(
  incomingStudents: { fullName: string; studentCode?: string }[],
  existingStudents: { fullName: string; studentCode?: string }[]
): { hasDuplicates: boolean; duplicates: string[] } {
  const existingSet = new Set<string>();
  for (const s of existingStudents) {
    if (s.studentCode) existingSet.add(`code:${normalizeHeader(s.studentCode)}`);
    existingSet.add(`name:${normalizeHeader(s.fullName)}`);
  }

  const duplicates: string[] = [];
  for (const incoming of incomingStudents) {
    const nameKey = `name:${normalizeHeader(incoming.fullName)}`;
    const codeKey = incoming.studentCode ? `code:${normalizeHeader(incoming.studentCode)}` : null;

    if (existingSet.has(nameKey) || (codeKey && existingSet.has(codeKey))) {
      duplicates.push(incoming.fullName + (incoming.studentCode ? ` (${incoming.studentCode})` : ''));
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}
