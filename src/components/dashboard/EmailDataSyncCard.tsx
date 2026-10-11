import React, { useState } from 'react';
import {
  Mail,
  CloudUpload,
  Download,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
} from 'lucide-react';
import { ClassData, BackupData } from '../../types';
import { GardenButton } from '../common/GardenButton';
import {
  generate19ClassesMailto,
  download19ClassesBackupFile,
} from '../../services/exportService';
import {
  syncAll19ClassesToFirestoreWithProgress,
  SyncProgressState,
  createFullBackup,
} from '../../services/storage';

interface EmailDataSyncCardProps {
  classes: ClassData[];
  userId: string;
  userEmail?: string;
  schoolYear?: string;
  onRefreshData?: () => Promise<void>;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const EmailDataSyncCard: React.FC<EmailDataSyncCardProps> = ({
  classes,
  userId,
  userEmail = 'hoangbang1310@gmail.com',
  schoolYear = '2026–2027',
  onRefreshData,
  onShowToast,
}) => {
  const targetEmail = 'hoangbang1310@gmail.com';
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0) || 840;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressState | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showClassList, setShowClassList] = useState(false);

  // Xử lý gửi báo cáo qua Gmail hoangbang1310@gmail.com
  const handleSendToGmail = async () => {
    try {
      // 1. Tạo file backup dữ liệu đầy đủ và tải về máy
      const backupData: BackupData = await createFullBackup(userId, schoolYear);
      download19ClassesBackupFile(backupData);

      // 2. Tạo link Gmail web và mailto
      const { gmailWebUrl, mailtoUrl } = generate19ClassesMailto({
        targetEmail,
        classes,
        totalStudents,
        schoolYear,
      });

      // 3. Mở tab soạn thư Gmail Web hoặc mailto
      const opened = window.open(gmailWebUrl, '_blank');
      if (!opened) {
        window.location.href = mailtoUrl;
      }

      onShowToast?.(
        `Đã tạo báo cáo gửi tới ${targetEmail} và tự động tải file sao lưu JSON về máy!`,
        'success'
      );
    } catch (err: any) {
      console.error('Error preparing email dispatch:', err);
      onShowToast?.('Không thể chuẩn bị file xuất: ' + (err?.message || ''), 'error');
    }
  };

  // Xử lý đẩy toàn bộ 19 lớp lên Cloud Firestore
  const handleSyncToFirestore = async () => {
    setIsSyncing(true);
    setSyncProgress({
      currentClass: 'Khởi động',
      completedClasses: 0,
      totalClasses: 19,
      syncedStudents: 0,
      percentage: 5,
      status: 'syncing',
      message: 'Đang kết nối Firestore dự án wey-manager...',
    });

    try {
      const result = await syncAll19ClassesToFirestoreWithProgress(
        userId,
        targetEmail,
        progress => {
          setSyncProgress(progress);
        }
      );

      if (result.success) {
        const timeStr = new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSyncTime(timeStr);
        onShowToast?.(
          `Đã đẩy thành công ${result.totalClasses} lớp (${result.totalStudents} học sinh) lên Firestore wey-manager cho ${targetEmail}!`,
          'success'
        );
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        onShowToast?.(
          'Đồng bộ hoàn tất ở bộ nhớ thiết bị. Lưu ý quyền truy cập Firestore: ' + (result.error || ''),
          'info'
        );
      }
    } catch (err: any) {
      console.error('Error syncing to Firestore:', err);
      onShowToast?.('Lỗi đồng bộ Firestore: ' + (err?.message || ''), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Xử lý tải riêng file JSON sao lưu
  const handleDownloadBackup = async () => {
    try {
      const backupData: BackupData = await createFullBackup(userId, schoolYear);
      download19ClassesBackupFile(backupData);
      onShowToast?.('Đã tải xuống file du_lieu_19_lop_khoi_8_hoangbang1310.json', 'success');
    } catch (err: any) {
      onShowToast?.('Lỗi tải backup: ' + (err?.message || ''), 'error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-[#f7faf7] to-[#ebf3eb] rounded-2xl border-2 border-[#94bd96] shadow-sm p-4 sm:p-5 relative overflow-hidden transition-all duration-300">
      {/* Decorative leaf watermarks */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#cbdfcb]/20 pointer-events-none blur-2xl" />
      <div className="absolute right-4 top-4 text-[#467348]/10 pointer-events-none">
        <Database className="w-24 h-24" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#304a32] to-[#467348] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold font-garden text-[#213523] leading-snug">
                  Đồng Bộ & Đẩy Dữ Liệu 19 Lớp Sang Gmail
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e1efe1] text-[#304a32] border border-[#b4d6b6] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#467348]" />
                  hoangbang1310@gmail.com
                </span>
              </div>
              <p className="text-xs text-[#527e54] mt-0.5">
                Cơ sở dữ liệu Firebase: <strong className="text-[#293e2b]">wey-manager</strong> (Firestore) · Quản lý toàn bộ 19 lớp Khối 8 (840 học sinh)
              </p>
            </div>
          </div>

          {lastSyncTime && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#eaf4ea] border border-[#badbbd] text-[11px] font-medium text-[#304a32] self-start sm:self-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã đồng bộ lúc: {lastSyncTime}</span>
            </div>
          )}
        </div>

        {/* Info Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-white/90 border border-[#cbdfcb] flex items-center gap-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#ea4335]/10 text-[#ea4335] flex items-center justify-center shrink-0 font-bold text-xs">
              M
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#5d905f] font-semibold uppercase">Email tiếp nhận</div>
              <div className="text-xs font-bold text-[#293e2b] truncate" title={targetEmail}>
                {targetEmail}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/90 border border-[#cbdfcb] flex items-center gap-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#ffa000]/15 text-[#e65100] flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#5d905f] font-semibold uppercase">Dự án Firebase</div>
              <div className="text-xs font-bold text-[#293e2b] truncate">
                wey-manager (asia-southeast1)
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/90 border border-[#cbdfcb] flex items-center gap-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#467348]/15 text-[#304a32] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#5d905f] font-semibold uppercase">Quy mô dữ liệu</div>
              <div className="text-xs font-bold text-[#293e2b]">
                {classes.length || 19} lớp · {totalStudents} học sinh
              </div>
            </div>
          </div>
        </div>

        {/* Sync Progress Bar if active */}
        {syncProgress && syncProgress.status === 'syncing' && (
          <div className="p-3 bg-white rounded-xl border border-[#b4d6b6] shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#293e2b]">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-[#467348] animate-spin" />
                {syncProgress.message}
              </span>
              <span className="text-[#467348]">{syncProgress.percentage}%</span>
            </div>
            <div className="w-full bg-[#e5f0e5] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#467348] to-[#68a06a] h-full transition-all duration-300"
                style={{ width: `${syncProgress.percentage}%` }}
              />
            </div>
            <div className="text-[11px] text-[#5d905f] flex justify-between">
              <span>Đang đẩy: Lớp {syncProgress.currentClass}</span>
              <span>Đã xong: {syncProgress.completedClasses}/{syncProgress.totalClasses} lớp</span>
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Primary Action: Send to Gmail */}
          <button
            onClick={handleSendToGmail}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea4335] via-[#db4437] to-[#c5221f] text-white hover:brightness-105 active:scale-[0.99] text-xs font-bold shadow-xs cursor-pointer transition-all"
            title="Mở Gmail để gửi báo cáo & tự động tải file backup JSON về máy"
          >
            <Send className="w-4 h-4" />
            <span>Gửi báo cáo qua Gmail ({targetEmail})</span>
          </button>

          {/* Secondary Action: Direct Cloud Sync */}
          <GardenButton
            variant="primary"
            onClick={handleSyncToFirestore}
            disabled={isSyncing}
            icon={isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
          >
            {isSyncing ? 'Đang đẩy lên Firestore...' : 'Đẩy 19 lớp lên Cloud Firestore'}
          </GardenButton>

          {/* Download JSON Backup directly */}
          <GardenButton
            variant="outline"
            onClick={handleDownloadBackup}
            icon={<Download className="w-4 h-4" />}
            title="Tải tệp JSON chứa đầy đủ 19 lớp và 840 học sinh"
          >
            Tải File Backup (.json)
          </GardenButton>

          {/* Toggle Class Quick List */}
          <button
            onClick={() => setShowClassList(!showClassList)}
            className="p-2 rounded-xl border border-[#cbdfcb] bg-white hover:bg-[#f4f8f4] text-[#467348] text-xs font-semibold cursor-pointer transition-colors ml-auto flex items-center gap-1"
          >
            <span>{showClassList ? 'Ẩn DS lớp' : 'Xem 19 lớp'}</span>
            {showClassList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible 19 Classes Quick Chips */}
        {showClassList && (
          <div className="p-3 bg-white/90 rounded-xl border border-[#cbdfcb] space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-[#293e2b]">
              <span>Danh sách 19 lớp Khối 8 đã sẵn sàng đẩy sang {targetEmail}:</span>
              <span className="text-[11px] text-[#5d905f]">Tổng: {classes.length || 19} lớp</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {classes.map((cls, idx) => (
                <div
                  key={cls.id || idx}
                  className="px-2.5 py-1 rounded-lg bg-[#f4f8f4] border border-[#cbdfcb] text-[11px] font-semibold text-[#293e2b] flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#467348]" />
                  <span>{cls.name}</span>
                  <span className="text-[#5d905f] font-normal">({cls.studentCount || 42} hs)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
