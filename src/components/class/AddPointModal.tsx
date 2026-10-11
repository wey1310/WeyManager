import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Check, X, Calendar, User, FileText } from 'lucide-react';
import { StudentData, StudentPointRecord } from '../../types';
import { GardenButton } from '../common/GardenButton';

interface AddPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentData[];
  selectedStudentId?: string;
  defaultType?: 'plus' | 'minus';
  defaultAmount?: number;
  defaultReason?: string;
  onSaveRecord: (record: StudentPointRecord) => Promise<void>;
  classId: string;
  userId: string;
}

const PLUS_PRESETS = [
  { label: '🙋 Phát biểu xây dựng bài', amount: 1 },
  { label: '✍️ Làm bài tập xuất sắc', amount: 1 },
  { label: '💯 Trả lời bài cũ 10 điểm', amount: 2 },
  { label: '🤝 Giúp đỡ bạn bè tích cực', amount: 1 },
  { label: '🧹 Trực nhật chăm chỉ, sạch đẹp', amount: 1 },
  { label: '💡 Sáng tạo / Giải cách độc đáo', amount: 1 },
];

const MINUS_PRESETS = [
  { label: '⏰ Đi học muộn / Vào lớp muộn', amount: 1 },
  { label: '📚 Không làm bài tập về nhà', amount: 1 },
  { label: '🗣️ Nói chuyện, mất trật tự', amount: 1 },
  { label: '📱 Làm việc riêng trong giờ học', amount: 1 },
  { label: '🎒 Quên sách vở / Đồ dùng', amount: 1 },
  { label: '⚠️ Vi phạm nội quy lớp học', amount: 2 },
];

export const AddPointModal: React.FC<AddPointModalProps> = ({
  isOpen,
  onClose,
  students,
  selectedStudentId = '',
  defaultType = 'plus',
  defaultAmount = 1,
  defaultReason = '',
  onSaveRecord,
  classId,
  userId,
}) => {
  const [studentId, setStudentId] = useState<string>(selectedStudentId);
  const [type, setType] = useState<'plus' | 'minus'>(defaultType);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [reason, setReason] = useState<string>(defaultReason);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudentId(selectedStudentId || students[0]?.id || '');
      setType(defaultType);
      setAmount(defaultAmount);
      setReason(defaultReason);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, selectedStudentId, defaultType, defaultAmount, defaultReason, students]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !reason.trim() || amount <= 0) return;

    setIsSubmitting(true);
    try {
      const record: StudentPointRecord = {
        id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentId,
        classId,
        userId,
        type,
        amount: Math.max(1, Number(amount) || 1),
        reason: reason.trim(),
        date,
        createdAt: new Date().toISOString(),
      };
      await onSaveRecord(record);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#cbdfcb] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#cbdfcb] bg-gradient-to-r from-[#eef5ee] to-[#f7faf7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
                type === 'plus' ? 'bg-[#467348]' : 'bg-[#d96541]'
              }`}
            >
              {type === 'plus' ? <Sparkles className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-garden text-lg font-bold text-[#293e2b]">
                {type === 'plus' ? 'Ghi nhận Điểm Cộng (+)' : 'Ghi nhận Điểm Trừ (-)'}
              </h3>
              <p className="text-xs text-[#5d905f]">
                Tích lũy hoa điểm tốt hoặc ghi nhận vi phạm nề nếp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5d905f] hover:text-[#293e2b] hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4f8f4] rounded-xl border border-[#cbdfcb]">
            <button
              type="button"
              onClick={() => setType('plus')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'plus'
                  ? 'bg-[#467348] text-white shadow-xs'
                  : 'text-[#395c3b] hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Điểm cộng (+)
            </button>
            <button
              type="button"
              onClick={() => setType('minus')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'minus'
                  ? 'bg-[#d96541] text-white shadow-xs'
                  : 'text-[#8a3318] hover:bg-white/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Điểm trừ (-)
            </button>
          </div>

          {/* Student selection */}
          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#467348]" />
              Học sinh nhận điểm *
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#cbdfcb] bg-white font-medium text-[#293e2b] focus:ring-1 focus:ring-[#467348]"
              required
            >
              {students.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {idx + 1}. {s.fullName} {s.studentCode ? `(${s.studentCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">
                Số điểm ({type === 'plus' ? '+' : '-'}) *
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-bold border cursor-pointer transition-all ${
                      amount === val
                        ? type === 'plus'
                          ? 'bg-[#467348] text-white border-[#467348]'
                          : 'bg-[#d96541] text-white border-[#d96541]'
                        : 'bg-white border-[#cbdfcb] text-[#293e2b] hover:bg-[#f4f8f4]'
                    }`}
                  >
                    {type === 'plus' ? `+${val}` : `-${val}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#467348]" />
                Ngày ghi nhận
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:ring-1 focus:ring-[#467348]"
              />
            </div>
          </div>

          {/* Reason presets */}
          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#467348]" />
              Lý do nhanh (Chọn 1 chạm):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {(type === 'plus' ? PLUS_PRESETS : MINUS_PRESETS).map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setReason(item.label);
                    setAmount(item.amount);
                  }}
                  className={`text-left px-2.5 py-2 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    reason === item.label
                      ? type === 'plus'
                        ? 'bg-[#eef5ee] border-[#467348] text-[#293e2b] font-bold'
                        : 'bg-[#fff2ed] border-[#d96541] text-[#8a3318] font-bold'
                      : 'bg-[#fcfbf9] border-[#cbdfcb]/60 text-[#395c3b] hover:bg-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1">
              Hoặc nhập lý do chi tiết *
            </label>
            <input
              type="text"
              placeholder={
                type === 'plus'
                  ? 'Ví dụ: Tích cực giải bài toán khó trên bảng...'
                  : 'Ví dụ: Quên mang vở bài tập...'
              }
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#cbdfcb] bg-white text-[#293e2b] focus:ring-1 focus:ring-[#467348]"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#cbdfcb]">
            <GardenButton type="button" variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </GardenButton>
            <GardenButton
              type="submit"
              variant={type === 'plus' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isSubmitting || !reason.trim()}
              icon={<Check className="w-4 h-4" />}
            >
              {isSubmitting ? 'Đang lưu...' : 'Ghi nhận điểm'}
            </GardenButton>
          </div>
        </form>
      </div>
    </div>
  );
};
