// src/services/storage.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  ClassData, 
  StudentData, 
  StudentGrades, 
  WeeklyNoteData, 
  TimetableItem, 
  UserProfileData, 
  BackupData,
  StudentPointRecord 
} from '../types';

// ================= USER PROFILE =================
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfileData) : null;
  } catch (err) {
    console.error('Error getting user profile:', err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfileData): Promise<void> {
  try {
    const ref = doc(db, 'users', profile.uid);
    await setDoc(ref, profile, { merge: true });
  } catch (err) {
    console.error('Error saving user profile:', err);
  }
}

// ================= CLASSES =================
export async function getClasses(userId: string): Promise<ClassData[]> {
  try {
    const ref = collection(db, 'users', userId, 'classes');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as ClassData);
  } catch (err) {
    console.error('Error getting classes:', err);
    return [];
  }
}

export async function saveClass(classData: ClassData): Promise<void> {
  try {
    const ref = doc(db, 'users', classData.userId, 'classes', classData.id);
    await setDoc(ref, classData, { merge: true });
  } catch (err) {
    console.error('Error saving class:', err);
  }
}

export async function deleteClass(userId: string, classId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId, 'classes', classId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('Error deleting class:', err);
  }
}

// ================= STUDENTS =================
export async function getStudents(userId: string, classId: string): Promise<StudentData[]> {
  try {
    const ref = collection(db, 'users', userId, 'classes', classId, 'students');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as StudentData);
  } catch (err) {
    console.error('Error getting students:', err);
    return [];
  }
}

// Lấy toàn bộ học sinh của tất cả các lớp thuộc user
export async function getAllStudentsForClasses(userId: string): Promise<StudentData[]> {
  try {
    const classes = await getClasses(userId);
    let allStudents: StudentData[] = [];
    for (const cls of classes) {
      const students = await getStudents(userId, cls.id);
      allStudents = allStudents.concat(students);
    }
    return allStudents;
  } catch (err) {
    console.error('Error getting all students for classes:', err);
    return [];
  }
}

export async function saveStudent(student: StudentData): Promise<void> {
  try {
    const ref = doc(db, 'users', student.userId, 'classes', student.classId, 'students', student.id);
    await setDoc(ref, student, { merge: true });
  } catch (err) {
    console.error('Error saving student:', err);
  }
}

export async function batchSaveStudents(userId: string, classId: string, students: StudentData[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    students.forEach(s => {
      const ref = doc(db, 'users', userId, 'classes', classId, 'students', s.id);
      batch.set(ref, s, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving students:', err);
  }
}

export async function deleteStudent(userId: string, classId: string, studentId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId, 'classes', classId, 'students', studentId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('Error deleting student:', err);
  }
}

// ================= GRADES =================
export async function getGrades(userId: string, classId: string): Promise<Record<string, StudentGrades>> {
  try {
    const ref = collection(db, 'users', userId, 'classes', classId, 'grades');
    const snap = await getDocs(ref);
    const result: Record<string, StudentGrades> = {};
    snap.docs.forEach(d => {
      const data = d.data() as StudentGrades;
      result[data.studentId] = data;
    });
    return result;
  } catch (err) {
    console.error('Error getting grades:', err);
    return {};
  }
}

export async function saveStudentGrade(grade: StudentGrades): Promise<void> {
  try {
    const ref = doc(db, 'users', grade.userId, 'classes', grade.classId, 'grades', grade.id || grade.studentId);
    await setDoc(ref, grade, { merge: true });
  } catch (err) {
    console.error('Error saving student grade:', err);
  }
}

export async function batchSaveGrades(userId: string, classId: string, grades: StudentGrades[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    grades.forEach(g => {
      const ref = doc(db, 'users', userId, 'classes', classId, 'grades', g.id || g.studentId);
      batch.set(ref, g, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving grades:', err);
  }
}

// ================= WEEKLY NOTES =================
export async function getWeeklyNotes(userId: string, classId: string): Promise<WeeklyNoteData[]> {
  try {
    const ref = collection(db, 'users', userId, 'classes', classId, 'weeks');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as WeeklyNoteData);
  } catch (err) {
    console.error('Error getting weekly notes:', err);
    return [];
  }
}

export async function saveWeeklyNote(note: WeeklyNoteData): Promise<void> {
  try {
    const ref = doc(db, 'users', note.userId, 'classes', note.classId, 'weeks', note.id);
    await setDoc(ref, note, { merge: true });
  } catch (err) {
    console.error('Error saving weekly note:', err);
  }
}

// ================= POINT RECORDS (BONUS / PENALTY) =================
export async function getPointRecords(userId: string, classId: string): Promise<StudentPointRecord[]> {
  try {
    const ref = collection(db, 'users', userId, 'classes', classId, 'points');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as StudentPointRecord);
  } catch (err) {
    console.error('Error getting point records:', err);
    return [];
  }
}

export async function savePointRecord(record: StudentPointRecord): Promise<void> {
  try {
    const ref = doc(db, 'users', record.userId, 'classes', record.classId, 'points', record.id);
    await setDoc(ref, record, { merge: true });
  } catch (err) {
    console.error('Error saving point record:', err);
  }
}

export async function deletePointRecord(userId: string, classId: string, recordId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId, 'classes', classId, 'points', recordId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('Error deleting point record:', err);
  }
}

// ================= TIMETABLE =================
export async function getTimetable(userId: string): Promise<TimetableItem[]> {
  try {
    const ref = collection(db, 'users', userId, 'timetables');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as TimetableItem);
  } catch (err) {
    console.error('Error getting timetable:', err);
    return [];
  }
}

export async function saveTimetableSlot(slot: TimetableItem): Promise<void> {
  try {
    const ref = doc(db, 'users', slot.userId, 'timetables', slot.id);
    await setDoc(ref, slot, { merge: true });
  } catch (err) {
    console.error('Error saving timetable slot:', err);
  }
}

export async function batchSaveTimetable(userId: string, slots: TimetableItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    slots.forEach(s => {
      const ref = doc(db, 'users', userId, 'timetables', s.id);
      batch.set(ref, s, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving timetable:', err);
  }
}

export async function deleteTimetableSlot(userId: string, slotId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId, 'timetables', slotId);
    await deleteDoc(ref);
  } catch (err) {
    console.error('Error deleting timetable slot:', err);
  }
}

// ================= BACKUP & SEED HELPERS =================
export async function createFullBackup(userId: string, schoolYear: string): Promise<BackupData> {
  const classes = await getClasses(userId);
  const timetables = await getTimetable(userId);
  const classesData: Record<string, { classInfo: ClassData; students: StudentData[]; grades: Record<string, StudentGrades>; weeklyNotes: WeeklyNoteData[]; pointRecords: StudentPointRecord[] }> = {};

  for (const cls of classes) {
    const students = await getStudents(userId, cls.id);
    const grades = await getGrades(userId, cls.id);
    const weeklyNotes = await getWeeklyNotes(userId, cls.id);
    const pointRecords = await getPointRecords(userId, cls.id);
    classesData[cls.id] = {
      classInfo: cls,
      students,
      grades,
      weeklyNotes,
      pointRecords,
    };
  }

  return {
    version: '1.0',
    schoolYear,
    exportDate: new Date().toISOString(),
    userId,
    classes: classesData,
    timetables,
  };
}

export async function restoreFromBackup(userId: string, backup: BackupData): Promise<void> {
  const batch = writeBatch(db);
  if (backup.classes) {
    for (const [classId, content] of Object.entries(backup.classes)) {
      const classRef = doc(db, 'users', userId, 'classes', classId);
      batch.set(classRef, content.classInfo);

      if (content.students) {
        content.students.forEach(s => {
          const sRef = doc(db, 'users', userId, 'classes', classId, 'students', s.id);
          batch.set(sRef, s);
        });
      }
      if (content.grades) {
        Object.values(content.grades).forEach(g => {
          const gRef = doc(db, 'users', userId, 'classes', classId, 'grades', g.id || g.studentId);
          batch.set(gRef, g);
        });
      }
    }
  }
  if (backup.timetables) {
    backup.timetables.forEach(t => {
      const tRef = doc(db, 'users', userId, 'timetables', t.id);
      batch.set(tRef, t);
    });
  }
  await batch.commit();
}

export function getLocalData() {
  return {};
}

export async function import19ClassesIntoSystem(userId: string): Promise<ClassData[]> {
  const defaultClasses: ClassData[] = [];
  for (let i = 1; i <= 19; i++) {
    const className = `8A${i}`;
    defaultClasses.push({
      id: `class_8a${i}_${Date.now()}`,
      userId,
      name: className,
      grade: 'Khối 8',
      subject: 'Khoa học tự nhiên',
      schoolYear: '2026–2027',
      studentCount: 0,
      note: `Lớp ${className} khối 8 năm học 2026-2027`,
      hk1Columns: [],
      hk2Columns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const batch = writeBatch(db);
  defaultClasses.forEach(c => {
    const ref = doc(db, 'users', userId, 'classes', c.id);
    batch.set(ref, c, { merge: true });
  });
  await batch.commit();

  return defaultClasses;
}

export async function seed19ClassesIfEmpty(userId: string): Promise<ClassData[]> {
  const existing = await getClasses(userId);
  if (existing.length === 0) {
    return await import19ClassesIntoSystem(userId);
  }
  return existing;
}