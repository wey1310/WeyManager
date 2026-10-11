export interface GradeColumnConfig {
  id: string;
  name: string;
  type: 'regular' | 'midterm' | 'final';
  coefficient: number;
}

export interface PointConversionConfig {
  bonusPointsNeeded: number; // Số điểm cộng cần để quy đổi thành điểm số (vd: 3 điểm cộng)
  bonusScoreAdded: number; // Số điểm số được cộng tương ứng (vd: +0.5 điểm)
  maxBonusScore: number; // Mức điểm thưởng tối đa (vd: 2.0 điểm)
  penaltyPointsNeeded: number; // Số điểm trừ cần để quy đổi thành điểm số (vd: 3 điểm trừ)
  penaltyScoreDeducted: number; // Số điểm số bị trừ tương ứng (vd: -0.5 điểm)
  maxPenaltyScore: number; // Mức điểm phạt tối đa (vd: 2.0 điểm)
  targetColumnType?: 'regular' | 'custom';
  customTargetColumnId?: string;
}

export interface StudentPointRecord {
  id: string;
  studentId: string;
  classId: string;
  userId: string;
  type: 'plus' | 'minus'; // 'plus' = Điểm cộng, 'minus' = Điểm trừ
  amount: number; // Số điểm (mặc định 1)
  reason: string; // Lý do nhận điểm
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface ClassData {
  id: string;
  userId: string;
  name: string;
  grade: string; // e.g. "Khối 6", "Khối 7", "Khối 8", "Khối 9"
  subject: string;
  schoolYear: string; // e.g. "2026–2027"
  studentCount: number;
  note?: string;
  hk1Columns?: GradeColumnConfig[];
  hk2Columns?: GradeColumnConfig[];
  pointConversionConfig?: PointConversionConfig;
  createdAt: string;
  updatedAt: string;
}

export interface StudentData {
  id: string;
  classId: string;
  userId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  zodiac?: string; // e.g. "Libra", "Aries"
  avatar?: string; // e.g. "/avatars/Libra-female.webp"
  note?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentGrades {
  id: string; // usually studentId
  studentId: string;
  classId: string;
  userId: string;
  hk1Scores: Record<string, number | null>; // columnId -> score
  hk2Scores: Record<string, number | null>;
  hk1Average?: number | null;
  hk2Average?: number | null;
  annualAverage?: number | null;
  updatedAt: string;
}

export interface WeeklyNoteData {
  id: string;
  classId: string;
  userId: string;
  weekNumber: number;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  title: string;
  note: string;
  customWeekNumber?: string; // e.g. "Tuần 5", "Tuần nghỉ lễ 2/9"
  createdAt?: string;
  updatedAt: string;
}

export interface TimetableItem {
  id: string;
  userId: string;
  dayOfWeek: number; // 2 to 7 (2 = Thứ 2, 7 = Thứ 7)
  period: number; // 1 to 5
  session?: 'morning' | 'afternoon'; // Buổi Sáng hoặc Buổi Chiều
  className: string;
  subject: string;
  room?: string;
  note?: string;
  color?: string;
  updatedAt: string;
}

export interface ExternalLinksConfig {
  facebook: string;
  zalo: string;
  drive: string;
  padlet: string;
}

export interface AssetConfig {
  landingBg?: string;
  landingHeading?: string;
  landingEnter?: string;
  landingFb?: string;
  landingZalo?: string;
  landingDrive?: string;
  landingPadlet?: string;
  homeBg?: string;
  classBg?: string;
  leaf1?: string;
  leaf2?: string;
}

export interface GradingConfig {
  regularCoefficient: number;
  midtermCoefficient: number;
  finalCoefficient: number;
  annualHk1Weight: number;
  annualHk2Weight: number;
  minScore: number;
  maxScore: number;
  decimalPlaces: number;
}

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currentSchoolYear: string;
  customGatePassword?: string;
  externalLinks: ExternalLinksConfig;
  assets: AssetConfig;
  subjects: string[];
  gradingConfig: GradingConfig;
  pointConversionConfig?: PointConversionConfig;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  schoolYear: string;
  classes: ClassData[];
  students: StudentData[];
  grades: StudentGrades[];
  weeks: WeeklyNoteData[];
  timetables: TimetableItem[];
  pointRecords?: StudentPointRecord[];
  settings?: Partial<UserProfileData>;
}
