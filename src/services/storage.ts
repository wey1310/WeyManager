import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  ClassData,
  StudentData,
  StudentGrades,
  WeeklyNoteData,
  TimetableItem,
  UserProfileData,
  BackupData,
  StudentPointRecord,
} from '../types';
import { DEFAULT_GRADING_CONFIG, DEFAULT_HK1_COLUMNS, DEFAULT_HK2_COLUMNS } from './gradeEngine';
import { getImportedClassesForUser } from '../data/imported19Classes';

const LOCAL_STORAGE_PREFIX = 'vuon_cua_wey_';

// Helpers for localStorage fallback & sync
export function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// User Profile & Settings
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    // If permission or offline, fall back to local
    console.warn('Falling back to local profile due to:', error);
    return getLocalData<UserProfileData | null>(`profile_${userId}`, null);
  }
}

export async function saveUserProfile(profile: UserProfileData): Promise<void> {
  const path = `users/${profile.uid}`;
  setLocalData(`profile_${profile.uid}`, profile);
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Classes
export async function getClasses(userId: string): Promise<ClassData[]> {
  const path = `users/${userId}/classes`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'classes'));
    const list: ClassData[] = [];
    snap.forEach(d => list.push(d.data() as ClassData));
    if (list.length >= 19 && list.some(c => c.name === '8A1')) {
      setLocalData(`classes_${userId}`, list);
      return list;
    }
  } catch (error) {
    console.warn('Falling back to local classes:', error);
  }

  // Check local cache
  const localList = getLocalData<ClassData[]>(`classes_${userId}`, []);
  if (localList.length >= 19 && localList.some(c => c.name === '8A1')) {
    return localList;
  }

  // Seed the 19 classes by default so user has immediate access to all 19 classes & 840 students
  return await import19ClassesIntoSystem(userId);
}

export async function saveClass(classData: ClassData): Promise<void> {
  const path = `users/${classData.userId}/classes/${classData.id}`;
  // Update local cache
  const localList = getLocalData<ClassData[]>(`classes_${classData.userId}`, []);
  const idx = localList.findIndex(c => c.id === classData.id);
  if (idx >= 0) localList[idx] = classData;
  else localList.push(classData);
  setLocalData(`classes_${classData.userId}`, localList);

  try {
    await setDoc(doc(db, 'users', classData.userId, 'classes', classData.id), {
      ...classData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClass(userId: string, classId: string): Promise<void> {
  const path = `users/${userId}/classes/${classId}`;
  const localList = getLocalData<ClassData[]>(`classes_${userId}`, []);
  setLocalData(`classes_${userId}`, localList.filter(c => c.id !== classId));

  try {
    await deleteDoc(doc(db, 'users', userId, 'classes', classId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Students
export async function getStudents(userId: string, classId: string): Promise<StudentData[]> {
  const path = `users/${userId}/classes/${classId}/students`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'classes', classId, 'students'));
    const list: StudentData[] = [];
    snap.forEach(d => list.push(d.data() as StudentData));
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.fullName.localeCompare(b.fullName, 'vi'));
    setLocalData(`students_${classId}`, list);
    return list;
  } catch (error) {
    console.warn('Falling back to local students:', error);
    return getLocalData<StudentData[]>(`students_${classId}`, []);
  }
}

/**
 * Lấy toàn bộ danh sách học sinh của nhiều lớp một lúc (hỗ trợ nhanh cho widget Thông báo khu vườn)
 */
export async function getAllStudentsForClasses(
  userId: string,
  classIds: string[]
): Promise<Record<string, StudentData[]>> {
  const result: Record<string, StudentData[]> = {};

  // Thử đọc nhanh từ local cache trước
  for (const cId of classIds) {
    const cached = getLocalData<StudentData[]>(`students_${cId}`, []);
    if (cached.length > 0) {
      result[cId] = cached;
    }
  }

  // Nếu đã đủ dữ liệu từ cache, trả về ngay
  if (Object.keys(result).length === classIds.length && classIds.length > 0) {
    return result;
  }

  // Nếu còn thiếu lớp nào, tải qua getStudents song song
  const promises = classIds.map(async cId => {
    if (!result[cId] || result[cId].length === 0) {
      const students = await getStudents(userId, cId);
      result[cId] = students;
    }
  });

  await Promise.all(promises);
  return result;
}

export async function saveStudent(student: StudentData): Promise<void> {
  const path = `users/${student.userId}/classes/${student.classId}/students/${student.id}`;
  const local = getLocalData<StudentData[]>(`students_${student.classId}`, []);
  const idx = local.findIndex(s => s.id === student.id);
  if (idx >= 0) local[idx] = student;
  else local.push(student);
  setLocalData(`students_${student.classId}`, local);

  try {
    await setDoc(doc(db, 'users', student.userId, 'classes', student.classId, 'students', student.id), {
      ...student,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchSaveStudents(userId: string, classId: string, students: StudentData[]): Promise<void> {
  const path = `users/${userId}/classes/${classId}/students`;
  const existing = getLocalData<StudentData[]>(`students_${classId}`, []);
  const combined = [...existing];
  for (const s of students) {
    const idx = combined.findIndex(item => item.id === s.id);
    if (idx >= 0) combined[idx] = s;
    else combined.push(s);
  }
  setLocalData(`students_${classId}`, combined);

  try {
    const batch = writeBatch(db);
    for (const student of students) {
      const ref = doc(db, 'users', userId, 'classes', classId, 'students', student.id);
      batch.set(ref, {
        ...student,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudent(userId: string, classId: string, studentId: string): Promise<void> {
  const path = `users/${userId}/classes/${classId}/students/${studentId}`;
  const local = getLocalData<StudentData[]>(`students_${classId}`, []);
  setLocalData(`students_${classId}`, local.filter(s => s.id !== studentId));

  try {
    await deleteDoc(doc(db, 'users', userId, 'classes', classId, 'students', studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Grades
export async function getGrades(userId: string, classId: string): Promise<Record<string, StudentGrades>> {
  const path = `users/${userId}/classes/${classId}/grades`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'classes', classId, 'grades'));
    const map: Record<string, StudentGrades> = {};
    snap.forEach(d => {
      const g = d.data() as StudentGrades;
      map[g.studentId] = g;
    });
    setLocalData(`grades_${classId}`, map);
    return map;
  } catch (error) {
    console.warn('Falling back to local grades:', error);
    return getLocalData<Record<string, StudentGrades>>(`grades_${classId}`, {});
  }
}

export async function saveStudentGrade(grade: StudentGrades): Promise<void> {
  const path = `users/${grade.userId}/classes/${grade.classId}/grades/${grade.studentId}`;
  const localMap = getLocalData<Record<string, StudentGrades>>(`grades_${grade.classId}`, {});
  localMap[grade.studentId] = grade;
  setLocalData(`grades_${grade.classId}`, localMap);

  try {
    await setDoc(doc(db, 'users', grade.userId, 'classes', grade.classId, 'grades', grade.studentId), {
      ...grade,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchSaveGrades(
  userId: string,
  classId: string,
  grades: StudentGrades[]
): Promise<void> {
  const path = `users/${userId}/classes/${classId}/grades`;
  const localMap = getLocalData<Record<string, StudentGrades>>(`grades_${classId}`, {});
  grades.forEach(g => {
    localMap[g.studentId] = g;
  });
  setLocalData(`grades_${classId}`, localMap);

  try {
    const batch = writeBatch(db);
    for (const g of grades) {
      const ref = doc(db, 'users', userId, 'classes', classId, 'grades', g.studentId);
      batch.set(ref, {
        ...g,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Weekly Notes
export async function getWeeklyNotes(userId: string, classId: string): Promise<WeeklyNoteData[]> {
  const path = `users/${userId}/classes/${classId}/weeks`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'classes', classId, 'weeks'));
    const list: WeeklyNoteData[] = [];
    snap.forEach(d => list.push(d.data() as WeeklyNoteData));
    list.sort((a, b) => a.weekNumber - b.weekNumber);
    setLocalData(`weeks_${classId}`, list);
    return list;
  } catch (error) {
    console.warn('Falling back to local weekly notes:', error);
    return getLocalData<WeeklyNoteData[]>(`weeks_${classId}`, []);
  }
}

export async function saveWeeklyNote(note: WeeklyNoteData): Promise<void> {
  const path = `users/${note.userId}/classes/${note.classId}/weeks/${note.id}`;
  const local = getLocalData<WeeklyNoteData[]>(`weeks_${note.classId}`, []);
  const idx = local.findIndex(w => w.id === note.id);
  if (idx >= 0) local[idx] = note;
  else local.push(note);
  setLocalData(`weeks_${note.classId}`, local);

  try {
    await setDoc(doc(db, 'users', note.userId, 'classes', note.classId, 'weeks', note.id), {
      ...note,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Student Bonus & Penalty Point Records
export async function getPointRecords(userId: string, classId: string): Promise<StudentPointRecord[]> {
  const path = `users/${userId}/classes/${classId}/points`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'classes', classId, 'points'));
    const list: StudentPointRecord[] = [];
    snap.forEach(d => list.push(d.data() as StudentPointRecord));
    list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    setLocalData(`points_${classId}`, list);
    return list;
  } catch (error) {
    console.warn('Falling back to local points:', error);
    return getLocalData<StudentPointRecord[]>(`points_${classId}`, []);
  }
}

export async function savePointRecord(record: StudentPointRecord): Promise<void> {
  const path = `users/${record.userId}/classes/${record.classId}/points/${record.id}`;
  const local = getLocalData<StudentPointRecord[]>(`points_${record.classId}`, []);
  const idx = local.findIndex(p => p.id === record.id);
  if (idx >= 0) local[idx] = record;
  else local.unshift(record);
  setLocalData(`points_${record.classId}`, local);

  try {
    await setDoc(doc(db, 'users', record.userId, 'classes', record.classId, 'points', record.id), {
      ...record,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePointRecord(userId: string, classId: string, recordId: string): Promise<void> {
  const path = `users/${userId}/classes/${classId}/points/${recordId}`;
  const local = getLocalData<StudentPointRecord[]>(`points_${classId}`, []);
  setLocalData(`points_${classId}`, local.filter(p => p.id !== recordId));

  try {
    await deleteDoc(doc(db, 'users', userId, 'classes', classId, 'points', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchSavePointRecords(
  userId: string,
  classId: string,
  records: StudentPointRecord[]
): Promise<void> {
  const path = `users/${userId}/classes/${classId}/points`;
  const existing = getLocalData<StudentPointRecord[]>(`points_${classId}`, []);
  const map = new Map<string, StudentPointRecord>();
  existing.forEach(r => map.set(r.id, r));
  records.forEach(r => map.set(r.id, r));
  const combined = Array.from(map.values());
  setLocalData(`points_${classId}`, combined);

  try {
    const batch = writeBatch(db);
    for (const r of records) {
      const ref = doc(db, 'users', userId, 'classes', classId, 'points', r.id);
      batch.set(ref, {
        ...r,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Timetable
export async function getTimetable(userId: string): Promise<TimetableItem[]> {
  const path = `users/${userId}/timetables`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'timetables'));
    const list: TimetableItem[] = [];
    snap.forEach(d => list.push(d.data() as TimetableItem));
    setLocalData(`timetable_${userId}`, list);
    return list;
  } catch (error) {
    console.warn('Falling back to local timetable:', error);
    return getLocalData<TimetableItem[]>(`timetable_${userId}`, []);
  }
}

export async function saveTimetableSlot(item: TimetableItem): Promise<void> {
  const path = `users/${item.userId}/timetables/${item.id}`;
  const local = getLocalData<TimetableItem[]>(`timetable_${item.userId}`, []);
  const idx = local.findIndex(t => t.id === item.id);
  if (idx >= 0) local[idx] = item;
  else local.push(item);
  setLocalData(`timetable_${item.userId}`, local);

  try {
    await setDoc(doc(db, 'users', item.userId, 'timetables', item.id), {
      ...item,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchSaveTimetable(userId: string, items: TimetableItem[]): Promise<void> {
  const path = `users/${userId}/timetables`;
  setLocalData(`timetable_${userId}`, items);

  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const ref = doc(db, 'users', userId, 'timetables', item.id);
      batch.set(ref, {
        ...item,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTimetableSlot(userId: string, slotId: string): Promise<void> {
  const path = `users/${userId}/timetables/${slotId}`;
  const local = getLocalData<TimetableItem[]>(`timetable_${userId}`, []);
  setLocalData(`timetable_${userId}`, local.filter(t => t.id !== slotId));

  try {
    await deleteDoc(doc(db, 'users', userId, 'timetables', slotId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Complete Backup generation
export async function createFullBackup(userId: string, schoolYear: string): Promise<BackupData> {
  const classes = await getClasses(userId);
  const allStudents: StudentData[] = [];
  const allGrades: StudentGrades[] = [];
  const allWeeks: WeeklyNoteData[] = [];
  const allPoints: StudentPointRecord[] = [];

  for (const c of classes) {
    const students = await getStudents(userId, c.id);
    allStudents.push(...students);
    const gradesMap = await getGrades(userId, c.id);
    allGrades.push(...Object.values(gradesMap));
    const weeks = await getWeeklyNotes(userId, c.id);
    allWeeks.push(...weeks);
    const points = await getPointRecords(userId, c.id);
    allPoints.push(...points);
  }

  const timetables = await getTimetable(userId);
  const profile = await getUserProfile(userId);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    schoolYear,
    classes,
    students: allStudents,
    grades: allGrades,
    weeks: allWeeks,
    timetables,
    pointRecords: allPoints,
    settings: profile || undefined,
  };
}

// Restore from Backup Data
export async function restoreFromBackup(userId: string, backup: BackupData): Promise<void> {
  // Batch restore classes
  for (const c of backup.classes || []) {
    await saveClass({ ...c, userId });
  }

  // Restore students
  const classStudentsMap: Record<string, StudentData[]> = {};
  for (const s of backup.students || []) {
    if (!classStudentsMap[s.classId]) classStudentsMap[s.classId] = [];
    classStudentsMap[s.classId].push({ ...s, userId });
  }
  for (const [classId, sList] of Object.entries(classStudentsMap)) {
    await batchSaveStudents(userId, classId, sList);
  }

  // Restore grades
  const classGradesMap: Record<string, StudentGrades[]> = {};
  for (const g of backup.grades || []) {
    if (!classGradesMap[g.classId]) classGradesMap[g.classId] = [];
    classGradesMap[g.classId].push({ ...g, userId });
  }
  for (const [classId, gList] of Object.entries(classGradesMap)) {
    await batchSaveGrades(userId, classId, gList);
  }

  // Restore weeks
  for (const w of backup.weeks || []) {
    await saveWeeklyNote({ ...w, userId });
  }

  // Restore point records
  const classPointsMap: Record<string, StudentPointRecord[]> = {};
  for (const p of backup.pointRecords || []) {
    if (!classPointsMap[p.classId]) classPointsMap[p.classId] = [];
    classPointsMap[p.classId].push({ ...p, userId });
  }
  for (const [classId, pList] of Object.entries(classPointsMap)) {
    await batchSavePointRecords(userId, classId, pList);
  }

  // Restore timetables
  if (backup.timetables && backup.timetables.length > 0) {
    await batchSaveTimetable(userId, backup.timetables.map(t => ({ ...t, userId })));
  }
}

// 19-Class Import Helper
export async function import19ClassesIntoSystem(userId: string): Promise<ClassData[]> {
  const { classes: importedClasses, studentsMap } = getImportedClassesForUser(userId);

  // 1. Merge into local storage cache
  const existingClasses = getLocalData<ClassData[]>(`classes_${userId}`, []);
  const classMap = new Map<string, ClassData>();
  existingClasses.forEach(c => classMap.set(c.id, c));
  importedClasses.forEach(c => classMap.set(c.id, c));
  const mergedClasses = Array.from(classMap.values());
  setLocalData(`classes_${userId}`, mergedClasses);

  // 2. Save students for every class in local cache
  for (const [classId, sList] of Object.entries(studentsMap)) {
    setLocalData(`students_${classId}`, sList);
  }

  // 3. Batch sync to Firestore if online
  try {
    const classBatch = writeBatch(db);
    for (const cls of importedClasses) {
      const cRef = doc(db, 'users', userId, 'classes', cls.id);
      classBatch.set(cRef, {
        ...cls,
        updatedAt: new Date().toISOString(),
      });
    }
    await classBatch.commit();

    // Sync students per class (each class <= 45 items, well under Firestore 500 batch limit)
    for (const [classId, sList] of Object.entries(studentsMap)) {
      const studentBatch = writeBatch(db);
      for (const student of sList) {
        const sRef = doc(db, 'users', userId, 'classes', classId, 'students', student.id);
        studentBatch.set(sRef, {
          ...student,
          updatedAt: new Date().toISOString(),
        });
      }
      await studentBatch.commit();
    }
  } catch (err) {
    console.warn('Firestore sync note during 19-class import (offline/local fallback active):', err);
  }

  return mergedClasses;
}

export async function seed19ClassesIfEmpty(userId: string): Promise<ClassData[]> {
  const localList = getLocalData<ClassData[]>(`classes_${userId}`, []);
  if (localList.length >= 19 && localList.some(c => c.name === '8A1')) {
    return localList;
  }
  return await import19ClassesIntoSystem(userId);
}
