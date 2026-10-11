import React, { useState } from 'react';
import { Leaf, Calendar, BookOpen, Settings, LogOut, Menu, X, Clock, Home } from 'lucide-react';
import { User } from 'firebase/auth';

interface GardenNavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onReturnToLanding: () => void;
  currentSchoolYear: string;
  onSelectSchoolYear: (year: string) => void;
}

export const GardenNavbar: React.FC<GardenNavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
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
    <header className="no-print sticky top-0 z-40 bg-[#fdfcf9]/90 backdrop-blur-md border-b border-[#e5f0e5] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Zone */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#e5f0e5] border border-[#cbdfcb] flex items-center justify-center text-[#467348] group-hover:bg-[#cbdfcb] transition-colors shrink-0">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 fill-[#467348]/20" />
              </div>
              <div className="min-w-0">
                <span className="font-garden text-base sm:text-lg font-bold text-[#293e2b] tracking-tight block leading-tight truncate">
                  Vườn của Wey
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#7eac7f] hidden sm:block leading-none">
                  Sổ giáo viên THCS
                </span>
              </div>
            </button>

            {/* School Year Selector */}
            <div className="hidden sm:flex items-center ml-4 pl-4 border-l border-[#cbdfcb]/60">
              <span className="text-xs text-[#5d905f] mr-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Năm học:
              </span>
              <select
                value={currentSchoolYear}
                onChange={e => onSelectSchoolYear(e.target.value)}
                className="text-xs font-semibold text-[#293e2b] bg-[#f4f8f4] border border-[#cbdfcb] rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#467348] cursor-pointer"
              >
                {schoolYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Zone */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#467348] text-white shadow-xs'
                      : 'text-[#395c3b] hover:bg-[#eef5ee] hover:text-[#293e2b]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={onReturnToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#cbdfcb] bg-[#f4f8f4] hover:bg-[#eef5ee] text-[#395c3b] hover:text-[#293e2b] text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Trở lại giao diện cổng vào khu vườn (Landing)"
            >
              <Home className="w-3.5 h-3.5 text-[#467348]" />
              <span>Ra cổng vườn</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-[#f4f8f4] border border-[#cbdfcb] rounded-lg px-2.5 py-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-6 h-6 rounded-full border border-[#cbdfcb] object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#a7c8a7] text-white text-[11px] font-bold flex items-center justify-center">
                    {currentUser.displayName ? currentUser.displayName[0] : 'W'}
                  </div>
                )}
                <span className="text-xs font-semibold text-[#293e2b] max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email || 'Giáo viên'}
                </span>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-1 text-[#7eac7f] hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={onReturnToLanding}
              className="p-2 rounded-lg text-[#395c3b] hover:bg-[#eef5ee] border border-[#cbdfcb] text-xs font-semibold flex items-center gap-1"
              title="Ra cổng vườn"
            >
              <Home className="w-4 h-4 text-[#467348]" />
              <span className="text-[11px]">Cổng</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#395c3b] hover:bg-[#eef5ee] cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e5f0e5] bg-[#fdfcf9] px-4 pt-3 pb-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#e5f0e5]">
            <span className="text-xs font-medium text-[#5d905f]">Năm học:</span>
            <select
              value={currentSchoolYear}
              onChange={e => onSelectSchoolYear(e.target.value)}
              className="text-xs font-semibold text-[#293e2b] bg-[#f4f8f4] border border-[#cbdfcb] rounded-md px-2 py-1"
            >
              {schoolYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#467348] text-white'
                    : 'text-[#395c3b] hover:bg-[#eef5ee]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              onReturnToLanding();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#395c3b] hover:bg-[#eef5ee] bg-[#f4f8f4] border border-[#cbdfcb]"
          >
            <Home className="w-4 h-4 shrink-0 text-[#467348]" />
            <span>Ra cổng vườn (Landing)</span>
          </button>
          {currentUser && (
            <div className="pt-2 border-t border-[#e5f0e5] flex items-center justify-between">
              <span className="text-xs text-[#5d905f] truncate">
                {currentUser.email}
              </span>
              <button
                onClick={onLogout}
                className="text-xs font-semibold text-rose-600 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
