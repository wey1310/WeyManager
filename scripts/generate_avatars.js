import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const zodiacSigns = [
  {
    name: 'Aries', vn: 'Bạch Dương', symbol: '♈',
    c1: '#f43f5e', c2: '#fda4af',
    bgFemale: '#fff1f2', bgMale: '#ffe4e6'
  },
  {
    name: 'Taurus', vn: 'Kim Ngưu', symbol: '♉',
    c1: '#10b981', c2: '#6ee7b7',
    bgFemale: '#ecfdf5', bgMale: '#d1fae5'
  },
  {
    name: 'Gemini', vn: 'Song Tử', symbol: '♊',
    c1: '#f59e0b', c2: '#fde68a',
    bgFemale: '#fffbeb', bgMale: '#fef3c7'
  },
  {
    name: 'Cancer', vn: 'Cự Giải', symbol: '♋',
    c1: '#06b6d4', c2: '#a5f3fc',
    bgFemale: '#ecfeff', bgMale: '#cffafe'
  },
  {
    name: 'Leo', vn: 'Sư Tử', symbol: '♌',
    c1: '#f97316', c2: '#fdba74',
    bgFemale: '#fff7ed', bgMale: '#ffedd5'
  },
  {
    name: 'Virgo', vn: 'Xử Nữ', symbol: '♍',
    c1: '#84cc16', c2: '#bef264',
    bgFemale: '#f7fee7', bgMale: '#ecfccb'
  },
  {
    name: 'Libra', vn: 'Thiên Bình', symbol: '♎',
    c1: '#8b5cf6', c2: '#c4b5fd',
    bgFemale: '#f5f3ff', bgMale: '#ede9fe'
  },
  {
    name: 'Scorpio', vn: 'Bọ Cạp', symbol: '♏',
    c1: '#ec4899', c2: '#fbcfe8',
    bgFemale: '#fdf2f8', bgMale: '#fce7f3'
  },
  {
    name: 'Sagittarius', vn: 'Nhân Mã', symbol: '♐',
    c1: '#6366f1', c2: '#a5b4fc',
    bgFemale: '#eef2ff', bgMale: '#e0e7ff'
  },
  {
    name: 'Capricorn', vn: 'Ma Kết', symbol: '♑',
    c1: '#059669', c2: '#6ee7b7',
    bgFemale: '#f0fdf4', bgMale: '#dcfce7'
  },
  {
    name: 'Aquarius', vn: 'Bảo Bình', symbol: '♒',
    c1: '#0284c7', c2: '#7dd3fc',
    bgFemale: '#f0f9ff', bgMale: '#e0f2fe'
  },
  {
    name: 'Pisces', vn: 'Song Ngư', symbol: '♓',
    c1: '#14b8a6', c2: '#99f6e4',
    bgFemale: '#f0fdfa', bgMale: '#ccfbf1'
  }
];

function createSvg(z, gender) {
  const isFemale = gender === 'female';
  const name = z.name;
  const symbol = z.symbol;
  const c1 = z.c1;
  const c2 = z.c2;
  const bg = isFemale ? z.bgFemale : z.bgMale;
  const skin = '#fed7aa';
  const blush = '#f472b6';
  const hair = isFemale ? '#451a03' : '#1c1917';

  const hairPart = isFemale
    ? `
      <circle cx="128" cy="115" r="56" fill="${hair}" />
      <path d="M 76 120 Q 64 175 80 195 Q 94 165 90 130 Z" fill="${hair}" />
      <path d="M 180 120 Q 192 175 176 195 Q 162 165 166 130 Z" fill="${hair}" />
      <circle cx="128" cy="128" r="44" fill="${skin}" />
      <path d="M 84 116 Q 128 85 172 116 Q 152 100 128 104 Q 104 100 84 116 Z" fill="${hair}" />
      <circle cx="80" cy="98" r="14" fill="${c1}" />
      <circle cx="80" cy="98" r="6" fill="#ffffff" />
    `
    : `
      <path d="M 76 122 Q 128 65 180 122 Q 170 92 128 86 Q 86 92 76 122 Z" fill="${hair}" />
      <circle cx="128" cy="130" r="44" fill="${skin}" />
      <path d="M 84 108 L 105 100 L 128 92 L 151 100 L 172 108 Q 128 90 84 108 Z" fill="${hair}" />
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="grad_${name}_${gender}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>

  <rect width="256" height="256" rx="128" fill="${bg}" />
  <circle cx="128" cy="128" r="120" fill="none" stroke="${c2}" stroke-width="4" />
  <circle cx="128" cy="128" r="112" fill="#ffffff" />

  <!-- Character -->
  ${hairPart}

  <!-- Eyes -->
  <circle cx="112" cy="134" r="5" fill="#1e293b" />
  <circle cx="144" cy="134" r="5" fill="#1e293b" />
  <circle cx="114" cy="132" r="2" fill="#ffffff" />
  <circle cx="146" cy="132" r="2" fill="#ffffff" />

  <!-- Blush -->
  <ellipse cx="100" cy="144" rx="7" ry="4" fill="${blush}" opacity="0.6" />
  <ellipse cx="156" cy="144" rx="7" ry="4" fill="${blush}" opacity="0.6" />

  <!-- Smile -->
  <path d="M 120 148 Q 128 156 136 148" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round" />

  <!-- Clothes -->
  <path d="M 84 180 Q 128 170 172 180 L 186 236 Q 128 252 70 236 Z" fill="url(#grad_${name}_${gender})" />
  <path d="M 112 176 Q 128 188 144 176" fill="${skin}" />

  <!-- Zodiac symbol badge -->
  <g transform="translate(162, 162)">
    <circle cx="30" cy="30" r="28" fill="#ffffff" stroke="${c1}" stroke-width="3" />
    <circle cx="30" cy="30" r="22" fill="url(#grad_${name}_${gender})" />
    <text x="30" y="38" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${symbol}</text>
  </g>

  <!-- Top label -->
  <g transform="translate(128, 26)">
    <rect x="-62" y="0" width="124" height="22" rx="11" fill="${c1}" />
    <text x="0" y="15" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">${name.toUpperCase()} • ${(isFemale ? 'NỮ' : 'NAM')}</text>
  </g>
</svg>`;
}

async function run() {
  const targetDirs = [
    'public/avatars',
    'public/assets/avatars',
    'src/assets/avatars',
    'public'
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  for (const z of zodiacSigns) {
    for (const g of ['female', 'male']) {
      const fileNameBase = `${z.name}-${g}`;
      const svg = createSvg(z, g);
      const svgBuffer = Buffer.from(svg);

      // Convert to webp with sharp
      const webpBuffer = await sharp(svgBuffer)
        .resize(256, 256)
        .webp({ quality: 90 })
        .toBuffer();

      for (const dir of targetDirs) {
        fs.writeFileSync(path.join(dir, `${fileNameBase}.webp`), webpBuffer);
        fs.writeFileSync(path.join(dir, `${fileNameBase}.svg`), svgBuffer);
      }
      console.log(`Generated ${fileNameBase}.webp`);
    }
  }

  console.log('SUCCESS: All 24 Zodiac Avatars created with Sharp!');
}

run().catch(console.error);
