import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { GardenModal } from '../common/GardenModal';
import { GardenButton } from '../common/GardenButton';
import {
  parseImportFile,
  ParsedSheet,
  guessFieldMapping,
  checkDuplicates,
  STUDENT_SYSTEM_FIELDS,
} from '../../services/importParser';
import { ClassData, StudentData, StudentGrades, GradeColumnConfig } from '../../types';
import { validateScore } from '../../services/gradeEngine';
import {
  resolveStudentAvatar,
  StudentAvatar,
  ZODIAC_SIGNS,
} from '../../utils/zodiacHelper';
import { WeySticker } from '../../utils/weyStickers';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData?: ClassData;
  availableClasses?: ClassData[];
  existingStudents: StudentData[];
  onImportStudents: (newStudents: StudentData[], targetClassId?: string) => Promise<void>;
  onImportGrades?: (updatedGrades: StudentGrades[]) => Promise<void>;
  onImport19Classes?: () => Promise<void>;
}

type ImportType = 'students' | 'grades';
type Step = 1 | 2 | 3 | 4 | 5;

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  classData,
  availableClasses = [],
  existingStudents,
  onImportStudents,
  onImportGrades,
  onImport19Classes,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [importType, setImportType] = useState<ImportType>('students');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedTargetClassId, setSelectedTargetClassId] = useState<string>(
    classData?.id || availableClasses[0]?.id || ''
  );

  // Sync selectedTargetClassId if classData or availableClasses change
  React.useEffect(() => {
    if (classData?.id) {
      setSelectedTargetClassId(classData.id);
    } else if (availableClasses.length > 0 && !selectedTargetClassId) {
      setSelectedTargetClassId(availableClasses[0].id);
    }
  }, [classData, availableClasses]);

  // File parsing states
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);

  // Mapping state: { [systemField]: sourceColumn }
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Validation results
  const [validatedStudents, setValidatedStudents] = useState<StudentData[]>([]);
  const [validatedGrades, setValidatedGrades] = useState<StudentGrades[]>([]);
  const [duplicatesWarning, setDuplicatesWarning] = useState<string[]>([]);
  const [invalidRowsCount, setInvalidRowsCount] = useState(0);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setParseError('');
    setSheets([]);
    setSelectedSheetIndex(0);
    setColumnMapping({});
    setValidatedStudents([]);
    setValidatedGrades([]);
    setDuplicatesWarning([]);
    setInvalidRowsCount(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);
    setParseError('');

    try {
      const parsedSheets = await parseImportFile(uploadedFile);
      if (parsedSheets.length === 0 || parsedSheets[0].rows.length === 0) {
        throw new Error('File không chứa dữ liệu hợp lệ.');
      }

      setSheets(parsedSheets);
      setSelectedSheetIndex(0);

      // Auto guess column mapping for first sheet
      const firstSheet = parsedSheets[0];
      const initialMap: Record<string, string> = {};

      if (importType === 'students') {
        STUDENT_SYSTEM_FIELDS.forEach(field => {
          for (const col of firstSheet.headers) {
            const guessed = guessFieldMapping(col, [field]);
            if (guessed === field.id && !initialMap[field.id]) {
              initialMap[field.id] = col;
              break;
            }
          }
        });
      } else if (importType === 'grades') {
        // Map student name/code
        for (const col of firstSheet.headers) {
          const guessed = guessFieldMapping(col);
          if (guessed === 'fullName' && !initialMap['fullName']) {
            initialMap['fullName'] = col;
          }
          if (guessed === 'studentCode' && !initialMap['studentCode']) {
            initialMap['studentCode'] = col;
          }
        }
        // Map grade columns
        const gradeCols =
          selectedSemester === 1
            ? classData?.hk1Columns || []
            : classData?.hk2Columns || [];
        gradeCols.forEach(col => {
          const match = firstSheet.headers.find(h =>
            h.toLowerCase().includes(col.name.toLowerCase())
          );
          if (match) initialMap[col.id] = match;
        });
      }

      setColumnMapping(initialMap);
      setStep(2); // Go to preview
    } catch (err: any) {
      setParseError(err.message || 'Lỗi đọc file');
    } finally {
      setIsParsing(false);
    }
  };

  const handleRunValidation = () => {
    const currentSheet = sheets[selectedSheetIndex];
    if (!currentSheet) return;

    const effectiveClass =
      classData || availableClasses.find(c => c.id === selectedTargetClassId) || availableClasses[0];
    const targetId = effectiveClass?.id || selectedTargetClassId || '';
    const targetUserId = effectiveClass?.userId || '';

    if (!targetId && importType === 'students') {
      setParseError('Chưa có lớp học nào được chọn để tiếp nhận học sinh. Vui lòng tạo lớp trước.');
      return;
    }

    if (importType === 'students') {
      const nameCol = columnMapping['fullName'];
      if (!nameCol) {
        setParseError('Vui lòng chọn cột tương ứng với Họ và tên học sinh.');
        return;
      }

      const validList: StudentData[] = [];
      let invalidCount = 0;

      currentSheet.rows.forEach((row, idx) => {
        const fullName = String(row[nameCol] || '').trim();
        if (!fullName) {
          invalidCount++;
          return;
        }

        const studentCode = columnMapping['studentCode']
          ? String(row[columnMapping['studentCode']] || '').trim()
          : '';
        const dateOfBirth = columnMapping['dateOfBirth']
          ? String(row[columnMapping['dateOfBirth']] || '').trim()
          : '';
        const gender = columnMapping['gender']
          ? String(row[columnMapping['gender']] || '').trim()
          : '';
        const note = columnMapping['note']
          ? String(row[columnMapping['note']] || '').trim()
          : '';

        const { zodiac, avatarUrl } = resolveStudentAvatar(dateOfBirth, gender);

        validList.push({
          id: `stu_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          classId: targetId,
          userId: targetUserId,
          fullName,
          studentCode,
          dateOfBirth,
          gender,
          zodiac: zodiac?.key,
          avatar: avatarUrl,
          note,
          order: existingStudents.length + validList.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      // Check duplicates with existing students
      const dupCheck = checkDuplicates(validList, existingStudents);
      setDuplicatesWarning(dupCheck.duplicates);
      setValidatedStudents(validList);
      setInvalidRowsCount(invalidCount);
      setStep(4);
    } else {
      // Validate grades
      const gradeCols =
        selectedSemester === 1
          ? classData?.hk1Columns || []
          : classData?.hk2Columns || [];

      const gradesToSave: StudentGrades[] = [];
      let invalidCount = 0;

      currentSheet.rows.forEach(row => {
        const nameVal = columnMapping['fullName']
          ? String(row[columnMapping['fullName']] || '').trim()
          : '';
        const codeVal = columnMapping['studentCode']
          ? String(row[columnMapping['studentCode']] || '').trim()
          : '';

        // Match student in class
        const targetStudent = existingStudents.find(
          s =>
            (codeVal && s.studentCode && s.studentCode === codeVal) ||
            s.fullName.toLowerCase() === nameVal.toLowerCase()
        );

        if (!targetStudent) {
          invalidCount++;
          return;
        }

        const scores: Record<string, number | null> = {};
        gradeCols.forEach(col => {
          const sourceCol = columnMapping[col.id];
          if (sourceCol && row[sourceCol] !== undefined) {
            const v = validateScore(row[sourceCol]);
            if (v.isValid) scores[col.id] = v.value;
          }
        });

        gradesToSave.push({
          id: targetStudent.id,
          studentId: targetStudent.id,
          classId: classData?.id || '',
          userId: classData?.userId || '',
          hk1Scores: selectedSemester === 1 ? scores : {},
          hk2Scores: selectedSemester === 2 ? scores : {},
          updatedAt: new Date().toISOString(),
        });
      });

      setValidatedGrades(gradesToSave);
      setInvalidRowsCount(invalidCount);
      setStep(4);
    }
  };

  const handleFinalConfirm = async () => {
    const effectiveClass =
      classData || availableClasses.find(c => c.id === selectedTargetClassId) || availableClasses[0];
    const targetId = effectiveClass?.id || selectedTargetClassId || '';

    if (importType === 'students') {
      await onImportStudents(validatedStudents, targetId);
    } else if (onImportGrades) {
      await onImportGrades(validatedGrades);
    }
    handleClose();
  };

  const currentSheet = sheets[selectedSheetIndex];
  const activeClass =
    classData || availableClasses.find(c => c.id === selectedTargetClassId) || availableClasses[0];

  return (
    <GardenModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Quy trình Import Dữ Liệu"
      subtitle={`Lớp ${activeClass?.name || 'Chưa chọn'} · Bước ${step}/5: ${
        step === 1
          ? 'Tải lên file'
          : step === 2
          ? 'Xem trước dữ liệu'
          : step === 3
          ? 'Ánh xạ cột'
          : step === 4
          ? 'Kiểm tra hợp lệ'
          : 'Xác nhận lưu'
      }`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#5d905f] border-b border-[#e5f0e5] pb-3">
          {[1, 2, 3, 4, 5].map(sNum => (
            <div
              key={sNum}
              className={`flex items-center gap-1.5 ${
                step === sNum
                  ? 'text-[#467348] font-bold'
                  : step > sNum
                  ? 'text-[#293e2b]'
                  : 'text-neutral-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === sNum
                    ? 'bg-[#467348] text-white'
                    : step > sNum
                    ? 'bg-[#cbdfcb] text-[#293e2b]'
                    : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {step > sNum ? '✓' : sNum}
              </span>
              <span className="hidden sm:inline">
                {sNum === 1
                  ? 'Upload'
                  : sNum === 2
                  ? 'Preview'
                  : sNum === 3
                  ? 'Mapping'
                  : sNum === 4
                  ? 'Kiểm tra'
                  : 'Lưu'}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Class target selector if not inside a specific class */}
            {!classData && (
              <div className="bg-[#f4f8f4] p-3.5 rounded-xl border border-[#cbdfcb] space-y-1.5">
                <label className="text-xs font-bold text-[#395c3b] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5d905f]" />
                  <span>Chọn lớp học tiếp nhận danh sách học sinh:</span>
                </label>
                {availableClasses.length > 0 ? (
                  <select
                    value={selectedTargetClassId}
                    onChange={e => setSelectedTargetClassId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
                  >
                    {availableClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name} ({c.grade} · {c.subject} — hiện có {c.studentCount || 0} HS)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-600">
                    Chưa có lớp học nào trong hệ thống. Vui lòng tạo lớp học trước khi import học sinh.
                  </p>
                )}
              </div>
            )}

            {/* Import Mode Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-[#395c3b]">Nội dung cần import:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportType('students')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    importType === 'students'
                      ? 'bg-[#467348] text-white'
                      : 'bg-[#f4f8f4] text-[#395c3b] border border-[#cbdfcb]'
                  }`}
                >
                  Danh sách học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setImportType('grades')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    importType === 'grades'
                      ? 'bg-[#467348] text-white'
                      : 'bg-[#f4f8f4] text-[#395c3b] border border-[#cbdfcb]'
                  }`}
                >
                  Bảng điểm học sinh
                </button>
              </div>
            </div>

            {importType === 'grades' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#395c3b]">Học kỳ nhập điểm:</span>
                <select
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                  className="px-2 py-1 rounded border border-[#cbdfcb] bg-white text-[#293e2b]"
                >
                  <option value={1}>Học kỳ I</option>
                  <option value={2}>Học kỳ II</option>
                </select>
              </div>
            )}

            {/* Quick 19 classes import card */}
            {onImport19Classes && (
              <div className="bg-gradient-to-r from-[#eef5ee] to-[#f4f8f4] border border-[#a7c8a7] p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#cbdfcb] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#467348]" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-[#293e2b]">
                      Nhập nhanh 19 lớp Khối 8 (840 học sinh)
                    </h5>
                    <p className="text-[11px] text-[#5d905f]">
                      Dữ liệu chính thức trường THCS Nguyễn Văn Trỗi: 8A1, 8A2, 8A3... đến 8A24 kèm họ tên, ngày sinh, giới tính và avatar cung hoàng đạo.
                    </p>
                  </div>
                </div>
                <GardenButton
                  variant="primary"
                  size="sm"
                  className="shrink-0"
                  onClick={async () => {
                    await onImport19Classes();
                    handleClose();
                  }}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Nhập ngay 19 lớp
                </GardenButton>
              </div>
            )}

            {/* Dropzone */}
            <div className="p-8 border-2 border-dashed border-[#cbdfcb] rounded-2xl bg-[#fcfbf9] text-center">
              <Upload className="w-10 h-10 mx-auto text-[#7eac7f] mb-2" />
              <h4 className="text-sm font-bold text-[#293e2b]">
                Kéo thả file vào đây hoặc bấm để chọn
              </h4>
              <p className="text-xs text-[#5d905f] mt-1 mb-4">
                Hỗ trợ định dạng: <strong>.xlsx, .xls, .csv, .docx, .doc</strong>
              </p>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#467348] text-white text-xs font-semibold hover:bg-[#395c3b] cursor-pointer shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Chọn file từ thiết bị</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx,.doc"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                />
              </label>

              {isParsing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#467348]">
                  <span className="w-3.5 h-3.5 border-2 border-[#467348] border-t-transparent rounded-full animate-spin" />
                  <span>Đang phân tích cấu trúc file...</span>
                </div>
              )}
            </div>

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === 2 && currentSheet && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5d905f]">Sheet / Bảng:</span>
                <select
                  value={selectedSheetIndex}
                  onChange={e => setSelectedSheetIndex(Number(e.target.value))}
                  className="text-xs font-bold text-[#293e2b] bg-white border border-[#cbdfcb] rounded-md px-2 py-1"
                >
                  {sheets.map((s, idx) => (
                    <option key={idx} value={idx}>
                      {s.sheetName} ({s.rows.length} dòng)
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-[#5d905f]">
                Tìm thấy <strong>{currentSheet.rows.length}</strong> dòng dữ liệu
              </span>
            </div>

            <div className="max-h-56 overflow-auto border border-[#cbdfcb] rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f4f8f4] text-[#293e2b] sticky top-0">
                  <tr className="border-b border-[#cbdfcb]">
                    {currentSheet.headers.map((h, i) => (
                      <th key={i} className="p-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5f0e5]">
                  {currentSheet.rows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#fbf9f4]">
                      {currentSheet.headers.map((h, cIdx) => (
                        <td key={cIdx} className="p-2 whitespace-nowrap text-neutral-600">
                          {String(row[h] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-[#7eac7f]">
              (Hiển thị trước 5 dòng đầu tiên. Bấm Tiếp tục để thiết lập ánh xạ cột).
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#e5f0e5]">
              <GardenButton variant="outline" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Chọn lại file
              </GardenButton>
              <GardenButton variant="primary" size="sm" onClick={() => setStep(3)}>
                Tiếp tục: Ánh xạ cột <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </GardenButton>
            </div>
          </div>
        )}

        {/* STEP 3: Column Mapping */}
        {step === 3 && currentSheet && (
          <div className="space-y-4">
            <p className="text-xs text-[#5d905f]">
              Chọn cột trong file tương ứng với từng trường hệ thống:
            </p>

            <div className="space-y-3 bg-[#fcfbf9] p-4 rounded-xl border border-[#cbdfcb]">
              {importType === 'students' ? (
                STUDENT_SYSTEM_FIELDS.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#293e2b]">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}:
                    </span>
                    <select
                      value={columnMapping[f.id] || ''}
                      onChange={e =>
                        setColumnMapping(prev => ({ ...prev, [f.id]: e.target.value }))
                      }
                      className="w-56 p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b]"
                    >
                      <option value="">-- Bỏ qua --</option>
                      {currentSheet.headers.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#293e2b]">Họ và tên học sinh *:</span>
                    <select
                      value={columnMapping['fullName'] || ''}
                      onChange={e =>
                        setColumnMapping(prev => ({ ...prev, fullName: e.target.value }))
                      }
                      className="w-56 p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b]"
                    >
                      <option value="">-- Chọn cột họ tên --</option>
                      {currentSheet.headers.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(selectedSemester === 1
                    ? classData?.hk1Columns || []
                    : classData?.hk2Columns || []
                  ).map(col => (
                    <div key={col.id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#293e2b]">
                        Cột điểm {col.name} ({col.type === 'regular' ? 'TX' : col.name}):
                      </span>
                      <select
                        value={columnMapping[col.id] || ''}
                        onChange={e =>
                          setColumnMapping(prev => ({ ...prev, [col.id]: e.target.value }))
                        }
                        className="w-56 p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b]"
                      >
                        <option value="">-- Bỏ qua cột này --</option>
                        {currentSheet.headers.map(h => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </>
              )}
            </div>

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {parseError}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#e5f0e5]">
              <GardenButton variant="outline" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại
              </GardenButton>
              <GardenButton variant="primary" size="sm" onClick={handleRunValidation}>
                Kiểm tra hợp lệ <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </GardenButton>
            </div>
          </div>
        )}

        {/* STEP 4: Validation */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#f4f8f4] border border-[#cbdfcb] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#467348] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {importType === 'students'
                    ? `Sẵn sàng import ${validatedStudents.length} học sinh`
                    : `Sẵn sàng cập nhật điểm cho ${validatedGrades.length} học sinh`}
                </span>
              </div>
              <p className="text-[#5d905f]">
                {invalidRowsCount > 0
                  ? `Đã bỏ qua ${invalidRowsCount} dòng trống hoặc không có thông tin học sinh.`
                  : 'Tất cả các dòng dữ liệu đều hợp lệ.'}
              </p>
            </div>

            {/* Student Preview with Avatars */}
            {importType === 'students' && validatedStudents.length > 0 && (
              <div className="bg-white rounded-xl border border-[#cbdfcb] p-3 space-y-2">
                <span className="text-[11px] font-bold text-[#293e2b] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#467348]" />
                  Xem trước nhận diện Cung hoàng đạo & Avatar ({Math.min(4, validatedStudents.length)} học sinh):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {validatedStudents.slice(0, 4).map((s, idx) => {
                    const zodiacInfo = s.zodiac ? ZODIAC_SIGNS[s.zodiac] : null;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#fbf9f4] border border-[#cbdfcb]/60">
                        <StudentAvatar
                          dob={s.dateOfBirth}
                          gender={s.gender}
                          zodiac={s.zodiac}
                          avatarUrl={s.avatar}
                          name={s.fullName}
                          size={32}
                          showBadge
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#293e2b] truncate">{s.fullName}</div>
                          <div className="text-[10px] text-[#5d905f] flex items-center gap-1">
                            <span>{s.dateOfBirth || 'Chưa có NS'}</span>
                            <span>•</span>
                            <span>{zodiacInfo ? `${zodiacInfo.nameVn} (${zodiacInfo.symbol})` : 'Mặc định'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Duplicates Warning */}
            {duplicatesWarning.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Phát hiện {duplicatesWarning.length} học sinh có thể bị trùng tên:</span>
                </div>
                <div className="max-h-24 overflow-y-auto text-amber-700 space-y-1 pl-6">
                  {duplicatesWarning.map((d, i) => (
                    <div key={i}>• {d}</div>
                  ))}
                </div>
                <p className="text-[11px] text-amber-800 italic">
                  Hệ thống sẽ không tự động ghi đè học sinh cũ nếu bạn chưa xác nhận.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#e5f0e5]">
              <GardenButton variant="outline" size="sm" onClick={() => setStep(3)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Sửa ánh xạ
              </GardenButton>
              <GardenButton variant="primary" size="sm" onClick={() => setStep(5)}>
                Bước cuối: Xem lại & Lưu <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </GardenButton>
            </div>
          </div>
        )}

        {/* STEP 5: Confirm */}
        {step === 5 && (
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto flex items-center justify-center">
              <WeySticker name="happy" size={64} />
            </div>

            <div>
              <h4 className="text-lg font-bold font-garden text-[#293e2b]">
                Xác nhận nạp dữ liệu vào lớp {classData?.name}
              </h4>
              <p className="text-xs text-[#5d905f] mt-1">
                {importType === 'students'
                  ? `Bạn sắp thêm ${validatedStudents.length} học sinh vào sổ danh sách lớp.`
                  : `Bạn sắp cập nhật điểm số cho ${validatedGrades.length} học sinh trong lớp.`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#cbdfcb] text-left text-xs space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-[#5d905f]">Dòng dữ liệu hợp lệ:</span>
                <span className="font-bold text-[#467348]">
                  {importType === 'students' ? validatedStudents.length : validatedGrades.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5d905f]">Dòng bị bỏ qua:</span>
                <span className="font-bold text-neutral-600">{invalidRowsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5d905f]">Học sinh có nguy cơ trùng:</span>
                <span className="font-bold text-amber-700">{duplicatesWarning.length}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <GardenButton variant="outline" onClick={() => setStep(4)}>
                Quay lại
              </GardenButton>
              <GardenButton variant="primary" onClick={handleFinalConfirm}>
                XÁC NHẬN IMPORT
              </GardenButton>
            </div>
          </div>
        )}
      </div>
    </GardenModal>
  );
};
