import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Upload, UserPlus, Sparkles, Copy, Check } from 'lucide-react';
import { StudentData, ClassData } from '../../types';
import { GardenButton } from '../common/GardenButton';
import { GardenModal } from '../common/GardenModal';
import { GardenInput } from '../common/GardenInput';
import { useToast } from '../common/GardenToast';
import { exportStudentsToExcel } from '../../services/exportService';
import {
  StudentAvatar,
  resolveStudentAvatar,
  ZODIAC_SIGNS,
} from '../../utils/zodiacHelper';
import { WeySticker } from '../../utils/weyStickers';

interface StudentRosterProps {
  classData: ClassData;
  students: StudentData[];
  onSaveStudent: (student: StudentData) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onOpenImport: () => void;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({
  classData,
  students,
  onSaveStudent,
  onDeleteStudent,
  onOpenImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentData | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Nam');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopyStudentNames = async () => {
    if (!students || students.length === 0) {
      showToast('Lớp chưa có học sinh nào để sao chép!', 'info');
      return;
    }
    const sorted = [...students].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const namesOnly = sorted
      .map(s => s.fullName?.trim())
      .filter(Boolean)
      .join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(namesOnly);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = namesOnly;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopied(true);
      showToast(`Đã copy họ tên ${sorted.length} học sinh (sẵn sàng dán vào web random)!`, 'success');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      showToast('Không thể sao chép vào bộ nhớ tạm', 'error');
    }
  };

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(term) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
      (s.note && s.note.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFullName('');
    setStudentCode('');
    setDateOfBirth('');
    setGender('Nam');
    setNote('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: StudentData) => {
    setEditingStudent(s);
    setFullName(s.fullName);
    setStudentCode(s.studentCode || '');
    setDateOfBirth(s.dateOfBirth || '');
    setGender(s.gender || 'Nam');
    setNote(s.note || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      const studentId = editingStudent
        ? editingStudent.id
        : `stu_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const { zodiac, avatarUrl } = resolveStudentAvatar(dateOfBirth.trim(), gender);
      await onSaveStudent({
        id: studentId,
        classId: classData.id,
        userId: classData.userId,
        fullName: fullName.trim(),
        studentCode: studentCode.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender,
        zodiac: zodiac?.key,
        avatar: avatarUrl,
        note: note.trim(),
        order: editingStudent?.order ?? students.length + 1,
        createdAt: editingStudent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    await onDeleteStudent(studentToDelete.id);
    setStudentToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbf9f4] p-3 rounded-xl border border-[#cbdfcb]">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7eac7f]" />
          <input
            type="text"
            placeholder="Tìm học sinh theo tên, mã..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          <GardenButton
            variant="outline"
            size="sm"
            icon={hasCopied ? <Check className="w-3.5 h-3.5 text-[#467348]" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyStudentNames}
            title="Sao chép họ & tên học sinh theo thứ tự (mỗi bạn 1 dòng) để dán vào Wheel of Names / web quay số"
            className={`flex-1 sm:flex-initial text-xs py-1.5 px-2.5 sm:px-3 transition-colors ${
              hasCopied ? 'bg-[#eef5ee] border-[#467348] text-[#293e2b]' : ''
            }`}
          >
            {hasCopied ? 'Đã copy tên!' : 'Copy tên HS'}
          </GardenButton>
          <GardenButton
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial text-xs py-1.5 px-2.5 sm:px-3"
          >
            Thêm HS
          </GardenButton>
          <GardenButton
            variant="outline"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={onOpenImport}
            className="flex-1 sm:flex-initial text-xs py-1.5 px-2.5 sm:px-3"
          >
            Import
          </GardenButton>
          <GardenButton
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => exportStudentsToExcel(classData, students)}
            className="flex-1 sm:flex-initial text-xs py-1.5 px-2.5 sm:px-3"
          >
            Xuất Excel
          </GardenButton>
        </div>
      </div>

      {/* Swipe hint on mobile */}
      <div className="sm:hidden px-1 text-[11px] text-[#5d905f] flex items-center justify-between">
        <span>Danh sách {students.length} học sinh</span>
        <span className="text-[#467348] font-semibold">↔ Vuốt ngang xem đủ cột</span>
      </div>

      {/* Student List Table */}
      <div className="overflow-x-auto touch-scroll rounded-xl border border-[#cbdfcb] bg-white shadow-xs">
        <table className="w-full text-xs text-left min-w-[560px] sm:min-w-[640px]">
          <thead className="bg-[#f4f8f4] text-[#293e2b] font-semibold border-b border-[#cbdfcb]">
            <tr>
              <th className="py-2.5 px-2 w-9 sm:w-11 text-center sticky left-0 bg-[#f4f8f4] z-10">STT</th>
              <th className="py-2.5 px-2 w-14 sm:w-16 text-center">Avatar</th>
              <th className="py-2.5 px-2 sm:px-3 w-20 sm:w-24 hidden md:table-cell">Mã HS</th>
              <th className="py-2.5 px-2.5 sm:px-4 min-w-[130px] sm:min-w-[160px] sticky left-9 sm:left-11 bg-[#f4f8f4] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">Họ và tên</th>
              <th className="py-2.5 px-2.5 sm:px-3 w-24 sm:w-28">Ngày sinh</th>
              <th className="py-2.5 px-2 sm:px-3 w-16 sm:w-20">Giới tính</th>
              <th className="py-2.5 px-2.5 sm:px-3 w-28 sm:w-32">Cung hoàng đạo</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">Ghi chú</th>
              <th className="py-2.5 px-2 sm:px-3 w-16 sm:w-20 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5f0e5]">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#5d905f]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <WeySticker name={searchTerm ? 'confused' : 'hello'} size={56} />
                    <span>
                      {searchTerm
                        ? 'Không tìm thấy học sinh phù hợp với từ khóa.'
                        : '🌱 Lớp chưa có học sinh. Bấm "+ Thêm HS" hoặc "Import" để nạp danh sách.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, idx) => {
                const zodiacInfo = s.zodiac ? ZODIAC_SIGNS[s.zodiac] : resolveStudentAvatar(s.dateOfBirth, s.gender).zodiac;

                return (
                  <tr key={s.id} className="hover:bg-[#fbf9f4] transition-colors group">
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums text-neutral-500 sticky left-0 bg-white group-hover:bg-[#fbf9f4] z-10 w-9 sm:w-11">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <StudentAvatar
                        dob={s.dateOfBirth}
                        gender={s.gender}
                        zodiac={s.zodiac}
                        avatarUrl={s.avatar}
                        name={s.fullName}
                        size={42}
                        showBadge
                      />
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 font-mono text-[11px] text-[#5d905f] hidden md:table-cell">
                      {s.studentCode || '—'}
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-4 font-semibold text-[#293e2b] sticky left-9 sm:left-11 bg-white group-hover:bg-[#fbf9f4] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap min-w-[130px] sm:min-w-[160px]">
                      <span className="truncate max-w-[110px] sm:max-w-none block">{s.fullName}</span>
                    </td>
                    <td className="py-2.5 px-2.5 sm:px-3 font-mono tabular-nums text-neutral-600 text-[11px] sm:text-xs">
                      {s.dateOfBirth || '—'}
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-[#5d905f] text-[11px] sm:text-xs">{s.gender || '—'}</td>
                    <td className="py-2.5 px-2.5 sm:px-3">
                      {zodiacInfo ? (
                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#f4f8f4] text-[#395c3b] border border-[#cbdfcb] text-[10px] sm:text-[11px] font-medium">
                          <span>{zodiacInfo.symbol}</span>
                          <span>{zodiacInfo.nameVn}</span>
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#5d905f] max-w-xs truncate hidden lg:table-cell">{s.note || '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Chỉnh sửa"
                          className="p-1 rounded text-[#5d905f] hover:text-[#293e2b] hover:bg-[#eef5ee] cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(s)}
                          title="Xóa học sinh"
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Student Modal */}
      <GardenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới'}
        subtitle={`Lớp ${classData.name} · Năm học ${classData.schoolYear}`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <GardenInput
            label="Họ và tên *"
            placeholder="Ví dụ: Nguyễn Văn An"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <GardenInput
              label="Mã học sinh"
              placeholder="Ví dụ: HS0123"
              value={studentCode}
              onChange={e => setStudentCode(e.target.value)}
            />

            <GardenInput
              label="Ngày sinh"
              placeholder="dd/mm/yyyy"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Giới tính</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Ghi chú</label>
              <input
                type="text"
                placeholder="Cán sự, lưu ý..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
              />
            </div>
          </div>

          {/* Live Zodiac & Avatar Preview Box */}
          {(() => {
            const zodiacPreview = resolveStudentAvatar(dateOfBirth, gender);
            return (
              <div className="p-3 bg-[#f4f8f4] rounded-xl border border-[#cbdfcb] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StudentAvatar
                    dob={dateOfBirth}
                    gender={gender}
                    name={fullName || 'Học sinh'}
                    size={56}
                    showBadge
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#293e2b]">
                        {zodiacPreview.zodiac
                          ? `Cung ${zodiacPreview.zodiac.nameVn} (${zodiacPreview.zodiac.key})`
                          : 'Cung hoàng đạo'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-[#cbdfcb] text-[#467348] font-semibold">
                        {zodiacPreview.gender === 'female' ? 'Nữ ♀' : 'Nam ♂'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5d905f] mt-0.5">
                      {zodiacPreview.zodiac
                        ? `Khoảng ngày: ${zodiacPreview.zodiac.dateRange} · Avatar: ${zodiacPreview.zodiac.key}-${zodiacPreview.gender}.webp`
                        : 'Nhập ngày sinh (dd/mm/yyyy) để tự động nhận diện chòm sao & chọn avatar'}
                    </p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-[#7eac7f] shrink-0" />
              </div>
            );
          })()}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5f0e5]">
            <GardenButton
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </GardenButton>
            <GardenButton type="submit" variant="primary" disabled={isSubmitting || !fullName.trim()}>
              {isSubmitting ? 'Đang lưu...' : editingStudent ? 'Cập nhật' : 'Thêm học sinh'}
            </GardenButton>
          </div>
        </form>
      </GardenModal>

      {/* Delete Confirmation Modal */}
      <GardenModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Xác nhận xóa học sinh"
        subtitle="Hành động xóa không thể hoàn tác"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#293e2b]">
            Bạn có chắc chắn muốn xóa học sinh <strong>{studentToDelete?.fullName}</strong> khỏi danh sách lớp? Toàn bộ điểm số liên quan đến học sinh này cũng sẽ bị xóa.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <GardenButton variant="outline" onClick={() => setStudentToDelete(null)}>
              Hủy
            </GardenButton>
            <GardenButton variant="danger" onClick={confirmDelete}>
              Xác nhận xóa
            </GardenButton>
          </div>
        </div>
      </GardenModal>
    </div>
  );
};
