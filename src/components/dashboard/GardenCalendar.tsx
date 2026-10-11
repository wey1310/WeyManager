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
  BookOpen,
  Sun,
  Sunset,
} from 'lucide-react';
import { TimetableItem, ClassData } from '../../types';
import { GardenCard } from '../common/GardenCard';
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

  // Daily notes saved in localStorage
  const [notes, setNotes] = useState<DayNote[]>(() => {
    try {
      const saved = localStorage.getItem('vuon_wey_calendar_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem('vuon_wey_calendar_notes', JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save calendar notes', e);
    }
  }, [notes]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Selected date key: YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectedKey = formatDateKey(selectedDate);

  // First day of month & total days
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // In JS getDay(): 0 is Sunday, 1 is Monday ...
  // We want Monday = 0, Tuesday = 1, ... Sunday = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  // Previous month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Next month navigation
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Go to today
  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Get Vietnamese day of week for timetable mapping
  // Timetable: 2 = Thứ 2 ... 7 = Thứ 7, 8 = Chủ nhật
  const getDayOfWeekKey = (d: Date) => {
    const jsDay = d.getDay();
    return jsDay === 0 ? 8 : jsDay + 1;
  };

  const selectedDayOfWeekKey = getDayOfWeekKey(selectedDate);
  const selectedDayLessons = timetable
    .filter(t => t.dayOfWeek === selectedDayOfWeekKey)
    .sort((a, b) => {
      // Sort morning before afternoon, then by period
      const sessA = a.session === 'afternoon' ? 2 : 1;
      const sessB = b.session === 'afternoon' ? 2 : 1;
      if (sessA !== sessB) return sessA - sessB;
      return a.period - b.period;
    });

  const selectedDayNotes = notes.filter(n => n.dateKey === selectedKey);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newNote: DayNote = {
      id: `note_${Date.now()}`,
      dateKey: selectedKey,
      text: newNoteText.trim(),
      completed: false,
    };
    setNotes(prev => [...prev, newNote]);
    setNewNoteText('');
  };

  const handleToggleNote = (noteId: string) => {
    setNotes(prev =>
      prev.map(n => (n.id === noteId ? { ...n, completed: !n.completed } : n))
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Formatted date string in Vietnamese
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
  // Blank days before month start
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    calendarCells.push(new Date(year, month, dayNum));
  }

  return (
    <div className="bg-white rounded-2xl border border-[#cbdfcb] shadow-xs overflow-hidden">
      {/* Calendar Header with Spiral Planner Aesthetic */}
      <div className="bg-gradient-to-r from-[#eef5ee] via-[#f7faf7] to-[#fbf8f0] border-b border-[#cbdfcb] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#467348] text-white flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-garden text-lg font-bold text-[#293e2b]">
                Cuốn Lịch Bàn Của Wey
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-[#467348] border border-[#cbdfcb] font-semibold">
                Sổ Lịch Giảng Dạy
              </span>
            </div>
            <p className="text-xs text-[#5d905f]">
              Theo dõi lịch dạy 2 buổi Sáng - Chiều và ghi chú nhắc việc từng ngày trong tuần
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGoToday}
            className="px-2.5 py-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#395c3b] hover:bg-[#eef5ee] text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Hôm nay
          </button>
          <div className="flex items-center bg-white border border-[#cbdfcb] rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded text-[#5d905f] hover:bg-[#f4f8f4] hover:text-[#293e2b] cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-[#293e2b] font-garden min-w-[110px] text-center">
              {VIETNAMESE_MONTHS[month]} · {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded text-[#5d905f] hover:bg-[#f4f8f4] hover:text-[#293e2b] cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Body: Grid on Left, Day Details & Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#cbdfcb]">
        {/* Left Side: Calendar Grid (7 columns) */}
        <div className="lg:col-span-7 p-4 sm:p-5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_LABELS.map((label, idx) => (
              <div
                key={label}
                className={`py-1.5 text-xs font-bold font-garden ${
                  idx >= 5 ? 'text-amber-700' : 'text-[#395c3b]'
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
                    className="h-14 sm:h-16 rounded-xl bg-[#faf9f6]/40 border border-transparent"
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
              const hasItems = cellLessons.length > 0 || cellNotes.length > 0;

              return (
                <button
                  key={cellDateKey}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`h-14 sm:h-16 rounded-xl p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'bg-[#467348] text-white shadow-sm ring-2 ring-[#467348]/30 font-bold'
                      : isToday
                      ? 'bg-[#eef5ee] border-2 border-[#467348] text-[#293e2b] font-bold'
                      : 'bg-[#fcfbf9] hover:bg-[#f4f8f4] border border-[#cbdfcb]/70 text-[#293e2b]'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-garden ${
                        isSelected
                          ? 'text-white'
                          : isToday
                          ? 'text-[#467348]'
                          : 'text-[#293e2b]'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                    {isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#467348]" />
                    )}
                  </div>

                  {/* Badges / Dots */}
                  <div className="flex items-center gap-1 mt-auto">
                    {cellLessons.length > 0 && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded-md font-semibold ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-[#e5f0e5] text-[#395c3b]'
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

          <div className="mt-3 pt-3 border-t border-[#e5f0e5] flex flex-wrap items-center justify-between text-[11px] text-[#5d905f]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eef5ee] border border-[#467348] inline-block" />
                <span>Hôm nay</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#467348] inline-block" />
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
                className="font-semibold text-[#467348] hover:underline cursor-pointer"
              >
                Xem toàn bộ TKB tuần →
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Selected Day Schedule & Teacher Notes */}
        <div className="lg:col-span-5 p-4 sm:p-5 bg-[#fdfcf9] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Selected Date Header */}
            <div className="border-b border-[#e5f0e5] pb-3">
              <span className="text-[11px] font-semibold text-[#467348] uppercase tracking-wider block">
                LỊCH TRÌNH VÀ CÔNG VIỆC
              </span>
              <h4 className="text-sm sm:text-base font-bold font-garden text-[#293e2b] mt-0.5">
                {formatVietnameseDate(selectedDate)}
              </h4>
            </div>

            {/* Scheduled Teaching Slots for Selected Day */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#395c3b] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5d905f]" />
                  <span>Tiết dạy trong ngày ({selectedDayLessons.length})</span>
                </span>
                {selectedDayLessons.length > 0 && onNavigateToTimetable && (
                  <button
                    onClick={onNavigateToTimetable}
                    className="text-[11px] text-[#467348] hover:underline cursor-pointer"
                  >
                    Mở TKB
                  </button>
                )}
              </div>

              {selectedDayLessons.length === 0 ? (
                <div className="p-3 rounded-xl bg-white border border-[#cbdfcb]/60 text-xs text-[#7eac7f] text-center">
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
                            ? 'bg-[#fdfaf0] border-amber-200/70 hover:border-amber-300'
                            : 'bg-[#fdf6f0] border-orange-200/70 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isMorning
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            T{lesson.period}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#293e2b]">
                                Lớp {lesson.className}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#5d905f] block">
                              {lesson.subject} · {isMorning ? 'Buổi Sáng' : 'Buổi Chiều'}
                            </span>
                          </div>
                        </div>

                        {targetClass && onSelectClass && (
                          <button
                            onClick={() => onSelectClass(targetClass.id)}
                            className="text-[11px] font-semibold text-[#467348] hover:underline px-2 py-1 rounded bg-white border border-[#cbdfcb] cursor-pointer shrink-0"
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
              <span className="text-xs font-bold text-[#395c3b] mb-2 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#5d905f]" />
                <span>Ghi chú công việc giáo viên ({selectedDayNotes.length})</span>
              </span>

              {/* Form Add Note */}
              <form onSubmit={handleAddNote} className="flex items-center gap-1.5 mb-2.5">
                <input
                  type="text"
                  placeholder="Ví dụ: Họp tổ chuyên môn, nộp đề kiểm tra..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
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
                  <p className="text-[11px] text-[#7eac7f] italic py-1">
                    Chưa có việc nào cần nhắc trong ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}.
                  </p>
                ) : (
                  selectedDayNotes.map(note => (
                    <div
                      key={note.id}
                      className="group flex items-center justify-between p-2 rounded-lg bg-white border border-[#e5f0e5] text-xs hover:border-[#cbdfcb] transition-colors"
                    >
                      <button
                        onClick={() => handleToggleNote(note.id)}
                        className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                      >
                        {note.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#467348] shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#7eac7f] shrink-0" />
                        )}
                        <span
                          className={`${
                            note.completed
                              ? 'line-through text-neutral-400'
                              : 'text-[#293e2b]'
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

          <div className="mt-4 pt-3 border-t border-[#e5f0e5] text-[11px] text-[#7eac7f] flex items-center justify-between">
            <span>Vườn của Wey · Sổ tay công việc giảng dạy</span>
            <span className="font-mono text-[10px]">Tự động lưu thiết bị</span>
          </div>
        </div>
      </div>
    </div>
  );
};
