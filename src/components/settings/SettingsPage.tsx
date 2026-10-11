import React, { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  KeyRound,
  ExternalLink,
  BookOpen,
  Image as ImageIcon,
  ShieldAlert,
  LogOut,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import {
  UserProfileData,
  AssetConfig,
  ExternalLinksConfig,
  BackupData,
  PointConversionConfig,
} from '../../types';
import { GardenButton } from '../common/GardenButton';
import { GardenCard } from '../common/GardenCard';
import { GardenInput } from '../common/GardenInput';
import { GardenModal } from '../common/GardenModal';
import { downloadBackupJSON } from '../../services/exportService';
import { DEFAULT_POINT_CONVERSION_CONFIG } from '../../services/gradeEngine';

interface SettingsPageProps {
  profile: UserProfileData;
  onSaveProfile: (updated: UserProfileData) => Promise<void>;
  onCreateBackup: () => Promise<BackupData>;
  onRestoreBackup: (backupData: BackupData) => Promise<void>;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  onSaveProfile,
  onCreateBackup,
  onRestoreBackup,
  onLogout,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [currentSchoolYear, setCurrentSchoolYear] = useState(profile.currentSchoolYear || '2026–2027');
  const [customPassword, setCustomPassword] = useState(profile.customGatePassword || '');

  // Links
  const [links, setLinks] = useState<ExternalLinksConfig>({
    facebook: profile.externalLinks?.facebook || '',
    zalo: profile.externalLinks?.zalo || '',
    drive: profile.externalLinks?.drive || '',
    padlet: profile.externalLinks?.padlet || '',
  });

  // Subjects
  const [subjects, setSubjects] = useState<string[]>(
    profile.subjects && profile.subjects.length > 0
      ? profile.subjects
      : ['Khoa học tự nhiên', 'Vật lí', 'Hóa học', 'Sinh học', 'Toán', 'Công nghệ']
  );
  const [newSubject, setNewSubject] = useState('');

  // Assets
  const [assets, setAssets] = useState<AssetConfig>(profile.assets || {});

  // Point Conversion Rules (Default for all classes)
  const [pointConfig, setPointConfig] = useState<PointConversionConfig>(
    profile.pointConversionConfig || DEFAULT_POINT_CONVERSION_CONFIG
  );

  // Backup & Restore
  const [isExporting, setIsExporting] = useState(false);
  const [restoreConfirmModal, setRestoreConfirmModal] = useState<BackupData | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAll = async () => {
    const updated: UserProfileData = {
      ...profile,
      displayName: displayName.trim(),
      currentSchoolYear: currentSchoolYear.trim(),
      customGatePassword: customPassword.trim(),
      externalLinks: links,
      subjects,
      assets,
      pointConversionConfig: pointConfig,
      updatedAt: new Date().toISOString(),
    };

    await onSaveProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddSubject = () => {
    if (!newSubject.trim() || subjects.includes(newSubject.trim())) return;
    setSubjects(prev => [...prev, newSubject.trim()]);
    setNewSubject('');
  };

  const handleRemoveSubject = (name: string) => {
    setSubjects(prev => prev.filter(s => s !== name));
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const data = await onCreateBackup();
      downloadBackupJSON(data);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (!json.version || !Array.isArray(json.classes)) {
          alert('File backup không hợp lệ hoặc không đúng định dạng Vườn của Wey.');
          return;
        }
        setRestoreConfirmModal(json as BackupData);
      } catch {
        alert('Không thể đọc file backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restoreConfirmModal) return;
    await onRestoreBackup(restoreConfirmModal);
    setRestoreConfirmModal(null);
    alert('Khôi phục dữ liệu thành công!');
    window.location.reload();
  };

  // Asset upload helper
  const handleAssetUpload = (assetKey: keyof AssetConfig, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAssets(prev => ({
        ...prev,
        [assetKey]: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearAsset = (assetKey: keyof AssetConfig) => {
    setAssets(prev => {
      const copy = { ...prev };
      delete copy[assetKey];
      return copy;
    });
  };

  const assetList: { key: keyof AssetConfig; label: string; desc: string }[] = [
    { key: 'landingBg', label: 'Hình nền Trang 1 (landing-bg.webp)', desc: 'Ảnh nền toàn màn hình cổng vào vườn' },
    { key: 'landingHeading', label: 'Tiêu đề Trang 1 (landing-heading.webp)', desc: 'Logo/Typography Vườn Của Wey' },
    { key: 'landingEnter', label: 'Nút Vào Vườn (landing-enter.webp)', desc: 'Nút bấm mở khóa vào khu vườn' },
    { key: 'landingFb', label: 'Icon Facebook (landing-linkingfb.webp)', desc: 'Nút tắt liên kết Facebook' },
    { key: 'landingZalo', label: 'Icon Zalo (landing-linkingzalo.webp)', desc: 'Nút tắt liên kết Zalo' },
    { key: 'landingDrive', label: 'Icon Google Drive (landing-linkingdrive.webp)', desc: 'Nút tắt liên kết Google Drive' },
    { key: 'landingPadlet', label: 'Icon Padlet (landing-linkingpadlet.webp)', desc: 'Nút tắt liên kết Padlet' },
    { key: 'homeBg', label: 'Hình nền Trang 2 (home-bg.webp)', desc: 'Ảnh nền trang tổng quan khu vườn' },
    { key: 'classBg', label: 'Hình nền Trang 3 (class-bg.webp)', desc: 'Ảnh nền giao diện sổ lớp' },
    { key: 'leaf1', label: 'Hiệu ứng lá 1 (leaf1.gif)', desc: 'Ảnh/GIF lá rơi trang trí' },
    { key: 'leaf2', label: 'Hiệu ứng lá 2 (leaf2.gif)', desc: 'Ảnh/GIF lá rơi trang trí' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-[#cbdfcb]">
        <div>
          <h2 className="text-xl font-bold font-garden text-[#293e2b]">Cài Đặt Khu Vườn</h2>
          <p className="text-xs text-[#5d905f]">
            Quản lý tài khoản, mật khẩu vào vườn, liên kết ngoài và sao lưu dữ liệu
          </p>
        </div>

        <GardenButton
          variant="primary"
          icon={saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          onClick={handleSaveAll}
        >
          {saveSuccess ? 'Đã lưu cấu hình' : 'Lưu tất cả thay đổi'}
        </GardenButton>
      </div>

      {/* Profile & Gate Password */}
      <GardenCard>
        <h3 className="text-base font-bold font-garden text-[#293e2b] mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#467348]" />
          <span>Thông tin giáo viên & Mật khẩu vào vườn</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GardenInput
            label="Tên hiển thị giáo viên"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Ví dụ: Thầy/Cô Wey"
          />

          <GardenInput
            label="Năm học mặc định"
            value={currentSchoolYear}
            onChange={e => setCurrentSchoolYear(e.target.value)}
            placeholder="Ví dụ: 2026–2027"
          />

          <div className="sm:col-span-2">
            <GardenInput
              label="Mật khẩu cổng vào vườn tùy chỉnh"
              type="text"
              value={customPassword}
              onChange={e => setCustomPassword(e.target.value)}
              placeholder="#LeSiYin1310 (Mặc định nếu để trống)"
              helperText="Mật khẩu cổng trước khi bước vào trang tổng quan. Khởi tạo: #LeSiYin1310."
            />
          </div>
        </div>
      </GardenCard>

      {/* External Links Configuration */}
      <GardenCard>
        <h3 className="text-base font-bold font-garden text-[#293e2b] mb-4 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[#467348]" />
          <span>Cấu hình 4 liên kết nhanh (Landing Shortcuts)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GardenInput
            label="Facebook URL"
            value={links.facebook}
            onChange={e => setLinks(prev => ({ ...prev, facebook: e.target.value }))}
            placeholder="https://facebook.com/..."
          />

          <GardenInput
            label="Zalo URL"
            value={links.zalo}
            onChange={e => setLinks(prev => ({ ...prev, zalo: e.target.value }))}
            placeholder="https://zalo.me/..."
          />

          <GardenInput
            label="Google Drive URL"
            value={links.drive}
            onChange={e => setLinks(prev => ({ ...prev, drive: e.target.value }))}
            placeholder="https://drive.google.com/..."
          />

          <GardenInput
            label="Padlet URL"
            value={links.padlet}
            onChange={e => setLinks(prev => ({ ...prev, padlet: e.target.value }))}
            placeholder="https://padlet.com/..."
          />
        </div>
      </GardenCard>

      {/* Subjects Management */}
      <GardenCard>
        <h3 className="text-base font-bold font-garden text-[#293e2b] mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#467348]" />
          <span>Danh sách môn học giảng dạy</span>
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {subjects.map(sub => (
            <span
              key={sub}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f4f8f4] border border-[#cbdfcb] text-xs font-semibold text-[#293e2b]"
            >
              <span>{sub}</span>
              <button
                type="button"
                onClick={() => handleRemoveSubject(sub)}
                className="text-neutral-400 hover:text-rose-600 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <input
            type="text"
            placeholder="Thêm môn học mới..."
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            className="flex-1 text-xs border border-[#cbdfcb] rounded-lg px-3 py-2 bg-white text-[#293e2b] focus:outline-none"
          />
          <GardenButton variant="outline" size="sm" onClick={handleAddSubject}>
            + Thêm môn
          </GardenButton>
        </div>
      </GardenCard>

      {/* Point Conversion Rules Configuration */}
      <GardenCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold font-garden text-[#293e2b] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#467348]" />
            <span>Quy định Quy đổi Điểm Cộng & Điểm Trừ mặc định</span>
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#eef5ee] text-[#467348] font-bold border border-[#cbdfcb]">
            Áp dụng chung
          </span>
        </div>
        <p className="text-xs text-[#5d905f] mb-4">
          Thiết lập quy chuẩn chuyển đổi số điểm cộng (hoa điểm tốt) và điểm trừ (vi phạm) thành điểm số trong sổ điểm cho tất cả các lớp.
        </p>

        <div className="space-y-4">
          {/* Bonus Points */}
          <div className="p-4 rounded-xl bg-[#f4f8f4] border border-[#cbdfcb] space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#467348] text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-[#293e2b]">
                Quy định Tích Điểm Cộng (Hoa điểm tốt, phát biểu, làm bài tốt)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#395c3b] mb-1">
                  Mỗi số điểm cộng tích lũy
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pointConfig.bonusPointsNeeded}
                    onChange={e =>
                      setPointConfig(prev => ({
                        ...prev,
                        bonusPointsNeeded: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white font-bold text-[#293e2b]"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-[#7eac7f]">điểm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#395c3b] mb-1">
                  Quy đổi thành điểm số (+)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={pointConfig.bonusScoreAdded}
                    onChange={e =>
                      setPointConfig(prev => ({
                        ...prev,
                        bonusScoreAdded: Math.max(0.1, Number(e.target.value) || 0.1),
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white font-bold text-[#467348]"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-[#7eac7f]">điểm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#395c3b] mb-1">
                  Mức cộng thưởng tối đa
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={pointConfig.maxBonusScore}
                    onChange={e =>
                      setPointConfig(prev => ({
                        ...prev,
                        maxBonusScore: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white font-bold text-[#293e2b]"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-[#7eac7f]">điểm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Penalty Points */}
          <div className="p-4 rounded-xl bg-[#fff9f5] border border-[#f3d3be] space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#d96541] text-white">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-[#8a3318]">
                Quy định Tích Điểm Trừ (Nhắc nhở, không làm bài, mất trật tự)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8a3318] mb-1">
                  Mỗi số điểm trừ tích lũy
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pointConfig.penaltyPointsNeeded}
                    onChange={e =>
                      setPointConfig(prev => ({
                        ...prev,
                        penaltyPointsNeeded: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#f3d3be] bg-white font-bold text-[#8a3318]"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-[#c27c65]">điểm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a3318] mb-1">
                  Quy đổi bị trừ điểm số (-)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={pointConfig.penaltyScoreDeducted}
                    onChange={e =>
                      setPointConfig(prev => ({
                        ...prev,
                        penaltyScoreDeducted: Math.max(0.1, Number(e.target.value) || 0.1),
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#f3d3be] bg-white font-bold text-[#d96541]"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-[#c27c65]">điểm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a3318] mb-1">
                  Mức trừ tối đa
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={pointConfig.maxPenaltyScore}
                    onChange={e =>
                      setPointConfig(prev => ({
                        ...prev,
                        maxPenaltyScore: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#f3d3be] bg-white font-bold text-[#8a3318]"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-[#c27c65]">điểm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GardenCard>

      {/* Asset Management */}
      <GardenCard>
        <h3 className="text-base font-bold font-garden text-[#293e2b] mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#467348]" />
          <span>Quản lý Asset hình ảnh & hiệu ứng</span>
        </h3>
        <p className="text-xs text-[#5d905f] mb-4">
          Tải lên hoặc thay thế hình ảnh tùy chỉnh cho Trang 1, Trang 2, Trang 3 và hiệu ứng lá rơi.
        </p>

        <div className="space-y-3">
          {assetList.map(item => {
            const currentVal = assets[item.key];
            return (
              <div
                key={item.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#fcfbf9] border border-[#cbdfcb] gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  {currentVal ? (
                    <img
                      src={currentVal}
                      alt={item.label}
                      className="w-12 h-12 object-cover rounded-lg border border-[#cbdfcb] bg-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#f4f8f4] border border-[#cbdfcb] flex items-center justify-center text-[#7eac7f]">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-[#293e2b] block">{item.label}</span>
                    <span className="text-[11px] text-[#5d905f]">{item.desc}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] hover:bg-[#f4f8f4] font-medium cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#5d905f]" />
                    <span>{currentVal ? 'Thay ảnh' : 'Tải lên'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleAssetUpload(item.key, e)}
                    />
                  </label>

                  {currentVal && (
                    <button
                      type="button"
                      onClick={() => handleClearAsset(item.key)}
                      title="Xóa asset này"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GardenCard>

      {/* Backup and Restore */}
      <GardenCard className="border-l-4 border-l-[#467348]">
        <h3 className="text-base font-bold font-garden text-[#293e2b] mb-2 flex items-center gap-2">
          <Download className="w-4 h-4 text-[#467348]" />
          <span>Sao lưu & Khôi phục dữ liệu (JSON Backup)</span>
        </h3>
        <p className="text-xs text-[#5d905f] mb-4">
          Xuất toàn bộ danh sách lớp, học sinh, điểm số, lịch trình và ghi chú ra file JSON để lưu trữ an toàn hoặc chuyển máy.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <GardenButton
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportBackup}
            disabled={isExporting}
          >
            {isExporting ? 'Đang tạo backup...' : 'Xuất file backup.json'}
          </GardenButton>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] hover:bg-[#f4f8f4] text-xs font-semibold cursor-pointer shadow-xs">
            <Upload className="w-4 h-4 text-[#5d905f]" />
            <span>Khôi phục từ file backup.json</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestoreFileSelected}
            />
          </label>
        </div>
      </GardenCard>

      {/* Google Account / Sign out */}
      <GardenCard className="border-l-4 border-l-rose-400">
        <h3 className="text-base font-bold font-garden text-[#293e2b] mb-1 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Tài khoản Google & Đăng xuất</span>
        </h3>
        <p className="text-xs text-[#5d905f] mb-4">
          Tài khoản kết nối: <strong>{profile.email}</strong>. Dữ liệu được bảo mật và cách ly tuyệt đối theo UID riêng của bạn.
        </p>

        <GardenButton variant="danger" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={onLogout}>
          Đăng xuất khỏi tài khoản
        </GardenButton>
      </GardenCard>

      {/* Restore Confirmation Modal */}
      <GardenModal
        isOpen={!!restoreConfirmModal}
        onClose={() => setRestoreConfirmModal(null)}
        title="Xác nhận khôi phục dữ liệu"
        subtitle="Hành động này sẽ cập nhật cơ sở dữ liệu từ file backup"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-[#293e2b]">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
            <strong>Cảnh báo khôi phục:</strong>
            <p>
              File backup ngày {restoreConfirmModal?.exportedAt?.slice(0, 10)} chứa{' '}
              <strong>{restoreConfirmModal?.classes?.length || 0} lớp học</strong> và{' '}
              <strong>{restoreConfirmModal?.students?.length || 0} học sinh</strong>.
            </p>
          </div>

          <p>
            Bạn có chắc chắn muốn tiến hành khôi phục? Các dữ liệu trùng lặp sẽ được cập nhật đồng bộ.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5f0e5]">
            <GardenButton variant="outline" onClick={() => setRestoreConfirmModal(null)}>
              Hủy
            </GardenButton>
            <GardenButton variant="primary" onClick={handleConfirmRestore}>
              Xác nhận khôi phục ngay
            </GardenButton>
          </div>
        </div>
      </GardenModal>
    </div>
  );
};
