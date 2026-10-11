import React, { useState } from 'react';
import { Settings, Sparkles, AlertTriangle, Check, ArrowRight, X } from 'lucide-react';
import { PointConversionConfig } from '../../types';
import { DEFAULT_POINT_CONVERSION_CONFIG } from '../../services/gradeEngine';
import { GardenButton } from '../common/GardenButton';

interface PointConversionRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PointConversionConfig;
  onSaveConfig: (newConfig: PointConversionConfig, applyGlobally: boolean) => Promise<void>;
  className?: string;
}

export const PointConversionRuleModal: React.FC<PointConversionRuleModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  className,
}) => {
  const [bonusPointsNeeded, setBonusPointsNeeded] = useState<number>(
    config?.bonusPointsNeeded || DEFAULT_POINT_CONVERSION_CONFIG.bonusPointsNeeded
  );
  const [bonusScoreAdded, setBonusScoreAdded] = useState<number>(
    config?.bonusScoreAdded || DEFAULT_POINT_CONVERSION_CONFIG.bonusScoreAdded
  );
  const [maxBonusScore, setMaxBonusScore] = useState<number>(
    typeof config?.maxBonusScore === 'number'
      ? config.maxBonusScore
      : DEFAULT_POINT_CONVERSION_CONFIG.maxBonusScore
  );

  const [penaltyPointsNeeded, setPenaltyPointsNeeded] = useState<number>(
    config?.penaltyPointsNeeded || DEFAULT_POINT_CONVERSION_CONFIG.penaltyPointsNeeded
  );
  const [penaltyScoreDeducted, setPenaltyScoreDeducted] = useState<number>(
    config?.penaltyScoreDeducted || DEFAULT_POINT_CONVERSION_CONFIG.penaltyScoreDeducted
  );
  const [maxPenaltyScore, setMaxPenaltyScore] = useState<number>(
    typeof config?.maxPenaltyScore === 'number'
      ? config.maxPenaltyScore
      : DEFAULT_POINT_CONVERSION_CONFIG.maxPenaltyScore
  );

  const [applyGlobally, setApplyGlobally] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Simulator calculations for real-time preview
  const simPlusPoints = 9;
  const simMinusPoints = 3;
  const simBonusUnits = bonusPointsNeeded > 0 ? Math.floor(simPlusPoints / bonusPointsNeeded) : 0;
  const simBonusScore = Math.min(simBonusUnits * bonusScoreAdded, maxBonusScore);

  const simPenaltyUnits = penaltyPointsNeeded > 0 ? Math.floor(simMinusPoints / penaltyPointsNeeded) : 0;
  const simPenaltyScore = Math.min(simPenaltyUnits * penaltyScoreDeducted, maxPenaltyScore);
  const simNetScore = +(simBonusScore - simPenaltyScore).toFixed(2);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedConfig: PointConversionConfig = {
        bonusPointsNeeded: Math.max(1, Number(bonusPointsNeeded) || 1),
        bonusScoreAdded: Math.max(0.1, Number(bonusScoreAdded) || 0.5),
        maxBonusScore: Math.max(0, Number(maxBonusScore) || 2),
        penaltyPointsNeeded: Math.max(1, Number(penaltyPointsNeeded) || 1),
        penaltyScoreDeducted: Math.max(0.1, Number(penaltyScoreDeducted) || 0.5),
        maxPenaltyScore: Math.max(0, Number(maxPenaltyScore) || 2),
        targetColumnType: 'regular',
      };
      await onSaveConfig(updatedConfig, applyGlobally);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    setBonusPointsNeeded(DEFAULT_POINT_CONVERSION_CONFIG.bonusPointsNeeded);
    setBonusScoreAdded(DEFAULT_POINT_CONVERSION_CONFIG.bonusScoreAdded);
    setMaxBonusScore(DEFAULT_POINT_CONVERSION_CONFIG.maxBonusScore);
    setPenaltyPointsNeeded(DEFAULT_POINT_CONVERSION_CONFIG.penaltyPointsNeeded);
    setPenaltyScoreDeducted(DEFAULT_POINT_CONVERSION_CONFIG.penaltyScoreDeducted);
    setMaxPenaltyScore(DEFAULT_POINT_CONVERSION_CONFIG.maxPenaltyScore);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#cbdfcb] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#cbdfcb] bg-gradient-to-r from-[#eef5ee] to-[#f7faf7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#467348] text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-garden text-lg font-bold text-[#293e2b]">
                Quy định Quy đổi Điểm Cộng & Điểm Trừ
              </h3>
              <p className="text-xs text-[#5d905f]">
                {className ? `Áp dụng cho Lớp ${className}` : 'Cấu hình quy chuẩn chuyển đổi điểm'}
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
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Section 1: Bonus Points Rules */}
          <div className="p-4 rounded-xl bg-[#f4f8f4] border border-[#cbdfcb] space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#467348] text-white text-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-[#293e2b]">
                Quy định Tích Điểm Cộng (Hoa điểm tốt / Sao thưởng)
              </h4>
            </div>

            <p className="text-xs text-[#395c3b]">
              Quy định số điểm cộng học sinh tích lũy được trong các giờ học sẽ được quy đổi thành điểm số cộng vào sổ điểm.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#395c3b] mb-1">
                  Mỗi số điểm cộng tích lũy *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={bonusPointsNeeded}
                    onChange={e => setBonusPointsNeeded(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#cbdfcb] bg-white font-bold text-[#293e2b] focus:ring-1 focus:ring-[#467348]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#7eac7f]">điểm</span>
                </div>
                <span className="text-[11px] text-[#7eac7f] mt-0.5 block">Ví dụ: 3 điểm</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#395c3b] mb-1">
                  Quy đổi thành điểm số *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={bonusScoreAdded}
                    onChange={e => setBonusScoreAdded(Number(e.target.value) || 0.1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#cbdfcb] bg-white font-bold text-[#467348] focus:ring-1 focus:ring-[#467348]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#7eac7f]">điểm</span>
                </div>
                <span className="text-[11px] text-[#7eac7f] mt-0.5 block">Ví dụ: +0.5 điểm</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#395c3b] mb-1">
                  Mức cộng tối đa *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={maxBonusScore}
                    onChange={e => setMaxBonusScore(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#cbdfcb] bg-white font-bold text-[#293e2b] focus:ring-1 focus:ring-[#467348]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#7eac7f]">điểm</span>
                </div>
                <span className="text-[11px] text-[#7eac7f] mt-0.5 block">Ví dụ: Tối đa +2.0đ</span>
              </div>
            </div>

            <div className="text-xs text-[#467348] font-medium bg-white p-2.5 rounded-lg border border-[#cbdfcb] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-[#467348]" />
              <span>
                Công thức: Cứ tích lũy đủ <b>{bonusPointsNeeded}</b> điểm cộng ➔ Quy đổi cộng <b>+{bonusScoreAdded}</b> điểm (Tối đa <b>+{maxBonusScore}</b> điểm)
              </span>
            </div>
          </div>

          {/* Section 2: Penalty Points Rules */}
          <div className="p-4 rounded-xl bg-[#fff9f5] border border-[#f3d3be] space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#d96541] text-white text-xs">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-[#8a3318]">
                Quy định Tích Điểm Trừ (Nhắc nhở / Vi phạm nề nếp)
              </h4>
            </div>

            <p className="text-xs text-[#9c4d32]">
              Quy định số điểm trừ học sinh bị ghi nhận sẽ được quy đổi tương ứng thành điểm bị trừ vào sổ điểm.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#8a3318] mb-1">
                  Mỗi số điểm trừ tích lũy *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={penaltyPointsNeeded}
                    onChange={e => setPenaltyPointsNeeded(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#f3d3be] bg-white font-bold text-[#8a3318] focus:ring-1 focus:ring-[#d96541]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#c27c65]">điểm</span>
                </div>
                <span className="text-[11px] text-[#c27c65] mt-0.5 block">Ví dụ: 3 điểm</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8a3318] mb-1">
                  Quy đổi bị trừ điểm số *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={penaltyScoreDeducted}
                    onChange={e => setPenaltyScoreDeducted(Number(e.target.value) || 0.1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#f3d3be] bg-white font-bold text-[#d96541] focus:ring-1 focus:ring-[#d96541]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#c27c65]">điểm</span>
                </div>
                <span className="text-[11px] text-[#c27c65] mt-0.5 block">Ví dụ: -0.5 điểm</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8a3318] mb-1">
                  Mức trừ tối đa *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={maxPenaltyScore}
                    onChange={e => setMaxPenaltyScore(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#f3d3be] bg-white font-bold text-[#8a3318] focus:ring-1 focus:ring-[#d96541]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#c27c65]">điểm</span>
                </div>
                <span className="text-[11px] text-[#c27c65] mt-0.5 block">Ví dụ: Tối đa -2.0đ</span>
              </div>
            </div>

            <div className="text-xs text-[#8a3318] font-medium bg-white p-2.5 rounded-lg border border-[#f3d3be] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-[#d96541]" />
              <span>
                Công thức: Cứ tích lũy đủ <b>{penaltyPointsNeeded}</b> điểm trừ ➔ Quy đổi trừ <b>-{penaltyScoreDeducted}</b> điểm (Tối đa <b>-{maxPenaltyScore}</b> điểm)
              </span>
            </div>
          </div>

          {/* Interactive Simulator Card */}
          <div className="p-4 rounded-xl bg-white border border-[#cbdfcb] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#293e2b] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#467348]" />
                Mô phỏng minh họa kết quả quy đổi thời gian thực:
              </h5>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#eef5ee] text-[#467348] font-semibold">
                Tự động tính
              </span>
            </div>

            <div className="bg-[#fbf9f5] p-3 rounded-lg border border-[#cbdfcb]/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#395c3b]">
                <span>Giả sử học sinh có <b>9 điểm cộng</b> (hoa/sao):</span>
                <span className="font-bold text-[#467348]">
                  {simBonusUnits} lần × {bonusScoreAdded}đ = +{simBonusScore} điểm thưởng
                </span>
              </div>
              <div className="flex items-center justify-between text-[#395c3b]">
                <span>Và có <b>3 điểm trừ</b> (vi phạm):</span>
                <span className="font-bold text-[#d96541]">
                  {simPenaltyUnits} lần × {penaltyScoreDeducted}đ = -{simPenaltyScore} điểm phạt
                </span>
              </div>
              <div className="pt-1.5 border-t border-[#cbdfcb] flex items-center justify-between font-bold text-sm">
                <span className="text-[#293e2b] flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-[#467348]" />
                  Điểm số tương ứng quy đổi vào sổ điểm:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md ${
                    simNetScore >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {simNetScore >= 0 ? `+${simNetScore}` : simNetScore} điểm
                </span>
              </div>
            </div>
          </div>

          {/* Global apply checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="applyGlobally"
              checked={applyGlobally}
              onChange={e => setApplyGlobally(e.target.checked)}
              className="w-4 h-4 rounded text-[#467348] focus:ring-[#467348] border-[#cbdfcb] cursor-pointer"
            />
            <label htmlFor="applyGlobally" className="text-xs font-medium text-[#293e2b] cursor-pointer">
              Đồng thời lưu làm quy định chuẩn cho tất cả các lớp của tôi
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#cbdfcb]">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-xs text-[#5d905f] hover:text-[#293e2b] underline cursor-pointer"
            >
              Đặt lại mặc định (3 điểm cộng = +0.5đ, 3 điểm trừ = -0.5đ)
            </button>

            <div className="flex items-center gap-2">
              <GardenButton type="button" variant="outline" size="sm" onClick={onClose}>
                Hủy bỏ
              </GardenButton>
              <GardenButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                icon={<Check className="w-4 h-4" />}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu quy định'}
              </GardenButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
