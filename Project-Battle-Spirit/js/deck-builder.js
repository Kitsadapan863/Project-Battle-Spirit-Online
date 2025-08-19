// Project-Battle-Spirit/js/deck-builder.js
import { fetchAllCards, db } from './firebase-init.js'; 
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => { // <-- ทำให้เป็น async
    const collectionView = document.getElementById('collection-view');
    const deckView = document.getElementById('deck-view');
    const deckCountSpan = document.getElementById('deck-count');
    const saveDeckBtn = document.getElementById('save-deck-btn');
    const clearDeckBtn = document.getElementById('clear-deck-btn');
    const deckNameInput = document.getElementById('deck-name');

    // Initialize Firebase Auth and Firestore
    const auth = getAuth();
    // const db = getFirestore();
    let currentUser = null;

    // ติดตามสถานะการล็อกอินของผู้ใช้
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            // เมื่อล็อกอินแล้ว ให้โหลดเด็คแรกของผู้ใช้ (ถ้ามี)
            loadFirstUserDeck(); 
        } else {
            // ถ้าผู้ใช้ไม่ได้ล็อกอิน ให้ redirect ไปหน้า login
            console.log("No user logged in, redirecting...");
            window.location.href = 'login.html';
        }
    });

    let currentDeck = {};
    const allCards = await fetchAllCards(); // <-- ดึงข้อมูลการ์ดตอนเริ่ม

    function renderCollection() {
        collectionView.innerHTML = '';
        allCards.forEach(card => {
            const cardInDeckQty = currentDeck[card.id] || 0;

            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'collection-card';
            cardWrapper.innerHTML = `
                <img src="${card.image}" alt="${card.name}" title="${card.name}">
                ${cardInDeckQty > 0 ? `<div class="card-count-badge">${cardInDeckQty}</div>` : ''}
            `;
            
            cardWrapper.addEventListener('click', () => addCardToDeck(card.id));
            collectionView.appendChild(cardWrapper);
        });
    }

    function renderDeckList() {
        deckView.innerHTML = '';
        let totalCards = 0;

        // เรียงการ์ดในเด็คตาม cost และชื่อ
        const sortedDeckCardIds = Object.keys(currentDeck).sort((a, b) => {
            const cardA = allCards.find(c => c.id === a);
            const cardB = allCards.find(c => c.id === b);
            if (cardA.cost < cardB.cost) return -1;
            if (cardA.cost > cardB.cost) return 1;
            if (cardA.name < cardB.name) return -1;
            if (cardA.name > cardB.name) return 1;
            return 0;
        });

        sortedDeckCardIds.forEach(cardId => {
            const card = allCards.find(c => c.id === cardId);
            const quantity = currentDeck[cardId];
            totalCards += quantity;

            const deckItem = document.createElement('div');
            deckItem.className = 'deck-card-item';
            deckItem.innerHTML = `
                <span class="card-name">${card.name}</span>
                <span class="card-quantity">x${quantity}</span>
            `;
            
            deckItem.addEventListener('click', () => removeCardFromDeck(cardId));
            deckView.appendChild(deckItem);
        });
        deckCountSpan.textContent = totalCards;
    }
    
    function updateAll() {
        renderCollection();
        renderDeckList();
    }

    function addCardToDeck(cardId) {
        const card = allCards.find(c => c.id === cardId);
        const currentQty = currentDeck[cardId] || 0;
        const totalCards = Object.values(currentDeck).reduce((sum, qty) => sum + qty, 0);
        const maxCopies = card.quantity || 3; // ใช้ quantity จาก database หรือ 3 เป็นค่า default

        if (currentQty < 3) {
            currentDeck[cardId] = currentQty + 1;
            updateAll();
        }
    }

    function removeCardFromDeck(cardId) {
        if (currentDeck[cardId]) {
            currentDeck[cardId] -= 1;
            if (currentDeck[cardId] === 0) {
                delete currentDeck[cardId];
            }
            updateAll();
        }
    }

    async function saveDeck() {
        if (!currentUser) {
            alert('You must be logged in to save a deck.');
            return;
        }
        const deckName = deckNameInput.value.trim();
        if (!deckName) {
            alert('Please enter a name for your deck.');
            return;
        }

        try {
            // สร้าง reference ไปยัง document ของเด็คที่ต้องการบันทึก
            // users/{userId}/decks/{deckName}
            const deckRef = doc(db, "users", currentUser.uid, "decks", deckName);
            
            // บันทึกข้อมูลเด็คลง Firestore
            await setDoc(deckRef, currentDeck);

            alert(`Deck "${deckName}" saved successfully!`);
        } catch (error) {
            console.error("Error saving deck: ", error);
            alert("Failed to save deck. Please try again.");
        }
    }

    async function loadDeck(deckName) {
        if (!currentUser) return;

        try {
            const deckRef = doc(db, "users", currentUser.uid, "decks", deckName);
            const docSnap = await getDoc(deckRef);

            if (docSnap.exists()) {
                currentDeck = docSnap.data();
                deckNameInput.value = deckName;
                updateAll();
                console.log(`Deck "${deckName}" loaded.`);
            } else {
                console.log(`No deck named "${deckName}" found for this user.`);
                // ถ้าไม่เจอเด็คที่ระบุ ให้เคลียร์เด็คปัจจุบัน
                currentDeck = {};
                updateAll();
            }
        } catch (error) {
            console.error("Error loading deck: ", error);
        }
    }

    // ฟังก์ชันใหม่: โหลดเด็คแรกที่เจอของผู้ใช้เมื่อเปิดหน้า
    async function loadFirstUserDeck() {
        if (!currentUser) return;
        
        const decksCollectionRef = collection(db, "users", currentUser.uid, "decks");
        const querySnapshot = await getDocs(decksCollectionRef);
        
        if (!querySnapshot.empty) {
            // ถ้ามีเด็คที่บันทึกไว้ ให้โหลดเด็คแรกมาแสดง
            const firstDeckDoc = querySnapshot.docs[0];
            loadDeck(firstDeckDoc.id);
        } else {
            // ถ้ายังไม่มีเด็คเลย ให้เริ่มด้วยเด็คว่างๆ
            updateAll();
        }
    }
    
    saveDeckBtn.addEventListener('click', saveDeck);
    clearDeckBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the deck?')) {
            currentDeck = {};
            updateAll();
        }
    });

    loadDeck('MyNewDeck');
    updateAll();
});