import React, { useState, useEffect } from 'react';
import { Dices, RefreshCw, UserCheck, Users, Sparkles, Check } from 'lucide-react';
import { StudentData } from '../../types';
import { GardenButton } from '../common/GardenButton';

interface RandomStudentPickerProps {
  students: StudentData[];
}

export const RandomStudentPicker: React.FC<RandomStudentPickerProps> = ({ students }) => {
  const [pickCount, setPickCount] = useState<number>(1);
  const [noRepeatMode, setNoRepeatMode] = useState<boolean>(true);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [currentPicks, setCurrentPicks] = useState<StudentData[]>([]);
  const [rollAnimationName, setRollAnimationName] = useState<string>('');

  // Candidates based on no-repeat mode
  const eligibleCandidates = noRepeatMode
    ? students.filter(s => !pickedIds.has(s.id))
    : students;

  const handleRoll = () => {
    if (eligibleCandidates.length === 0) return;

    setIsRolling(true);
    setCurrentPicks([]);

    // Fast cycling name animation
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * students.length);
      setRollAnimationName(students[randomIdx]?.fullName || '');
      counter++;
      if (counter > 18) {
        clearInterval(interval);

        // Pick actual winners
        const pool = [...eligibleCandidates];
        const winners: StudentData[] = [];
        const countToPick = Math.min(pickCount, pool.length);

        for (let i = 0; i < countToPick; i++) {
          const winnerIdx = Math.floor(Math.random() * pool.length);
          winners.push(pool[winnerIdx]);
          pool.splice(winnerIdx, 1);
        }

        setCurrentPicks(winners);
        setIsRolling(false);

        if (noRepeatMode) {
          setPickedIds(prev => {
            const next = new Set(prev);
            winners.forEach(w => next.add(w.id));
            return next;
          });
        }
      }
    }, 60);
  };

  const handleResetHistory = () => {
    setPickedIds(new Set());
    setCurrentPicks([]);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Controls Card */}
      <div className="bg-white rounded-2xl border border-[#cbdfcb] p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5f0e5] pb-4">
          <div>
            <h3 className="text-lg font-bold font-garden text-[#293e2b] flex items-center gap-2">
              <Dices className="w-5 h-5 text-[#467348]" />
              <span>Gọi Tên Ngẫu Nhiên · Random Học Sinh</span>
            </h3>
            <p className="text-xs text-[#5d905f] mt-0.5">
              Hỗ trợ kiểm tra miệng, phát biểu ý kiến hoặc gọi theo nhóm
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5d905f]">
              Còn lại: <strong>{eligibleCandidates.length}</strong> / {students.length} học sinh
            </span>
            {pickedIds.size > 0 && (
              <GardenButton
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleResetHistory}
              >
                Reset lượt đã gọi
              </GardenButton>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#395c3b]">Số lượng chọn:</span>
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => setPickCount(num)}
                className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                  pickCount === num
                    ? 'bg-[#467348] text-white shadow-xs'
                    : 'bg-[#f4f8f4] text-[#395c3b] border border-[#cbdfcb] hover:bg-[#cbdfcb]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#293e2b]">
            <input
              type="checkbox"
              checked={noRepeatMode}
              onChange={e => setNoRepeatMode(e.target.checked)}
              className="rounded border-[#cbdfcb] text-[#467348] focus:ring-[#467348]"
            />
            <span>Chế độ không lặp lại (đã gọi sẽ không gọi lại)</span>
          </label>
        </div>

        {/* Rolling Stage */}
        <div className="py-12 px-6 rounded-2xl bg-gradient-to-b from-[#f4f8f4] to-[#fbf8f0] border border-[#cbdfcb] flex flex-col items-center justify-center text-center min-h-[220px]">
          {isRolling ? (
            <div className="space-y-3 animate-pulse">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#cbdfcb] flex items-center justify-center text-[#467348] animate-spin">
                <Dices className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold font-garden text-[#467348] tracking-tight">
                {rollAnimationName || 'Đang chọn...'}
              </h4>
              <p className="text-xs text-[#7eac7f]">Đang quay thưởng khu vườn...</p>
            </div>
          ) : currentPicks.length > 0 ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e5f0e5] border border-[#cbdfcb] text-xs font-semibold text-[#467348]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HỌC SINH ĐƯỢC CHỌN</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                {currentPicks.map(p => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-white border-2 border-[#467348] shadow-md min-w-[200px]"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#eef5ee] text-[#467348] font-bold font-garden text-lg flex items-center justify-center mb-2">
                      {p.fullName[0]}
                    </div>
                    <div className="text-xl font-bold text-[#293e2b] font-garden">
                      {p.fullName}
                    </div>
                    {p.studentCode && (
                      <div className="text-xs font-mono text-[#7eac7f] mt-0.5">
                        {p.studentCode}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-[#5d905f]">
              <Dices className="w-12 h-12 mx-auto text-[#a7c8a7]" />
              <p className="text-sm font-medium">
                {students.length === 0
                  ? 'Lớp chưa có học sinh nào để quay số.'
                  : 'Sẵn sàng! Bấm nút bên dưới để chọn ngẫu nhiên học sinh.'}
              </p>
            </div>
          )}

          {/* Roll Button */}
          <div className="mt-6">
            <button
              onClick={handleRoll}
              disabled={isRolling || eligibleCandidates.length === 0}
              className="px-8 py-3.5 rounded-xl bg-[#467348] hover:bg-[#395c3b] active:bg-[#304a32] text-white font-bold text-base shadow-lg shadow-[#467348]/25 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              <Dices className="w-5 h-5" />
              <span>🎲 BẮT ĐẦU RANDOM</span>
            </button>
          </div>
        </div>

        {/* History of Picked Students */}
        {pickedIds.size > 0 && (
          <div className="pt-4 border-t border-[#e5f0e5]">
            <h5 className="text-xs font-semibold text-[#5d905f] mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#467348]" />
              <span>Đã gọi trong tiết này ({pickedIds.size} học sinh):</span>
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {students
                .filter(s => pickedIds.has(s.id))
                .map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#f4f8f4] border border-[#cbdfcb] text-xs text-[#293e2b]"
                  >
                    <Check className="w-3 h-3 text-[#467348]" />
                    {s.fullName}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
