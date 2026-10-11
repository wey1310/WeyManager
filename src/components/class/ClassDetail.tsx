import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Users,
  FileText,
  Dices,
  Edit,
  GraduationCap,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { useToast } from '../common/GardenToast';
import {
  ClassData,
  StudentData,
  StudentGrades,
  WeeklyNoteData,
  GradeColumnConfig,
  GradingConfig,
  AssetConfig,
  StudentPointRecord,
  PointConversionConfig,
} from '../../types';
import { GradebookTable } from './GradebookTable';
import { StudentRoster } from './StudentRoster';
import { GardenWeekNote } from './GardenWeekNote';
import { RandomStudentModal } from './RandomStudentModal';
import { StudentPointTracker } from './StudentPointTracker';
import { GardenButton } from '../common/GardenButton';
import { WeySticker } from '../../utils/weyStickers';

interface ClassDetailProps {
  classData: ClassData;
  students: StudentData[];
  gradesMap: Record<string, StudentGrades>;
  weeklyNotes: WeeklyNoteData[];
  pointRecords: StudentPointRecord[];
  gradingConfig: GradingConfig;
  assets: AssetConfig;
  onBack: () => void;
  onEditClass: (cls: ClassData) => void;
  onSaveGrade: (grade: StudentGrades) => Promise<void>;
  onBatchSaveGrades: (grades: StudentGrades[]) => Promise<void>;
  onUpdateClassColumns: (hk1: GradeColumnConfig[], hk2: GradeColumnConfig[]) => Promise<void>;
  onSaveStudent: (student: StudentData) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onSaveWeeklyNote: (note: WeeklyNoteData) => Promise<void>;
  onSavePointRecord: (record: StudentPointRecord) => Promise<void>;
  onDeletePointRecord: (recordId: string) => Promise<void>;
  onSaveConversionConfig: (newConfig: PointConversionConfig, applyGlobally: boolean) => Promise<void>;
  onOpenImport: () => void;
}

export const ClassDetail: React.FC<ClassDetailProps> = ({
  classData,
  students,
  gradesMap,
  weeklyNotes,
  pointRecords,
  gradingConfig,
  assets,
  onBack,
  onEditClass,
  onSaveGrade,
  onBatchSaveGrades,
  onUpdateClassColumns,
  onSaveStudent,
  onDeleteStudent,
  onSaveWeeklyNote,
  onSavePointRecord,
  onDeletePointRecord,
  onSaveConversionConfig,
  onOpenImport,
}) => {
  // Main tabs: Gradebook, Student roster, Bonus points, Weekly notes
  const [activeTab, setActiveTab] = useState<'gradebook' | 'students' | 'points' | 'weeks'>('gradebook');
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [hasCopiedNames, setHasCopiedNames] = useState(false);
  const { showToast } = useToast();

  const handleCopyStudentNames = async () => {
    if (!students || students.length === 0) {
      showToast('Lớp chưa có học sinh nào để sao chép!', 'info');
      return;
    }
    // Giữ nguyên thứ tự số thứ tự (order / STT)
    const sorted = [...students].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    // Chỉ lấy họ và tên, mỗi bạn 1 dòng để dán vào các web random như Wheel of Names
    const namesOnly = sorted
      .map(s => s.fullName?.trim())
      .filter(Boolean)
      .join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(namesOnly);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = namesOnly;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopiedNames(true);
      showToast(`Đã copy họ tên ${sorted.length} học sinh (sẵn sàng dán vào web random)!`, 'success');
      setTimeout(() => setHasCopiedNames(false), 2500);
    } catch {
      showToast('Không thể copy vào clipboard. Vui lòng kiểm tra quyền trình duyệt.', 'error');
    }
  };

  const tabs = [
    { id: 'gradebook', label: 'Sổ điểm', icon: BookOpen },
    { id: 'students', label: `Học sinh (${students.length})`, icon: Users },
    { id: 'points', label: 'Tích điểm cộng / trừ 🌸', icon: Sparkles },
    { id: 'weeks', label: 'Ghi chú tuần', icon: FileText },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header Class Banner */}
      <div className="no-print bg-[#FFFDF6] rounded-2xl sm:rounded-3xl border border-[#D5E4D0] p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-[#D5E4D0] bg-white text-[#293D2C] hover:bg-[#E8F1E5] hover:text-[#426F49] transition-colors cursor-pointer shrink-0 min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center shadow-2xs"
            title="Quay lại danh sách lớp"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#426F49] text-white flex items-center justify-center font-bold text-base sm:text-xl font-garden shadow-xs shrink-0">
              {classData.name}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold font-garden text-[#293D2C] truncate">
                  Lớp {classData.name}
                </h2>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#E8F1E5] text-[#426F49] font-bold border border-[#D5E4D0] shrink-0">
                  {classData.grade}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-[#293D2C]/75 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-[#426F49] truncate">
                  <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> {classData.subject}
                </span>
                <span>·</span>
                <span>{classData.schoolYear}</span>
                <span>·</span>
                <span className="font-semibold text-[#426F49]">{students.length} HS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          <GardenButton
            variant="outline"
            size="sm"
            icon={hasCopiedNames ? <Check className="w-3.5 h-3.5 text-[#426F49]" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyStudentNames}
            title="Sao chép toàn bộ danh sách họ và tên học sinh (mỗi bạn 1 dòng) để dán vào Wheel of Names / web quay số random"
            className={`text-xs py-1.5 transition-colors ${
              hasCopiedNames ? 'bg-[#E8F1E5] border-[#426F49] text-[#293D2C]' : ''
            }`}
          >
            {hasCopiedNames ? 'Đã copy tên!' : 'Copy tên HS'}
          </GardenButton>
          <GardenButton
            variant="primary"
            size="sm"
            icon={<Dices className="w-3.5 h-3.5" />}
            onClick={() => setIsRandomModalOpen(true)}
            title="Quay số gọi học sinh ngẫu nhiên (chế độ không lặp & hoa xoay)"
            className="flex-1 md:flex-initial text-xs py-1.5"
          >
            Random học sinh
          </GardenButton>
          <GardenButton
            variant="outline"
            size="sm"
            icon={<Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            onClick={() => onEditClass(classData)}
            className="flex-1 md:flex-initial text-xs py-1.5"
          >
            Sửa lớp
          </GardenButton>
        </div>
      </div>

      {/* Tabs Navigation Frame with solid background */}
      <div className="no-print bg-[#FFFDF6] p-1.5 rounded-2xl border border-[#D5E4D0] shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar touch-scroll flex-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[40px] shrink-0 ${
                  isActive
                    ? 'bg-[#426F49] text-white shadow-xs'
                    : 'bg-white text-[#293D2C] hover:bg-[#E8F1E5] border border-[#D5E4D0]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="hidden lg:flex items-center pr-2 shrink-0">
          <WeySticker name={activeTab === 'points' ? 'happy' : activeTab === 'gradebook' ? 'study' : 'hello'} size={34} />
        </div>
      </div>

      {/* Tab Panels inside solid container */}
      <div className="bg-[#FFFDF6] rounded-2xl sm:rounded-3xl border border-[#D5E4D0] p-2.5 sm:p-5 shadow-xs">
        {activeTab === 'gradebook' && (
          <GradebookTable
            classData={classData}
            students={students}
            gradesMap={gradesMap}
            gradingConfig={gradingConfig}
            onSaveGrade={onSaveGrade}
            onBatchSaveGrades={onBatchSaveGrades}
            onUpdateClassColumns={onUpdateClassColumns}
            onOpenImport={onOpenImport}
          />
        )}

        {activeTab === 'students' && (
          <StudentRoster
            classData={classData}
            students={students}
            onSaveStudent={onSaveStudent}
            onDeleteStudent={onDeleteStudent}
            onOpenImport={onOpenImport}
          />
        )}

        {activeTab === 'points' && (
          <StudentPointTracker
            classData={classData}
            students={students}
            gradesMap={gradesMap}
            pointRecords={pointRecords}
            onSaveRecord={onSavePointRecord}
            onDeleteRecord={onDeletePointRecord}
            onSaveConversionConfig={onSaveConversionConfig}
            onBatchSaveGrades={onBatchSaveGrades}
          />
        )}

        {activeTab === 'weeks' && (
          <GardenWeekNote
            classData={classData}
            weeklyNotes={weeklyNotes}
            onSaveWeeklyNote={onSaveWeeklyNote}
          />
        )}
      </div>

      {/* Dedicated Random Student Modal (with flower spin animation & no-repeat mode) */}
      <RandomStudentModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        students={students}
        className={classData.name}
      />
    </div>
  );
};
