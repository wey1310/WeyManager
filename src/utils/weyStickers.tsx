import React from 'react';

// Wey stickers assets
export type WeyStickerType =
  | 'hello'
  | 'love'
  | 'study'
  | 'sleep'
  | 'confused'
  | 'happy'
  | 'work'
  | 'sad'
  | 'thinking';

export interface WeyStickerMeta {
  id: string;
  type: WeyStickerType;
  fileName: string;
  title: string;
  description: string;
  url: string;
}

export const WEY_STICKERS: Record<WeyStickerType, WeyStickerMeta> = {
  hello: {
    id: 'wey_01',
    type: 'hello',
    fileName: 'wey_01_hello.webp',
    title: 'Xin chào!',
    description: 'Lời chào thân thiện từ Vườn Wey, đón chào ngày mới và chào đón học sinh',
    url: '/wey_01_hello.webp',
  },
  love: {
    id: 'wey_02',
    type: 'love',
    fileName: 'wey_02_love.webp',
    title: 'Xuất sắc / Yêu thích ❤️',
    description: 'Khen ngợi học sinh giỏi, đạt điểm cao 9-10 hoặc top bảng danh dự',
    url: '/wey_02_love.webp',
  },
  study: {
    id: 'wey_03',
    type: 'study',
    fileName: 'wey_03_study.webp',
    title: 'Chăm chỉ học tập 📚',
    description: 'Chuyên cần, ôn luyện, quản lý sổ điểm và bài kiểm tra định kỳ',
    url: '/wey_03_study.webp',
  },
  sleep: {
    id: 'wey_04',
    type: 'sleep',
    fileName: 'wey_04_sleep.webp',
    title: 'Nghỉ ngơi / Trống dữ liệu 💤',
    description: 'Chưa có thông tin điểm số, ngày nghỉ hoặc danh sách còn trống',
    url: '/wey_04_sleep.webp',
  },
  confused: {
    id: 'wey_05',
    type: 'confused',
    fileName: 'wey_05_confused.webp',
    title: 'Băn khoăn / Cần trợ giúp 🤔',
    description: 'Cảnh báo điểm cần cải thiện, không tìm thấy kết quả hoặc dữ liệu bất thường',
    url: '/wey_05_confused.webp',
  },
  happy: {
    id: 'wey_06',
    type: 'happy',
    fileName: 'wey_06_happy.webp',
    title: 'Vui vẻ / Thành công ✨',
    description: 'Tích điểm cộng, chúc mừng tiến bộ, lưu dữ liệu thành công',
    url: '/wey_06_happy.webp',
  },
  work: {
    id: 'wey_07',
    type: 'work',
    fileName: 'wey_07_work.webp',
    title: 'Làm việc chăm chỉ 💼',
    description: 'Nhập xuất báo cáo, xuất file PDF/Docx/Excel, thiết lập cấu hình',
    url: '/wey_07_work.webp',
  },
  sad: {
    id: 'wey_08',
    type: 'sad',
    fileName: 'wey_08_sad.webp',
    title: 'Nhắc nhở / Buồn 💧',
    description: 'Điểm trừ hành vi vi phạm, học sinh chưa đạt cần kèm cặp',
    url: '/wey_08_sad.webp',
  },
  thinking: {
    id: 'wey_09',
    type: 'thinking',
    fileName: 'wey_09_thinking.webp',
    title: 'Thống kê & Phân tích 🧠',
    description: 'Biểu đồ phân loại học lực, phân tích trung bình môn, tính toán số liệu',
    url: '/wey_09_thinking.webp',
  },
};

interface WeyStickerProps {
  name: WeyStickerType;
  className?: string;
  size?: number | string;
  alt?: string;
  showCaption?: boolean;
}

export const WeySticker: React.FC<WeyStickerProps> = ({
  name,
  className = '',
  size = 56,
  alt,
  showCaption = false,
}) => {
  const meta = WEY_STICKERS[name] || WEY_STICKERS.hello;
  const sizeStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : { width: size, height: size };

  return (
    <div className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      <img
        src={meta.url}
        alt={alt || meta.title}
        title={meta.title}
        style={sizeStyle}
        className="object-contain drop-shadow-xs transition-transform duration-200 hover:scale-110 select-none pointer-events-auto"
        onError={(e) => {
          // Fallback to /assets/ if root fails
          const target = e.currentTarget;
          if (!target.src.includes('/assets/')) {
            target.src = `/assets/${meta.fileName}`;
          }
        }}
      />
      {showCaption && (
        <span className="text-[10px] text-[#395c3b] font-medium mt-1 text-center font-garden">
          {meta.title}
        </span>
      )}
    </div>
  );
};
