import React from 'react';

export interface ZodiacSignInfo {
  key: string; // e.g. "Libra"
  nameVn: string; // "Thiên Bình"
  symbol: string; // "♎"
  element: string; // "Khí"
  dateRange: string; // "23/09 - 23/10"
}

export const ZODIAC_SIGNS: Record<string, ZodiacSignInfo> = {
  Capricorn: { key: 'Capricorn', nameVn: 'Ma Kết', symbol: '♑', element: 'Đất', dateRange: '22/12 - 19/01' },
  Aquarius: { key: 'Aquarius', nameVn: 'Bảo Bình', symbol: '♒', element: 'Khí', dateRange: '20/01 - 18/02' },
  Pisces: { key: 'Pisces', nameVn: 'Song Ngư', symbol: '♓', element: 'Nước', dateRange: '19/02 - 20/03' },
  Aries: { key: 'Aries', nameVn: 'Bạch Dương', symbol: '♈', element: 'Lửa', dateRange: '21/03 - 19/04' },
  Taurus: { key: 'Taurus', nameVn: 'Kim Ngưu', symbol: '♉', element: 'Đất', dateRange: '20/04 - 20/05' },
  Gemini: { key: 'Gemini', nameVn: 'Song Tử', symbol: '♊', element: 'Khí', dateRange: '21/05 - 20/06' },
  Cancer: { key: 'Cancer', nameVn: 'Cự Giải', symbol: '♋', element: 'Nước', dateRange: '21/06 - 22/07' },
  Leo: { key: 'Leo', nameVn: 'Sư Tử', symbol: '♌', element: 'Lửa', dateRange: '23/07 - 22/08' },
  Virgo: { key: 'Virgo', nameVn: 'Xử Nữ', symbol: '♍', element: 'Đất', dateRange: '23/08 - 22/09' },
  Libra: { key: 'Libra', nameVn: 'Thiên Bình', symbol: '♎', element: 'Khí', dateRange: '23/09 - 23/10' },
  Scorpio: { key: 'Scorpio', nameVn: 'Bọ Cạp', symbol: '♏', element: 'Nước', dateRange: '24/10 - 21/11' },
  Sagittarius: { key: 'Sagittarius', nameVn: 'Nhân Mã', symbol: '♐', element: 'Lửa', dateRange: '22/11 - 21/12' },
};

/**
 * Determine Zodiac Sign from a date string (supports DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
 */
export function getZodiacSignFromDate(dateStr?: string): ZodiacSignInfo | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  let day: number | null = null;
  let month: number | null = null;

  // Case 1: YYYY-MM-DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }
  // Case 2: DD/MM/YYYY or DD-MM-YYYY or D/M/YYYY
  else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  }
  // Case 3: DD/MM
  else if (/^\d{1,2}[-/.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/);
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  }

  if (!day || !month || isNaN(day) || isNaN(month) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Exact dates according to astrological rules
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return ZODIAC_SIGNS.Aries;
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return ZODIAC_SIGNS.Taurus;
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return ZODIAC_SIGNS.Gemini;
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return ZODIAC_SIGNS.Cancer;
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return ZODIAC_SIGNS.Leo;
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return ZODIAC_SIGNS.Virgo;
  // 13/10 falls here: Month 10 and day 13 -> Libra!
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return ZODIAC_SIGNS.Libra;
  if ((month === 10 && day >= 24) || (month === 11 && day <= 21)) return ZODIAC_SIGNS.Scorpio;
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return ZODIAC_SIGNS.Sagittarius;
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return ZODIAC_SIGNS.Capricorn;
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return ZODIAC_SIGNS.Aquarius;
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return ZODIAC_SIGNS.Pisces;

  return null;
}

/**
 * Normalize gender input to 'female' or 'male'
 */
export function normalizeGender(gender?: string): 'female' | 'male' {
  if (!gender) return 'female';
  const g = gender.trim().toLowerCase();
  if (['nam', 'male', 'm', 'trai', 'boy', 'đực'].includes(g)) return 'male';
  return 'female';
}

// Tải toàn bộ avatar từ kho src/assets/avatars/*.webp của người dùng
const avatarGlob = import.meta.glob<{ default: string }>('../assets/avatars/*.webp', {
  eager: true,
});

export const ZODIAC_AVATAR_MAP: Record<string, string> = {};
for (const [path, mod] of Object.entries(avatarGlob)) {
  const fileName = path.split('/').pop() || '';
  if (fileName && mod && mod.default) {
    ZODIAC_AVATAR_MAP[fileName] = mod.default;
  }
}

/**
 * Returns the exact formatted avatar filename and path from src/assets/avatars
 * Format: [Zodiac]-[gender].webp (e.g. Libra-female.webp)
 */
export function getZodiacAvatarPath(zodiacKey: string, gender: 'female' | 'male'): string {
  const capZodiac = zodiacKey.charAt(0).toUpperCase() + zodiacKey.slice(1);
  const fileName = `${capZodiac}-${gender}.webp`;
  return ZODIAC_AVATAR_MAP[fileName] || `/avatars/${fileName}`;
}

/**
 * Computes zodiac avatar for a student given DOB and gender
 */
export function resolveStudentAvatar(dob?: string, rawGender?: string): {
  zodiac: ZodiacSignInfo | null;
  gender: 'female' | 'male';
  avatarUrl: string;
} {
  const gender = normalizeGender(rawGender);
  const zodiac = getZodiacSignFromDate(dob) || ZODIAC_SIGNS.Libra; // Default to Libra if unknown
  const avatarUrl = getZodiacAvatarPath(zodiac.key, gender);

  return { zodiac, gender, avatarUrl };
}

interface StudentAvatarProps {
  dob?: string;
  gender?: string;
  zodiac?: string;
  avatarUrl?: string;
  name?: string;
  size?: number;
  className?: string;
  showBadge?: boolean;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  dob,
  gender,
  zodiac,
  avatarUrl,
  name = 'Học sinh',
  size = 40,
  className = '',
  showBadge = false,
}) => {
  const resolved = resolveStudentAvatar(dob, gender);
  const effectiveZodiac = zodiac && ZODIAC_SIGNS[zodiac] ? ZODIAC_SIGNS[zodiac] : resolved.zodiac;
  const effectiveUrl = avatarUrl || (effectiveZodiac ? getZodiacAvatarPath(effectiveZodiac.key, resolved.gender) : resolved.avatarUrl);

  const titleTooltip = effectiveZodiac
    ? `${name} • Cung ${effectiveZodiac.nameVn} (${effectiveZodiac.symbol}) - ${resolved.gender === 'female' ? 'Nữ' : 'Nam'}`
    : `${name} (${resolved.gender === 'female' ? 'Nữ' : 'Nam'})`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title={titleTooltip}
    >
      <img
        src={effectiveUrl}
        alt={titleTooltip}
        className="w-full h-full rounded-full object-cover border-2 border-white shadow-xs hover:scale-105 transition-transform"
        onError={(e) => {
          const target = e.currentTarget;
          const fallback = ZODIAC_AVATAR_MAP['Libra-female.webp'] || '/avatars/Libra-female.webp';
          if (target.src !== fallback) {
            target.src = fallback;
          }
        }}
      />
      {showBadge && effectiveZodiac && (
        <span
          className="absolute -bottom-1 -right-1 bg-white border border-[#cbdfcb] rounded-full text-[10px] w-4 h-4 flex items-center justify-center shadow-xs"
          title={`Cung ${effectiveZodiac.nameVn}`}
        >
          {effectiveZodiac.symbol}
        </span>
      )}
    </div>
  );
};
