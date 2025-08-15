// Project-Battle-Spirit/js/auth-guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// **สำคัญ:** นำ firebaseConfig ที่คุณใช้ในไฟล์ auth.js มาวางที่นี่ด้วย
const firebaseConfig = {
  apiKey: "AIzaSyBU-kd0XhODrLPR10TNyusnSEZcDw6tDSI",
  authDomain: "battle-spirits-game.firebaseapp.com",
  projectId: "battle-spirits-game",
  storageBucket: "battle-spirits-game.firebasestorage.app",
  messagingSenderId: "246374886880",
  appId: "1:246374886880:web:58ab1449927db6952e0f85",
  measurementId: "G-ETGBKV28R5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    // ถ้าไม่มี user (ยังไม่ล็อกอิน) และไม่ใช่หน้า login อยู่แล้ว
    if (!user && window.location.pathname.endsWith('login.html') === false) {
        console.log('Auth Guard: No user found, redirecting to login.');
        // ให้กลับไปหน้า login ทันที
        window.location.replace('login.html');
    }
});