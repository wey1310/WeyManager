import React, { useState } from 'react';
import { Leaf, Calendar, BookOpen, Settings, LogOut, Menu, X, Clock, Home, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';

interface GardenNavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onGoogleLogin?: () => Promise<void>;
  onReturnToLanding: () => void;
  currentSchoolYear: string;
  onSelectSchoolYear: (year: string) => void;
}

export const GardenNavbar: React.FC<GardenNavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onGoogleLogin,
  onReturnToLanding,
  currentSchoolYear,
  onSelectSchoolYear,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Leaf },
    { id: 'classes', label: 'Lớp học', icon: BookOpen },
    { id: 'timetable', label: 'Thời khóa biểu', icon: Calendar },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const schoolYears = ['2026–2027', '2025–2026', '2027–2028'];

  return (
    <header className="no-print sticky top-0 z-40 bg-[#FFFDF6]/95 backdrop-blur-md border-b border-[#D5E4D0] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Zone */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F1E5] border border-[#D5E4D0] flex items-center justify-center text-[#426F49] group-hover:bg-[#A8C7A0]/30 transition-colors shrink-0 shadow-2xs">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 fill-[#426F49]/20" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-garden text-base sm:text-lg font-bold text-[#293D2C] tracking-tight leading-tight whitespace-nowrap">
                  Vườn của Wey
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#426F49]/80 hidden sm:block leading-none mt-0.5 whitespace-nowrap">
                  Sổ giáo viên THCS
                </span>
              </div>
            </button>

            {/* School Year Selector */}
            <div className="hidden sm:flex items-center ml-2 pl-3 border-l border-[#D5E4D0]">
              <span className="text-xs text-[#426F49] mr-1.5 flex items-center gap-1 font-medium whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-[#A8C7A0]" /> Năm học:
              </span>
              <select
                value={currentSchoolYear}
                onChange={e => onSelectSchoolYear(e.target.value)}
                className="text-xs font-semibold text-[#293D2C] bg-[#E8F1E5]/60 hover:bg-[#E8F1E5] border border-[#D5E4D0] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#426F49] cursor-pointer transition-colors"
              >
                {schoolYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Zone (Desktop & Tablet horizontal scroll/flex) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 overflow-x-auto no-scrollbar py-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#426F49] text-white shadow-xs'
                      : 'text-[#293D2C] hover:bg-[#E8F1E5] hover:text-[#426F49]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Ra cổng vườn button */}
            <button
              onClick={onReturnToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5E4D0] bg-[#FFFDF6] hover:bg-[#E8F1E5] text-[#293D2C] text-xs font-semibold cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
              title="Trở lại giao diện cổng vào khu vườn (Landing)"
            >
              <Home className="w-3.5 h-3.5 text-[#426F49]" />
              <span>Ra cổng vườn</span>
            </button>

            {/* Google / Account status */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#E8F1E5]/70 border border-[#D5E4D0] rounded-xl px-2.5 py-1.5 shadow-2xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-5 h-5 rounded-full border border-[#A8C7A0] object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#426F49] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {currentUser.displayName ? currentUser.displayName[0] : 'W'}
                  </div>
                )}
                <span className="text-xs font-semibold text-[#293D2C] max-w-[110px] truncate">
                  {currentUser.displayName || currentUser.email || 'Giáo viên'}
                </span>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-1 text-[#426F49] hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#A8C7A0] bg-[#E8F1E5] hover:bg-[#d8e8d4] text-[#293D2C] text-xs font-bold cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                title="Đăng nhập tài khoản Google / Gmail để lưu trữ và đồng bộ đám mây"
              >
                <LogIn className="w-3.5 h-3.5 text-[#426F49]" />
                <span>Liên kết Gmail</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center md:hidden gap-1.5 shrink-0">
            <button
              onClick={onReturnToLanding}
              className="p-1.5 sm:p-2 rounded-xl text-[#293D2C] hover:bg-[#E8F1E5] border border-[#D5E4D0] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Ra cổng vườn"
            >
              <Home className="w-3.5 h-3.5 text-[#426F49]" />
              <span className="text-[11px] hidden xs:inline">Cổng</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-xl text-[#293D2C] hover:bg-[#E8F1E5] border border-transparent hover:border-[#D5E4D0] cursor-pointer transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D5E4D0] bg-[#FFFDF6] px-4 pt-3 pb-4 space-y-2.5 shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#D5E4D0]">
            <span className="text-xs font-medium text-[#426F49]">Năm học:</span>
            <select
              value={currentSchoolYear}
              onChange={e => onSelectSchoolYear(e.target.value)}
              className="text-xs font-semibold text-[#293D2C] bg-[#E8F1E5]/70 border border-[#D5E4D0] rounded-lg px-2 py-1"
            >
              {schoolYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#426F49] text-white shadow-xs'
                      : 'text-[#293D2C] bg-[#E8F1E5]/40 hover:bg-[#E8F1E5]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              onReturnToLanding();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#293D2C] hover:bg-[#E8F1E5] bg-[#E8F1E5]/50 border border-[#D5E4D0]"
          >
            <Home className="w-3.5 h-3.5 text-[#426F49]" />
            <span>Ra cổng vườn (Landing)</span>
          </button>

          {currentUser ? (
            <div className="pt-2 border-t border-[#D5E4D0] flex items-center justify-between">
              <span className="text-xs text-[#293D2C] font-medium truncate max-w-[180px]">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={onLogout}
                className="text-xs font-semibold text-rose-600 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#D5E4D0]">
              <button
                onClick={() => {
                  onGoogleLogin?.();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-[#426F49] hover:bg-[#365c3c] shadow-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Liên kết Gmail để lưu trữ</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
