import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Printer,
  Sun,
  Sunset,
  Layers,
} from 'lucide-react';
import { TimetableItem, ClassData } from '../../types';
import { GardenButton } from '../common/GardenButton';
import { GardenModal } from '../common/GardenModal';
import { GardenInput } from '../common/GardenInput';

interface TeacherTimetableProps {
  timetable: TimetableItem[];
  classes: ReadonlyArray<ClassData>;
  userId: string;
  onSaveSlot: (item: TimetableItem) => Promise<void>;
  onBatchSaveTimetable: (items: TimetableItem[]) => Promise<void>;
  onDeleteSlot: (slotId: string) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { key: 2, label: 'Thứ 2' },
  { key: 3, label: 'Thứ 3' },
  { key: 4, label: 'Thứ 4' },
  { key: 5, label: 'Thứ 5' },
  { key: 6, label: 'Thứ 6' },
  { key: 7, label: 'Thứ 7' },
];

const MORNING_PERIODS = [
  { period: 1, time: '07:15 - 08:00' },
  { period: 2, time: '08:05 - 08:50' },
  { period: 3, time: '09:05 - 09:50' },
  { period: 4, time: '09:55 - 10:40' },
  { period: 5, time: '10:45 - 11:30' },
];

const AFTERNOON_PERIODS = [
  { period: 1, time: '13:00 - 13:45' },
  { period: 2, time: '13:50 - 14:35' },
  { period: 3, time: '14:50 - 15:35' },
  { period: 4, time: '15:40 - 16:25' },
  { period: 5, time: '16:30 - 17:15' },
];

export const TeacherTimetable: React.FC<TeacherTimetableProps> = ({
  timetable,
  classes,
  userId,
  onSaveSlot,
  onBatchSaveTimetable,
  onDeleteSlot,
}) => {
  // Session filter: 'all' | 'morning' | 'afternoon'
  const [activeSessionFilter, setActiveSessionFilter] = useState<'all' | 'morning' | 'afternoon'>('all');

  // Modal for editing slot
  const [editingSlot, setEditingSlot] = useState<TimetableItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for manual slot
  const [session, setSession] = useState<'morning' | 'afternoon'>('morning');
  const [dayOfWeek, setDayOfWeek] = useState(2);
  const [period, setPeriod] = useState(1);
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');

  // OCR Timetable States
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrPreviewItems, setOcrPreviewItems] = useState<
    {
      dayOfWeek: number;
      session: 'morning' | 'afternoon';
      period: number;
      className: string;
      subject: string;
      note?: string;
    }[]
  >([]);

  // Find slot by session, day, and period
  const getSlot = (sess: 'morning' | 'afternoon', day: number, per: number) => {
    return timetable.find(t => {
      const itemSession = t.session || 'morning';
      return itemSession === sess && t.dayOfWeek === day && t.period === per;
    });
  };

  const handleOpenEditSlot = (sess: 'morning' | 'afternoon', day: number, per: number) => {
    const existing = getSlot(sess, day, per);
    if (existing) {
      setEditingSlot(existing);
      setSession(existing.session || 'morning');
      setDayOfWeek(existing.dayOfWeek);
      setPeriod(existing.period);
      setClassName(existing.className);
      setSubject(existing.subject);
      setNote(existing.note || '');
    } else {
      setEditingSlot(null);
      setSession(sess);
      setDayOfWeek(day);
      setPeriod(per);
      setClassName(classes[0]?.name || '');
      setSubject(classes[0]?.subject || 'Khoa học tự nhiên');
      setNote('');
    }
    setIsEditModalOpen(true);
  };

  const handleSaveSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !subject.trim()) return;

    // Deterministic ID prevents duplicate slots accumulating in the same timetable cell
    const id = `slot_${session}_d${dayOfWeek}_p${period}`;

    await onSaveSlot({
      id,
      userId,
      dayOfWeek,
      period,
      session,
      className: className.trim(),
      subject: subject.trim(),
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    });

    setIsEditModalOpen(false);
  };

  const handleDeleteCurrentSlot = async () => {
    if (!editingSlot) return;
    await onDeleteSlot(editingSlot.id);
    setIsEditModalOpen(false);
  };

  // Compress image before sending to avoid large payloads / network failure
  const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: 'application/pdf' });
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
          reader.onerror = reject;
          reader.readAsDataURL(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve({ base64: canvas.toDataURL('image/jpeg', 0.88), mimeType: 'image/jpeg' });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  // Handle OCR file upload
  const handleOcrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrError('');
    setIsProcessingOcr(true);
    setOcrPreviewItems([]);

    try {
      const { base64, mimeType } = await compressImage(file);

      const res = await fetch('/api/ocr-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.items && data.items.length > 0) {
        // Normalize items to include session (default to morning if not set)
        const normalized = data.items.map((it: any) => ({
          dayOfWeek: Number(it.dayOfWeek) || 2,
          period: Math.min(Math.max(Number(it.period) || 1, 1), 5),
          session: (it.session === 'afternoon' ? 'afternoon' : 'morning') as 'morning' | 'afternoon',
          className: String(it.className || '').trim(),
          subject: String(it.subject || '').trim(),
          note: it.note ? String(it.note).trim() : '',
        }));
        setOcrPreviewItems(normalized);
      } else {
        setOcrError(data.error || 'Không tìm thấy các tiết học trong ảnh này. Vui lòng thử ảnh chụp rõ hơn.');
      }
    } catch (err: any) {
      setOcrError('Lỗi phân tích ảnh: ' + (err.message || 'Không thể kết nối'));
    } finally {
      setIsProcessingOcr(false);
      // Reset input value so user can re-select same file if needed
      e.target.value = '';
    }
  };

  // Confirm Save OCR preview
  const handleConfirmOcrTimetable = async () => {
    if (ocrPreviewItems.length === 0) return;

    const itemsToSave: TimetableItem[] = ocrPreviewItems.map(item => ({
      id: `slot_${item.session}_d${item.dayOfWeek}_p${item.period}`,
      userId,
      dayOfWeek: item.dayOfWeek,
      period: item.period,
      session: item.session,
      className: item.className,
      subject: item.subject,
      note: item.note,
      updatedAt: new Date().toISOString(),
    }));

    await onBatchSaveTimetable(itemsToSave);
    setIsOcrModalOpen(false);
    setOcrPreviewItems([]);
  };

  const renderSessionTable = (
    sess: 'morning' | 'afternoon',
    title: string,
    periods: { period: number; time: string }[],
    icon: React.ReactNode,
    headerColor: string
  ) => {
    return (
      <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#cbdfcb] shadow-xs space-y-2.5 sm:space-y-3">
        <div className={`flex items-center justify-between px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl ${headerColor} border border-[#cbdfcb]`}>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-garden text-xs sm:text-sm font-bold text-[#293e2b] uppercase tracking-wide">
              {title} (5 Tiết)
            </h3>
          </div>
          <span className="sm:hidden text-[10px] text-[#467348] font-semibold">
            ↔ Vuốt xem các thứ
          </span>
        </div>

        <div className="overflow-x-auto touch-scroll rounded-xl border border-[#cbdfcb] bg-white">
          <table className="w-full text-xs text-left border-collapse min-w-[620px] sm:min-w-[700px]">
            <thead>
              <tr className="bg-[#f4f8f4] border-b border-[#cbdfcb] text-[#293e2b]">
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 w-20 sm:w-28 text-center font-bold border-r border-[#cbdfcb]/60 sticky left-0 bg-[#f4f8f4] z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                  Tiết / Giờ
                </th>
                {DAYS_OF_WEEK.map(day => (
                  <th
                    key={day.key}
                    className="py-2 sm:py-2.5 px-2 sm:px-3 text-center font-bold border-r border-[#cbdfcb]/60 last:border-r-0 min-w-[85px] sm:min-w-[95px]"
                  >
                    <span className="text-xs sm:text-sm font-garden">{day.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbdfcb]/60">
              {periods.map(p => (
                <tr key={p.period} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="py-2 px-1.5 sm:px-2 text-center bg-[#f7faf7] border-r border-[#cbdfcb]/60 sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    <div className="font-bold text-xs sm:text-sm text-[#293e2b] font-garden">Tiết {p.period}</div>
                    <div className="text-[9px] sm:text-[10px] text-[#7eac7f] font-mono mt-0.5 leading-tight">{p.time}</div>
                  </td>

                  {DAYS_OF_WEEK.map(day => {
                    const slot = getSlot(sess, day.key, p.period);
                    return (
                      <td
                        key={day.key}
                        onClick={() => handleOpenEditSlot(sess, day.key, p.period)}
                        className="p-1 sm:p-1.5 border-r border-[#cbdfcb]/60 last:border-r-0 h-16 sm:h-20 align-top cursor-pointer transition-all hover:bg-[#f4f8f4]/80 group"
                      >
                        {slot ? (
                          <div className="h-full rounded-lg sm:rounded-xl bg-gradient-to-br from-[#eef5ee] to-[#f4f8f4] border border-[#cbdfcb] p-1.5 sm:p-2 flex flex-col justify-between group-hover:border-[#7eac7f] shadow-2xs">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs sm:text-sm text-[#293e2b] font-garden truncate">
                                  Lớp {slot.className}
                                </span>
                              </div>
                              <div className="text-[11px] sm:text-xs text-[#395c3b] font-medium mt-0.5 truncate">
                                {slot.subject}
                              </div>
                            </div>
                            {slot.note && (
                              <div className="text-[9px] sm:text-[10px] text-[#7eac7f] truncate mt-0.5">
                                {slot.note}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full rounded-lg sm:rounded-xl border border-dashed border-[#cbdfcb]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#7eac7f]">
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <div className="no-print bg-white rounded-xl sm:rounded-2xl border border-[#cbdfcb] p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-xl font-bold font-garden text-[#293e2b] flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#467348] shrink-0" />
            <span>Thời Khóa Biểu Giảng Dạy (Sáng & Chiều)</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-[#5d905f] mt-0.5 sm:mt-1">
            Quản lý cả 2 buổi dạy Sáng và Chiều của giáo viên THCS. Bấm vào từng ô để thêm/sửa tiết.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Session tabs filter */}
          <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-[#f4f8f4] border border-[#cbdfcb] rounded-xl text-[11px] sm:text-xs font-semibold">
            <button
              onClick={() => setActiveSessionFilter('all')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeSessionFilter === 'all'
                  ? 'bg-white text-[#293e2b] shadow-2xs'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Cả ngày</span>
            </button>
            <button
              onClick={() => setActiveSessionFilter('morning')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeSessionFilter === 'morning'
                  ? 'bg-white text-[#293e2b] shadow-2xs'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
              <span>Sáng</span>
            </button>
            <button
              onClick={() => setActiveSessionFilter('afternoon')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeSessionFilter === 'afternoon'
                  ? 'bg-white text-[#293e2b] shadow-2xs'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              <Sunset className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />
              <span>Chiều</span>
            </button>
          </div>

          <GardenButton
            variant="primary"
            size="sm"
            icon={<Camera className="w-3.5 h-3.5" />}
            onClick={() => setIsOcrModalOpen(true)}
            className="text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3"
          >
            <span className="hidden sm:inline">Nhận diện </span>TKB ảnh
          </GardenButton>
          <GardenButton
            variant="outline"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
            className="text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3"
          >
            In
          </GardenButton>
        </div>
      </div>

      {/* Tables based on filter */}
      <div className="space-y-6">
        {(activeSessionFilter === 'all' || activeSessionFilter === 'morning') &&
          renderSessionTable(
            'morning',
            'Buổi Sáng',
            MORNING_PERIODS,
            <Sun className="w-4 h-4 text-amber-600" />,
            'bg-[#fdfaf0]'
          )}

        {(activeSessionFilter === 'all' || activeSessionFilter === 'afternoon') &&
          renderSessionTable(
            'afternoon',
            'Buổi Chiều',
            AFTERNOON_PERIODS,
            <Sunset className="w-4 h-4 text-orange-600" />,
            'bg-[#fdf6f0]'
          )}
      </div>

      {/* Manual Slot Edit Modal */}
      <GardenModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingSlot ? 'Chỉnh sửa tiết dạy' : 'Thêm tiết dạy mới'}
        subtitle={`${session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'} · Thứ ${
          dayOfWeek === 8 ? 'Chủ nhật' : dayOfWeek
        } · Tiết ${period}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveSlotSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Buổi học *</label>
              <select
                value={session}
                onChange={e => setSession(e.target.value as 'morning' | 'afternoon')}
                className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
              >
                <option value="morning">Buổi Sáng (07:15 - 11:30)</option>
                <option value="afternoon">Buổi Chiều (13:00 - 17:15)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Tiết học *</label>
              <select
                value={period}
                onChange={e => setPeriod(Number(e.target.value))}
                className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>
                    Tiết {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Thứ *</label>
              <select
                value={dayOfWeek}
                onChange={e => setDayOfWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Lớp học *</label>
              <input
                type="text"
                placeholder="Ví dụ: 6A1"
                value={className}
                onChange={e => setClassName(e.target.value)}
                required
                className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Môn học *</label>
              <input
                type="text"
                placeholder="Ví dụ: KHTN, Toán..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
              />
            </div>

            <GardenInput
              label="Ghi chú tiết (nếu có)"
              placeholder="Nội dung, bài dạy..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#e5f0e5]">
            {editingSlot ? (
              <button
                type="button"
                onClick={handleDeleteCurrentSlot}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa tiết
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <GardenButton type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Hủy
              </GardenButton>
              <GardenButton type="submit" variant="primary">
                Lưu tiết học
              </GardenButton>
            </div>
          </div>
        </form>
      </GardenModal>

      {/* OCR Timetable Image Modal */}
      <GardenModal
        isOpen={isOcrModalOpen}
        onClose={() => {
          setIsOcrModalOpen(false);
          setOcrPreviewItems([]);
          setOcrError('');
        }}
        title="Nhận diện TKB bằng hình ảnh"
        subtitle="Hệ thống đọc ảnh thời khóa biểu (Sáng & Chiều) và hiển thị bảng xem trước"
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* File input */}
          <div className="p-6 border-2 border-dashed border-[#cbdfcb] rounded-2xl bg-[#fcfbf9] text-center">
            <Camera className="w-8 h-8 mx-auto text-[#7eac7f] mb-2" />
            <h4 className="text-sm font-bold text-[#293e2b]">Tải lên hình ảnh thời khóa biểu</h4>
            <p className="text-xs text-[#5d905f] mt-1 mb-4">
              Hỗ trợ ảnh chụp hoặc file ảnh (.png, .jpg, .webp, .pdf). Vision AI tự động nhận diện cả buổi Sáng và Chiều.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#467348] text-white text-xs font-semibold hover:bg-[#395c3b] cursor-pointer shadow-xs">
              <Upload className="w-4 h-4" />
              <span>Chọn ảnh TKB từ máy tính</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleOcrFileUpload}
                disabled={isProcessingOcr}
              />
            </label>

            {isProcessingOcr && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#467348] font-medium">
                <span className="w-3 h-3 border-2 border-[#467348] border-t-transparent rounded-full animate-spin" />
                <span>Đang quét và nhận diện bảng thời khóa biểu...</span>
              </div>
            )}
          </div>

          {ocrError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{ocrError}</span>
            </div>
          )}

          {/* OCR Preview Table */}
          {ocrPreviewItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#293e2b]">
                  Xem trước {ocrPreviewItems.length} tiết đã nhận diện (chọn buổi Sáng/Chiều và sửa nếu cần):
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-[#cbdfcb] rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f8f4] text-[#293e2b] sticky top-0">
                    <tr className="border-b border-[#cbdfcb]">
                      <th className="p-2">Buổi</th>
                      <th className="p-2">Thứ</th>
                      <th className="p-2">Tiết</th>
                      <th className="p-2">Lớp</th>
                      <th className="p-2">Môn</th>
                      <th className="p-2">Ghi chú</th>
                      <th className="p-2 text-center w-10">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5f0e5]">
                    {ocrPreviewItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#fbf9f4]">
                        <td className="p-2">
                          <select
                            value={item.session}
                            onChange={e => {
                              const val = e.target.value as 'morning' | 'afternoon';
                              setOcrPreviewItems(prev => {
                                const copy = [...prev];
                                copy[idx].session = val;
                                return copy;
                              });
                            }}
                            className="text-xs border border-[#cbdfcb] rounded bg-white px-1.5 py-0.5"
                          >
                            <option value="morning">Sáng</option>
                            <option value="afternoon">Chiều</option>
                          </select>
                        </td>
                        <td className="p-2 font-semibold">
                          Thứ {item.dayOfWeek === 8 ? 'CN' : item.dayOfWeek}
                        </td>
                        <td className="p-2 font-mono">Tiết {item.period}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.className}
                            onChange={e => {
                              const val = e.target.value;
                              setOcrPreviewItems(prev => {
                                const copy = [...prev];
                                copy[idx].className = val;
                                return copy;
                              });
                            }}
                            className="w-16 px-1.5 py-0.5 border border-[#cbdfcb] rounded bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.subject}
                            onChange={e => {
                              const val = e.target.value;
                              setOcrPreviewItems(prev => {
                                const copy = [...prev];
                                copy[idx].subject = val;
                                return copy;
                              });
                            }}
                            className="w-28 px-1.5 py-0.5 border border-[#cbdfcb] rounded bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.note || ''}
                            placeholder="—"
                            onChange={e => {
                              const val = e.target.value;
                              setOcrPreviewItems(prev => {
                                const copy = [...prev];
                                copy[idx].note = val;
                                return copy;
                              });
                            }}
                            className="w-24 px-1.5 py-0.5 border border-[#cbdfcb] rounded bg-white text-neutral-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setOcrPreviewItems(prev => prev.filter((_, i) => i !== idx));
                            }}
                            title="Xóa tiết này"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <GardenButton
                  variant="outline"
                  onClick={() => {
                    setIsOcrModalOpen(false);
                    setOcrPreviewItems([]);
                  }}
                >
                  Hủy
                </GardenButton>
                <GardenButton
                  variant="primary"
                  icon={<Check className="w-4 h-4" />}
                  onClick={handleConfirmOcrTimetable}
                >
                  XÁC NHẬN LƯU TKB
                </GardenButton>
              </div>
            </div>
          )}
        </div>
      </GardenModal>
    </div>
  );
};
