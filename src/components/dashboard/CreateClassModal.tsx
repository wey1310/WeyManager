import React, { useState, useEffect } from 'react';
import { GardenModal } from '../common/GardenModal';
import { GardenInput } from '../common/GardenInput';
import { GardenButton } from '../common/GardenButton';
import { ClassData } from '../../types';
import { DEFAULT_HK1_COLUMNS, DEFAULT_HK2_COLUMNS } from '../../services/gradeEngine';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: Partial<ClassData>) => Promise<void>;
  editingClass?: ClassData | null;
  currentSchoolYear: string;
  availableSubjects: string[];
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClass,
  currentSchoolYear,
  availableSubjects,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Khối 6');
  const [subject, setSubject] = useState(availableSubjects[0] || 'Khoa học tự nhiên');
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setGrade(editingClass.grade);
      setSubject(editingClass.subject);
      setSchoolYear(editingClass.schoolYear);
      setNote(editingClass.note || '');
    } else {
      setName('');
      setGrade('Khối 6');
      setSubject(availableSubjects[0] || 'Khoa học tự nhiên');
      setSchoolYear(currentSchoolYear);
      setNote('');
    }
    setError('');
  }, [editingClass, currentSchoolYear, availableSubjects, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        id: editingClass ? editingClass.id : Math.random().toString(36).substring(2, 10),
        name: name.trim(),
        grade,
        subject,
        schoolYear,
        note: note.trim(),
        studentCount: editingClass ? editingClass.studentCount : 0,
        hk1Columns: editingClass?.hk1Columns || DEFAULT_HK1_COLUMNS,
        hk2Columns: editingClass?.hk2Columns || DEFAULT_HK2_COLUMNS,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GardenModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingClass ? `Chỉnh sửa Lớp ${editingClass.name}` : 'Tạo Lớp Học Mới'}
      subtitle="Thiết lập thông tin quản lý cho lớp học"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <GardenInput
            label="Tên lớp *"
            placeholder="Ví dụ: 6A1, 7A2..."
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Khối *</label>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
            >
              <option value="Khối 6">Khối 6</option>
              <option value="Khối 7">Khối 7</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Khối 9">Khối 9</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Môn học *</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
            >
              {availableSubjects.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Năm học *</label>
            <input
              type="text"
              value={schoolYear}
              onChange={e => setSchoolYear(e.target.value)}
              className="w-full rounded-lg border border-[#cbdfcb] bg-white px-3 py-2 text-sm text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#395c3b] mb-1.5">Ghi chú lớp</label>
          <textarea
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ví dụ: Lớp chọn, dạy thứ 2 & thứ 4, sĩ số 42..."
            className="w-full rounded-lg border border-[#cbdfcb] bg-white p-2.5 text-xs text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e5f0e5]">
          <GardenButton type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </GardenButton>
          <GardenButton type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : editingClass ? 'Lưu thay đổi' : 'Tạo lớp'}
          </GardenButton>
        </div>
      </form>
    </GardenModal>
  );
};
