import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Calendar,
  Plus,
  FileSpreadsheet,
  Search,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit,
  GraduationCap,
  LayoutGrid,
  Table as TableIcon,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { ClassData, TimetableItem } from '../../types';
import { GardenCard } from '../common/GardenCard';
import { GardenButton } from '../common/GardenButton';
import { GardenCalendar } from './GardenCalendar';
import { ClassesOverviewTable } from './ClassesOverviewTable';
import { GardenBirthdayNoticeWidget } from './GardenBirthdayNoticeWidget';
import { WeySticker } from '../../utils/weyStickers';

interface GardenDashboardProps {
  classes: ReadonlyArray<ClassData>;
  timetable: ReadonlyArray<TimetableItem>;
  currentSchoolYear: string;
  userId?: string;
  onSelectClass: (classId: string) => void;
  onCreateClass: () => void;
  onImportClass: () => void;
  onImport19Classes?: () => void;
  onEditClass: (cls: ClassData) => void;
  onDeleteClass: (classId: string, className: string) => void;
  onNavigateTab: (tab: string) => void;
  onReturnToLanding?: () => void;
}

export const GardenDashboard: React.FC<GardenDashboardProps> = ({
  classes,
  timetable,
  currentSchoolYear,
  userId = 'guest_teacher',
  onSelectClass,
  onCreateClass,
  onImportClass,
  onImport19Classes,
  onEditClass,
  onDeleteClass,
  onNavigateTab,
  onReturnToLanding,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [activeMenuClassId, setActiveMenuClassId] = useState<string | null>(null);
  const [classDisplayMode, setClassDisplayMode] = useState<'both' | 'cards' | 'table'>('both');

  // Filter classes by current school year, search query, grade, and subject
  const normalizeYear = (yr?: string) => (yr || '').replace(/–|-/g, '-').trim();
  const yearClasses = classes.filter(
    c => !currentSchoolYear || normalizeYear(c.schoolYear) === normalizeYear(currentSchoolYear) || !c.schoolYear
  );

  const filteredClasses = yearClasses.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.grade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'ALL' || c.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'ALL' || c.subject === selectedSubject;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  // Calculate statistics
  const totalStudents = yearClasses.reduce((acc, c) => acc + (c.studentCount || 0), 0);
  const gradesList = Array.from(new Set(yearClasses.map(c => c.grade))).filter(Boolean);
  const subjectsList = Array.from(new Set(yearClasses.map(c => c.subject))).filter(Boolean);

  // Today's lessons from timetable (dayOfWeek: 2 = Mon ... 7 = Sat)
  const currentJsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const todayDayOfWeek = currentJsDay === 0 ? 8 : currentJsDay + 1; // 2 to 7
  const todayLessons = timetable
    .filter(t => t.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.period - b.period);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Garden Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#eef5ee] via-[#f7faf7] to-[#fbf8f0] border border-[#cbdfcb] p-6 sm:p-8 shadow-xs flex items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#467348] mb-2">
            <Sparkles className="w-4 h-4 text-[#7eac7f]" />
            <span>KHU VƯỜN GIẢNG DẠY · NĂM HỌC {currentSchoolYear}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-garden text-[#293e2b] tracking-tight">
            Chào mừng trở lại khu vườn của bạn
          </h2>
          <p className="mt-1.5 text-sm text-[#5d905f]">
            Quản lý {yearClasses.length} lớp học, {totalStudents} học sinh và lịch trình một cách nhẹ nhàng, gọn gàng.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <GardenButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={onCreateClass}
            >
              Tạo lớp mới
            </GardenButton>
            <GardenButton
              variant="secondary"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={onImportClass}
            >
              Import danh sách lớp
            </GardenButton>
          </div>
        </div>

        <div className="hidden sm:flex shrink-0 items-center justify-center p-2">
          <WeySticker name="hello" size={128} className="drop-shadow-md hover:scale-105 transition-transform" />
        </div>
      </div>

      {/* Overview Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GardenCard className="border-l-4 border-l-[#467348]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5d905f]">Tổng số lớp</span>
            <BookOpen className="w-4 h-4 text-[#7eac7f]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#293e2b] tabular-nums font-garden">
            {yearClasses.length}
          </div>
          <p className="mt-1 text-[11px] text-[#7eac7f]">
            {gradesList.length > 0 ? gradesList.join(', ') : 'Chưa phân khối'}
          </p>
        </GardenCard>

        <GardenCard className="border-l-4 border-l-[#7eac7f]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5d905f]">Tổng học sinh</span>
            <Users className="w-4 h-4 text-[#7eac7f]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#293e2b] tabular-nums font-garden">
            {totalStudents}
          </div>
          <p className="mt-1 text-[11px] text-[#7eac7f]">
            Trung bình {yearClasses.length > 0 ? Math.round(totalStudents / yearClasses.length) : 0} HS/lớp
          </p>
        </GardenCard>

        <GardenCard className="border-l-4 border-l-[#a7c8a7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5d905f]">Môn giảng dạy</span>
            <GraduationCap className="w-4 h-4 text-[#7eac7f]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#293e2b] tabular-nums font-garden">
            {subjectsList.length}
          </div>
          <p className="mt-1 text-[11px] text-[#7eac7f] truncate">
            {subjectsList.length > 0 ? subjectsList.join(', ') : 'Chưa có môn'}
          </p>
        </GardenCard>

        <GardenCard className="border-l-4 border-l-[#304a32]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5d905f]">Lịch hôm nay</span>
            <Calendar className="w-4 h-4 text-[#7eac7f]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#293e2b] tabular-nums font-garden">
            {todayLessons.length} <span className="text-sm font-normal text-[#5d905f]">tiết</span>
          </div>
          <p className="mt-1 text-[11px] text-[#7eac7f] truncate">
            {todayLessons.length > 0
              ? todayLessons.map(t => `${t.className} (T${t.period})`).join(' · ')
              : 'Hôm nay không có tiết dạy'}
          </p>
        </GardenCard>
      </div>

      {/* Widget Thông báo từ khu vườn: Sinh nhật học sinh trong tuần */}
      <GardenBirthdayNoticeWidget
        classes={yearClasses}
        userId={userId}
        onSelectClass={onSelectClass}
      />

      {/* View Switcher: Card View vs Table View */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#cbdfcb] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold font-garden text-[#293e2b]">
            Không Gian Quản Lý Lớp Học
          </h3>
          <p className="text-xs text-[#5d905f]">
            Xem dạng luống thẻ lớp học hoặc bảng tổng hợp phân nhóm theo khối & môn
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#f4f8f4] border border-[#cbdfcb] rounded-xl text-xs font-semibold">
          <button
            onClick={() => setClassDisplayMode('both')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              classDisplayMode === 'both'
                ? 'bg-white text-[#293e2b] shadow-2xs font-bold'
                : 'text-[#5d905f] hover:text-[#293e2b]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đầy đủ (Thẻ & Bảng)</span>
          </button>
          <button
            onClick={() => setClassDisplayMode('cards')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              classDisplayMode === 'cards'
                ? 'bg-white text-[#293e2b] shadow-2xs font-bold'
                : 'text-[#5d905f] hover:text-[#293e2b]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Thẻ luống lớp</span>
          </button>
          <button
            onClick={() => setClassDisplayMode('table')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              classDisplayMode === 'table'
                ? 'bg-white text-[#293e2b] shadow-2xs font-bold'
                : 'text-[#5d905f] hover:text-[#293e2b]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Bảng tổng quan nhóm</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CLASS CARDS GRID (When displayMode is 'both' or 'cards') */}
      {(classDisplayMode === 'both' || classDisplayMode === 'cards') && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#cbdfcb] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-garden text-[#467348] uppercase tracking-wider">
                  🌱 CÁC LUỐNG LỚP HỌC TRONG VƯỜN
                </span>
                <span className="text-[11px] text-[#5d905f] font-semibold bg-[#eef5ee] px-2 py-0.5 rounded-md border border-[#cbdfcb]">
                  {filteredClasses.length} lớp
                </span>
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7eac7f]" />
                <input
                  type="text"
                  placeholder="Tìm lớp..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
                />
              </div>
            </div>

            {/* Grade and Subject Filter Pills / Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-[#e5f0e5]">
            <span className="text-[#5d905f] font-semibold mr-1">Khối:</span>
            {['ALL', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'].map(grade => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedGrade === grade
                    ? 'bg-[#467348] text-white font-semibold'
                    : 'bg-[#f4f8f4] text-[#395c3b] hover:bg-[#cbdfcb]/50 border border-[#cbdfcb]'
                }`}
              >
                {grade === 'ALL' ? 'Tất cả khối' : grade}
              </button>
            ))}

            {subjectsList.length > 1 && (
              <>
                <span className="text-[#cbdfcb] mx-1">|</span>
                <span className="text-[#5d905f] font-semibold mr-1">Môn:</span>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="px-2 py-1 rounded-md border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none"
                >
                  <option value="ALL">Tất cả môn</option>
                  {subjectsList.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

          {/* Cards Grid */}
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white border border-dashed border-[#cbdfcb]">
              <div className="mx-auto flex items-center justify-center mb-3">
                <WeySticker name={searchTerm || selectedGrade !== 'ALL' ? 'confused' : 'sleep'} size={64} />
              </div>
              <h4 className="text-base font-bold font-garden text-[#293e2b]">
                🌱 Chưa có lớp nào trong danh sách.
              </h4>
              <p className="text-xs text-[#5d905f] mt-1 max-w-sm mx-auto">
                {searchTerm || selectedGrade !== 'ALL'
                  ? 'Không tìm thấy lớp học phù hợp với bộ lọc hiện tại.'
                  : 'Hãy tạo hoặc import lớp đầu tiên để bắt đầu quản lý sổ điểm và học sinh.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <GardenButton variant="primary" size="sm" onClick={onCreateClass}>
                  + Tạo lớp đầu tiên
                </GardenButton>
                <GardenButton variant="secondary" size="sm" onClick={onImportClass}>
                  Import từ Excel/Word
                </GardenButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClasses.map(cls => (
                <div
                  key={cls.id}
                  className="group relative bg-white/95 hover:bg-white rounded-2xl border border-[#cbdfcb] hover:border-[#467348]/70 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:scale-[1.018] hover:brightness-[1.02] transition-all duration-300 ease-out p-5 flex flex-col justify-between overflow-hidden cursor-pointer backdrop-blur-xs ring-1 ring-transparent hover:ring-[#7eac7f]/30"
                  onClick={(e) => {
                    // Only navigate if clicking on card, not actions menu
                    if ((e.target as HTMLElement).closest('.class-action-menu')) return;
                    onSelectClass(cls.id);
                  }}
                >
                  {/* Subtle leafy matcha gradient shimmer in card background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#f7faf7]/40 to-[#eef5ee]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#eef5ee] to-[#d8ebd8] border border-[#cbdfcb] flex items-center justify-center text-[#467348] font-bold font-garden text-lg group-hover:bg-[#467348] group-hover:text-white group-hover:scale-105 group-hover:shadow-xs transition-all duration-300">
                          {cls.name}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#293e2b] group-hover:text-[#395c3b] font-garden transition-colors">
                            Lớp {cls.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-[#5d905f]">
                            <span className="font-medium">{cls.grade}</span>
                            <span>·</span>
                            <span>{cls.subject}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative class-action-menu">
                        <button
                          onClick={() =>
                            setActiveMenuClassId(activeMenuClassId === cls.id ? null : cls.id)
                          }
                          className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenuClassId === cls.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-[#cbdfcb] py-1 z-20">
                            <button
                              onClick={() => {
                                setActiveMenuClassId(null);
                                onEditClass(cls);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-[#293e2b] hover:bg-[#f4f8f4] flex items-center gap-2 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#5d905f]" />
                              Sửa lớp
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuClassId(null);
                                onDeleteClass(cls.id, cls.name);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              Xóa lớp
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {cls.note && (
                      <p className="mt-3 text-xs text-[#5d905f] line-clamp-2 bg-[#fdfcf9] p-2 rounded-md border border-[#e5f0e5]">
                        {cls.note}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#e5f0e5] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#395c3b] font-medium">
                      <Users className="w-3.5 h-3.5 text-[#7eac7f]" />
                      <span>{cls.studentCount || 0} học sinh</span>
                    </div>

                    <button
                      onClick={() => onSelectClass(cls.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#467348] hover:text-[#293e2b] group-hover:translate-x-0.5 transition-transform cursor-pointer"
                    >
                      <span>Vào sổ lớp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: COMPREHENSIVE OVERVIEW TABLE [NHÓM THEO KHỐI, MÔN] */}
      {(classDisplayMode === 'both' || classDisplayMode === 'table') && (
        <ClassesOverviewTable
          classes={classes}
          currentSchoolYear={currentSchoolYear}
          onSelectClass={onSelectClass}
          onEditClass={onEditClass}
          onDeleteClass={onDeleteClass}
          onCreateClass={onCreateClass}
          onImportClass={onImportClass}
        />
      )}

      {/* SECTION 3: CUỐN LỊCH BÀN CỦA WEY (CALENDAR AT THE BOTTOM OF OVERVIEW) */}
      <div className="pt-2">
        <GardenCalendar
          timetable={timetable}
          classes={classes}
          onNavigateToTimetable={() => onNavigateTab('timetable')}
          onSelectClass={onSelectClass}
        />
      </div>
    </div>
  );
};
