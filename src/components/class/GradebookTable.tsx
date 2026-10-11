import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Printer,
  Save,
  Check,
  AlertTriangle,
  RotateCcw,
  FileText,
  PieChart,
  Sparkles,
} from 'lucide-react';
import { ClassData, StudentData, StudentGrades, GradeColumnConfig, GradingConfig } from '../../types';
import { GardenButton } from '../common/GardenButton';
import { GardenModal } from '../common/GardenModal';
import { GardenInput } from '../common/GardenInput';
import {
  validateScore,
  calculateSemesterAverage,
  calculateAnnualAverage,
  getAcademicClassification,
} from '../../services/gradeEngine';
import { exportGradebookToExcel } from '../../services/exportService';
import { ExportGradebookModal } from './ExportGradebookModal';
import { AcademicDistributionCard } from './AcademicDistributionCard';
import { StudentAvatar } from '../../utils/zodiacHelper';
import { WeySticker } from '../../utils/weyStickers';

interface GradebookTableProps {
  classData: ClassData;
  students: StudentData[];
  gradesMap: Record<string, StudentGrades>;
  gradingConfig: GradingConfig;
  onSaveGrade: (grade: StudentGrades) => Promise<void>;
  onBatchSaveGrades: (grades: StudentGrades[]) => Promise<void>;
  onUpdateClassColumns: (hk1Columns: GradeColumnConfig[], hk2Columns: GradeColumnConfig[]) => Promise<void>;
  onOpenImport: () => void;
}

export const GradebookTable: React.FC<GradebookTableProps> = ({
  classData,
  students,
  gradesMap,
  gradingConfig,
  onSaveGrade,
  onBatchSaveGrades,
  onUpdateClassColumns,
  onOpenImport,
}) => {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [localGrades, setLocalGrades] = useState<Record<string, StudentGrades>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({}); // key: `${studentId}_${colId}`
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Column management modal
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<'regular' | 'midterm' | 'final'>('regular');
  const [colToDelete, setColToDelete] = useState<GradeColumnConfig | null>(null);

  // Sync with prop
  useEffect(() => {
    setLocalGrades(gradesMap);
  }, [gradesMap]);

  const activeColumns: GradeColumnConfig[] =
    semester === 1
      ? classData.hk1Columns || []
      : classData.hk2Columns || [];

  // Helper to trigger debounced autosave
  const triggerDebouncedSave = (updatedGrade: StudentGrades) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSaveGrade(updatedGrade);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, 600);
  };

  const handleScoreChange = (studentId: string, colId: string, rawVal: string) => {
    const errorKey = `${studentId}_${colId}`;
    const validation = validateScore(rawVal, gradingConfig);

    if (!validation.isValid) {
      setCellErrors(prev => ({ ...prev, [errorKey]: validation.error || 'Điểm không hợp lệ' }));
      return;
    } else {
      setCellErrors(prev => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }

    const currentRecord: StudentGrades = localGrades[studentId] || {
      id: studentId,
      studentId,
      classId: classData.id,
      userId: classData.userId,
      hk1Scores: {},
      hk2Scores: {},
      updatedAt: new Date().toISOString(),
    };

    const targetScores = semester === 1 ? { ...currentRecord.hk1Scores } : { ...currentRecord.hk2Scores };
    targetScores[colId] = validation.value;

    // Recalculate semester average
    const columns = semester === 1 ? classData.hk1Columns || [] : classData.hk2Columns || [];
    const semAvgResult = calculateSemesterAverage(targetScores, columns, gradingConfig);

    let updatedRecord: StudentGrades = {
      ...currentRecord,
      hk1Scores: semester === 1 ? targetScores : currentRecord.hk1Scores,
      hk2Scores: semester === 2 ? targetScores : currentRecord.hk2Scores,
      hk1Average: semester === 1 ? semAvgResult.average : currentRecord.hk1Average,
      hk2Average: semester === 2 ? semAvgResult.average : currentRecord.hk2Average,
      updatedAt: new Date().toISOString(),
    };

    // If HK2, also calculate Annual Average
    if (semester === 2 || updatedRecord.hk2Average !== undefined) {
      const annualResult = calculateAnnualAverage(
        updatedRecord.hk1Average ?? null,
        updatedRecord.hk2Average ?? null,
        gradingConfig
      );
      updatedRecord.annualAverage = annualResult.average;
    }

    setLocalGrades(prev => ({
      ...prev,
      [studentId]: updatedRecord,
    }));

    triggerDebouncedSave(updatedRecord);
  };

  // Keyboard navigation & Excel multi-cell paste support
  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startStudentIndex: number,
    startColId: string
  ) => {
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    // If paste data has newlines or tabs, it's multi-cell data!
    if (pasteData.includes('\n') || pasteData.includes('\t')) {
      e.preventDefault();
      const rows = pasteData.trim().split(/\r\n|\n|\r/);
      const colIndex = activeColumns.findIndex(c => c.id === startColId);
      if (colIndex < 0) return;

      const updatedGradesToSave: StudentGrades[] = [];
      const newGradesMap = { ...localGrades };

      rows.forEach((rowStr, rOffset) => {
        const targetStudent = students[startStudentIndex + rOffset];
        if (!targetStudent) return;

        const cells = rowStr.split('\t');
        let currentRecord: StudentGrades = newGradesMap[targetStudent.id] || {
          id: targetStudent.id,
          studentId: targetStudent.id,
          classId: classData.id,
          userId: classData.userId,
          hk1Scores: {},
          hk2Scores: {},
          updatedAt: new Date().toISOString(),
        };

        const targetScores =
          semester === 1 ? { ...currentRecord.hk1Scores } : { ...currentRecord.hk2Scores };

        cells.forEach((cellVal, cOffset) => {
          const targetCol = activeColumns[colIndex + cOffset];
          if (!targetCol) return;

          const validation = validateScore(cellVal.trim(), gradingConfig);
          if (validation.isValid) {
            targetScores[targetCol.id] = validation.value;
          }
        });

        const columns = semester === 1 ? classData.hk1Columns || [] : classData.hk2Columns || [];
        const semAvg = calculateSemesterAverage(targetScores, columns, gradingConfig);

        const updated: StudentGrades = {
          ...currentRecord,
          hk1Scores: semester === 1 ? targetScores : currentRecord.hk1Scores,
          hk2Scores: semester === 2 ? targetScores : currentRecord.hk2Scores,
          hk1Average: semester === 1 ? semAvg.average : currentRecord.hk1Average,
          hk2Average: semester === 2 ? semAvg.average : currentRecord.hk2Average,
          updatedAt: new Date().toISOString(),
        };

        if (semester === 2) {
          const annual = calculateAnnualAverage(
            updated.hk1Average ?? null,
            updated.hk2Average ?? null,
            gradingConfig
          );
          updated.annualAverage = annual.average;
        }

        newGradesMap[targetStudent.id] = updated;
        updatedGradesToSave.push(updated);
      });

      setLocalGrades(newGradesMap);
      setSaveStatus('saving');
      onBatchSaveGrades(updatedGradesToSave).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      });
    }
  };

  // Add Column
  const handleAddColumn = async () => {
    if (!newColName.trim()) return;
    const colId = `col_${Date.now()}`;
    const coefficient = newColType === 'regular' ? 1 : newColType === 'midterm' ? 2 : 3;
    const newCol: GradeColumnConfig = {
      id: colId,
      name: newColName.trim(),
      type: newColType,
      coefficient,
    };

    const hk1 = [...(classData.hk1Columns || [])];
    const hk2 = [...(classData.hk2Columns || [])];

    if (semester === 1) hk1.push(newCol);
    else hk2.push(newCol);

    await onUpdateClassColumns(hk1, hk2);
    setNewColName('');
    setIsColModalOpen(false);
  };

  // Delete Column
  const confirmDeleteColumn = async () => {
    if (!colToDelete) return;
    const hk1 = (classData.hk1Columns || []).filter(c => c.id !== colToDelete.id);
    const hk2 = (classData.hk2Columns || []).filter(c => c.id !== colToDelete.id);

    await onUpdateClassColumns(hk1, hk2);
    setColToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 bg-[#fbf9f4] p-2.5 sm:p-3.5 rounded-xl border border-[#cbdfcb]">
        {/* Semester switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#eef5ee] rounded-lg border border-[#cbdfcb] shrink-0 self-start md:self-auto">
          <button
            onClick={() => setSemester(1)}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all cursor-pointer ${
              semester === 1
                ? 'bg-white text-[#293e2b] shadow-xs'
                : 'text-[#5d905f] hover:text-[#293e2b]'
            }`}
          >
            HỌC KỲ I
          </button>
          <button
            onClick={() => setSemester(2)}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all cursor-pointer ${
              semester === 2
                ? 'bg-white text-[#293e2b] shadow-xs'
                : 'text-[#5d905f] hover:text-[#293e2b]'
            }`}
          >
            HỌC KỲ II & CẢ NĂM
          </button>
        </div>

        {/* Action buttons & autosave status */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Autosave status indicator */}
          <div className="text-[11px] sm:text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium text-[#5d905f]">
            {saveStatus === 'saving' && (
              <span className="text-amber-700 flex items-center gap-1 animate-pulse">
                <RotateCcw className="w-3 h-3 animate-spin" /> <span className="hidden sm:inline">Đang lưu...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3" /> <span className="hidden sm:inline">Đã lưu</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> <span className="hidden sm:inline">Lỗi lưu</span>
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-[#7eac7f] flex items-center gap-1">
                <Save className="w-3 h-3" /> <span className="hidden lg:inline">Tự động lưu</span>
              </span>
            )}
          </div>

          <GardenButton
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsColModalOpen(true)}
            className="text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5"
            title="Thêm cột kiểm tra điểm mới"
          >
            <span className="hidden sm:inline">Thêm </span>cột
          </GardenButton>

          <GardenButton
            variant="outline"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={onOpenImport}
            className="text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5"
            title="Import điểm từ file Excel / Word"
          >
            Import
          </GardenButton>

          <GardenButton
            variant="primary"
            size="sm"
            icon={<FileText className="w-3.5 h-3.5" />}
            onClick={() => setIsExportModalOpen(true)}
            title="Xuất báo cáo PDF, Word (.docx), Excel (.xlsx) chuẩn quy định Bộ Giáo dục & Đào tạo"
            className="text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3"
          >
            <span className="hidden sm:inline">Xuất </span>Báo cáo Bộ GD
          </GardenButton>

          <GardenButton
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => exportGradebookToExcel(classData, students, localGrades, semester)}
            className="text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5"
            title="Xuất bảng điểm ra file Excel"
          >
            Excel
          </GardenButton>

          <GardenButton
            variant="outline"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
            className="text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5 hidden xs:inline-flex"
            title="In bảng điểm"
          >
            In
          </GardenButton>
        </div>
      </div>

      {/* MoET Guideline Notice */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#5d905f] px-1 gap-1">
        <span>
          📌 Điểm trung bình tính theo <strong>Thông tư 22/2021/TT-BGDĐT</strong> (ĐGtx hệ số 1, GK hệ số 2, CK hệ số 3).
          Nhập số từ 0 - 10. Hỗ trợ copy/paste nhiều ô từ Excel.
        </span>
        <span className="text-[10px] sm:text-[11px] text-[#467348] font-semibold flex items-center gap-1 shrink-0">
          ↔ Vuốt ngang bảng để xem & nhập điểm
        </span>
      </div>

      {/* Grade Table / Spreadsheet */}
      <div className="overflow-x-auto touch-scroll rounded-xl border border-[#cbdfcb] bg-white shadow-xs max-h-[72vh]">
        <table className="w-full text-xs text-left border-collapse">
          {/* Header Row */}
          <thead className="bg-[#f4f8f4] text-[#293e2b] font-semibold sticky top-0 z-20 shadow-xs">
            <tr className="border-b border-[#cbdfcb]">
              <th className="py-2.5 px-2 w-9 sm:w-11 text-center sticky left-0 bg-[#f4f8f4] z-30">STT</th>
              <th className="py-2.5 px-2.5 w-20 sm:w-24 hidden md:table-cell">Mã HS</th>
              <th className="py-2.5 px-2.5 sm:px-4 min-w-[125px] sm:min-w-[170px] sticky left-9 sm:left-11 bg-[#f4f8f4] z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                Họ và tên
              </th>

              {/* Flexible Grade Columns */}
              {activeColumns.map(col => (
                <th key={col.id} className="py-2.5 px-2 text-center min-w-[70px] relative group">
                  <div className="flex items-center justify-center gap-1">
                    <span>{col.name}</span>
                    <button
                      onClick={() => setColToDelete(col)}
                      title={`Xóa cột ${col.name}`}
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition-opacity p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="block text-[10px] font-normal text-[#7eac7f]">
                    {col.type === 'regular'
                      ? 'TX'
                      : col.type === 'midterm'
                      ? 'GK (x2)'
                      : 'CK (x3)'}
                  </span>
                </th>
              ))}

              {/* Semester Average Column */}
              <th className="py-2.5 px-3 text-center min-w-[85px] bg-[#eef5ee] text-[#293e2b] font-bold">
                ĐTB HK{semester}
              </th>

              {/* Annual Average & Classification in HK2 */}
              {semester === 2 && (
                <>
                  <th className="py-2.5 px-3 text-center min-w-[85px] bg-[#e5f0e5] text-[#293e2b] font-bold">
                    ĐTB Cả Năm
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[85px] bg-[#eef5ee] text-[#293e2b] font-semibold">
                    Xếp loại
                  </th>
                </>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#e5f0e5]">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColumns.length + (semester === 2 ? 6 : 4)}
                  className="py-12 text-center text-[#5d905f]"
                >
                  🌱 Lớp chưa có học sinh nào. Hãy chuyển qua tab <strong>Học sinh</strong> để thêm hoặc import.
                </td>
              </tr>
            ) : (
              students.map((student, sIdx) => {
                const gradeRecord = localGrades[student.id];
                const scoreObj =
                  semester === 1
                    ? gradeRecord?.hk1Scores || {}
                    : gradeRecord?.hk2Scores || {};

                const semAvg = semester === 1 ? gradeRecord?.hk1Average : gradeRecord?.hk2Average;
                const annualAvg = gradeRecord?.annualAverage;
                const classification = getAcademicClassification(annualAvg ?? null);

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-[#fbf9f4] transition-colors group"
                  >
                    <td className="py-2 px-1.5 sm:px-2 text-center font-mono tabular-nums text-neutral-500 sticky left-0 bg-white group-hover:bg-[#fbf9f4] z-10 w-9 sm:w-11">
                      {sIdx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#5d905f] hidden md:table-cell">
                      {student.studentCode || '—'}
                    </td>
                    <td className="py-2 px-2.5 sm:px-4 font-semibold text-[#293e2b] whitespace-nowrap sticky left-9 sm:left-11 bg-white group-hover:bg-[#fbf9f4] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] min-w-[125px] sm:min-w-[170px]">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <StudentAvatar
                          dob={student.dateOfBirth}
                          gender={student.gender}
                          zodiac={student.zodiac}
                          name={student.fullName}
                          size={32}
                          className="sm:w-9 sm:h-9"
                          showBadge
                        />
                        <span className="truncate max-w-[105px] sm:max-w-[160px] md:max-w-none text-xs">{student.fullName}</span>
                      </div>
                    </td>

                    {/* Grade Cells */}
                    {activeColumns.map(col => {
                      const val = scoreObj[col.id];
                      const errorKey = `${student.id}_${col.id}`;
                      const hasError = !!cellErrors[errorKey];

                      return (
                        <td key={col.id} className="py-1 px-1 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={val !== undefined && val !== null ? val : ''}
                            placeholder="—"
                            onChange={e => handleScoreChange(student.id, col.id, e.target.value)}
                            onPaste={e => handlePaste(e, sIdx, col.id)}
                            className={`w-12 sm:w-14 text-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded font-mono tabular-nums text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-[#467348] min-h-[32px] ${
                              hasError
                                ? 'bg-rose-50 border border-rose-400 text-rose-700'
                                : 'bg-[#fcfbf9] border border-[#cbdfcb] hover:border-[#7eac7f] text-[#293e2b]'
                            }`}
                          />
                        </td>
                      );
                    })}

                    {/* Semester Average */}
                    <td className="py-2 px-3 text-center font-mono font-bold tabular-nums bg-[#f7faf7] text-[#395c3b]">
                      {typeof semAvg === 'number' ? (
                        semAvg.toFixed(1)
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-normal">Chưa đủ điểm</span>
                      )}
                    </td>

                    {/* Annual Average and Classification */}
                    {semester === 2 && (
                      <>
                        <td className="py-2 px-3 text-center font-mono font-bold tabular-nums bg-[#eef5ee] text-[#293e2b]">
                          {typeof annualAvg === 'number' ? (
                            annualAvg.toFixed(1)
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-normal">Chưa đủ</span>
                          )}
                        </td>
                        <td className={`py-2 px-3 text-center text-xs ${classification.color}`}>
                          {classification.level}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Khung phân loại học lực học sinh nằm dưới khung nhập điểm */}
      <div className="no-print pt-2">
        <AcademicDistributionCard
          classData={classData}
          students={students}
          gradesMap={localGrades}
          defaultSemester={semester}
        />
      </div>

      {/* Add Column Modal */}
      <GardenModal
        isOpen={isColModalOpen}
        onClose={() => setIsColModalOpen(false)}
        title="Thêm Cột Điểm Mới"
        subtitle={`Thêm cột điểm cho ${semester === 1 ? 'Học kỳ I' : 'Học kỳ II'}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <GardenInput
            label="Tên cột điểm *"
            placeholder="Ví dụ: Miệng, 15 phút, TX4..."
            value={newColName}
            onChange={e => setNewColName(e.target.value)}
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Loại điểm *</label>
            <select
              value={newColType}
              onChange={e => setNewColType(e.target.value as any)}
              className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
            >
              <option value="regular">Đánh giá thường xuyên (Hệ số 1)</option>
              <option value="midterm">Đánh giá giữa kỳ (Hệ số 2)</option>
              <option value="final">Đánh giá cuối kỳ (Hệ số 3)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <GardenButton variant="outline" onClick={() => setIsColModalOpen(false)}>
              Hủy
            </GardenButton>
            <GardenButton variant="primary" onClick={handleAddColumn} disabled={!newColName.trim()}>
              Thêm cột
            </GardenButton>
          </div>
        </div>
      </GardenModal>

      {/* Confirm Delete Column Modal */}
      <GardenModal
        isOpen={!!colToDelete}
        onClose={() => setColToDelete(null)}
        title="Xác nhận xóa cột điểm"
        subtitle="Hành động này sẽ xóa dữ liệu điểm trong cột này"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#293e2b]">
            Bạn có chắc chắn muốn xóa cột <strong>{colToDelete?.name}</strong>? Toàn bộ điểm học sinh đã nhập ở cột này sẽ bị loại bỏ khỏi bảng tính.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <GardenButton variant="outline" onClick={() => setColToDelete(null)}>
              Hủy
            </GardenButton>
            <GardenButton variant="danger" onClick={confirmDeleteColumn}>
              Xóa cột
            </GardenButton>
          </div>
        </div>
      </GardenModal>

      {/* Official MoET Export Modal (PDF, DOCX, EXCEL) */}
      <ExportGradebookModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        classData={classData}
        students={students}
        gradesMap={localGrades}
      />
    </div>
  );
};
