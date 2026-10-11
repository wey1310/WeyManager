import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  CheckSquare,
  RotateCcw,
} from 'lucide-react';
import { ClassData, WeeklyNoteData } from '../../types';
import { GardenButton } from '../common/GardenButton';

interface WeeklyNotesProps {
  classData: ClassData;
  weeklyNotes: WeeklyNoteData[];
  onSaveWeeklyNote: (note: WeeklyNoteData) => Promise<void>;
}

// Base anchor: 05/10/2026 = Tuần 5
const ANCHOR_DATE = new Date(2026, 9, 5); // October 5, 2026
const ANCHOR_WEEK = 5;

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getWeekDateRange(weekNum: number): { startDate: string; endDate: string } {
  const diffWeeks = weekNum - ANCHOR_WEEK;
  const start = new Date(ANCHOR_DATE);
  start.setDate(ANCHOR_DATE.getDate() + diffWeeks * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

export const WeeklyNotes: React.FC<WeeklyNotesProps> = ({
  classData,
  weeklyNotes,
  onSaveWeeklyNote,
}) => {
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(5);
  const [currentNote, setCurrentNote] = useState<WeeklyNoteData>({
    id: `week_${classData.id}_5`,
    classId: classData.id,
    userId: classData.userId,
    weekNumber: 5,
    startDate: '05/10/2026',
    endDate: '11/10/2026',
    title: 'Tuần 5',
    note: '',
    customWeekNumber: 'Tuần 5',
    updatedAt: new Date().toISOString(),
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when selectedWeekNumber or weeklyNotes change
  useEffect(() => {
    const existing = weeklyNotes.find(w => w.weekNumber === selectedWeekNumber);
    if (existing) {
      setCurrentNote(existing);
    } else {
      const dates = getWeekDateRange(selectedWeekNumber);
      setCurrentNote({
        id: `week_${classData.id}_${selectedWeekNumber}`,
        classId: classData.id,
        userId: classData.userId,
        weekNumber: selectedWeekNumber,
        startDate: dates.startDate,
        endDate: dates.endDate,
        title: `Tuần ${selectedWeekNumber}`,
        note: '',
        customWeekNumber: `Tuần ${selectedWeekNumber}`,
        updatedAt: new Date().toISOString(),
      });
    }
    setSaveStatus('idle');
  }, [selectedWeekNumber, weeklyNotes, classData.id, classData.userId]);

  const handleNoteChange = (newText: string) => {
    const updated: WeeklyNoteData = {
      ...currentNote,
      note: newText,
      updatedAt: new Date().toISOString(),
    };
    setCurrentNote(updated);

    // Debounced autosave
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      await onSaveWeeklyNote(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 700);
  };

  const handleCustomTitleChange = (newTitle: string) => {
    const updated: WeeklyNoteData = {
      ...currentNote,
      title: newTitle,
      customWeekNumber: newTitle,
      updatedAt: new Date().toISOString(),
    };
    setCurrentNote(updated);
    onSaveWeeklyNote(updated);
  };

  // Formatting toolbar actions
  const applyFormat = (syntaxPrefix: string, syntaxSuffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selected = text.substring(start, end);
    const replacement = `${syntaxPrefix}${selected || 'nội dung'}${syntaxSuffix}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    handleNoteChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxPrefix.length,
        start + replacement.length - syntaxSuffix.length
      );
    }, 50);
  };

  // Generate 35 weeks navigation
  const availableWeeks = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Week Selector Bar */}
      <div className="bg-[#fbf9f4] rounded-xl border border-[#cbdfcb] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWeekNumber(prev => Math.max(1, prev - 1))}
            disabled={selectedWeekNumber <= 1}
            className="p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] hover:bg-[#eef5ee] disabled:opacity-40 cursor-pointer"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5d905f]">Chọn tuần:</span>
            <select
              value={selectedWeekNumber}
              onChange={e => setSelectedWeekNumber(Number(e.target.value))}
              className="text-xs font-bold text-[#293e2b] bg-white border border-[#cbdfcb] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#467348] cursor-pointer"
            >
              {availableWeeks.map(w => {
                const existing = weeklyNotes.find(item => item.weekNumber === w);
                const dates = getWeekDateRange(w);
                return (
                  <option key={w} value={w}>
                    {existing?.customWeekNumber || `Tuần ${w}`} ({dates.startDate} – {dates.endDate})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => setSelectedWeekNumber(prev => Math.min(35, prev + 1))}
            disabled={selectedWeekNumber >= 35}
            className="p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] hover:bg-[#eef5ee] disabled:opacity-40 cursor-pointer"
            title="Tuần kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date range & Custom Title input */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#467348] font-medium bg-[#f4f8f4] px-3 py-1.5 rounded-lg border border-[#cbdfcb]">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {currentNote.startDate} – {currentNote.endDate}
            </span>
          </div>

          {/* Autosave status */}
          <div className="text-xs text-[#5d905f] flex items-center gap-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-700">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-700">
                <Check className="w-3.5 h-3.5" /> Đã lưu
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="flex items-center gap-1 text-[#7eac7f]">
                <Save className="w-3.5 h-3.5" /> Tự động lưu
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Week Title Customization */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#cbdfcb]">
        <label className="text-xs font-semibold text-[#395c3b] shrink-0">
          Tên tuần tùy chỉnh:
        </label>
        <input
          type="text"
          value={currentNote.customWeekNumber || currentNote.title}
          onChange={e => handleCustomTitleChange(e.target.value)}
          placeholder="Ví dụ: Tuần 5, Tuần nghỉ lễ, Tuần ôn tập giữa kỳ..."
          className="flex-1 text-xs font-semibold text-[#293e2b] bg-[#fcfbf9] border border-[#cbdfcb] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#467348]"
        />
        <span className="text-[11px] text-[#7eac7f]">
          (Có thể ghi "Tuần nghỉ lễ" hoặc nhảy số tuần)
        </span>
      </div>

      {/* Formatting Toolbar & Editor */}
      <div className="bg-white rounded-xl border border-[#cbdfcb] overflow-hidden shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f4f8f4] border-b border-[#cbdfcb] text-[#395c3b]">
          <button
            type="button"
            onClick={() => applyFormat('**', '**')}
            title="Đậm (Ctrl+B)"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/50 cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('*', '*')}
            title="Nghiêng (Ctrl+I)"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/50 cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('<u>', '</u>')}
            title="Gạch chân"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/50 cursor-pointer"
          >
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-[#cbdfcb] mx-1" />
          <button
            type="button"
            onClick={() => applyFormat('## ')}
            title="Tiêu đề mục"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/50 cursor-pointer"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('\n- ')}
            title="Danh sách gạch đầu dòng"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/50 cursor-pointer"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('\n1. ')}
            title="Danh sách số thứ tự"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/50 cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('\n- [ ] ')}
            title="Checklist công việc"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/50 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Large Weekly Note Textarea */}
        <textarea
          ref={textareaRef}
          rows={14}
          value={currentNote.note}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder={`Ghi chú công việc cho ${currentNote.customWeekNumber || 'tuần này'}...
Ví dụ:
- Hoàn thành chương 2: Trao đổi chất ở sinh vật
- Chuẩn bị đề kiểm tra thường xuyên số 2 (15 phút) vào thứ Năm
- Nhắc nhở ban cán sự nộp sổ theo dõi nề nếp`}
          className="w-full p-4 text-sm text-[#293e2b] placeholder-[#a7c8a7] leading-relaxed focus:outline-none resize-y font-sans"
        />

        <div className="px-4 py-2 bg-[#fbf9f4] border-t border-[#e5f0e5] flex items-center justify-between text-xs text-[#5d905f]">
          <span>Ghi chú lưu riêng theo từng tuần của Lớp {classData.name}</span>
          <GardenButton
            variant="primary"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={() => onSaveWeeklyNote(currentNote)}
          >
            Lưu ngay
          </GardenButton>
        </div>
      </div>
    </div>
  );
};
