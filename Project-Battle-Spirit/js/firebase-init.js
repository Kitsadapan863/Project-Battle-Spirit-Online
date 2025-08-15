// Project-Battle-Spirit/js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBU-kd0XhODrLPR10TNyusnSEZcDw6tDSI",
  authDomain: "battle-spirits-game.firebaseapp.com",
  projectId: "battle-spirits-game",
  storageBucket: "battle-spirits-game.firebasestorage.app",
  messagingSenderId: "246374886880",
  appId: "1:246374886880:web:58ab1449927db6952e0f85",
  measurementId: "G-ETGBKV28R5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// สร้างฟังก์ชันกลางสำหรับดึงข้อมูลการ์ดทั้งหมด
export async function fetchAllCards() {
    try {
        const cardsCollection = collection(db, 'cards');
        const cardsSnapshot = await getDocs(cardsCollection);
        const allCards = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Fetched ${allCards.length} cards from Firestore for client.`);
        return allCards;
    } catch (error) {
        console.error("Error fetching cards from Firestore:", error);
        alert("Could not connect to the card database. Please check your Firebase setup and internet connection.");
        return []; // ส่งค่าว่างกลับไปเพื่อไม่ให้แอปพัง
    }
}