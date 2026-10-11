import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  RotateCcw,
  Clock,
  Eye,
  Edit3,
} from 'lucide-react';
import { ClassData, WeeklyNoteData } from '../../types';
import { GardenButton } from '../common/GardenButton';
import { WeySticker } from '../../utils/weyStickers';

interface GardenWeekNoteProps {
  classData: ClassData;
  weeklyNotes: WeeklyNoteData[];
  onSaveWeeklyNote: (note: WeeklyNoteData) => Promise<void>;
}

// Base anchor: 05/10/2026 (Monday) = Tuần 5
const ANCHOR_DATE = new Date(2026, 9, 5); // Month is 0-indexed, 9 = October
const ANCHOR_WEEK = 5;

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function calculateCurrentWeekNumber(now: Date = new Date()): number {
  // Normalize dates to start of day in local time
  const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const anchorStart = new Date(ANCHOR_DATE.getFullYear(), ANCHOR_DATE.getMonth(), ANCHOR_DATE.getDate());
  
  const diffTime = currentStart.getTime() - anchorStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  
  const computed = ANCHOR_WEEK + diffWeeks;
  return Math.max(1, Math.min(35, computed));
}

export function getWeekDateRange(weekNum: number): { startDate: string; endDate: string } {
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

export const GardenWeekNote: React.FC<GardenWeekNoteProps> = ({
  classData,
  weeklyNotes,
  onSaveWeeklyNote,
}) => {
  const currentRealWeek = calculateCurrentWeekNumber();
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(currentRealWeek);
  
  const [currentNote, setCurrentNote] = useState<WeeklyNoteData>(() => {
    const existing = weeklyNotes.find(w => w.weekNumber === currentRealWeek);
    if (existing) return existing;
    const dates = getWeekDateRange(currentRealWeek);
    return {
      id: `week_${classData.id}_${currentRealWeek}`,
      classId: classData.id,
      userId: classData.userId,
      weekNumber: currentRealWeek,
      startDate: dates.startDate,
      endDate: dates.endDate,
      title: `Tuần ${currentRealWeek}`,
      note: '',
      customWeekNumber: `Tuần ${currentRealWeek}`,
      updatedAt: new Date().toISOString(),
    };
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when week changes or when props update
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

  // Autosave into Firestore with debounce
  const handleNoteChange = (newText: string) => {
    const updated: WeeklyNoteData = {
      ...currentNote,
      note: newText,
      updatedAt: new Date().toISOString(),
    };
    setCurrentNote(updated);

    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSaveWeeklyNote(updated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err) {
        console.error('Lỗi autosave Firestore:', err);
        setSaveStatus('error');
      }
    }, 600);
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

  const handleCustomWeekNumberChange = (num: number) => {
    if (num < 1) return;
    setSelectedWeekNumber(num);
  };

  // Simple formatting actions: Bold, Italic, Bullet list, Link
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = 'nội dung') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || placeholder}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    handleNoteChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + replacement.length - suffix.length
      );
    }, 50);
  };

  const handleInsertLink = () => {
    const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
    if (!url) return;
    const title = prompt('Nhập tên hiển thị cho liên kết:', 'Xem chi tiết') || url;
    insertFormatting(`[${title}](`, ')', url);
  };

  // Render markdown-like text to HTML for preview
  const renderPreviewHtml = (raw: string) => {
    if (!raw.trim()) {
      return '<p class="text-[#a7c8a7] italic">Chưa có nội dung ghi chú nào cho tuần này.</p>';
    }

    return raw
      .replace(/^### (.*$)/gim, '<h3 class="font-bold text-base text-[#293e2b] my-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="font-bold text-lg text-[#293e2b] my-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-[#293e2b]">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noreferrer" class="text-[#467348] underline font-medium hover:text-[#293e2b]">$1</a>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-[#395c3b]">$1</li>')
      .replace(/\n/gim, '<br />');
  };

  const availableWeeks = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Week Selector & Current Week Indicator */}
      <div className="bg-[#fbf9f4] rounded-2xl border border-[#cbdfcb] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWeekNumber(prev => Math.max(1, prev - 1))}
            disabled={selectedWeekNumber <= 1}
            className="p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] hover:bg-[#eef5ee] disabled:opacity-40 cursor-pointer transition-colors"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5d905f]">Chọn tuần:</span>
            <select
              value={selectedWeekNumber}
              onChange={e => handleCustomWeekNumberChange(Number(e.target.value))}
              className="text-xs font-bold text-[#293e2b] bg-white border border-[#cbdfcb] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#467348] cursor-pointer"
            >
              {availableWeeks.map(w => {
                const existing = weeklyNotes.find(item => item.weekNumber === w);
                const dates = getWeekDateRange(w);
                const isCurrent = w === currentRealWeek;
                return (
                  <option key={w} value={w}>
                    {existing?.customWeekNumber || `Tuần ${w}`} ({dates.startDate} – {dates.endDate})
                    {isCurrent ? ' ★ Hiện tại' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => setSelectedWeekNumber(prev => Math.min(35, prev + 1))}
            disabled={selectedWeekNumber >= 35}
            className="p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] hover:bg-[#eef5ee] disabled:opacity-40 cursor-pointer transition-colors"
            title="Tuần kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick jump to current calculated week */}
          {selectedWeekNumber !== currentRealWeek && (
            <button
              onClick={() => setSelectedWeekNumber(currentRealWeek)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#eef5ee] text-[#467348] border border-[#cbdfcb] hover:bg-[#cbdfcb] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Về tuần hiện tại (Tuần {currentRealWeek})</span>
            </button>
          )}
        </div>

        {/* Date range & Autosave Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#467348] font-medium bg-[#f4f8f4] px-3 py-1.5 rounded-lg border border-[#cbdfcb]">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {currentNote.startDate} – {currentNote.endDate}
            </span>
          </div>

          {/* Autosave status badge */}
          <div className="text-xs text-[#5d905f] flex items-center gap-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-700 animate-pulse font-medium">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Đang lưu Firestore...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" /> Đã lưu Firestore
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="flex items-center gap-1 text-[#7eac7f]">
                <Save className="w-3.5 h-3.5" /> Tự động lưu
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                Lỗi đồng bộ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Week Title & Custom Number Customization */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#cbdfcb]">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-xs font-semibold text-[#395c3b] shrink-0">
            Tên tuần tùy chỉnh:
          </label>
          <input
            type="text"
            value={currentNote.customWeekNumber || currentNote.title}
            onChange={e => handleCustomTitleChange(e.target.value)}
            placeholder="Ví dụ: Tuần 5, Tuần nghỉ lễ, Tuần thi học kỳ..."
            className="flex-1 text-xs font-semibold text-[#293e2b] bg-[#fcfbf9] border border-[#cbdfcb] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#467348]"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-[#f4f8f4] border border-[#cbdfcb] rounded-lg">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'edit'
                ? 'bg-white text-[#293e2b] shadow-2xs'
                : 'text-[#5d905f] hover:text-[#293e2b]'
            }`}
          >
            <Edit3 className="w-3 h-3" /> Soạn thảo
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'preview'
                ? 'bg-white text-[#293e2b] shadow-2xs'
                : 'text-[#5d905f] hover:text-[#293e2b]'
            }`}
          >
            <Eye className="w-3 h-3" /> Xem trước
          </button>
        </div>
      </div>

      {/* Editor & Formatting Toolbar */}
      <div className="bg-white rounded-2xl border border-[#cbdfcb] overflow-hidden shadow-xs">
        {/* Simple Toolbar: Bold, Italic, Bullet list, Link */}
        <div className="flex items-center gap-1 p-2 bg-[#f4f8f4] border-b border-[#cbdfcb] text-[#395c3b]">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'chữ đậm')}
            title="Đậm (Bold)"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/60 cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <Bold className="w-4 h-4" />
            <span className="hidden sm:inline">Bold</span>
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'chữ nghiêng')}
            title="Nghiêng (Italic)"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/60 cursor-pointer flex items-center gap-1 text-xs italic"
          >
            <Italic className="w-4 h-4" />
            <span className="hidden sm:inline">Italic</span>
          </button>

          <div className="w-[1px] h-4 bg-[#cbdfcb] mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('\n- ', '', 'nội dung gạch đầu dòng')}
            title="Danh sách dấu chấm (Bullet List)"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/60 cursor-pointer flex items-center gap-1 text-xs"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Bullet List</span>
          </button>

          <button
            type="button"
            onClick={handleInsertLink}
            title="Chèn liên kết (Link)"
            className="p-1.5 rounded hover:bg-[#cbdfcb]/60 cursor-pointer flex items-center gap-1 text-xs"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Link</span>
          </button>
        </div>

        {/* Content View / Editor */}
        {viewMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            rows={14}
            value={currentNote.note}
            onChange={e => handleNoteChange(e.target.value)}
            placeholder={`Ghi chú công việc cho ${currentNote.customWeekNumber || 'tuần này'}...
Ví dụ:
- **Dạy bài 5:** Đoạn mạch nối tiếp và song song
- Nhắc lớp chuẩn bị đồ dùng thí nghiệm
- *Lưu ý:* Kiểm tra bài cũ 3 học sinh đầu giờ
- Tài liệu đính kèm: [Giáo án điện tử KHTN 6](https://drive.google.com)`}
            className="w-full p-4 text-sm text-[#293D2C] placeholder-[#426F49]/50 leading-relaxed focus:outline-none resize-y font-sans bg-transparent"
          />
        ) : (
          <div className="p-5 min-h-[300px] text-sm text-[#293D2C] leading-relaxed font-sans bg-[#FFFDF6]">
            {!currentNote.note.trim() ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <WeySticker name="work" size={60} />
                <p className="text-sm font-garden font-bold text-[#293D2C]">
                  Chưa có nội dung ghi chú nào cho {currentNote.customWeekNumber || `Tuần ${currentNote.weekNumber}`}
                </p>
                <p className="text-xs text-[#426F49]">
                  Chuyển sang chế độ "Soạn thảo" để ghi chú giáo án, công việc và nhắc nhở học sinh.
                </p>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: renderPreviewHtml(currentNote.note) }} />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#fbf9f4] border-t border-[#e5f0e5] flex items-center justify-between text-xs text-[#5d905f]">
          <span>
            {currentNote.customWeekNumber || `Tuần ${currentNote.weekNumber}`} · Lớp {classData.name}
          </span>
          <GardenButton
            variant="primary"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={() => onSaveWeeklyNote(currentNote)}
          >
            Lưu vào Firestore
          </GardenButton>
        </div>
      </div>
    </div>
  );
};
