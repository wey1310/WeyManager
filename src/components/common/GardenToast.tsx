import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { WeySticker, WeyStickerType } from '../../utils/weyStickers';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getStickerForToast = (type: ToastType): WeyStickerType => {
    if (type === 'success') return 'happy';
    if (type === 'error') return 'confused';
    return 'hello';
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          const sticker = getStickerForToast(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-3 sm:p-3.5 rounded-2xl shadow-lg border text-xs sm:text-sm animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-xs ${
                toast.type === 'success'
                  ? 'bg-[#FFFDF6] border-[#D5E4D0] text-[#293D2C]'
                  : toast.type === 'error'
                  ? 'bg-[#FFF5F5] border-rose-300 text-rose-900'
                  : 'bg-[#F7FAF7] border-[#D5E4D0] text-[#293D2C]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  <WeySticker name={sticker} size={36} />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold leading-snug line-clamp-2">{toast.message}</span>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-black/5 cursor-pointer ml-2 shrink-0 transition-colors"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
