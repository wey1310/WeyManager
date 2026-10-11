import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  GraduationCap,
  ArrowRight,
  Edit,
  Trash2,
  Layers,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { ClassData } from '../../types';
import { GardenButton } from '../common/GardenButton';

interface ClassesOverviewTableProps {
  classes: ReadonlyArray<ClassData>;
  currentSchoolYear: string;
  onSelectClass: (classId: string) => void;
  onEditClass: (cls: ClassData) => void;
  onDeleteClass: (classId: string, className: string) => void;
  onCreateClass: () => void;
  onImportClass: () => void;
}

export const ClassesOverviewTable: React.FC<ClassesOverviewTableProps> = ({
  classes,
  currentSchoolYear,
  onSelectClass,
  onEditClass,
  onDeleteClass,
  onCreateClass,
  onImportClass,
}) => {
  const [groupBy, setGroupBy] = useState<'grade' | 'subject' | 'flat'>('grade');
  const [filterText, setFilterText] = useState('');

  // Filter classes by current year
  const yearClasses = classes.filter(c => c.schoolYear === currentSchoolYear);

  // Search filter
  const displayedClasses = yearClasses.filter(c => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.grade.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      (c.note && c.note.toLowerCase().includes(q))
    );
  });

  // Extract unique grades and subjects
  const allGrades = ['Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'];
  const presentGrades = Array.from(new Set(yearClasses.map(c => c.grade))).sort();
  const sortedGrades = allGrades.filter(g => presentGrades.includes(g)).concat(
    presentGrades.filter(g => !allGrades.includes(g))
  );

  const allSubjects = Array.from(new Set(yearClasses.map(c => c.subject))).sort();

  // Matrix calculation: matrix[grade][subject] = ClassData[]
  const matrix: Record<string, Record<string, ClassData[]>> = {};
  sortedGrades.forEach(g => {
    matrix[g] = {};
    allSubjects.forEach(s => {
      matrix[g][s] = yearClasses.filter(c => c.grade === g && c.subject === s);
    });
  });

  const totalStudents = yearClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-[#cbdfcb] shadow-xs overflow-hidden space-y-6 p-5 sm:p-6">
      {/* Header Zone */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5f0e5] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eef5ee] border border-[#cbdfcb] flex items-center justify-center text-[#467348]">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-garden text-lg font-bold text-[#293e2b]">
              Bảng Tổng Quan Toàn Bộ Lớp [Nhóm Theo Khối & Môn]
            </h3>
          </div>
          <p className="text-xs text-[#5d905f] mt-1">
            Tổng hợp toàn diện {yearClasses.length} lớp học, {totalStudents} học sinh trong năm học {currentSchoolYear}
          </p>
        </div>

        {/* Action Controls & Group Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grouping switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#f4f8f4] border border-[#cbdfcb] rounded-xl text-xs font-semibold">
            <span className="text-[#5d905f] px-2 text-[11px]">Nhóm theo:</span>
            <button
              onClick={() => setGroupBy('grade')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                groupBy === 'grade'
                  ? 'bg-white text-[#293e2b] shadow-2xs font-bold'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              Khối lớp
            </button>
            <button
              onClick={() => setGroupBy('subject')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                groupBy === 'subject'
                  ? 'bg-white text-[#293e2b] shadow-2xs font-bold'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              Môn học
            </button>
            <button
              onClick={() => setGroupBy('flat')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                groupBy === 'flat'
                  ? 'bg-white text-[#293e2b] shadow-2xs font-bold'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              Toàn bộ
            </button>
          </div>

          <GardenButton variant="outline" size="sm" onClick={onCreateClass}>
            + Thêm lớp
          </GardenButton>
        </div>
      </div>

      {/* MATRIX SUMMARY TABLE: Khối vs Môn Cross-Tabulation */}
      {sortedGrades.length > 0 && allSubjects.length > 0 && (
        <div className="bg-[#fcfbf9] rounded-xl border border-[#cbdfcb] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold font-garden text-[#293e2b] flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#5d905f]" />
              <span>Ma Trận Phân Bổ: Khối × Môn Học</span>
            </span>
            <span className="text-[11px] text-[#7eac7f]">
              Số lớp (Sĩ số học sinh)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f8f4] border-b border-[#cbdfcb] text-[#293e2b]">
                  <th className="py-2 px-3 font-bold border-r border-[#cbdfcb]">Khối</th>
                  {allSubjects.map(sub => (
                    <th key={sub} className="py-2 px-3 text-center font-bold border-r border-[#cbdfcb]">
                      {sub}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-center font-bold bg-[#eef5ee] text-[#467348]">
                    Tổng cộng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbdfcb]/60 bg-white">
                {sortedGrades.map(grade => {
                  const gradeClasses = yearClasses.filter(c => c.grade === grade);
                  const gradeStudents = gradeClasses.reduce((s, c) => s + (c.studentCount || 0), 0);

                  return (
                    <tr key={grade} className="hover:bg-[#f7faf7] transition-colors">
                      <td className="py-2 px-3 font-bold text-[#293e2b] bg-[#fdfcf9] border-r border-[#cbdfcb]">
                        {grade}
                      </td>
                      {allSubjects.map(sub => {
                        const cellClasses = matrix[grade]?.[sub] || [];
                        const cellStudents = cellClasses.reduce((s, c) => s + (c.studentCount || 0), 0);
                        return (
                          <td
                            key={sub}
                            className="py-2 px-3 text-center border-r border-[#cbdfcb]/60"
                          >
                            {cellClasses.length > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-[#293e2b]">
                                  {cellClasses.length} lớp
                                </span>
                                <span className="text-[10px] text-[#5d905f]">
                                  ({cellStudents} HS)
                                </span>
                              </div>
                            ) : (
                              <span className="text-neutral-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center font-bold bg-[#f7faf7] text-[#467348]">
                        {gradeClasses.length} lớp ({gradeStudents} HS)
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-[#eef5ee] font-bold text-[#293e2b]">
                  <td className="py-2 px-3 border-r border-[#cbdfcb]">TỔNG CỘNG</td>
                  {allSubjects.map(sub => {
                    const subClasses = yearClasses.filter(c => c.subject === sub);
                    const subStudents = subClasses.reduce((s, c) => s + (c.studentCount || 0), 0);
                    return (
                      <td key={sub} className="py-2 px-3 text-center border-r border-[#cbdfcb]/60">
                        {subClasses.length} lớp ({subStudents} HS)
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-center bg-[#467348] text-white">
                    {yearClasses.length} lớp ({totalStudents} HS)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED MASTER TABLE VIEW */}
      <div className="space-y-4">
        {/* Search quick filter */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-[#293e2b] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#467348]" />
            <span>Chi tiết danh sách các lớp ({displayedClasses.length})</span>
          </div>

          <input
            type="text"
            placeholder="Lọc nhanh lớp, khối, môn..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#293e2b] focus:outline-none focus:ring-1 focus:ring-[#467348] w-48 sm:w-64"
          />
        </div>

        {displayedClasses.length === 0 ? (
          <div className="text-center py-10 rounded-xl bg-[#fcfbf9] border border-dashed border-[#cbdfcb] text-xs text-[#5d905f]">
            🌱 Chưa có lớp nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#cbdfcb] bg-white">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#f4f8f4] border-b border-[#cbdfcb] text-[#293e2b]">
                  <th className="py-2.5 px-3 font-bold">Khối</th>
                  <th className="py-2.5 px-3 font-bold">Môn học</th>
                  <th className="py-2.5 px-3 font-bold">Tên lớp</th>
                  <th className="py-2.5 px-3 text-center font-bold">Sĩ số</th>
                  <th className="py-2.5 px-3 text-center font-bold">Cột điểm HK1/HK2</th>
                  <th className="py-2.5 px-3 font-bold">Ghi chú</th>
                  <th className="py-2.5 px-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbdfcb]/60">
                {groupBy === 'grade' &&
                  sortedGrades.map(grade => {
                    const groupClasses = displayedClasses.filter(c => c.grade === grade);
                    if (groupClasses.length === 0) return null;
                    const groupStudents = groupClasses.reduce((s, c) => s + (c.studentCount || 0), 0);

                    return (
                      <React.Fragment key={grade}>
                        {/* Subheader for Grade */}
                        <tr className="bg-[#eef5ee]/70 text-[#293e2b] font-bold">
                          <td colSpan={7} className="py-2 px-3">
                            <div className="flex items-center justify-between">
                              <span className="font-garden text-sm text-[#467348]">
                                🌿 {grade} ({groupClasses.length} lớp)
                              </span>
                              <span className="text-[11px] text-[#5d905f] font-normal">
                                Tổng sĩ số: <strong>{groupStudents} học sinh</strong>
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Rows */}
                        {groupClasses.map(cls => renderClassRow(cls))}
                      </React.Fragment>
                    );
                  })}

                {groupBy === 'subject' &&
                  allSubjects.map(sub => {
                    const groupClasses = displayedClasses.filter(c => c.subject === sub);
                    if (groupClasses.length === 0) return null;
                    const groupStudents = groupClasses.reduce((s, c) => s + (c.studentCount || 0), 0);

                    return (
                      <React.Fragment key={sub}>
                        {/* Subheader for Subject */}
                        <tr className="bg-[#eef5ee]/70 text-[#293e2b] font-bold">
                          <td colSpan={7} className="py-2 px-3">
                            <div className="flex items-center justify-between">
                              <span className="font-garden text-sm text-[#467348]">
                                📚 {sub} ({groupClasses.length} lớp)
                              </span>
                              <span className="text-[11px] text-[#5d905f] font-normal">
                                Tổng sĩ số: <strong>{groupStudents} học sinh</strong>
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Rows */}
                        {groupClasses.map(cls => renderClassRow(cls))}
                      </React.Fragment>
                    );
                  })}

                {groupBy === 'flat' &&
                  displayedClasses.map(cls => renderClassRow(cls))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  function renderClassRow(cls: ClassData) {
    const hk1ColCount = cls.hk1Columns?.length || 5;
    const hk2ColCount = cls.hk2Columns?.length || 5;

    return (
      <tr key={cls.id} className="hover:bg-[#fcfbf9] transition-colors">
        <td className="py-2.5 px-3">
          <span className="px-2 py-0.5 rounded-md bg-[#f4f8f4] text-[#467348] font-semibold border border-[#cbdfcb]">
            {cls.grade}
          </span>
        </td>
        <td className="py-2.5 px-3 font-medium text-[#293e2b]">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#5d905f]" />
            <span>{cls.subject}</span>
          </span>
        </td>
        <td className="py-2.5 px-3">
          <button
            onClick={() => onSelectClass(cls.id)}
            className="font-bold text-sm font-garden text-[#293e2b] hover:text-[#467348] hover:underline cursor-pointer flex items-center gap-1.5 text-left"
          >
            <span>Lớp {cls.name}</span>
          </button>
        </td>
        <td className="py-2.5 px-3 text-center">
          <span className="font-bold tabular-nums text-[#293e2b]">
            {cls.studentCount || 0}
          </span>{' '}
          <span className="text-[11px] text-[#7eac7f]">HS</span>
        </td>
        <td className="py-2.5 px-3 text-center text-[11px] text-[#5d905f]">
          HK1: {hk1ColCount} cột · HK2: {hk2ColCount} cột
        </td>
        <td className="py-2.5 px-3 text-[11px] text-[#5d905f] max-w-xs truncate">
          {cls.note || <span className="text-neutral-300 italic">Chưa có ghi chú</span>}
        </td>
        <td className="py-2.5 px-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => onSelectClass(cls.id)}
              className="px-2.5 py-1 rounded-lg bg-[#467348] hover:bg-[#395c3b] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-2xs transition-colors"
            >
              <span>Vào sổ</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onEditClass(cls)}
              className="p-1 rounded-lg text-neutral-500 hover:text-[#293e2b] hover:bg-[#f4f8f4] cursor-pointer"
              title="Chỉnh sửa thông tin lớp"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteClass(cls.id, cls.name)}
              className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Xóa lớp"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }
};
