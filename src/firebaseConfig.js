import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBSNgC599_aGyCysrQkG0_TSLFKsoh-BYM",
  authDomain: "edupresenceapp-5a628.firebaseapp.com",
  databaseURL: "https://edupresenceapp-5a628-default-rtdb.firebaseio.com", // تأكد من إضافة هذا الرابط
  projectId: "edupresenceapp-5a628",
  storageBucket: "edupresenceapp-5a628.firebasestorage.app",
  messagingSenderId: "499617620235",
  appId: "1:499617620235:web:4f1fb1f434e705663a420e",
  measurementId: "G-BW573X5EG4"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تصدير قاعدة البيانات لاستخدامها في التطبيق
export const database = getDatabase(app);