import React, { useState, useEffect } from 'react';
import { Dices, RefreshCw, Sparkles, UserCheck, Check, Flower2, Copy } from 'lucide-react';
import { StudentData } from '../../types';
import { GardenModal } from '../common/GardenModal';
import { useToast } from '../common/GardenToast';
import { WeySticker } from '../../utils/weyStickers';
import { StudentAvatar } from '../../utils/zodiacHelper';

interface RandomStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentData[];
  className: string;
}

export const RandomStudentModal: React.FC<RandomStudentModalProps> = ({
  isOpen,
  onClose,
  students,
  className,
}) => {
  const [noRepeatMode, setNoRepeatMode] = useState<boolean>(true);
  const [pickedStudentIds, setPickedStudentIds] = useState<Set<string>>(new Set());
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [cyclingName, setCyclingName] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopyNames = async () => {
    if (!students || students.length === 0) {
      showToast('Lớp chưa có học sinh nào!', 'info');
      return;
    }
    const sorted = [...students].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
      setHasCopied(true);
      showToast(`Đã copy họ tên ${sorted.length} HS (dán vào Wheel of Names / web random)!`, 'success');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      showToast('Không thể sao chép vào bộ nhớ tạm', 'error');
    }
  };

  // Eligible pool of students
  const availablePool = noRepeatMode
    ? students.filter(s => !pickedStudentIds.has(s.id))
    : students;

  // Clear transient selection when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setIsSpinning(false);
    }
  }, [isOpen]);

  const handleSpin = () => {
    if (availablePool.length === 0) return;

    setIsSpinning(true);
    setSelectedStudent(null);

    let tick = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * students.length);
      setCyclingName(students[randomIdx]?.fullName || '');
      tick++;

      if (tick > 18) {
        clearInterval(interval);
        // Choose winner from available pool
        const winnerIdx = Math.floor(Math.random() * availablePool.length);
        const winner = availablePool[winnerIdx];
        setSelectedStudent(winner);
        setIsSpinning(false);

        if (noRepeatMode && winner) {
          setPickedStudentIds(prev => new Set(prev).add(winner.id));
        }
      }
    }, 70);
  };

  const handleResetHistory = () => {
    setPickedStudentIds(new Set());
    setSelectedStudent(null);
  };

  const calledStudents = students.filter(s => pickedStudentIds.has(s.id));

  return (
    <GardenModal
      isOpen={isOpen}
      onClose={onClose}
      title="🎲 Gọi Tên Học Sinh Ngẫu Nhiên"
      subtitle={`Lớp ${className} · Còn lại ${availablePool.length}/${students.length} học sinh`}
      sticker="happy"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Top Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#E8F1E5] p-3 rounded-2xl border border-[#D5E4D0] text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#293D2C]">
            <input
              type="checkbox"
              checked={noRepeatMode}
              onChange={e => setNoRepeatMode(e.target.checked)}
              className="rounded border-[#D5E4D0] text-[#426F49] focus:ring-[#426F49]"
            />
            <span>Random không lặp (loại em đã gọi)</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNames}
              className="text-xs text-[#293D2C] hover:text-[#426F49] flex items-center gap-1.5 font-semibold cursor-pointer px-2.5 py-1 rounded-xl bg-white border border-[#D5E4D0] hover:bg-[#E8F1E5] transition-colors shadow-2xs"
              title="Sao chép họ & tên học sinh (mỗi bạn 1 dòng) để dán vào Wheel of Names / web quay số"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#426F49]" />
                  <span className="text-[#426F49]">Đã copy tên!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#426F49]" />
                  <span>Copy tên dán web khác</span>
                </>
              )}
            </button>

            {pickedStudentIds.size > 0 && (
              <button
                onClick={handleResetHistory}
                className="text-xs text-[#426F49] hover:text-[#293D2C] flex items-center gap-1 font-semibold cursor-pointer underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset ({pickedStudentIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Gentle Spinning Arena */}
        <div className="relative overflow-hidden py-10 px-6 rounded-3xl bg-[#FFFDF6] border border-[#D5E4D0] shadow-sm flex flex-col items-center justify-center text-center min-h-[250px]">
          {/* Swirling flower / floating leaf backdrop animation */}
          {isSpinning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
              <Flower2 className="w-48 h-48 text-[#A8C7A0] animate-spin duration-700" />
            </div>
          )}

          {isSpinning ? (
            <div className="relative z-10 space-y-3">
              <div className="mx-auto flex items-center justify-center animate-bounce">
                <WeySticker name="thinking" size={72} />
              </div>
              <div className="text-2xl font-bold font-garden text-[#426F49] tracking-tight min-h-[32px]">
                {cyclingName || 'Đang gọi tên...'}
              </div>
              <p className="text-xs text-[#426F49]/80 font-medium">Gió thổi qua khu vườn matcha...</p>
            </div>
          ) : selectedStudent ? (
            <div className="relative z-10 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F1E5] border border-[#D5E4D0] text-xs font-semibold text-[#426F49]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HỌC SINH ĐƯỢC CHỌN</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border-2 border-[#426F49] shadow-md min-w-[260px] flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <StudentAvatar
                    dob={selectedStudent.dateOfBirth}
                    gender={selectedStudent.gender}
                    zodiac={selectedStudent.zodiac}
                    avatarUrl={selectedStudent.avatar}
                    name={selectedStudent.fullName}
                    size={52}
                    showBadge
                  />
                  <WeySticker name="love" size={48} />
                </div>
                <div className="text-2xl font-bold text-[#293D2C] font-garden">
                  {selectedStudent.fullName}
                </div>
                {selectedStudent.studentCode && (
                  <div className="text-xs font-mono text-[#426F49] mt-0.5 font-medium">
                    Mã HS: {selectedStudent.studentCode}
                  </div>
                )}
                {selectedStudent.note && (
                  <div className="text-[11px] text-[#293D2C]/70 mt-1 italic">
                    {selectedStudent.note}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative z-10 space-y-2 text-[#293D2C]">
              <div className="mx-auto flex items-center justify-center mb-1">
                <WeySticker name={availablePool.length === 0 ? 'sleep' : 'hello'} size={68} />
              </div>
              <p className="text-sm font-bold font-garden text-[#293D2C]">
                {availablePool.length === 0
                  ? 'Tất cả học sinh trong lớp đều đã được gọi.'
                  : 'Sẵn sàng quay số chọn học sinh'}
              </p>
              <p className="text-xs text-[#426F49]">
                {availablePool.length === 0
                  ? 'Bấm "Reset" để bắt đầu lượt gọi mới.'
                  : `Có ${availablePool.length} học sinh sẵn sàng trong lượt này.`}
              </p>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="mt-6 relative z-10">
            <button
              onClick={handleSpin}
              disabled={isSpinning || availablePool.length === 0}
              className="px-8 py-3 rounded-2xl bg-[#426F49] hover:bg-[#365c3c] active:bg-[#293D2C] text-white font-bold text-sm shadow-md shadow-[#426F49]/20 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer mx-auto"
            >
              <Dices className="w-5 h-5" />
              <span>{selectedStudent ? '🎲 Quay tiếp học sinh khác' : '🎲 Bắt đầu quay số'}</span>
            </button>
          </div>
        </div>

        {/* History of Picked Students */}
        {calledStudents.length > 0 && (
          <div className="p-3 bg-[#fcfbf9] rounded-xl border border-[#cbdfcb] text-xs">
            <div className="flex items-center justify-between font-semibold text-[#395c3b] mb-2">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#467348]" />
                <span>Đã gọi trong tiết này ({calledStudents.length} học sinh):</span>
              </span>
              <button
                onClick={handleResetHistory}
                className="text-rose-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {calledStudents.map(s => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#cbdfcb] text-xs text-[#293e2b]"
                >
                  <Check className="w-3 h-3 text-[#467348]" />
                  {s.fullName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </GardenModal>
  );
};
