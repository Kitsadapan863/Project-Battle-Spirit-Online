// Project-Battle-Spirit/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// **สำคัญ:** นำ firebaseConfig ที่คุณใช้ในไฟล์ firebase-init.js มาวางที่นี่ด้วย
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

// --- ตรวจสอบสถานะการล็อกอิน ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is already logged in:', user.uid);
        // ใช้ replace แทน href เพื่อไม่ให้ผู้ใช้กด back กลับมาหน้า login ได้
        window.location.replace('index.html');
    } else {
        console.log('User is logged out.');
    }
});

// --- ส่วนจัดการ Form ---
const authFormContainer = document.querySelector('.auth-form-container');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const toggleText = document.getElementById('toggle-form-text');
const authError = document.getElementById('auth-error');

let isLoginMode = true;

// --- START: แก้ไข Logic การสลับ Form ---
// เราจะดักฟัง event ที่ container แทนที่จะเป็นที่ link โดยตรง
authFormContainer.addEventListener('click', (e) => {
    // เช็คว่า element ที่ถูกคลิกคือ link ที่เราต้องการหรือไม่
    if (e.target.id === 'toggle-form-link') {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authError.textContent = '';
        
        if (isLoginMode) {
            formTitle.textContent = 'Login';
            submitBtn.textContent = 'Login';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-form-link">Sign Up</a>';
        } else {
            formTitle.textContent = 'Sign Up';
            submitBtn.textContent = 'Sign Up';
            toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-form-link">Login</a>';
        }
    }
});
// --- END: แก้ไข Logic การสลับ Form ---


// จัดการการ submit form (โค้ดส่วนนี้เหมือนเดิม)
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';

    if (isLoginMode) {
        // --- Login ---
        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                authError.textContent = error.message;
            });
    } else {
        // --- Sign Up ---
        createUserWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                authError.textContent = error.message;
            });
    }
});