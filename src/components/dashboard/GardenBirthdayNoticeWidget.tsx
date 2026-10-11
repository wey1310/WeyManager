import React, { useState, useEffect, useMemo } from 'react';
import {
  Cake,
  Sparkles,
  Calendar,
  Gift,
  ChevronRight,
  PartyPopper,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ClassData, StudentData } from '../../types';
import { StudentAvatar, getZodiacSignFromDate } from '../../utils/zodiacHelper';
import { WeySticker } from '../../utils/weyStickers';
import { getAllStudentsForClasses } from '../../services/storage';

export interface BirthdayStudentItem {
  student: StudentData;
  classInfo: ClassData;
  day: number;
  month: number;
  year?: number;
  age?: number;
  formattedDob: string; // e.g. "13/10" or "13/10/2013"
  isToday: boolean;
  dayOfWeekName: string; // "Hôm nay", "Thứ Hai", "Thứ Ba"...
  diffDays: number; // 0 for today, 1 for tomorrow, etc.
}

interface GardenBirthdayNoticeWidgetProps {
  classes: ReadonlyArray<ClassData>;
  userId: string;
  onSelectClass?: (classId: string) => void;
}

/**
 * Trích xuất ngày, tháng, năm từ chuỗi ngày sinh đa định dạng
 */
function parseDateParts(dob?: string): { day: number; month: number; year?: number } | null {
  if (!dob || typeof dob !== 'string') return null;
  const trimmed = dob.trim();

  // YYYY-MM-DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { day: d, month: m, year: y };
  }

  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { day: d, month: m, year: y };
  }

  // DD/MM
  if (/^\d{1,2}[-/.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { day: d, month: m };
  }

  return null;
}

const VI_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export const GardenBirthdayNoticeWidget: React.FC<GardenBirthdayNoticeWidgetProps> = ({
  classes,
  userId,
  onSelectClass,
}) => {
  const [studentsByClass, setStudentsByClass] = useState<Record<string, StudentData[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  // Load students for all active classes
  useEffect(() => {
    let isMounted = true;
    const classIds = classes.map(c => c.id);
    if (classIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getAllStudentsForClasses(userId, classIds)
      .then(res => {
        if (isMounted) {
          setStudentsByClass(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Error loading students for birthday widget:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [classes, userId]);

  // Calculate current week range (Monday to Sunday) & students with birthdays
  const { birthdayList, todayCount, weekRangeStr } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Monday as start of week (0 is Sunday, 1 is Monday...)
    const jsDay = now.getDay();
    const distanceToMonday = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const formatShort = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    const rangeStr = `${formatShort(monday)} – ${formatShort(sunday)}/${sunday.getFullYear()}`;

    // Collect all students
    const list: BirthdayStudentItem[] = [];

    // Map classId to ClassData
    const classMap = new Map<string, ClassData>();
    classes.forEach(c => classMap.set(c.id, c));

    for (const [classId, sList] of Object.entries(studentsByClass)) {
      const cls = classMap.get(classId);
      if (!cls) continue;

      for (const student of sList) {
        if (!student.dateOfBirth) continue;
        const parts = parseDateParts(student.dateOfBirth);
        if (!parts) continue;

        // Create birthday date in current year
        const bdayThisYear = new Date(currentYear, parts.month - 1, parts.day);
        bdayThisYear.setHours(12, 0, 0, 0);

        // Check if falls between Monday and Sunday
        if (bdayThisYear >= monday && bdayThisYear <= sunday) {
          const isToday =
            parts.day === now.getDate() && parts.month === now.getMonth() + 1;

          const dayOfWeekName = isToday
            ? 'Hôm nay'
            : VI_DAYS[bdayThisYear.getDay()];

          const diffDays = Math.round(
            (new Date(currentYear, parts.month - 1, parts.day).getTime() -
              new Date(currentYear, now.getMonth(), now.getDate()).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const age = parts.year ? currentYear - parts.year : undefined;

          list.push({
            student,
            classInfo: cls,
            day: parts.day,
            month: parts.month,
            year: parts.year,
            age,
            formattedDob: `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}${parts.year ? `/${parts.year}` : ''}`,
            isToday,
            dayOfWeekName,
            diffDays,
          });
        }
      }
    }

    // Sort by day in week, today first, then closest day
    list.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      return a.student.fullName.localeCompare(b.student.fullName, 'vi');
    });

    const countToday = list.filter(item => item.isToday).length;

    return { birthdayList: list, todayCount: countToday, weekRangeStr: rangeStr };
  }, [studentsByClass, classes]);

  const handleCopyWish = (item: BirthdayStudentItem) => {
    const wish = `Chúc mừng sinh nhật ${item.student.fullName} (Lớp ${item.classInfo.name})! Chúc em thêm một tuổi mới luôn vui tươi, chăm ngoan và học giỏi trong Vườn của Wey! 🎉🎂`;
    navigator.clipboard.writeText(wish).then(() => {
      setCopiedName(item.student.id);
      setTimeout(() => setCopiedName(null), 2500);
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ffffff] via-[#f7faf7] to-[#f4f8f4] border border-[#cbdfcb] shadow-sm hover:shadow-md transition-all duration-300">
      {/* Decorative top matcha accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#467348] via-[#7eac7f] to-[#f59e0b]" />

      {/* Header bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5f0e5]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#eef5ee] to-[#d8ebd8] border border-[#cbdfcb] text-[#467348] shadow-2xs">
            <Cake className="w-5 h-5 text-[#467348]" />
            {todayCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] font-bold text-white items-center justify-center">
                  {todayCount}
                </span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#467348] tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                THÔNG BÁO TỪ KHU VƯỜN
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eef5ee] text-[#395c3b] border border-[#cbdfcb]">
                Tuần: {weekRangeStr}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-garden text-[#293e2b] flex items-center gap-2 mt-0.5">
              <span>Sinh nhật học sinh trong tuần</span>
              {birthdayList.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#467348] text-white">
                  {birthdayList.length} hoa nở
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {todayCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Hôm nay có {todayCount} học sinh sinh nhật!</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-[#5d905f] hover:text-[#293e2b] hover:bg-[#eef5ee] transition-colors cursor-pointer"
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Widget Content Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="py-8 flex items-center justify-center gap-3 text-xs text-[#5d905f]">
              <div className="w-5 h-5 border-2 border-[#467348] border-t-transparent rounded-full animate-spin" />
              <span>Đang thu thập ngày sinh từ các luống hoa học sinh...</span>
            </div>
          ) : birthdayList.length === 0 ? (
            /* Empty State with Mascot Wey */
            <div className="py-6 px-4 flex flex-col sm:flex-row items-center justify-center gap-5 text-center sm:text-left bg-gradient-to-r from-[#fbfcfb] to-[#f4f8f4] rounded-xl border border-dashed border-[#cbdfcb]">
              <div className="shrink-0 transform hover:scale-105 transition-transform">
                <WeySticker name="happy" size={80} className="drop-shadow-xs" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-[#293e2b] font-garden flex items-center justify-center sm:justify-start gap-1.5">
                  <span>Tuần này chưa có bạn nhỏ nào thêm tuổi mới!</span>
                  <span>🌱</span>
                </h4>
                <p className="mt-1 text-xs text-[#5d905f] leading-relaxed">
                  Khu vườn đang tích lũy năng lượng và tưới tắm cho tuần tiếp theo. Dữ liệu ngày sinh được tự động lấy từ danh sách học sinh của các lớp bạn đang quản lý.
                </p>
                <div className="mt-2 text-[11px] text-[#7eac7f] flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Khoảng thời gian: {weekRangeStr}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Birthday Cards Carousel / Grid */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {birthdayList.map(item => {
                  const zodiacInfo = getZodiacSignFromDate(item.student.dateOfBirth);

                  return (
                    <div
                      key={`${item.classInfo.id}_${item.student.id}`}
                      className={`group relative rounded-xl p-3.5 transition-all duration-200 border flex flex-col justify-between ${
                        item.isToday
                          ? 'bg-gradient-to-br from-amber-50/90 via-white to-[#fef8ea] border-amber-300 shadow-sm ring-1 ring-amber-300/60'
                          : 'bg-white hover:bg-[#fbfcfb] border-[#cbdfcb] hover:border-[#7eac7f] hover:shadow-xs'
                      }`}
                    >
                      {/* Top badge */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            item.isToday
                              ? 'bg-amber-500 text-white animate-bounce shadow-2xs'
                              : item.diffDays === 1
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-[#eef5ee] text-[#395c3b] border border-[#cbdfcb]'
                          }`}
                        >
                          {item.isToday ? (
                            <>
                              <PartyPopper className="w-3 h-3" />
                              <span>Hôm nay!</span>
                            </>
                          ) : item.diffDays > 0 ? (
                            <span>{item.dayOfWeekName} (+{item.diffDays} ngày)</span>
                          ) : (
                            <span>{item.dayOfWeekName}</span>
                          )}
                        </span>

                        <button
                          onClick={() => onSelectClass && onSelectClass(item.classInfo.id)}
                          className="text-[11px] font-bold text-[#467348] hover:text-[#293e2b] hover:underline cursor-pointer flex items-center gap-0.5"
                          title={`Mở sổ lớp ${item.classInfo.name}`}
                        >
                          <span>Lớp {item.classInfo.name}</span>
                          <ChevronRight className="w-3 h-3 text-[#7eac7f]" />
                        </button>
                      </div>

                      {/* Main student information */}
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <StudentAvatar
                            dob={item.student.dateOfBirth}
                            gender={item.student.gender}
                            zodiac={item.student.zodiac}
                            name={item.student.fullName}
                            size={46}
                            showBadge={true}
                          />
                          {item.isToday && (
                            <span className="absolute -top-1 -left-1 text-sm select-none" title="Chúc mừng sinh nhật">
                              👑
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#293e2b] truncate group-hover:text-[#395c3b] transition-colors">
                            {item.student.fullName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-[#5d905f] mt-0.5">
                            <span className="font-semibold text-[#467348] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.formattedDob}
                            </span>
                            {item.age && (
                              <span className="text-[11px] text-[#7eac7f]">
                                ({item.age} tuổi)
                              </span>
                            )}
                          </div>
                          {zodiacInfo && (
                            <div className="text-[10px] text-[#7eac7f] truncate mt-0.5 flex items-center gap-1">
                              <span>Cung {zodiacInfo.nameVn}</span>
                              <span className="text-neutral-400">·</span>
                              <span>{item.student.gender === 'Nam' ? 'Nam' : 'Nữ'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="mt-3 pt-2.5 border-t border-[#f0f4f0] flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyWish(item)}
                          className="text-[11px] font-semibold text-[#467348] hover:text-[#293e2b] hover:bg-[#eef5ee] px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Sao chép lời chúc mừng sinh nhật"
                        >
                          <Gift className="w-3.5 h-3.5 text-amber-500" />
                          <span>{copiedName === item.student.id ? 'Đã copy lời chúc!' : 'Copy lời chúc'}</span>
                        </button>

                        {onSelectClass && (
                          <button
                            onClick={() => onSelectClass(item.classInfo.id)}
                            className="text-[11px] text-[#5d905f] hover:text-[#293e2b] cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom gentle tip */}
              <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-[#7eac7f]">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#5d905f]" />
                  <span>Gợi ý: Thầy/cô có thể tặng điểm cộng sinh nhật cho các em ngay trong tab Theo dõi nề nếp của lớp!</span>
                </div>
                <span>Tự động cập nhật mỗi đầu tuần</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
