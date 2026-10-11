import {
  GradeColumnConfig,
  GradingConfig,
  PointConversionConfig,
  StudentPointRecord,
} from '../types';

export const DEFAULT_POINT_CONVERSION_CONFIG: PointConversionConfig = {
  bonusPointsNeeded: 3, // Cứ 3 điểm cộng tích lũy
  bonusScoreAdded: 0.5, // Quy đổi thành +0.5 điểm
  maxBonusScore: 2.0, // Tối đa +2.0 điểm
  penaltyPointsNeeded: 3, // Cứ 3 điểm trừ tích lũy
  penaltyScoreDeducted: 0.5, // Quy đổi thành -0.5 điểm
  maxPenaltyScore: 2.0, // Tối đa -2.0 điểm
  targetColumnType: 'regular',
};

export const DEFAULT_GRADING_CONFIG: GradingConfig = {
  regularCoefficient: 1,
  midtermCoefficient: 2,
  finalCoefficient: 3,
  annualHk1Weight: 1,
  annualHk2Weight: 2,
  minScore: 0,
  maxScore: 10,
  decimalPlaces: 1,
};

export const DEFAULT_HK1_COLUMNS: GradeColumnConfig[] = [
  { id: 'tx1', name: 'TX1', type: 'regular', coefficient: 1 },
  { id: 'tx2', name: 'TX2', type: 'regular', coefficient: 1 },
  { id: 'tx3', name: 'TX3', type: 'regular', coefficient: 1 },
  { id: 'gk', name: 'GK', type: 'midterm', coefficient: 2 },
  { id: 'ck', name: 'CK', type: 'final', coefficient: 3 },
];

export const DEFAULT_HK2_COLUMNS: GradeColumnConfig[] = [
  { id: 'tx1', name: 'TX1', type: 'regular', coefficient: 1 },
  { id: 'tx2', name: 'TX2', type: 'regular', coefficient: 1 },
  { id: 'tx3', name: 'TX3', type: 'regular', coefficient: 1 },
  { id: 'gk', name: 'GK', type: 'midterm', coefficient: 2 },
  { id: 'ck', name: 'CK', type: 'final', coefficient: 3 },
];

export function validateScore(
  raw: string | number | null | undefined,
  config: GradingConfig = DEFAULT_GRADING_CONFIG
): { isValid: boolean; value: number | null; error?: string } {
  if (raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')) {
    return { isValid: true, value: null };
  }

  const str = String(raw).trim().replace(',', '.');
  const num = Number(str);

  if (isNaN(num)) {
    return {
      isValid: false,
      value: null,
      error: 'Điểm phải là số (0 - 10), ví dụ: 8 hoặc 7.5',
    };
  }

  if (num < config.minScore || num > config.maxScore) {
    return {
      isValid: false,
      value: null,
      error: `Điểm phải từ ${config.minScore} đến ${config.maxScore}`,
    };
  }

  // Round to max 2 decimal places input precision
  const rounded = Math.round(num * 100) / 100;
  return { isValid: true, value: rounded };
}

/**
 * Calculates semester average according to MoET Thông tư 22/2021/TT-BGDĐT:
 * ĐTBmhk = (Tổng điểm ĐGtx + 2 * ĐĐGgk + 3 * ĐĐGck) / (Số lượng ĐGtx + 2 + 3)
 * Returns null if not enough data (e.g. GK or CK missing, or no regular scores).
 */
export function calculateSemesterAverage(
  scores: Record<string, number | null>,
  columns: GradeColumnConfig[],
  config: GradingConfig = DEFAULT_GRADING_CONFIG
): { average: number | null; statusText: string } {
  let regularSum = 0;
  let regularCount = 0;
  let midtermScore: number | null = null;
  let finalScore: number | null = null;

  for (const col of columns) {
    const val = scores[col.id];
    if (col.type === 'regular') {
      if (typeof val === 'number') {
        regularSum += val * (col.coefficient || config.regularCoefficient);
        regularCount++;
      }
    } else if (col.type === 'midterm') {
      if (typeof val === 'number') {
        midtermScore = val;
      }
    } else if (col.type === 'final') {
      if (typeof val === 'number') {
        finalScore = val;
      }
    }
  }

  // Need at least 1 regular score, plus midterm and final scores for full official average
  if (regularCount === 0 || midtermScore === null || finalScore === null) {
    return { average: null, statusText: 'Chưa đủ dữ liệu để tính' };
  }

  const numerator =
    regularSum +
    midtermScore * config.midtermCoefficient +
    finalScore * config.finalCoefficient;

  const denominator =
    regularCount * config.regularCoefficient +
    config.midtermCoefficient +
    config.finalCoefficient;

  if (denominator <= 0) {
    return { average: null, statusText: 'Chưa đủ dữ liệu để tính' };
  }

  const rawAvg = numerator / denominator;
  const factor = Math.pow(10, config.decimalPlaces);
  const rounded = Math.round(rawAvg * factor) / factor;

  return { average: rounded, statusText: rounded.toFixed(config.decimalPlaces) };
}

/**
 * Calculates annual average according to Thông tư 22/2021/TT-BGDĐT:
 * ĐTBmcn = (ĐTBmhkI + 2 * ĐTBmhkII) / 3
 */
export function calculateAnnualAverage(
  hk1Average: number | null,
  hk2Average: number | null,
  config: GradingConfig = DEFAULT_GRADING_CONFIG
): { average: number | null; statusText: string } {
  if (hk1Average === null || hk2Average === null) {
    return { average: null, statusText: 'Chưa đủ điểm cả 2 học kỳ' };
  }

  const numerator =
    hk1Average * config.annualHk1Weight +
    hk2Average * config.annualHk2Weight;

  const denominator = config.annualHk1Weight + config.annualHk2Weight;

  if (denominator <= 0) {
    return { average: null, statusText: 'Chưa đủ dữ liệu' };
  }

  const rawAvg = numerator / denominator;
  const factor = Math.pow(10, config.decimalPlaces);
  const rounded = Math.round(rawAvg * factor) / factor;

  return { average: rounded, statusText: rounded.toFixed(config.decimalPlaces) };
}

/**
 * Classifies evaluation level based on annual grade according to Circular 22
 */
export function getAcademicClassification(avg: number | null): { level: string; color: string } {
  if (avg === null) return { level: 'Chưa xếp loại', color: 'text-neutral-500' };
  if (avg >= 8.0) return { level: 'Tốt', color: 'text-emerald-700 font-semibold' };
  if (avg >= 6.5) return { level: 'Khá', color: 'text-teal-700 font-medium' };
  if (avg >= 5.0) return { level: 'Đạt', color: 'text-amber-700 font-medium' };
  return { level: 'Chưa đạt', color: 'text-rose-700 font-medium' };
}

/**
 * Calculates bonus/penalty points and their corresponding grade score conversions
 */
export function calculateStudentPointSummary(
  records: StudentPointRecord[],
  config: PointConversionConfig = DEFAULT_POINT_CONVERSION_CONFIG
) {
  let plusTotal = 0;
  let minusTotal = 0;

  for (const r of records) {
    const amt = Number(r.amount) || 1;
    if (r.type === 'plus') {
      plusTotal += amt;
    } else if (r.type === 'minus') {
      minusTotal += amt;
    }
  }

  const netPoints = plusTotal - minusTotal;

  // Bonus points conversion: e.g. every bonusPointsNeeded -> +bonusScoreAdded, capped at maxBonusScore
  const bonusNeeded = config.bonusPointsNeeded > 0 ? config.bonusPointsNeeded : 3;
  const bonusAdded = config.bonusScoreAdded > 0 ? config.bonusScoreAdded : 0.5;
  const maxBonus = typeof config.maxBonusScore === 'number' ? config.maxBonusScore : 2.0;

  const bonusUnits = Math.floor(plusTotal / bonusNeeded);
  const convertedBonus = Math.min(bonusUnits * bonusAdded, maxBonus);

  // Penalty points conversion: e.g. every penaltyPointsNeeded -> -penaltyScoreDeducted, capped at maxPenaltyScore
  const penaltyNeeded = config.penaltyPointsNeeded > 0 ? config.penaltyPointsNeeded : 3;
  const penaltyDeducted = config.penaltyScoreDeducted > 0 ? config.penaltyScoreDeducted : 0.5;
  const maxPenalty = typeof config.maxPenaltyScore === 'number' ? config.maxPenaltyScore : 2.0;

  const penaltyUnits = Math.floor(minusTotal / penaltyNeeded);
  const convertedPenalty = Math.min(penaltyUnits * penaltyDeducted, maxPenalty);

  // Net score adjustment (e.g. +1.5 - 0.5 = +1.0)
  const netScoreAdjustment = Math.round((convertedBonus - convertedPenalty) * 100) / 100;

  return {
    plusTotal,
    minusTotal,
    netPoints,
    convertedBonus: Math.round(convertedBonus * 100) / 100,
    convertedPenalty: Math.round(convertedPenalty * 100) / 100,
    netScoreAdjustment,
    bonusUnits,
    penaltyUnits,
    plusPointsToNextBonus: bonusNeeded - (plusTotal % bonusNeeded),
    minusPointsToNextPenalty: penaltyNeeded - (minusTotal % penaltyNeeded),
  };
}
