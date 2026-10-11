import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  logout,
  testConnection,
} from './services/firebase';
import {
  getUserProfile,
  saveUserProfile,
  getClasses,
  saveClass,
  deleteClass,
  getStudents,
  saveStudent,
  batchSaveStudents,
  deleteStudent,
  getGrades,
  saveStudentGrade,
  batchSaveGrades,
  getWeeklyNotes,
  saveWeeklyNote,
  getPointRecords,
  savePointRecord,
  deletePointRecord,
  getTimetable,
  saveTimetableSlot,
  batchSaveTimetable,
  deleteTimetableSlot,
  createFullBackup,
  restoreFromBackup,
  getLocalData,
  import19ClassesIntoSystem,
  seed19ClassesIfEmpty,
} from './services/storage';
import {
  ClassData,
  StudentData,
  StudentGrades,
  WeeklyNoteData,
  TimetableItem,
  UserProfileData,
  GradeColumnConfig,
  BackupData,
  StudentPointRecord,
  PointConversionConfig,
} from './types';
import { DEFAULT_GRADING_CONFIG, DEFAULT_HK1_COLUMNS, DEFAULT_HK2_COLUMNS } from './services/gradeEngine';
import { ToastProvider, useToast } from './components/common/GardenToast';
import { GardenNavbar } from './components/navbar/GardenNavbar';
import { BotanicalLeaves } from './components/common/BotanicalLeaves';
import { LandingPage } from './components/landing/LandingPage';
import { GardenDashboard } from './components/dashboard/GardenDashboard';
import { CreateClassModal } from './components/dashboard/CreateClassModal';
import { ClassDetail } from './components/class/ClassDetail';
import { TeacherTimetable } from './components/schedule/TeacherTimetable';
import { SettingsPage } from './components/settings/SettingsPage';
import { ImportWizardModal } from './components/import/ImportWizardModal';
import { WifiOff } from 'lucide-react';

const DEFAULT_PROFILE = (user?: User | null): UserProfileData => ({
  uid: user?.uid || 'guest_teacher',
  email: user?.email || 'teacher@vuoncuawey.edu.vn',
  displayName: user?.displayName || 'Thầy/Cô Wey',
  photoURL: user?.photoURL || undefined,
  currentSchoolYear: '2026–2027',
  customGatePassword: '',
  externalLinks: {
    facebook: '',
    zalo: '',
    drive: '',
    padlet: '',
  },
  assets: {},
  subjects: ['Khoa học tự nhiên', 'Vật lí', 'Hóa học', 'Sinh học', 'Toán', 'Công nghệ'],
  gradingConfig: DEFAULT_GRADING_CONFIG,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function MainApp() {
  const { showToast } = useToast();

  // Navigation states
  const [inGarden, setInGarden] = useState(true);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'classes' | 'class-detail' | 'timetable' | 'settings'>('dashboard');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Authentication & Network
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Data states
  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_PROFILE());
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);

  // Selected Class active states
  const [classStudents, setClassStudents] = useState<StudentData[]>([]);
  const [classGrades, setClassGrades] = useState<Record<string, StudentGrades>>({});
  const [classWeeks, setClassWeeks] = useState<WeeklyNoteData[]>([]);
  const [classPoints, setClassPoints] = useState<StudentPointRecord[]>([]);

  // Modals
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Đã kết nối lại mạng Internet.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Mất kết nối mạng. Dữ liệu đang được lưu tạm trên thiết bị.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Auth observer
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setInGarden(true);
        // Load user profile
        let userProfile = await getUserProfile(user.uid);
        if (!userProfile) {
          userProfile = DEFAULT_PROFILE(user);
          await saveUserProfile(userProfile);
        }
        setProfile(userProfile);
        await loadUserData(user.uid);
      } else {
        // Fallback for demo or guest mode before login
        const guestProfile = DEFAULT_PROFILE(null);
        setProfile(guestProfile);
        await loadUserData(guestProfile.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load classes and timetable for current user
  const loadUserData = async (userId: string) => {
    try {
      let classList = await getClasses(userId);
      if (classList.length < 19 || !classList.some(c => c.name === '8A1')) {
        classList = await import19ClassesIntoSystem(userId);
      }
      setClasses(classList);
      const timetableList = await getTimetable(userId);
      setTimetable(timetableList);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleImport19Classes = async () => {
    try {
      const uid = currentUser?.uid || profile.uid;
      const updatedClasses = await import19ClassesIntoSystem(uid);
      setClasses(updatedClasses);
      showToast('Đã nhập thành công 19 lớp Khối 8 (840 học sinh) vào hệ thống lớp!', 'success');
      if (selectedClassId) {
        const students = await getStudents(uid, selectedClassId);
        setClassStudents(students);
      }
    } catch (err: any) {
      console.error('Lỗi nhập 19 lớp:', err);
      showToast('Lỗi khi nhập 19 lớp: ' + (err.message || 'Không xác định'), 'error');
    }
  };

  // Load specific class detail data
  useEffect(() => {
    if (!selectedClassId) return;
    const uid = currentUser?.uid || profile.uid;

    getStudents(uid, selectedClassId).then(setClassStudents);
    getGrades(uid, selectedClassId).then(setClassGrades);
    getWeeklyNotes(uid, selectedClassId).then(setClassWeeks);
    getPointRecords(uid, selectedClassId).then(setClassPoints);
  }, [selectedClassId, currentUser?.uid, profile.uid]);

  // Auth actions
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      setInGarden(true);
      showToast(`Xin chào ${user.displayName || user.email}!`, 'success');
    } catch (err: any) {
      console.warn('Google login popup cancelled or error:', err);
      // Still allow entering garden with local state
      setInGarden(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setInGarden(false);
      setCurrentTab('dashboard');
      setSelectedClassId(null);
      showToast('Đã đăng xuất khỏi khu vườn.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Class Actions
  const handleSaveClass = async (classData: Partial<ClassData>) => {
    const uid = currentUser?.uid || profile.uid;
    const fullClass: ClassData = {
      id: classData.id || `class_${Date.now()}`,
      userId: uid,
      name: classData.name || 'Lớp mới',
      grade: classData.grade || 'Khối 6',
      subject: classData.subject || 'Khoa học tự nhiên',
      schoolYear: classData.schoolYear || profile.currentSchoolYear,
      studentCount: classData.studentCount || 0,
      note: classData.note || '',
      hk1Columns: classData.hk1Columns || DEFAULT_HK1_COLUMNS,
      hk2Columns: classData.hk2Columns || DEFAULT_HK2_COLUMNS,
      createdAt: classData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveClass(fullClass);
    await loadUserData(uid);
    showToast(`Đã lưu lớp ${fullClass.name}`, 'success');
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp ${className} và toàn bộ dữ liệu điểm số, học sinh?`)) {
      return;
    }
    const uid = currentUser?.uid || profile.uid;
    await deleteClass(uid, classId);
    await loadUserData(uid);
    if (selectedClassId === classId) {
      setSelectedClassId(null);
      setCurrentTab('dashboard');
    }
    showToast(`Đã xóa lớp ${className}`, 'info');
  };

  // Grade Actions
  const handleSaveGrade = async (grade: StudentGrades) => {
    await saveStudentGrade(grade);
    setClassGrades(prev => ({
      ...prev,
      [grade.studentId]: grade,
    }));
  };

  const handleBatchSaveGrades = async (grades: StudentGrades[]) => {
    const uid = currentUser?.uid || profile.uid;
    if (!selectedClassId) return;
    await batchSaveGrades(uid, selectedClassId, grades);
    setClassGrades(prev => {
      const copy = { ...prev };
      grades.forEach(g => (copy[g.studentId] = g));
      return copy;
    });
    showToast(`Đã lưu điểm cho ${grades.length} học sinh`, 'success');
  };

  const handleUpdateClassColumns = async (hk1: GradeColumnConfig[], hk2: GradeColumnConfig[]) => {
    if (!selectedClassId) return;
    const target = classes.find(c => c.id === selectedClassId);
    if (!target) return;

    const updated = {
      ...target,
      hk1Columns: hk1,
      hk2Columns: hk2,
      updatedAt: new Date().toISOString(),
    };
    await saveClass(updated);
    setClasses(prev => prev.map(c => (c.id === selectedClassId ? updated : c)));
    showToast('Đã cập nhật danh sách cột điểm', 'success');
  };

  // Student Actions
  const handleSaveStudent = async (student: StudentData) => {
    await saveStudent(student);
    const uid = currentUser?.uid || profile.uid;
    if (selectedClassId) {
      const list = await getStudents(uid, selectedClassId);
      setClassStudents(list);

      // Update student count in class
      const target = classes.find(c => c.id === selectedClassId);
      if (target) {
        const updated = { ...target, studentCount: list.length };
        await saveClass(updated);
        setClasses(prev => prev.map(c => (c.id === selectedClassId ? updated : c)));
      }
    }
    showToast(`Đã lưu thông tin học sinh ${student.fullName}`, 'success');
  };

  const handleDeleteStudent = async (studentId: string) => {
    const uid = currentUser?.uid || profile.uid;
    if (!selectedClassId) return;
    await deleteStudent(uid, selectedClassId, studentId);
    const list = await getStudents(uid, selectedClassId);
    setClassStudents(list);

    // Update student count in class
    const target = classes.find(c => c.id === selectedClassId);
    if (target) {
      const updated = { ...target, studentCount: list.length };
      await saveClass(updated);
      setClasses(prev => prev.map(c => (c.id === selectedClassId ? updated : c)));
    }
    showToast('Đã xóa học sinh khỏi danh sách', 'info');
  };

  const handleBatchImportStudents = async (newStudents: StudentData[], targetClassId?: string) => {
    const uid = currentUser?.uid || profile.uid;
    const effectiveClassId = targetClassId || selectedClassId;
    if (!effectiveClassId) {
      showToast('Vui lòng chọn lớp học trước khi import danh sách học sinh.', 'error');
      return;
    }

    // Ensure all imported student records have the target classId and userId
    const sanitizedStudents = newStudents.map(s => ({
      ...s,
      classId: effectiveClassId,
      userId: uid,
    }));

    await batchSaveStudents(uid, effectiveClassId, sanitizedStudents);

    // If currently viewing this class, reload student roster
    if (selectedClassId === effectiveClassId) {
      const list = await getStudents(uid, effectiveClassId);
      setClassStudents(list);
    }

    // Update student count in class
    const target = classes.find(c => c.id === effectiveClassId);
    if (target) {
      const allClassStudents = await getStudents(uid, effectiveClassId);
      const updated = { ...target, studentCount: allClassStudents.length };
      await saveClass(updated);
      setClasses(prev => prev.map(c => (c.id === effectiveClassId ? updated : c)));
    }
    showToast(`Đã nạp thành công ${newStudents.length} học sinh vào lớp ${target?.name || ''}`, 'success');
  };

  // Weekly note actions
  const handleSaveWeeklyNote = async (note: WeeklyNoteData) => {
    await saveWeeklyNote(note);
    setClassWeeks(prev => {
      const idx = prev.findIndex(w => w.id === note.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = note;
        return copy;
      }
      return [...prev, note];
    });
  };

  // Student Point Actions (Bonus & Penalty points)
  const handleSavePointRecord = async (record: StudentPointRecord) => {
    await savePointRecord(record);
    setClassPoints(prev => {
      const idx = prev.findIndex(p => p.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
    const sName = classStudents.find(s => s.id === record.studentId)?.fullName || 'học sinh';
    if (record.type === 'plus') {
      showToast(`+${record.amount} điểm cộng cho ${sName}: ${record.reason}`, 'success');
    } else {
      showToast(`-${record.amount} điểm trừ cho ${sName}: ${record.reason}`, 'info');
    }
  };

  const handleDeletePointRecord = async (recordId: string) => {
    const uid = currentUser?.uid || profile.uid;
    if (!selectedClassId) return;
    await deletePointRecord(uid, selectedClassId, recordId);
    setClassPoints(prev => prev.filter(p => p.id !== recordId));
    showToast('Đã xóa bản ghi điểm', 'info');
  };

  const handleSaveConversionConfig = async (newConfig: PointConversionConfig, applyGlobally: boolean) => {
    if (applyGlobally) {
      const updatedProfile: UserProfileData = {
        ...profile,
        pointConversionConfig: newConfig,
        updatedAt: new Date().toISOString(),
      };
      await saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    }

    if (selectedClassId) {
      const targetClass = classes.find(c => c.id === selectedClassId);
      if (targetClass) {
        const updatedClass: ClassData = {
          ...targetClass,
          pointConversionConfig: newConfig,
          updatedAt: new Date().toISOString(),
        };
        await saveClass(updatedClass);
        setClasses(prev => prev.map(c => (c.id === selectedClassId ? updatedClass : c)));
      }
    }
    showToast('Đã lưu quy định quy đổi điểm cộng & điểm trừ', 'success');
  };

  // Timetable actions
  const handleSaveSlot = async (slot: TimetableItem) => {
    await saveTimetableSlot(slot);
    setTimetable(prev => {
      const sess = slot.session || 'morning';
      const idx = prev.findIndex(
        t => (t.session || 'morning') === sess && t.dayOfWeek === slot.dayOfWeek && t.period === slot.period
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = slot;
        return copy;
      }
      return [...prev, slot];
    });
    showToast('Đã lưu tiết học vào TKB', 'success');
  };

  const handleBatchSaveTimetable = async (newItems: TimetableItem[]) => {
    const uid = currentUser?.uid || profile.uid;
    // Merge new items into existing timetable to prevent wiping out other sessions
    const mergedMap = new Map<string, TimetableItem>();
    timetable.forEach(t => {
      const sess = t.session || 'morning';
      mergedMap.set(`${sess}_${t.dayOfWeek}_${t.period}`, t);
    });
    newItems.forEach(item => {
      const sess = item.session || 'morning';
      mergedMap.set(`${sess}_${item.dayOfWeek}_${item.period}`, item);
    });
    const mergedList = Array.from(mergedMap.values());

    await batchSaveTimetable(uid, mergedList);
    setTimetable(mergedList);
    showToast(`Đã lưu thành công ${newItems.length} tiết học từ nhận diện TKB`, 'success');
  };

  const handleDeleteSlot = async (slotId: string) => {
    const uid = currentUser?.uid || profile.uid;
    await deleteTimetableSlot(uid, slotId);
    setTimetable(prev => prev.filter(t => t.id !== slotId));
    showToast('Đã xóa tiết học khỏi TKB', 'info');
  };

  // Settings Actions
  const handleSaveProfile = async (updated: UserProfileData) => {
    await saveUserProfile(updated);
    setProfile(updated);
    showToast('Đã lưu cấu hình tài khoản và khu vườn', 'success');
  };

  const handleCreateBackup = async (): Promise<BackupData> => {
    const uid = currentUser?.uid || profile.uid;
    return await createFullBackup(uid, profile.currentSchoolYear);
  };

  const handleRestoreBackup = async (backupData: BackupData) => {
    const uid = currentUser?.uid || profile.uid;
    await restoreFromBackup(uid, backupData);
  };

  const currentSelectedClass = classes.find(c => c.id === selectedClassId);

  // If not in garden, show Landing Page (Trang 1)
  if (!inGarden) {
    return (
      <LandingPage
        onEnterGarden={() => setInGarden(true)}
        onGoogleLogin={handleGoogleLogin}
        externalLinks={profile.externalLinks}
        assets={profile.assets}
        customSavedPassword={profile.customGatePassword}
        hasActiveSession={currentUser !== null || classes.length > 0}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#fbf9f5] relative"
      style={{
        backgroundImage: `url(${profile.assets?.homeBg || '/home-bg.webp'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Soft Matcha Garden backdrop veil ensures 100% contrast & clarity for all cards and text */}
      <div className="fixed inset-0 bg-[#fbf9f5]/85 pointer-events-none z-0" />
      <BotanicalLeaves leaf1Url={profile.assets?.leaf1} leaf2Url={profile.assets?.leaf2} />

      {/* Offline banner */}
      {!isOnline && (
        <div className="no-print bg-amber-500 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mất kết nối mạng. Dữ liệu đang được lưu tạm trên máy và sẽ đồng bộ khi có mạng lại.</span>
        </div>
      )}

      {/* Navigation */}
      <GardenNavbar
        currentTab={currentTab === 'class-detail' ? 'classes' : currentTab}
        onSelectTab={tab => {
          if (tab === 'dashboard' || tab === 'classes') {
            setSelectedClassId(null);
          }
          setCurrentTab(tab as any);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onReturnToLanding={() => setInGarden(false)}
        currentSchoolYear={profile.currentSchoolYear}
        onSelectSchoolYear={year => {
          const updated = { ...profile, currentSchoolYear: year };
          handleSaveProfile(updated);
        }}
      />

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-5 lg:px-8 py-3.5 sm:py-6">
        {/* TAB 1: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <GardenDashboard
            classes={classes}
            timetable={timetable}
            currentSchoolYear={profile.currentSchoolYear}
            userId={currentUser?.uid || profile.uid}
            onSelectClass={classId => {
              setSelectedClassId(classId);
              setCurrentTab('class-detail');
            }}
            onCreateClass={() => {
              setEditingClass(null);
              setIsCreateClassModalOpen(true);
            }}
            onImportClass={() => setIsImportModalOpen(true)}
            onImport19Classes={handleImport19Classes}
            onEditClass={cls => {
              setEditingClass(cls);
              setIsCreateClassModalOpen(true);
            }}
            onDeleteClass={handleDeleteClass}
            onNavigateTab={tab => setCurrentTab(tab as any)}
            onReturnToLanding={() => setInGarden(false)}
          />
        )}

        {/* TAB 2: CLASSES LIST */}
        {currentTab === 'classes' && !selectedClassId && (
          <GardenDashboard
            classes={classes}
            timetable={timetable}
            currentSchoolYear={profile.currentSchoolYear}
            onSelectClass={classId => {
              setSelectedClassId(classId);
              setCurrentTab('class-detail');
            }}
            onCreateClass={() => {
              setEditingClass(null);
              setIsCreateClassModalOpen(true);
            }}
            onImportClass={() => setIsImportModalOpen(true)}
            onImport19Classes={handleImport19Classes}
            onEditClass={cls => {
              setEditingClass(cls);
              setIsCreateClassModalOpen(true);
            }}
            onDeleteClass={handleDeleteClass}
            onNavigateTab={tab => setCurrentTab(tab as any)}
            onReturnToLanding={() => setInGarden(false)}
          />
        )}

        {/* TAB 3: CLASS DETAIL */}
        {currentTab === 'class-detail' && currentSelectedClass && (
          <ClassDetail
            classData={currentSelectedClass}
            students={classStudents}
            gradesMap={classGrades}
            weeklyNotes={classWeeks}
            pointRecords={classPoints}
            gradingConfig={profile.gradingConfig}
            assets={profile.assets}
            onBack={() => {
              setSelectedClassId(null);
              setCurrentTab('dashboard');
            }}
            onEditClass={cls => {
              setEditingClass(cls);
              setIsCreateClassModalOpen(true);
            }}
            onSaveGrade={handleSaveGrade}
            onBatchSaveGrades={handleBatchSaveGrades}
            onUpdateClassColumns={handleUpdateClassColumns}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onSaveWeeklyNote={handleSaveWeeklyNote}
            onSavePointRecord={handleSavePointRecord}
            onDeletePointRecord={handleDeletePointRecord}
            onSaveConversionConfig={handleSaveConversionConfig}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {/* TAB 4: TEACHER TIMETABLE */}
        {currentTab === 'timetable' && (
          <TeacherTimetable
            timetable={timetable}
            classes={classes}
            userId={currentUser?.uid || profile.uid}
            onSaveSlot={handleSaveSlot}
            onBatchSaveTimetable={handleBatchSaveTimetable}
            onDeleteSlot={handleDeleteSlot}
          />
        )}

        {/* TAB 5: SETTINGS */}
        {currentTab === 'settings' && (
          <SettingsPage
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onCreateBackup={handleCreateBackup}
            onRestoreBackup={handleRestoreBackup}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Create / Edit Class Modal */}
      <CreateClassModal
        isOpen={isCreateClassModalOpen}
        onClose={() => {
          setIsCreateClassModalOpen(false);
          setEditingClass(null);
        }}
        onSave={handleSaveClass}
        editingClass={editingClass}
        currentSchoolYear={profile.currentSchoolYear}
        availableSubjects={profile.subjects}
      />

      {/* Universal Import Wizard Modal */}
      <ImportWizardModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        classData={currentSelectedClass}
        availableClasses={classes}
        existingStudents={classStudents}
        onImportStudents={handleBatchImportStudents}
        onImportGrades={handleBatchSaveGrades}
        onImport19Classes={handleImport19Classes}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
