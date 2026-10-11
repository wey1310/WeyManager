import React, { useState } from 'react';
import { KeyRound, Lock, ExternalLink, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
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
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterGarden,
  onGoogleLogin,
  externalLinks,
  assets,
  customSavedPassword,
  hasActiveSession = false,
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsVerifying(true);

    try {
      const res = await fetch('/api/verify-gate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          customSavedPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsPasswordModalOpen(false);
        // Prompt Google Sign-In or continue to Garden
        try {
          await onGoogleLogin();
        } catch {
          // If popup closed or skipped, enter garden with local/active session
          onEnterGarden();
        }
      } else {
        setErrorMessage(data.message || 'Mật khẩu vào vườn không chính xác.');
      }
    } catch {
      // Fallback check if server request fails
      if (password === '#LeSiYin1310' || (customSavedPassword && password === customSavedPassword)) {
        setIsPasswordModalOpen(false);
        onEnterGarden();
      } else {
        setErrorMessage('Mật khẩu vào vườn không chính xác.');
      }
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
      color: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/20',
      label: 'Facebook',
    },
    {
      id: 'zalo',
      name: 'Zalo',
      url: externalLinks.zalo || 'https://zalo.me',
      assetImg: assets.landingZalo,
      color: 'bg-[#0068FF]/10 text-[#0068FF] border-[#0068FF]/30 hover:bg-[#0068FF]/20',
      label: 'Zalo',
    },
    {
      id: 'drive',
      name: 'Google Drive',
      url: externalLinks.drive || 'https://drive.google.com',
      assetImg: assets.landingDrive,
      color: 'bg-[#0F9D58]/10 text-[#0F9D58] border-[#0F9D58]/30 hover:bg-[#0F9D58]/20',
      label: 'Google Drive',
    },
    {
      id: 'padlet',
      name: 'Padlet',
      url: externalLinks.padlet || 'https://padlet.com',
      assetImg: assets.landingPadlet,
      color: 'bg-[#E91E63]/10 text-[#E91E63] border-[#E91E63]/30 hover:bg-[#E91E63]/20',
      label: 'Padlet',
    },
  ];

  return (
    <div
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#fbf9f4]"
      style={{
        backgroundImage: `url(${assets.landingBg || '/landing-bg.webp'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-[#fbf9f4]/70 pointer-events-none z-0" />
      <BotanicalLeaves leaf1Url={assets.leaf1} leaf2Url={assets.leaf2} />

      {/* Top Bar for landing with solid capsule frame */}
      <header className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#cbdfcb] px-5 py-3 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5d905f] inline-block animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-[#467348] uppercase">
              Private Teacher Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5d905f] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#467348]" />
            <span>Khu vườn cá nhân của Wey</span>
          </div>
        </div>
      </header>

      {/* Hero Section with solid card framing */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 text-center max-w-xl mx-auto w-full space-y-5">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#cbdfcb] p-8 sm:p-10 shadow-md flex flex-col items-center text-center">
          {/* Heading Asset or Typography */}
          <div className="mb-4">
            {assets.landingHeading ? (
              <img
                src={assets.landingHeading}
                alt="Vườn của Wey"
                className="max-h-28 md:max-h-36 object-contain mx-auto"
              />
            ) : (
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e5f0e5] text-[#395c3b] text-xs font-medium mb-3 border border-[#cbdfcb]">
                  <Sparkles className="w-3.5 h-3.5 text-[#5d905f]" />
                  <span>Không gian quản lý lớp học THCS</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold font-garden text-[#293e2b] tracking-tight mb-2">
                  Vườn Của Wey
                </h1>
                <p className="text-sm md:text-base text-[#5d905f] max-w-md mx-auto font-normal leading-relaxed">
                  Sổ tay giảng dạy, quản lý điểm và lịch trình cá nhân nhẹ nhàng như một khu vườn matcha.
                </p>
              </div>
            )}
          </div>

          {/* Enter Button or Asset */}
          <div className="mt-2 flex flex-col items-center">
            {assets.landingEnter ? (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <img src={assets.landingEnter} alt="Vào vườn" className="h-14 md:h-16 object-contain" />
              </button>
            ) : (
            <button
              onClick={onEnterGarden}
              className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-[#467348] hover:bg-[#395c3b] text-white text-base font-bold shadow-lg shadow-[#467348]/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-[#395c3b]"
            >
              <Sparkles className="w-5 h-5 text-[#a7c8a7] group-hover:text-white transition-colors" />
              <span>VÀO VƯỜN (19 LỚP KHỐI 8)</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            )}
          </div>
        </div>

        {/* External Links Shortcuts with solid background */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-[#cbdfcb] p-5 shadow-xs">
          <p className="text-xs font-bold text-[#5d905f] mb-3 tracking-wide">
            LIÊN KẾT NHANH CỦA GIÁO VIÊN
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {linkShortcuts.map(item => (
              <a
                key={item.id}
                href={item.url || '#'}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all hover:-translate-y-0.5 ${item.color}`}
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

      {/* Footer with card badge */}
      <footer className="relative z-10 py-5 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-white/95 border border-[#cbdfcb] text-xs text-[#5d905f] shadow-2xs">
          Vườn của Wey · Thiết kế riêng cho công việc giảng dạy THCS
        </span>
      </footer>

      {/* Password Modal */}
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
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu vào vườn..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errorMessage}
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
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
            <GardenButton type="submit" variant="primary" disabled={isVerifying || !password.trim()}>
              {isVerifying ? 'Đang kiểm tra...' : 'Xác nhận vào'}
            </GardenButton>
          </div>
        </form>
      </GardenModal>
    </div>
  );
};
