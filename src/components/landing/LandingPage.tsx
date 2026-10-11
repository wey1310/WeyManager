import React, { useState } from 'react';
import { Leaf, ExternalLink, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';
import { GardenButton } from '../common/GardenButton';
import { GardenModal } from '../common/GardenModal';
import { GardenInput } from '../common/GardenInput';
import { BotanicalLeaves } from '../common/BotanicalLeaves';
import { ExternalLinksConfig, AssetConfig } from '../../types';

interface LandingPageProps {
  onEnterGarden: () => void;
  onGoogleLogin: () => Promise<void>;
  externalLinks: ExternalLinksConfig;
  assets: AssetConfig;
  customSavedPassword?: string;
  hasActiveSession?: boolean;
  currentUser?: User | null;
  classCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterGarden,
  onGoogleLogin,
  externalLinks,
  assets,
  customSavedPassword,
  hasActiveSession = false,
  currentUser = null,
  classCount,
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const inputPass = password.trim();

    if (!inputPass) {
      setErrorMessage('Vui lòng nhập mật khẩu vào vườn.');
      return;
    }

    // Direct client check for instant feedback
    const defaultPass = '#LeSiYin1310';
    if (inputPass === defaultPass || (customSavedPassword && inputPass === customSavedPassword.trim())) {
      setIsPasswordModalOpen(false);
      setPassword('');
      onEnterGarden();
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-gate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: inputPass,
          customSavedPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsPasswordModalOpen(false);
        setPassword('');
        onEnterGarden();
      } else {
        setErrorMessage(data.message || 'Mật khẩu vào vườn không chính xác. Mật khẩu mặc định: #LeSiYin1310');
      }
    } catch {
      setErrorMessage('Mật khẩu vào vườn không chính xác. Mật khẩu mặc định: #LeSiYin1310');
    } finally {
      setIsVerifying(false);
    }
  };

  const linkShortcuts = [
    {
      id: 'fb',
      name: 'Facebook',
      url: externalLinks.facebook || 'https://facebook.com',
      assetImg: assets.landingFb,
      color: 'bg-[#1877F2]/8 text-[#1877F2] border-[#1877F2]/25 hover:bg-[#1877F2]/15',
    },
    {
      id: 'zalo',
      name: 'Zalo',
      url: externalLinks.zalo || 'https://zalo.me',
      assetImg: assets.landingZalo,
      color: 'bg-[#0068FF]/8 text-[#0068FF] border-[#0068FF]/25 hover:bg-[#0068FF]/15',
    },
    {
      id: 'drive',
      name: 'Google Drive',
      url: externalLinks.drive || 'https://drive.google.com',
      assetImg: assets.landingDrive,
      color: 'bg-[#0F9D58]/8 text-[#0F9D58] border-[#0F9D58]/25 hover:bg-[#0F9D58]/15',
    },
    {
      id: 'padlet',
      name: 'Padlet',
      url: externalLinks.padlet || 'https://padlet.com',
      assetImg: assets.landingPadlet,
      color: 'bg-[#E91E63]/8 text-[#E91E63] border-[#E91E63]/25 hover:bg-[#E91E63]/15',
    },
  ];

  return (
    <div
      className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-[#fbf9f4]"
      style={{
        backgroundImage: `url(${assets.landingBg || '/landing-bg.webp'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background veil to enhance text & card contrast while preserving original background */}
      <div className="absolute inset-0 bg-[#FFFDF6]/70 backdrop-blur-[1px] pointer-events-none z-0" />
      <BotanicalLeaves leaf1Url={assets.leaf1} leaf2Url={assets.leaf2} />

      {/* 4. Top Navigation Bar (Gọn gàng, chuẩn phong cách Matcha Garden) */}
      <header className="relative z-10 max-w-4xl w-full mx-auto px-3.5 sm:px-6 pt-3 sm:pt-5">
        <div className="bg-[#FFFDF6]/95 backdrop-blur-md rounded-2xl border border-[#D5E4D0] px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-xs flex items-center justify-between gap-2.5 sm:gap-4 transition-all">
          {/* Bên trái: Icon lá + Tên 'Vườn của Wey' + Nhãn 'PRIVATE TEACHER DASHBOARD' */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#E8F1E5] border border-[#D5E4D0] flex items-center justify-center text-[#426F49] shrink-0 shadow-2xs">
              <Leaf className="w-4 h-4 fill-[#426F49]/20" />
            </div>
            <span className="font-garden text-base sm:text-lg font-bold text-[#293D2C] tracking-tight truncate">
              Vườn của Wey
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#E8F1E5] text-[#426F49] border border-[#D5E4D0] tracking-wider uppercase shrink-0">
              PRIVATE TEACHER DASHBOARD
            </span>
          </div>

          {/* Bên phải: Nhãn khu vườn cá nhân & thông tin tài khoản nếu đã đăng nhập */}
          <div className="flex items-center gap-2 text-xs text-[#527E54] font-medium shrink-0">
            {currentUser ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#E8F1E5] border border-[#D5E4D0] text-[#293D2C] text-xs font-semibold max-w-[150px] sm:max-w-[220px] truncate shadow-2xs"
                title={currentUser.displayName || currentUser.email || 'Giáo viên'}
              >
                <span className="w-2 h-2 rounded-full bg-[#426F49] shrink-0" />
                <span className="truncate">{currentUser.displayName || currentUser.email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#527E54] font-medium">
                <ShieldCheck className="w-4 h-4 text-[#426F49] shrink-0" />
                <span className="hidden xs:inline">Khu vườn cá nhân của Wey</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 5. Khu vực Hero Chính & 7. Liên Kết Nhanh */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-3.5 sm:px-6 py-6 sm:py-10 text-center max-w-xl mx-auto w-full space-y-4 sm:space-y-5">
        {/* Card trung tâm Hero */}
        <div className="w-full bg-[#FFFDF6]/95 backdrop-blur-md rounded-3xl border border-[#D5E4D0] p-6 sm:p-10 shadow-md shadow-[#426F49]/5 flex flex-col items-center text-center transition-all">
          {/* Nhãn phía trên: Không gian quản lý lớp học THCS */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F1E5] text-[#426F49] text-xs font-semibold mb-3.5 border border-[#D5E4D0] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#426F49]" />
            <span>Không gian quản lý lớp học THCS</span>
          </div>

          {/* Tiêu đề & Mô tả */}
          <div className="mb-5 sm:mb-6">
            {assets.landingHeading ? (
              <img
                src={assets.landingHeading}
                alt="Vườn của Wey"
                className="max-h-24 sm:max-h-32 object-contain mx-auto"
              />
            ) : (
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-garden text-[#293D2C] tracking-tight mb-2 sm:mb-2.5">
                  Vườn Của Wey
                </h1>
                <p className="text-sm sm:text-base text-[#527E54] max-w-md mx-auto font-normal leading-relaxed">
                  Sổ tay giảng dạy, quản lý điểm và lịch trình cá nhân nhẹ nhàng như một khu vườn matcha.
                </p>
              </div>
            )}
          </div>

          {/* 6. Nút 'VÀO VƯỜN' */}
          <div className="mt-1 flex flex-col items-center w-full sm:w-auto">
            {assets.landingEnter ? (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <img src={assets.landingEnter} alt="Vào vườn" className="h-14 md:h-16 object-contain" />
              </button>
            ) : (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="group relative inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 sm:px-9 sm:py-4 rounded-2xl bg-[#426F49] hover:bg-[#365c3c] text-white text-sm sm:text-base font-bold shadow-md shadow-[#426F49]/20 hover:shadow-lg hover:shadow-[#426F49]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer border border-[#365c3c] focus:outline-none focus:ring-2 focus:ring-[#A8C7A0] focus:ring-offset-2"
              >
                <Leaf className="w-4 h-4 text-[#A8C7A0] group-hover:text-white transition-colors" />
                <span>
                  {typeof classCount === 'number' && classCount > 0
                    ? `VÀO VƯỜN (${classCount} LỚP KHỐI 8)`
                    : 'VÀO VƯỜN (19 LỚP KHỐI 8)'}
                </span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* 7. Khu vực liên kết nhanh của giáo viên */}
        <div className="w-full bg-[#FFFDF6]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#D5E4D0] p-4 sm:p-5 shadow-xs">
          <p className="text-[11px] sm:text-xs font-bold text-[#527E54] mb-3 tracking-wide text-center uppercase">
            LIÊN KẾT NHANH CỦA GIÁO VIÊN
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {linkShortcuts.map(item => (
              <a
                key={item.id}
                href={item.url || '#'}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-2 h-11 sm:h-12 px-3 rounded-xl border text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 ${item.color}`}
              >
                {item.assetImg ? (
                  <img src={item.assetImg} alt={item.name} className="w-4 h-4 object-contain" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* 8. Footer */}
      <footer className="relative z-10 py-4 sm:py-5 text-center px-4">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFFDF6]/90 border border-[#D5E4D0] text-xs text-[#527E54] shadow-2xs font-medium">
          Vườn của Wey · Thiết kế riêng cho công việc giảng dạy THCS
        </span>
      </footer>

      {/* Mật Khẩu Vào Vườn Modal (Giữ nguyên luồng kiểm tra mật khẩu hiện tại) */}
      <GardenModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setErrorMessage('');
          setPassword('');
        }}
        title="Mật khẩu vào vườn"
        subtitle="Vui lòng nhập mật khẩu cổng vườn để tiếp tục"
        maxWidth="sm"
      >
        <form onSubmit={handleVerifyPassword} className="space-y-4">
          <GardenInput
            label="Mật khẩu cổng"
            type="password"
            placeholder="Nhập mật khẩu vào vườn..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errorMessage}
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D5E4D0]">
            <GardenButton
              type="button"
              variant="outline"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setErrorMessage('');
                setPassword('');
              }}
            >
              Hủy
            </GardenButton>
            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="px-4 py-2 rounded-xl bg-[#426F49] hover:bg-[#365c3c] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#A8C7A0]"
            >
              {isVerifying ? 'Đang kiểm tra...' : 'Xác nhận vào'}
            </button>
          </div>
        </form>
      </GardenModal>
    </div>
  );
};
