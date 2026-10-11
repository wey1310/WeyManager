import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileCheck,
  Building,
  User,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';
import { ClassData, StudentData, StudentGrades } from '../../types';
import { GardenModal } from '../common/GardenModal';
import { GardenButton } from '../common/GardenButton';
import { GardenInput } from '../common/GardenInput';
import {
  exportGradebookToExcelMoET,
  exportGradebookToDocxMoET,
  exportGradebookToPdfMoET,
  MoETReportConfig,
} from '../../services/exportService';
import { WeySticker } from '../../utils/weyStickers';

interface ExportGradebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  students: StudentData[];
  gradesMap: Record<string, StudentGrades>;
}

export const ExportGradebookModal: React.FC<ExportGradebookModalProps> = ({
  isOpen,
  onClose,
  classData,
  students,
  gradesMap,
}) => {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [schoolName, setSchoolName] = useState('Trường THCS / THPT Vườn của Wey');
  const [departmentName, setDepartmentName] = useState('Bộ Giáo dục và Đào tạo');
  const [teacherName, setTeacherName] = useState('Giáo viên bộ môn');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const config: MoETReportConfig = {
    schoolName,
    departmentName,
    teacherName,
    semester,
    academicYear: classData.schoolYear,
    signLocationDate: `Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportGradebookToExcelMoET(classData, students, gradesMap, config);
      setExportSuccess('Đã xuất file Excel (.xlsx) chuẩn Bộ GD&ĐT thành công!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      await exportGradebookToDocxMoET(classData, students, gradesMap, config);
      setExportSuccess('Đã xuất file Word (.docx) chuẩn Bộ GD&ĐT thành công!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      exportGradebookToPdfMoET(classData, students, gradesMap, config);
      setExportSuccess('Đã xuất file PDF chuẩn Bộ GD&ĐT thành công!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <GardenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xuất báo cáo sổ điểm chuẩn Bộ GD&ĐT"
      subtitle={`Lớp ${classData.name} · Môn ${classData.subject} · ${students.length} học sinh`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Banner with Wey work sticker */}
        <div className="flex items-center gap-4 p-3.5 bg-[#f4f8f4] rounded-xl border border-[#cbdfcb]">
          <WeySticker name="work" size={52} />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-[#293e2b] flex items-center gap-1.5 font-garden">
              <span>Định dạng sổ điểm chuẩn Thông tư 22/2021/TT-BGDĐT</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#467348] text-white">
                Chính thức
              </span>
            </h4>
            <p className="text-[11px] text-[#5d905f] mt-0.5">
              Hệ thống tự động tổng hợp đầy đủ Quốc hiệu, Tiêu ngữ, Bảng điểm thường xuyên, giữa kỳ, cuối kỳ, điểm trung bình môn và phần ký duyệt của Hiệu trưởng & Giáo viên.
            </p>
          </div>
        </div>

        {/* Configuration fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#fbf9f4] p-3.5 rounded-xl border border-[#cbdfcb]">
          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1">
              Học kỳ báo cáo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSemester(1)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                  semester === 1
                    ? 'bg-[#467348] text-white border-[#467348]'
                    : 'bg-white text-[#293e2b] border-[#cbdfcb] hover:bg-[#eef5ee]'
                }`}
              >
                Học kỳ I
              </button>
              <button
                type="button"
                onClick={() => setSemester(2)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                  semester === 2
                    ? 'bg-[#467348] text-white border-[#467348]'
                    : 'bg-white text-[#293e2b] border-[#cbdfcb] hover:bg-[#eef5ee]'
                }`}
              >
                Học kỳ II & Cả năm
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1">
              Giáo viên bộ môn
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              placeholder="Họ tên giáo viên..."
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1">
              Cơ quan quản lý
            </label>
            <input
              type="text"
              value={departmentName}
              onChange={e => setDepartmentName(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1">
              Tên trường
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
            />
          </div>
        </div>

        {/* Success toast */}
        {exportSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{exportSuccess}</span>
          </div>
        )}

        {/* Export Buttons cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* PDF Button */}
          <div className="p-3.5 bg-white rounded-xl border border-[#cbdfcb] hover:border-[#467348] hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2 font-bold text-xs">
                PDF
              </div>
              <h5 className="text-xs font-bold text-[#293e2b]">Xuất báo cáo PDF</h5>
              <p className="text-[10px] text-[#5d905f] mt-0.5">
                Định dạng A4 khổ ngang, sẵn sàng gửi duyệt hoặc lưu hồ sơ điện tử.
              </p>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Tải file PDF
            </button>
          </div>

          {/* Word (.docx) Button */}
          <div className="p-3.5 bg-white rounded-xl border border-[#cbdfcb] hover:border-[#467348] hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 font-bold text-xs">
                DOCX
              </div>
              <h5 className="text-xs font-bold text-[#293e2b]">Xuất file Word</h5>
              <p className="text-[10px] text-[#5d905f] mt-0.5">
                Dễ dàng chỉnh sửa thêm nhận xét, đóng dấu hoặc in ấn nội bộ nhà trường.
              </p>
            </div>
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Tải Word (.docx)
            </button>
          </div>

          {/* Excel (.xlsx) Button */}
          <div className="p-3.5 bg-white rounded-xl border border-[#cbdfcb] hover:border-[#467348] hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 font-bold text-xs">
                XLSX
              </div>
              <h5 className="text-xs font-bold text-[#293e2b]">Xuất bảng Excel</h5>
              <p className="text-[10px] text-[#5d905f] mt-0.5">
                Bảng tính MoET nguyên bản, kèm công thức và phân tích xếp loại.
              </p>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Tải Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Direct print alternative */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#cbdfcb]">
          <span className="text-[11px] text-[#5d905f]">
            Có thể bấm <strong>In trực tiếp</strong> để in ra máy in hoặc Lưu dưới dạng PDF từ trình duyệt.
          </span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <GardenButton variant="outline" size="sm" onClick={onClose}>
              Đóng
            </GardenButton>
            <GardenButton
              variant="secondary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              In trực tiếp
            </GardenButton>
          </div>
        </div>
      </div>
    </GardenModal>
  );
};
