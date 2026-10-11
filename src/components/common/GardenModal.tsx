import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { WeySticker, WeyStickerType } from '../../utils/weyStickers';

interface GardenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sticker?: WeyStickerType;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const GardenModal: React.FC<GardenModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  sticker,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1e2f20]/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-[96vw] ${widthClasses[maxWidth]} bg-[#FFFDF6] rounded-2xl sm:rounded-3xl border border-[#D5E4D0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-[#D5E4D0] bg-[#FFFDF6] shrink-0">
          <div className="pr-2 min-w-0 flex items-center gap-3">
            {sticker && (
              <div className="shrink-0 p-1 bg-[#E8F1E5] rounded-xl border border-[#D5E4D0]">
                <WeySticker name={sticker} size={36} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#293D2C] font-garden truncate">{title}</h3>
              {subtitle && <p className="text-[11px] sm:text-xs text-[#426F49] mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#293D2C]/60 hover:text-[#293D2C] hover:bg-[#E8F1E5] transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-5 lg:p-6 overflow-y-auto overscroll-contain bg-[#FFFDF6]">{children}</div>
      </div>
    </div>
  );
};
