import React from 'react';
import {
  BookOpen,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Clock,
  LogIn,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ClassData, TimetableItem } from '../../types';
import { GardenCard } from '../common/GardenCard';
import { GardenCalendar } from './GardenCalendar';
import { WeySticker } from '../../utils/weyStickers';

interface GardenDashboardProps {
  classes: ReadonlyArray<ClassData>;
  timetable: ReadonlyArray<TimetableItem>;
  currentSchoolYear: string;
  userId?: string;
  currentUser?: User | null;
  onGoogleLogin?: () => Promise<void>;
  onSelectClass: (classId: string) => void;
  onNavigateTab: (tab: string) => void;
  onReturnToLanding?: () => void;
}

export const GardenDashboard: React.FC<GardenDashboardProps> = ({
  classes,
  timetable,
  currentSchoolYear,
  currentUser = null,
  onGoogleLogin,
  onSelectClass,
  onNavigateTab,
}) => {
  // Normalize year
  const normalizeYear = (yr?: string) => (yr || '').replace(/–|-/g, '-').trim();
  const yearClasses = classes.filter(
    c => !currentSchoolYear || normalizeYear(c.schoolYear) === normalizeYear(currentSchoolYear) || !c.schoolYear
  );

  // Calculate statistics
  const totalStudents = yearClasses.reduce((acc, c) => acc + (c.studentCount || 0), 0);

  // Today's lessons from timetable (dayOfWeek: 2 = Mon ... 7 = Sat)
  const currentJsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const todayDayOfWeek = currentJsDay === 0 ? 8 : currentJsDay + 1; // 2 to 7
  const todayLessons = timetable
    .filter(t => t.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.period - b.period);

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* 1. Hero card — Khu vực chào mừng */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FFFDF6]/95 border border-[#D5E4D0] p-6 sm:p-8 lg:p-9 shadow-sm backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          {/* Tagline */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F1E5] border border-[#D5E4D0] text-xs font-semibold text-[#426F49] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#426F49]" />
            <span>KHU VƯỜN GIẢNG DẠY THCS · NĂM HỌC {currentSchoolYear}</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold font-garden text-[#293D2C] tracking-tight leading-tight">
            Chào mừng Thầy/Cô đến với Vườn của Wey
          </h1>

          {/* Subtitle */}
          <p className="mt-2.5 text-xs sm:text-sm text-[#293D2C]/80 leading-relaxed">
            Sổ tay giảng dạy, quản lý điểm số và lịch trình cá nhân nhẹ nhàng như một khu vườn matcha.
            Tất cả dữ liệu được thiết kế tối ưu, gọn gàng cho giáo viên THCS.
          </p>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/* Primary button */}
            <button
              onClick={() => onNavigateTab('classes')}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-[#426F49] hover:bg-[#365c3c] text-white text-xs font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Xem danh sách lớp học ({yearClasses.length} lớp)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Secondary button */}
            <button
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#E8F1E5] border border-[#D5E4D0] text-[#293D2C] text-xs font-semibold shadow-2xs hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#426F49]" />
              <span>Thời khóa biểu tuần</span>
            </button>
          </div>
        </div>

        {/* Mascot / Botanical asset */}
        <div className="hidden lg:flex items-center justify-center shrink-0 pr-2">
          <div className="p-3 bg-[#E8F1E5]/60 rounded-3xl border border-[#D5E4D0]">
            <WeySticker name="happy" size={88} />
          </div>
        </div>
      </div>

      {/* 2. Thống kê tổng quan (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Số lớp trong vườn */}
        <div
          onClick={() => onNavigateTab('classes')}
          className="cursor-pointer group"
        >
          <GardenCard
            hoverable
            className="border-l-4 border-l-[#426F49]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#426F49]">Tổng số lớp trong vườn</span>
              <div className="w-7 h-7 rounded-lg bg-[#E8F1E5] flex items-center justify-center text-[#426F49] group-hover:bg-[#A8C7A0]/40 transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-[#293D2C] tabular-nums font-garden">
              {yearClasses.length} <span className="text-sm font-normal text-[#426F49]/80">lớp</span>
            </div>
            <p className="mt-1.5 text-[11px] text-[#426F49]/85 flex items-center gap-1 font-medium">
              <span>Bấm để vào không gian lớp học</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </GardenCard>
        </div>

        {/* Card 2: Tổng số học sinh */}
        <div
          onClick={() => onNavigateTab('classes')}
          className="cursor-pointer group"
        >
          <GardenCard
            hoverable
            className="border-l-4 border-l-[#A8C7A0]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#426F49]">Tổng số học sinh</span>
              <div className="w-7 h-7 rounded-lg bg-[#E8F1E5] flex items-center justify-center text-[#426F49] group-hover:bg-[#A8C7A0]/40 transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-[#293D2C] tabular-nums font-garden">
              {totalStudents} <span className="text-sm font-normal text-[#426F49]/80">em</span>
            </div>
            <p className="mt-1.5 text-[11px] text-[#426F49]/85 flex items-center gap-1 font-medium">
              <span>Đầy đủ danh sách & sinh nhật</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </GardenCard>
        </div>

        {/* Card 3: Tiết dạy hôm nay */}
        <div
          onClick={() => onNavigateTab('timetable')}
          className="cursor-pointer group"
        >
          <GardenCard
            hoverable
            className="border-l-4 border-l-[#293D2C]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#426F49]">Lịch dạy hôm nay</span>
              <div className="w-7 h-7 rounded-lg bg-[#E8F1E5] flex items-center justify-center text-[#426F49] group-hover:bg-[#A8C7A0]/40 transition-colors">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 text-2xl sm:text-3xl font-bold text-[#293D2C] tabular-nums font-garden">
              {todayLessons.length} <span className="text-sm font-normal text-[#426F49]/80">tiết</span>
            </div>
            <p className="mt-1.5 text-[11px] text-[#426F49]/85 truncate font-medium">
              {todayLessons.length > 0
                ? todayLessons.map(t => `${t.className} (T${t.period})`).join(' · ')
                : 'Hôm nay không có tiết dạy trên thời khóa biểu'}
            </p>
          </GardenCard>
        </div>
      </div>

      {/* 3. Tiện ích liên kết Gmail & Trạng thái Firestore */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF6] border border-[#D5E4D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            currentUser
              ? 'bg-[#E8F1E5] border-[#D5E4D0] text-[#426F49]'
              : 'bg-[#FFFDF6] border-amber-200 text-amber-600'
          }`}>
            {currentUser ? (
              <CheckCircle2 className="w-5 h-5 text-[#426F49]" />
            ) : (
              <LogIn className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold font-garden text-[#293D2C]">
              {currentUser ? 'Đã liên kết Gmail lưu trữ Firestore' : 'Liên kết Gmail lưu trữ đám mây'}
            </h3>
            <p className="text-xs text-[#293D2C]/80 mt-0.5">
              {currentUser ? (
                <span>
                  Tài khoản: <strong className="text-[#293D2C] font-semibold">{currentUser.email}</strong> · Dữ liệu đồng bộ trực tiếp lên Firebase <strong>wey-manager</strong>.
                </span>
              ) : (
                <span>
                  Đăng nhập tài khoản Gmail để sao lưu và đồng bộ toàn bộ {yearClasses.length} lớp học tự động lên cơ sở dữ liệu Firebase wey-manager.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {!currentUser && onGoogleLogin && (
            <button
              onClick={onGoogleLogin}
              className="px-4 py-2 rounded-xl bg-[#426F49] hover:bg-[#365c3c] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Liên kết Gmail ngay</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#E8F1E5] border border-[#D5E4D0] text-[#293D2C] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-[#426F49]" />
            <span>Cài đặt & Sao lưu</span>
          </button>
        </div>
      </div>

      {/* 4. Các phím tắt chuyển nhanh (Quick Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shortcut 1: Không gian lớp học */}
        <div
          onClick={() => onNavigateTab('classes')}
          className="p-5 rounded-3xl bg-[#FFFDF6] border border-[#D5E4D0] hover:border-[#A8C7A0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex items-start justify-between gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E8F1E5] border border-[#D5E4D0] flex items-center justify-center text-[#426F49] group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#A8C7A0] group-hover:text-[#426F49] group-hover:translate-x-1 transition-all md:hidden" />
            </div>
            <h3 className="text-base font-bold font-garden text-[#293D2C] group-hover:text-[#426F49] transition-colors">
              Không Gian Quản Lý Lớp Học
            </h3>
            <p className="text-xs text-[#293D2C]/75 mt-1 leading-relaxed">
              Xem {yearClasses.length} luống lớp học, nhập điểm số, thông báo sinh nhật học sinh trong tuần và danh sách nhóm khối.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center shrink-0 p-2 bg-[#E8F1E5]/50 rounded-2xl border border-[#D5E4D0]">
            <WeySticker name="study" size={54} />
          </div>
        </div>

        {/* Shortcut 2: Thời khóa biểu */}
        <div
          onClick={() => onNavigateTab('timetable')}
          className="p-5 rounded-3xl bg-[#FFFDF6] border border-[#D5E4D0] hover:border-[#A8C7A0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex items-start justify-between gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E8F1E5] border border-[#D5E4D0] flex items-center justify-center text-[#426F49] group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#A8C7A0] group-hover:text-[#426F49] group-hover:translate-x-1 transition-all md:hidden" />
            </div>
            <h3 className="text-base font-bold font-garden text-[#293D2C] group-hover:text-[#426F49] transition-colors">
              Thời Khóa Biểu & Lịch Giảng Dạy
            </h3>
            <p className="text-xs text-[#293D2C]/75 mt-1 leading-relaxed">
              Xem và chỉnh sửa lịch dạy từ Thứ 2 đến Thứ 7, hỗ trợ quản lý tiết dạy và đồng bộ cùng cuốn lịch bàn.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center shrink-0 p-2 bg-[#E8F1E5]/50 rounded-2xl border border-[#D5E4D0]">
            <WeySticker name="work" size={54} />
          </div>
        </div>
      </div>

      {/* 5. Cuốn Lịch Bàn Của Wey (GardenCalendar) */}
      <div className="pt-1">
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
