import React, { useState } from 'react';
import { Sparkles, Check, X, ArrowRight, AlertCircle, BookOpen } from 'lucide-react';
import {
  ClassData,
  StudentData,
  StudentGrades,
  StudentPointRecord,
  PointConversionConfig,
} from '../../types';
import { calculateStudentPointSummary } from '../../services/gradeEngine';
import { GardenButton } from '../common/GardenButton';

interface ApplyBonusToGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  students: StudentData[];
  gradesMap: Record<string, StudentGrades>;
  pointRecords: StudentPointRecord[];
  conversionConfig: PointConversionConfig;
  onBatchSaveGrades: (grades: StudentGrades[]) => Promise<void>;
}

export const ApplyBonusToGradeModal: React.FC<ApplyBonusToGradeModalProps> = ({
  isOpen,
  onClose,
  classData,
  students,
  gradesMap,
  pointRecords,
  conversionConfig,
  onBatchSaveGrades,
}) => {
  const [semester, setSemester] = useState<1 | 2>(1);
  const currentColumns = semester === 1 ? classData.hk1Columns || [] : classData.hk2Columns || [];
  const regularColumns = currentColumns.filter(c => c.type === 'regular');
  const [targetColumnId, setTargetColumnId] = useState<string>(
    regularColumns[0]?.id || currentColumns[0]?.id || 'tx1'
  );
  const [onlyPositive, setOnlyPositive] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  // Calculate summaries for each student
  const studentPreviews = students.map(s => {
    const sRecords = pointRecords.filter(r => r.studentId === s.id);
    const summary = calculateStudentPointSummary(sRecords, conversionConfig);

    const existingGrade = gradesMap[s.id] || {
      id: s.id,
      studentId: s.id,
      classId: classData.id,
      userId: classData.userId,
      hk1Scores: {},
      hk2Scores: {},
      updatedAt: new Date().toISOString(),
    };

    const scoreMap = semester === 1 ? existingGrade.hk1Scores : existingGrade.hk2Scores;
    const currentScore = scoreMap[targetColumnId] ?? null;

    let adjustment = summary.netScoreAdjustment;
    if (onlyPositive && adjustment < 0) {
      adjustment = summary.convertedBonus; // Only apply bonus, don't penalize
    }

    let newScore: number | null = currentScore;
    if (adjustment !== 0) {
      const base = currentScore !== null ? currentScore : 0;
      newScore = Math.min(10, Math.max(0, Math.round((base + adjustment) * 10) / 10));
    }

    return {
      student: s,
      summary,
      currentScore,
      adjustment,
      newScore,
      hasChange: adjustment !== 0 && currentScore !== null,
    };
  });

  const studentsWithChanges = studentPreviews.filter(p => p.adjustment !== 0);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const updatedGradesList: StudentGrades[] = [];

      studentPreviews.forEach(p => {
        if (p.adjustment === 0) return;

        const existingGrade = gradesMap[p.student.id] || {
          id: p.student.id,
          studentId: p.student.id,
          classId: classData.id,
          userId: classData.userId,
          hk1Scores: {},
          hk2Scores: {},
          updatedAt: new Date().toISOString(),
        };

        const scoreMapKey = semester === 1 ? 'hk1Scores' : 'hk2Scores';
        const currentScores = { ...existingGrade[scoreMapKey] };
        currentScores[targetColumnId] = p.newScore;

        updatedGradesList.push({
          ...existingGrade,
          [scoreMapKey]: currentScores,
          updatedAt: new Date().toISOString(),
        });
      });

      if (updatedGradesList.length > 0) {
        await onBatchSaveGrades(updatedGradesList);
      }
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const selectedColName = currentColumns.find(c => c.id === targetColumnId)?.name || targetColumnId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#cbdfcb] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#cbdfcb] bg-gradient-to-r from-[#eef5ee] to-[#f7faf7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#467348] text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-garden text-lg font-bold text-[#293e2b]">
                Quy đổi Điểm thưởng vào Sổ điểm
              </h3>
              <p className="text-xs text-[#5d905f]">
                Lớp {classData.name} · Tự động tính và cộng điểm tích lũy vào cột điểm đã chọn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5d905f] hover:text-[#293e2b] hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#f4f8f4] border border-[#cbdfcb]">
            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1">
                Chọn Học kỳ
              </label>
              <div className="flex rounded-lg border border-[#cbdfcb] overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setSemester(1)}
                  className={`flex-1 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    semester === 1 ? 'bg-[#467348] text-white' : 'text-[#395c3b] hover:bg-[#f4f8f4]'
                  }`}
                >
                  Học kỳ 1
                </button>
                <button
                  type="button"
                  onClick={() => setSemester(2)}
                  className={`flex-1 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    semester === 2 ? 'bg-[#467348] text-white' : 'text-[#395c3b] hover:bg-[#f4f8f4]'
                  }`}
                >
                  Học kỳ 2
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1">
                Cột điểm nhận điểm thưởng *
              </label>
              <select
                value={targetColumnId}
                onChange={e => setTargetColumnId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] font-medium focus:ring-1 focus:ring-[#467348]"
              >
                {currentColumns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.type === 'regular' ? 'TX' : col.type === 'midterm' ? 'GK' : 'CK'}, Hệ số {col.coefficient})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Option: Only positive or both */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="onlyPositive"
              checked={onlyPositive}
              onChange={e => setOnlyPositive(e.target.checked)}
              className="w-4 h-4 rounded text-[#467348] focus:ring-[#467348] border-[#cbdfcb] cursor-pointer"
            />
            <label htmlFor="onlyPositive" className="text-xs font-medium text-[#293e2b] cursor-pointer">
              Chỉ cộng điểm thưởng (không trừ điểm vào bài kiểm tra của học sinh có điểm trừ)
            </label>
          </div>

          {/* Rule note */}
          <div className="p-3 rounded-xl bg-white border border-[#cbdfcb] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#467348] font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Quy tắc đang áp dụng:</span>
            </div>
            <p className="text-[#395c3b]">
              Cứ <b>{conversionConfig.bonusPointsNeeded}</b> điểm cộng ➔ +<b>{conversionConfig.bonusScoreAdded}</b>đ (tối đa +{conversionConfig.maxBonusScore}đ). Điểm số tối đa trong sổ là 10.0 điểm.
            </p>
          </div>

          {/* Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#293e2b] uppercase tracking-wider">
                Bảng xem trước kết quả quy đổi ({studentsWithChanges.length} học sinh có điểm thưởng)
              </h4>
              <span className="text-[11px] text-[#5d905f]">
                Cột mục tiêu: <b>{selectedColName}</b>
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-[#cbdfcb]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#f4f8f4] text-[#293e2b] sticky top-0 border-b border-[#cbdfcb]">
                  <tr>
                    <th className="p-2 w-10 text-center">STT</th>
                    <th className="p-2">Học sinh</th>
                    <th className="p-2 text-center">Điểm cộng / trừ</th>
                    <th className="p-2 text-center">Điểm hiện tại</th>
                    <th className="p-2 text-center">Mức quy đổi</th>
                    <th className="p-2 text-center">Điểm sau quy đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbdfcb]/60 bg-white">
                  {studentsWithChanges.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-xs text-[#5d905f]">
                        Chưa có học sinh nào tích lũy đủ mốc điểm quy đổi (cần tối thiểu {conversionConfig.bonusPointsNeeded} điểm cộng).
                      </td>
                    </tr>
                  ) : (
                    studentsWithChanges.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-[#fbf9f5]">
                        <td className="p-2 text-center font-medium text-[#5d905f]">{idx + 1}</td>
                        <td className="p-2 font-medium text-[#293e2b]">
                          {item.student.fullName}
                          {item.student.studentCode && (
                            <span className="text-[10px] text-[#7eac7f] ml-1">({item.student.studentCode})</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-emerald-700 font-bold">+{item.summary.plusTotal}</span>
                          {item.summary.minusTotal > 0 && (
                            <span className="text-rose-700 font-bold ml-1">-{item.summary.minusTotal}</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold text-[#293e2b]">
                          {item.currentScore !== null ? item.currentScore : '—'}
                        </td>
                        <td className="p-2 text-center font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              item.adjustment > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold text-[#467348]">
                          {item.newScore !== null ? item.newScore : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#cbdfcb] bg-[#fbf9f5] flex items-center justify-between gap-3">
          <span className="text-xs text-[#5d905f]">
            Sẽ cập nhật điểm vào cột <b>{selectedColName}</b> (HK{semester})
          </span>

          <div className="flex items-center gap-2">
            <GardenButton variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </GardenButton>
            <GardenButton
              variant="primary"
              size="sm"
              disabled={isApplying || studentsWithChanges.length === 0}
              onClick={handleApply}
              icon={<Check className="w-4 h-4" />}
            >
              {isApplying ? 'Đang lưu sổ điểm...' : 'Xác nhận áp dụng vào Sổ điểm'}
            </GardenButton>
          </div>
        </div>
      </div>
    </div>
  );
};
