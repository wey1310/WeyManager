import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Award,
  Settings,
  Plus,
  BookOpen,
  Search,
  Trash2,
  Calendar,
  History,
  TrendingUp,
  Star,
  CheckCircle2,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  ClassData,
  StudentData,
  StudentGrades,
  StudentPointRecord,
  PointConversionConfig,
} from '../../types';
import { DEFAULT_POINT_CONVERSION_CONFIG, calculateStudentPointSummary } from '../../services/gradeEngine';
import { GardenButton } from '../common/GardenButton';
import { PointConversionRuleModal } from './PointConversionRuleModal';
import { AddPointModal } from './AddPointModal';
import { ApplyBonusToGradeModal } from './ApplyBonusToGradeModal';
import { StudentAvatar } from '../../utils/zodiacHelper';
import { WeySticker } from '../../utils/weyStickers';

interface StudentPointTrackerProps {
  classData: ClassData;
  students: StudentData[];
  gradesMap: Record<string, StudentGrades>;
  pointRecords: StudentPointRecord[];
  onSaveRecord: (record: StudentPointRecord) => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
  onSaveConversionConfig: (newConfig: PointConversionConfig, applyGlobally: boolean) => Promise<void>;
  onBatchSaveGrades: (grades: StudentGrades[]) => Promise<void>;
}

export const StudentPointTracker: React.FC<StudentPointTrackerProps> = ({
  classData,
  students,
  gradesMap,
  pointRecords,
  onSaveRecord,
  onDeleteRecord,
  onSaveConversionConfig,
  onBatchSaveGrades,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hasBonus' | 'hasPenalty' | 'convertible'>('all');
  const [viewMode, setViewMode] = useState<'roster' | 'history'>('roster');

  // Modals
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Quick add / specific student modal trigger
  const [selectedStudentForAdd, setSelectedStudentForAdd] = useState<string>('');
  const [selectedTypeForAdd, setSelectedTypeForAdd] = useState<'plus' | 'minus'>('plus');
  const [selectedReasonForAdd, setSelectedReasonForAdd] = useState<string>('');

  const config = classData.pointConversionConfig || DEFAULT_POINT_CONVERSION_CONFIG;

  // Calculate summaries for each student
  const studentSummaries = useMemo(() => {
    return students.map(s => {
      const sRecords = pointRecords.filter(r => r.studentId === s.id);
      const summary = calculateStudentPointSummary(sRecords, config);
      return {
        student: s,
        records: sRecords,
        ...summary,
      };
    });
  }, [students, pointRecords, config]);

  // Leaderboard (Top students by plus points)
  const topStudents = useMemo(() => {
    return [...studentSummaries]
      .filter(s => s.plusTotal > 0)
      .sort((a, b) => b.plusTotal - a.plusTotal || b.netPoints - a.netPoints)
      .slice(0, 3);
  }, [studentSummaries]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return studentSummaries.filter(item => {
      const matchSearch =
        item.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.student.studentCode && item.student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType === 'hasBonus') return item.plusTotal > 0;
      if (filterType === 'hasPenalty') return item.minusTotal > 0;
      if (filterType === 'convertible') return item.convertedBonus > 0 || item.convertedPenalty > 0;
      return true;
    });
  }, [studentSummaries, searchTerm, filterType]);

  // Quick 1-click point adding
  const handleQuickAddPoint = async (
    studentId: string,
    type: 'plus' | 'minus',
    reason: string,
    amount: number = 1
  ) => {
    const record: StudentPointRecord = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      classId: classData.id,
      userId: classData.userId,
      type,
      amount,
      reason,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    await onSaveRecord(record);
  };

  const openAddModalForStudent = (sId: string, type: 'plus' | 'minus' = 'plus', reason: string = '') => {
    setSelectedStudentForAdd(sId);
    setSelectedTypeForAdd(type);
    setSelectedReasonForAdd(reason);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Conversion Rules Highlight Card */}
      <div className="bg-gradient-to-br from-[#f4f8f4] via-white to-[#edf5ed] rounded-xl sm:rounded-2xl border border-[#cbdfcb] p-3.5 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2.5 sm:gap-4">
            <WeySticker name="happy" size={40} className="sm:w-12 sm:h-12 shrink-0" />
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="p-1 sm:p-1.5 rounded-lg bg-[#467348] text-white">
                  <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <h3 className="font-garden text-sm sm:text-base font-bold text-[#293e2b]">
                  Quy định Quy đổi Điểm Cộng & Điểm Trừ
                </h3>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-[#eef5ee] text-[#467348] border border-[#cbdfcb] font-semibold">
                  Áp dụng
                </span>
              </div>

            {/* Rules visual badges */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 pt-0.5 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white border border-[#cbdfcb] shadow-2xs text-[11px] sm:text-xs">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-semibold text-[#293e2b]">
                  🌸 Cứ <b>{config.bonusPointsNeeded}</b> điểm cộng ➔
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  +{config.bonusScoreAdded}đ
                </span>
                <span className="text-[10px] text-[#7eac7f] hidden xs:inline">
                  (Tối đa +{config.maxBonusScore}đ)
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white border border-[#f3d3be] shadow-2xs text-[11px] sm:text-xs">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="font-semibold text-[#8a3318]">
                  ⚠️ Cứ <b>{config.penaltyPointsNeeded}</b> điểm trừ ➔
                </span>
                <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">
                  -{config.penaltyScoreDeducted}đ
                </span>
                <span className="text-[10px] text-[#c27c65] hidden xs:inline">
                  (Tối đa -{config.maxPenaltyScore}đ)
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-2 lg:pt-0">
            <GardenButton
              variant="outline"
              size="sm"
              icon={<Settings className="w-3.5 h-3.5" />}
              onClick={() => setIsRuleModalOpen(true)}
              className="text-[11px] sm:text-xs py-1.5 px-2.5"
              title="Thay đổi số điểm cộng/trừ và tỉ lệ quy đổi điểm số"
            >
              Cài đặt
            </GardenButton>

            <GardenButton
              variant="secondary"
              size="sm"
              icon={<BookOpen className="w-3.5 h-3.5" />}
              onClick={() => setIsApplyModalOpen(true)}
              className="text-[11px] sm:text-xs py-1.5 px-2.5"
              title="Chuyển điểm quy đổi trực tiếp vào cột điểm trong sổ điểm"
            >
              Vào sổ điểm
            </GardenButton>

            <GardenButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => openAddModalForStudent(students[0]?.id || '', 'plus')}
              className="text-[11px] sm:text-xs py-1.5 px-2.5"
            >
              Ghi nhận điểm
            </GardenButton>
          </div>
        </div>
      </div>

      {/* 2. Top Honor Board (Vườn hoa thi đua) */}
      {topStudents.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#cbdfcb] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Award className="w-4 h-4" />
              </span>
              <h4 className="font-garden text-sm font-bold text-[#293e2b] uppercase tracking-wide">
                Vườn Hoa Điểm Tốt · Top Học Sinh Tích Cực Nhất
              </h4>
            </div>
            <span className="text-xs text-[#5d905f]">
              {pointRecords.length} lượt ghi nhận điểm trong lớp
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topStudents.map((item, idx) => {
              const medals = ['🥇', '🥈', '🥉'];
              const medalBgs = [
                'bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-300 text-amber-900',
                'bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-300 text-slate-800',
                'bg-gradient-to-br from-orange-50 to-orange-100/60 border-orange-300 text-orange-900',
              ];
              return (
                <div
                  key={item.student.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between shadow-2xs ${medalBgs[idx]}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{medals[idx]}</span>
                    <StudentAvatar
                      dob={item.student.dateOfBirth}
                      gender={item.student.gender}
                      zodiac={item.student.zodiac}
                      avatarUrl={item.student.avatar}
                      name={item.student.fullName}
                      size={36}
                      showBadge
                    />
                    <div>
                      <div className="font-bold text-xs">{item.student.fullName}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        {item.student.studentCode || `STT ${item.student.order || idx + 1}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-emerald-800 flex items-center justify-end gap-1">
                      <span>🌸</span>
                      <span>+{item.plusTotal}</span>
                    </div>
                    <div className="text-[11px] font-medium text-emerald-700">
                      Quy đổi: +{item.convertedBonus}đ
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. View Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbf9f4] p-3 rounded-xl border border-[#cbdfcb]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('roster')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'roster'
                ? 'bg-[#467348] text-white shadow-2xs'
                : 'bg-white text-[#395c3b] hover:bg-[#eef5ee] border border-[#cbdfcb]'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Danh sách tích điểm ({students.length})</span>
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'history'
                ? 'bg-[#467348] text-white shadow-2xs'
                : 'bg-white text-[#395c3b] hover:bg-[#eef5ee] border border-[#cbdfcb]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật ký hoạt động ({pointRecords.length})</span>
          </button>
        </div>

        {viewMode === 'roster' && (
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7eac7f]" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên, mã..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:ring-1 focus:ring-[#467348]"
              />
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:ring-1 focus:ring-[#467348]"
            >
              <option value="all">Tất cả</option>
              <option value="convertible">Đủ mốc quy đổi</option>
              <option value="hasBonus">Có điểm cộng</option>
              <option value="hasPenalty">Có điểm trừ</option>
            </select>
          </div>
        )}
      </div>

      {/* Swipe hint on mobile */}
      <div className="sm:hidden px-1 text-[11px] text-[#5d905f] flex items-center justify-between">
        <span>{viewMode === 'roster' ? `Danh sách ${students.length} học sinh` : `Nhật ký ${pointRecords.length} lần ghi nhận`}</span>
        <span className="text-[#467348] font-semibold">↔ Vuốt ngang xem đủ cột</span>
      </div>

      {/* 4. Main Body: Roster Table vs History View */}
      {viewMode === 'roster' ? (
        <div className="overflow-x-auto touch-scroll rounded-xl border border-[#cbdfcb] bg-white">
          <table className="w-full text-xs text-left border-collapse min-w-[680px] sm:min-w-[760px]">
            <thead className="bg-[#f4f8f4] text-[#293e2b] border-b border-[#cbdfcb] sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-2 w-9 sm:w-11 text-center font-bold sticky left-0 bg-[#f4f8f4] z-30">STT</th>
                <th className="py-2.5 px-2.5 sm:px-3 font-bold sticky left-9 sm:left-11 bg-[#f4f8f4] z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] min-w-[130px] sm:min-w-[170px]">Học sinh</th>
                <th className="py-2.5 px-2.5 text-center font-bold">
                  <span className="flex items-center justify-center gap-1 text-emerald-800">
                    <span>🌸</span> Điểm cộng
                  </span>
                </th>
                <th className="py-2.5 px-2.5 text-center font-bold">
                  <span className="flex items-center justify-center gap-1 text-rose-800">
                    <span>⚠️</span> Điểm trừ
                  </span>
                </th>
                <th className="py-2.5 px-2.5 text-center font-bold">Điểm ròng</th>
                <th className="py-2.5 px-2.5 text-center font-bold">
                  <span className="flex items-center justify-center gap-1 text-[#467348]">
                    <Sparkles className="w-3.5 h-3.5" /> Quy đổi điểm số
                  </span>
                </th>
                <th className="py-2.5 px-2.5 font-bold text-center">Thao tác 1 chạm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbdfcb]/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#5d905f]">
                    Không tìm thấy học sinh phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-[#fbf9f5] transition-colors group">
                    <td className="py-2.5 px-2 text-center font-medium text-[#5d905f] sticky left-0 bg-white group-hover:bg-[#fbf9f5] z-10 w-9 sm:w-11">
                      {item.student.order || idx + 1}
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3 sticky left-9 sm:left-11 bg-white group-hover:bg-[#fbf9f5] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] min-w-[130px] sm:min-w-[170px]">
                      <div className="font-bold text-[#293e2b] text-xs flex items-center gap-1.5 sm:gap-2">
                        <StudentAvatar
                          dob={item.student.dateOfBirth}
                          gender={item.student.gender}
                          zodiac={item.student.zodiac}
                          avatarUrl={item.student.avatar}
                          name={item.student.fullName}
                          size={32}
                          className="sm:w-9 sm:h-9"
                          showBadge
                        />
                        <span className="truncate max-w-[105px] sm:max-w-none">{item.student.fullName}</span>
                        {item.convertedBonus > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold shrink-0">
                            +{item.convertedBonus}đ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#7eac7f]">
                        {item.student.studentCode || 'Chưa có mã HS'}
                        {item.plusPointsToNextBonus > 0 && item.plusTotal > 0 && (
                          <span className="ml-1.5 text-[10px] text-[#5d905f]">
                            (Còn {item.plusPointsToNextBonus} hoa nữa là +{config.bonusScoreAdded}đ)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Plus points */}
                    <td className="py-2.5 px-3 text-center">
                      {item.plusTotal > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                          🌸 +{item.plusTotal}
                        </span>
                      ) : (
                        <span className="text-[#a8c4a9]">0</span>
                      )}
                    </td>

                    {/* Minus points */}
                    <td className="py-2.5 px-3 text-center">
                      {item.minusTotal > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs">
                          ⚠️ -{item.minusTotal}
                        </span>
                      ) : (
                        <span className="text-[#a8c4a9]">0</span>
                      )}
                    </td>

                    {/* Net points */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-bold ${
                          item.netPoints > 0
                            ? 'text-emerald-700'
                            : item.netPoints < 0
                            ? 'text-rose-700'
                            : 'text-[#7eac7f]'
                        }`}
                      >
                        {item.netPoints > 0 ? `+${item.netPoints}` : item.netPoints}
                      </span>
                    </td>

                    {/* Converted Grade Score */}
                    <td className="py-2.5 px-3 text-center">
                      {item.netScoreAdjustment !== 0 ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                            item.netScoreAdjustment > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                          title={`Thưởng: +${item.convertedBonus}đ, Trừ: -${item.convertedPenalty}đ`}
                        >
                          {item.netScoreAdjustment > 0
                            ? `+${item.netScoreAdjustment} điểm`
                            : `${item.netScoreAdjustment} điểm`}
                        </span>
                      ) : (
                        <span className="text-[#7eac7f] text-[11px]">Chưa đạt mốc</span>
                      )}
                    </td>

                    {/* 1-touch Quick Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickAddPoint(item.student.id, 'plus', '🙋 Phát biểu bài tốt', 1)}
                          className="px-2 py-1 rounded-lg bg-[#eef5ee] text-[#395c3b] hover:bg-[#467348] hover:text-white border border-[#cbdfcb] transition-colors font-medium text-[11px] cursor-pointer"
                          title="Cộng 1 điểm: Phát biểu xây dựng bài"
                        >
                          +1 Phát biểu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAddPoint(item.student.id, 'plus', '✍️ Làm bài tập xuất sắc', 1)}
                          className="px-2 py-1 rounded-lg bg-[#eef5ee] text-[#395c3b] hover:bg-[#467348] hover:text-white border border-[#cbdfcb] transition-colors font-medium text-[11px] cursor-pointer"
                          title="Cộng 1 điểm: Làm bài tập xuất sắc"
                        >
                          +1 Bài tập
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAddPoint(item.student.id, 'minus', '🗣️ Mất trật tự / Đi muộn', 1)}
                          className="px-2 py-1 rounded-lg bg-[#fff2ed] text-[#8a3318] hover:bg-[#d96541] hover:text-white border border-[#f3d3be] transition-colors font-medium text-[11px] cursor-pointer"
                          title="Trừ 1 điểm: Nhắc nhở nề nếp"
                        >
                          -1 Nhắc nhở
                        </button>
                        <button
                          type="button"
                          onClick={() => openAddModalForStudent(item.student.id, 'plus')}
                          className="px-2 py-1 rounded-lg bg-[#f4f8f4] text-[#293e2b] hover:bg-[#cbdfcb] border border-[#cbdfcb] transition-colors text-[11px] cursor-pointer"
                          title="Ghi nhận điểm với lý do tùy chỉnh"
                        >
                          ... Thêm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* History Log View */
        <div className="bg-white rounded-2xl border border-[#cbdfcb] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#cbdfcb]/60 pb-3">
            <h4 className="font-garden text-sm font-bold text-[#293e2b] flex items-center gap-2">
              <History className="w-4 h-4 text-[#467348]" />
              Nhật ký ghi nhận điểm cộng & điểm trừ của lớp
            </h4>
            <span className="text-xs text-[#5d905f]">
              Tổng số {pointRecords.length} lượt ghi nhận
            </span>
          </div>

          {pointRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5d905f]">
              Chưa có nhật ký ghi nhận điểm nào. Hãy bấm "Ghi nhận điểm" hoặc dùng nút 1 chạm để thưởng hoa điểm tốt cho học sinh!
            </div>
          ) : (
            <div className="divide-y divide-[#cbdfcb]/50 max-h-[500px] overflow-y-auto">
              {pointRecords.map(rec => {
                const student = students.find(s => s.id === rec.studentId);
                const isPlus = rec.type === 'plus';
                return (
                  <div
                    key={rec.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#fbf9f5] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xs ${
                          isPlus ? 'bg-[#467348]' : 'bg-[#d96541]'
                        }`}
                      >
                        {isPlus ? `+${rec.amount}` : `-${rec.amount}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#293e2b]">
                            {student?.fullName || 'Học sinh'}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                              isPlus
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPlus ? 'Điểm cộng 🌸' : 'Điểm trừ ⚠️'}
                          </span>
                        </div>
                        <div className="text-xs text-[#395c3b] mt-0.5">{rec.reason}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-[11px] text-[#7eac7f] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{rec.date}</span>
                      </div>

                      <button
                        onClick={() => onDeleteRecord(rec.id)}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa bản ghi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <PointConversionRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        config={config}
        onSaveConfig={onSaveConversionConfig}
        className={classData.name}
      />

      <AddPointModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        students={students}
        selectedStudentId={selectedStudentForAdd}
        defaultType={selectedTypeForAdd}
        defaultAmount={1}
        defaultReason={selectedReasonForAdd}
        onSaveRecord={onSaveRecord}
        classId={classData.id}
        userId={classData.userId}
      />

      <ApplyBonusToGradeModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        classData={classData}
        students={students}
        gradesMap={gradesMap}
        pointRecords={pointRecords}
        conversionConfig={config}
        onBatchSaveGrades={onBatchSaveGrades}
      />
    </div>
  );
};
