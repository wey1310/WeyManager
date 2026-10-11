// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Cấu hình Firebase từ thông tin project wey-manager của bạn
const firebaseConfig = {
  apiKey: "AIzaSyAFG0SR-XbD7z63V1djI4WI-_0HmiDZA3g",
  authDomain: "wey-manager.firebaseapp.com",
  databaseURL: "https://wey-manager-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wey-manager",
  storageBucket: "wey-manager.firebasestorage.app",
  messagingSenderId: "806242262119",
  appId: "1:806242262119:web:733186edafd0ded05708c2",
  measurementId: "G-1X31XNEXRL"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Đăng nhập Google Popup
const googleProvider = new GoogleAuthProvider();
export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

// Đăng xuất
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Xuất bộ lắng nghe trạng thái đăng nhập
export { onAuthStateChanged };

// Kiểm tra kết nối
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log("Firebase Firestore đã kết nối thành công với Project:", firebaseConfig.projectId);
    return true;
  } catch (error) {
    console.error("Lỗi kết nối Firebase:", error);
    return false;
  }
};