import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react';
import { TimetableItem, ClassData } from '../../types';
import { GardenButton } from '../common/GardenButton';

interface GardenCalendarProps {
  timetable: ReadonlyArray<TimetableItem>;
  classes: ReadonlyArray<ClassData>;
  onNavigateToTimetable?: () => void;
  onSelectClass?: (classId: string) => void;
}

interface DayNote {
  id: string;
  dateKey: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
}

const VIETNAMESE_MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const GardenCalendar: React.FC<GardenCalendarProps> = ({
  timetable,
  classes,
  onNavigateToTimetable,
  onSelectClass,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Notes state persisted locally
  const [notes, setNotes] = useState<DayNote[]>(() => {
    try {
      const saved = localStorage.getItem('wey_garden_calendar_notes');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [
      {
        id: '1',
        dateKey: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
          today.getDate()
        ).padStart(2, '0')}`,
        text: 'Kiểm tra sổ điểm 19 lớp trước khi kết thúc tuần',
        completed: false,
      },
    ];
  });

  const [newNoteText, setNewNoteText] = useState('');

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem('wey_garden_calendar_notes', JSON.stringify(notes));
    } catch {
      // Ignore
    }
  }, [notes]);

  // Year & Month for current calendar view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleGoToday = () => {
    const t = new Date();
    setCurrentDate(t);
    setSelectedDate(t);
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Formatter helpers
  const formatDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const selectedDateKey = formatDateKey(selectedDate);

  // Convert Date to DayOfWeek (2 = Thứ 2 ... 7 = Thứ 7, 8 = Chủ nhật)
  const getDayOfWeekKey = (d: Date) => {
    const day = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    return day === 0 ? 8 : day + 1; // 2 = Mon, 7 = Sat, 8 = Sun
  };

  const selectedDayOfWeekKey = getDayOfWeekKey(selectedDate);

  // Get timetable lessons for the selected day
  const selectedDayLessons = timetable
    .filter(t => t.dayOfWeek === selectedDayOfWeekKey)
    .sort((a, b) => {
      if (a.session !== b.session) {
        return a.session === 'morning' ? -1 : 1;
      }
      return a.period - b.period;
    });

  // Get notes for selected date
  const selectedDayNotes = notes.filter(n => n.dateKey === selectedDateKey);

  // Add note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: DayNote = {
      id: Date.now().toString(),
      dateKey: selectedDateKey,
      text: newNoteText.trim(),
      completed: false,
    };
    setNotes(prev => [...prev, newNote]);
    setNewNoteText('');
  };

  // Toggle note
  const handleToggleNote = (id: string) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, completed: !n.completed } : n))
    );
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const formatVietnameseDate = (d: Date) => {
    const days = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy',
    ];
    return `${days[d.getDay()]}, ngày ${d.getDate()} ${VIETNAMESE_MONTHS[d.getMonth()]} năm ${d.getFullYear()}`;
  };

  // Calendar cells
  const calendarCells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    calendarCells.push(new Date(year, month, dayNum));
  }

  return (
    <div className="bg-[#FFFDF6] rounded-2xl border border-[#D5E4D0] shadow-xs overflow-hidden">
      {/* Calendar Header with Spiral Planner Aesthetic */}
      <div className="bg-[#E8F1E5]/60 border-b border-[#D5E4D0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#426F49] text-white flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-garden text-lg font-bold text-[#293D2C]">
                Cuốn Lịch Bàn Của Wey
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#426F49] border border-[#D5E4D0] font-semibold">
                Sổ Lịch Giảng Dạy
              </span>
            </div>
            <p className="text-xs text-[#293D2C]/75 mt-0.5">
              Theo dõi lịch dạy 2 buổi Sáng - Chiều và ghi chú nhắc việc từng ngày trong tuần
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGoToday}
            className="px-2.5 py-1.5 rounded-xl border border-[#D5E4D0] bg-white text-[#293D2C] hover:bg-[#E8F1E5] text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Hôm nay
          </button>
          <div className="flex items-center bg-white border border-[#D5E4D0] rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#426F49] hover:bg-[#E8F1E5] hover:text-[#293D2C] cursor-pointer transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-[#293D2C] font-garden min-w-[110px] text-center">
              {VIETNAMESE_MONTHS[month]} · {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#426F49] hover:bg-[#E8F1E5] hover:text-[#293D2C] cursor-pointer transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Body: Grid on Left, Day Details & Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#D5E4D0]">
        {/* Left Side: Calendar Grid (7 columns) */}
        <div className="lg:col-span-7 p-4 sm:p-5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_LABELS.map((label, idx) => (
              <div
                key={label}
                className={`py-1 text-xs font-bold font-garden ${
                  idx >= 5 ? 'text-amber-800' : 'text-[#426F49]'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((dateObj, idx) => {
              if (!dateObj) {
                return (
                  <div
                    key={`empty_${idx}`}
                    className="h-13 sm:h-15 rounded-xl bg-neutral-50/50 border border-transparent"
                  />
                );
              }

              const isToday =
                dateObj.getDate() === today.getDate() &&
                dateObj.getMonth() === today.getMonth() &&
                dateObj.getFullYear() === today.getFullYear();

              const isSelected =
                dateObj.getDate() === selectedDate.getDate() &&
                dateObj.getMonth() === selectedDate.getMonth() &&
                dateObj.getFullYear() === selectedDate.getFullYear();

              const cellDateKey = formatDateKey(dateObj);
              const cellDayOfWeek = getDayOfWeekKey(dateObj);

              // Check if lessons or notes exist for this day
              const cellLessons = timetable.filter(t => t.dayOfWeek === cellDayOfWeek);
              const cellNotes = notes.filter(n => n.dateKey === cellDateKey);

              return (
                <button
                  key={cellDateKey}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`h-13 sm:h-15 rounded-xl p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'bg-[#426F49] text-white shadow-sm ring-2 ring-[#426F49]/30 font-bold'
                      : isToday
                      ? 'bg-[#E8F1E5] border-2 border-[#426F49] text-[#293D2C] font-bold'
                      : 'bg-[#FFFDF6] hover:bg-[#E8F1E5]/60 border border-[#D5E4D0] text-[#293D2C]'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-garden ${
                        isSelected
                          ? 'text-white'
                          : isToday
                          ? 'text-[#426F49]'
                          : 'text-[#293D2C]'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                    {isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#426F49]" />
                    )}
                  </div>

                  {/* Badges / Dots */}
                  <div className="flex items-center gap-1 mt-auto">
                    {cellLessons.length > 0 && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                          isSelected
                            ? 'bg-white/30 text-white'
                            : 'bg-[#E8F1E5] text-[#426F49]'
                        }`}
                        title={`${cellLessons.length} tiết dạy`}
                      >
                        {cellLessons.length}t
                      </span>
                    )}
                    {cellNotes.length > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-300' : 'bg-amber-500'
                        }`}
                        title={`${cellNotes.length} việc cần làm`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-[#D5E4D0] flex flex-wrap items-center justify-between text-[11px] text-[#293D2C]/75 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8F1E5] border border-[#426F49] inline-block" />
                <span>Hôm nay</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#426F49] inline-block" />
                <span>Ngày đang chọn</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Có việc cần làm</span>
              </span>
            </div>
            {onNavigateToTimetable && (
              <button
                onClick={onNavigateToTimetable}
                className="font-semibold text-[#426F49] hover:underline cursor-pointer"
              >
                Xem toàn bộ TKB tuần →
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Selected Day Schedule & Teacher Notes */}
        <div className="lg:col-span-5 p-4 sm:p-5 bg-[#FFFDF6] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Selected Date Header */}
            <div className="border-b border-[#D5E4D0] pb-3">
              <span className="text-[11px] font-semibold text-[#426F49] uppercase tracking-wider block">
                LỊCH TRÌNH VÀ CÔNG VIỆC
              </span>
              <h4 className="text-sm sm:text-base font-bold font-garden text-[#293D2C] mt-0.5">
                {formatVietnameseDate(selectedDate)}
              </h4>
            </div>

            {/* Scheduled Teaching Slots for Selected Day */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#293D2C] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#426F49]" />
                  <span>Tiết dạy trong ngày ({selectedDayLessons.length})</span>
                </span>
                {selectedDayLessons.length > 0 && onNavigateToTimetable && (
                  <button
                    onClick={onNavigateToTimetable}
                    className="text-[11px] text-[#426F49] hover:underline cursor-pointer"
                  >
                    Mở TKB
                  </button>
                )}
              </div>

              {selectedDayLessons.length === 0 ? (
                <div className="p-3 rounded-xl bg-white border border-[#D5E4D0] text-xs text-[#293D2C]/70 text-center">
                  🌱 Không có tiết dạy được xếp trong ngày này.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {selectedDayLessons.map(lesson => {
                    const isMorning = lesson.session !== 'afternoon';
                    const targetClass = classes.find(c => c.name === lesson.className);
                    return (
                      <div
                        key={lesson.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                          isMorning
                            ? 'bg-[#FFFDF6] border-amber-200/80 hover:border-amber-300'
                            : 'bg-[#FFFDF6] border-orange-200/80 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isMorning
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-orange-100 text-orange-900'
                            }`}
                          >
                            T{lesson.period}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#293D2C]">
                                Lớp {lesson.className}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#293D2C]/75 block">
                              {lesson.subject} · {isMorning ? 'Buổi Sáng' : 'Buổi Chiều'}
                            </span>
                          </div>
                        </div>

                        {targetClass && onSelectClass && (
                          <button
                            onClick={() => onSelectClass(targetClass.id)}
                            className="text-[11px] font-semibold text-[#426F49] hover:underline px-2 py-1 rounded-lg bg-white border border-[#D5E4D0] cursor-pointer shrink-0"
                          >
                            Vào sổ
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Teacher Daily Tasks / Notes */}
            <div>
              <span className="text-xs font-bold text-[#293D2C] mb-2 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#426F49]" />
                <span>Ghi chú công việc giáo viên ({selectedDayNotes.length})</span>
              </span>

              {/* Form Add Note */}
              <form onSubmit={handleAddNote} className="flex items-center gap-1.5 mb-2.5">
                <input
                  type="text"
                  placeholder="Ví dụ: Họp tổ chuyên môn, nộp đề kiểm tra..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-[#D5E4D0] bg-white text-[#293D2C] focus:outline-none focus:ring-1 focus:ring-[#426F49]"
                />
                <GardenButton
                  type="submit"
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  disabled={!newNoteText.trim()}
                >
                  Thêm
                </GardenButton>
              </form>

              {/* Notes List */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedDayNotes.length === 0 ? (
                  <p className="text-[11px] text-[#293D2C]/70 italic py-1">
                    Chưa có việc nào cần nhắc trong ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}.
                  </p>
                ) : (
                  selectedDayNotes.map(note => (
                    <div
                      key={note.id}
                      className="group flex items-center justify-between p-2 rounded-xl bg-white border border-[#D5E4D0] text-xs hover:border-[#A8C7A0] transition-colors"
                    >
                      <button
                        onClick={() => handleToggleNote(note.id)}
                        className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                      >
                        {note.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#426F49] shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#A8C7A0] shrink-0" />
                        )}
                        <span
                          className={`${
                            note.completed
                              ? 'line-through text-neutral-400'
                              : 'text-[#293D2C]'
                          }`}
                        >
                          {note.text}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 cursor-pointer transition-opacity"
                        title="Xóa ghi chú"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D5E4D0] text-[11px] text-[#293D2C]/70 flex items-center justify-between">
            <span>Vườn của Wey · Sổ tay công việc giảng dạy</span>
            <span className="font-mono text-[10px]">Tự động lưu thiết bị</span>
          </div>
        </div>
      </div>
    </div>
  );
};
