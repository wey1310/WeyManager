import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ClassData, StudentData, StudentGrades } from '../../types';
import { WeySticker } from '../../utils/weyStickers';

interface AcademicDistributionCardProps {
  classData: ClassData;
  students: StudentData[];
  gradesMap: Record<string, StudentGrades>;
  defaultSemester?: 1 | 2;
}

const COLORS = {
  good: '#16a34a', // Giỏi / Tốt
  fair: '#2563eb', // Khá
  pass: '#f59e0b', // Đạt / Trung bình
  fail: '#e11d48', // Chưa đạt / Yếu
  unrated: '#94a3b8', // Chưa có điểm
};

export const AcademicDistributionCard: React.FC<AcademicDistributionCardProps> = ({
  classData,
  students,
  gradesMap,
  defaultSemester = 1,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<1 | 2 | 'annual'>(defaultSemester);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute distribution and statistics
  const stats = useMemo(() => {
    let good = 0;
    let fair = 0;
    let pass = 0;
    let fail = 0;
    let unrated = 0;

    let totalScore = 0;
    let scoredCount = 0;
    let maxScore = 0;

    students.forEach(student => {
      const g = gradesMap[student.id];
      let avg: number | null | undefined = null;

      if (selectedSemester === 1) {
        avg = g?.hk1Average;
      } else if (selectedSemester === 2) {
        avg = g?.hk2Average;
      } else {
        avg = g?.annualAverage ?? g?.hk2Average ?? g?.hk1Average;
      }

      if (typeof avg === 'number' && !isNaN(avg)) {
        scoredCount++;
        totalScore += avg;
        if (avg > maxScore) maxScore = avg;

        if (avg >= 8.0) good++;
        else if (avg >= 6.5) fair++;
        else if (avg >= 5.0) pass++;
        else fail++;
      } else {
        unrated++;
      }
    });

    const classAverage = scoredCount > 0 ? totalScore / scoredCount : null;
    const passRate = scoredCount > 0 ? ((good + fair + pass) / scoredCount) * 100 : 0;
    const goodRate = scoredCount > 0 ? (good / scoredCount) * 100 : 0;

    const chartData = [
      { name: 'Giỏi / Tốt (≥ 8.0)', count: good, color: COLORS.good },
      { name: 'Khá (6.5 – 7.9)', count: fair, color: COLORS.fair },
      { name: 'Đạt / TB (5.0 – 6.4)', count: pass, color: COLORS.pass },
      { name: 'Chưa đạt (< 5.0)', count: fail, color: COLORS.fail },
    ].filter(item => item.count > 0);

    return {
      good,
      fair,
      pass,
      fail,
      unrated,
      totalStudents: students.length,
      scoredCount,
      classAverage,
      maxScore,
      passRate,
      goodRate,
      chartData,
    };
  }, [students, gradesMap, selectedSemester]);

  // Determine which Wey sticker best fits this class status
  const stickerName = useMemo(() => {
    if (stats.scoredCount === 0) return 'sleep';
    if (stats.goodRate >= 40) return 'love';
    if (stats.passRate >= 80) return 'happy';
    if (stats.fail > 3) return 'confused';
    return 'thinking';
  }, [stats]);

  return (
    <div className="bg-[#fbf9f4] rounded-xl sm:rounded-2xl border border-[#cbdfcb] p-3.5 sm:p-4 shadow-xs transition-all">
      {/* Top Header of Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <WeySticker name={stickerName} size={38} className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-[#293e2b] font-garden truncate">
                Phân loại học lực học sinh
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eef5ee] text-[#467348] border border-[#cbdfcb] shrink-0">
                Recharts
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#5d905f] truncate">
              Đánh giá chất lượng dựa trên điểm trung bình môn học (Thông tư 22/BGDĐT)
            </p>
          </div>
        </div>

        {/* Controls: Semester Switcher & Collapse */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center p-0.5 bg-[#eef5ee] rounded-lg border border-[#cbdfcb] text-xs">
            <button
              onClick={() => setSelectedSemester(1)}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                selectedSemester === 1
                  ? 'bg-white text-[#293e2b] shadow-xs'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              HK I
            </button>
            <button
              onClick={() => setSelectedSemester(2)}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                selectedSemester === 2
                  ? 'bg-white text-[#293e2b] shadow-xs'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              HK II
            </button>
            <button
              onClick={() => setSelectedSemester('annual')}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                selectedSemester === 'annual'
                  ? 'bg-white text-[#293e2b] shadow-xs'
                  : 'text-[#5d905f] hover:text-[#293e2b]'
              }`}
            >
              Cả năm
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-[#cbdfcb] bg-white text-[#5d905f] hover:text-[#293e2b] hover:bg-[#eef5ee] transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
            title={isCollapsed ? 'Mở rộng biểu đồ' : 'Thu gọn biểu đồ'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="mt-4 pt-3 border-t border-[#cbdfcb]/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Left stats pills (3 cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-[#cbdfcb]">
              <span className="text-[10px] text-[#5d905f] block">Đã có điểm</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-[#293e2b]">{stats.scoredCount}</span>
                <span className="text-[10px] text-neutral-400">/ {stats.totalStudents} HS</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-[#cbdfcb]">
              <span className="text-[10px] text-[#5d905f] block">Điểm trung bình lớp</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-[#467348]">
                  {stats.classAverage !== null ? stats.classAverage.toFixed(2) : '—'}
                </span>
                <span className="text-[10px] text-neutral-400">/ 10</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-[#cbdfcb]">
              <span className="text-[10px] text-[#5d905f] block">Tỉ lệ Đạt (≥ 5.0)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-emerald-700">
                  {stats.scoredCount > 0 ? `${stats.passRate.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-[#cbdfcb]">
              <span className="text-[10px] text-[#5d905f] block">Điểm cao nhất</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-amber-600">
                  {stats.scoredCount > 0 ? stats.maxScore.toFixed(1) : '—'}
                </span>
              </div>
            </div>

            {/* Quick breakdown pill */}
            <div className="col-span-2 p-2 bg-[#f4f8f4] rounded-xl border border-[#cbdfcb] flex items-center justify-between text-[11px]">
              <span className="text-[#395c3b] font-medium">Học sinh Giỏi / Tốt:</span>
              <span className="font-bold text-[#467348]">
                {stats.good} HS ({stats.scoredCount ? stats.goodRate.toFixed(1) : 0}%)
              </span>
            </div>
          </div>

          {/* Center: Pie Chart (5 cols) */}
          <div className="lg:col-span-5 h-48 flex items-center justify-center">
            {stats.chartData.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 text-xs flex flex-col items-center">
                <WeySticker name="sleep" size={48} />
                <span className="mt-2 text-[#5d905f]">Chưa có học sinh nào được nhập điểm trong kỳ này</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} học sinh (${stats.scoredCount ? ((Number(value) / stats.scoredCount) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbdfcb',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Right: Legend & Classification breakdown (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#cbdfcb]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-[11px] text-[#293e2b] font-medium">Giỏi (≥8.0)</span>
              </div>
              <span className="font-bold text-emerald-700">{stats.good}</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#cbdfcb]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span className="text-[11px] text-[#293e2b] font-medium">Khá (6.5–7.9)</span>
              </div>
              <span className="font-bold text-blue-700">{stats.fair}</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#cbdfcb]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[11px] text-[#293e2b] font-medium">Đạt (5.0–6.4)</span>
              </div>
              <span className="font-bold text-amber-700">{stats.pass}</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#cbdfcb]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span className="text-[11px] text-[#293e2b] font-medium">Chưa đạt (&lt;5.0)</span>
              </div>
              <span className="font-bold text-rose-700">{stats.fail}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
