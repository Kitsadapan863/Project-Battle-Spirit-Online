// Project-Battle-Spirit/js/deck-selection.js
import { defaultDecks } from './default-decks.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    const decksListDiv = document.getElementById('saved-decks-list');
    const playGameBtn = document.getElementById('play-game-btn');
    let selectedDeckName = null;
    let isDefaultDeck = false;

    const auth = getAuth();
    // const db = getFirestore();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // เมื่อผู้ใช้ล็อกอินแล้ว ให้โหลดเด็คทั้งหมด
            loadDecks(user.uid);
        } else {
            console.log("No user logged in, redirecting...");
            window.location.href = 'login.html';
        }
    });

    function createDeckItem(deckName, isDefault = false) {
        const deckItemWrapper = document.createElement('div');
        deckItemWrapper.className = 'deck-item-wrapper';

        const deckItem = document.createElement('div');
        deckItem.className = 'deck-item';
        deckItem.textContent = deckName;
        
        if (isDefault) {
            deckItem.classList.add('default-deck');
        }

        // ทำให้ทั้ง div สามารถกดเลือกเพื่อเล่นได้
        deckItem.addEventListener('click', () => {
            document.querySelectorAll('.deck-item').forEach(d => d.classList.remove('selected'));
            deckItem.classList.add('selected');
            
            selectedDeckName = deckName;
            isDefaultDeck = isDefault;
            playGameBtn.disabled = false;
        });

        deckItemWrapper.appendChild(deckItem);

        // เพิ่มปุ่ม Edit และ Delete สำหรับเด็คที่ผู้ใช้สร้างเองเท่านั้น
        if (!isDefault) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'deck-item-actions';

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'edit-deck-btn';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // ป้องกันไม่ให้ event click ของ deckItem ทำงาน
                // ส่งชื่อเด็คไปที่หน้า builder ผ่าน URL parameter
                window.location.href = `deck-builder.html?deckNameToEdit=${encodeURIComponent(deckName)}`;
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-deck-btn';
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the deck "${deckName}"?`)) {
                    try {
                        const deckRef = doc(db, "users", auth.currentUser.uid, "decks", deckName);
                        await deleteDoc(deckRef);
                        alert(`Deck "${deckName}" has been deleted.`);
                        loadDecks(auth.currentUser.uid); // โหลดรายการเด็คใหม่
                    } catch (error) {
                        console.error("Error deleting deck: ", error);
                        alert("Failed to delete deck.");
                    }
                }
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            deckItemWrapper.appendChild(actionsDiv);
        }

        return deckItemWrapper;
    }

    async function loadDecks(userId) {
        decksListDiv.innerHTML = '';

        // 1. แสดงเด็คเริ่มต้น (เหมือนเดิม)
        defaultDecks.forEach(deck => {
            decksListDiv.appendChild(createDeckItem(deck.name, true));
        });

        // 2. ดึงเด็คที่ผู้เล่นสร้างเองจาก Firestore
        try {
            const decksCollectionRef = collection(db, "users", userId, "decks");
            const querySnapshot = await getDocs(decksCollectionRef);
            
            querySnapshot.forEach((doc) => {
                // doc.id คือชื่อของเด็ค
                decksListDiv.appendChild(createDeckItem(doc.id, false));
            });
        } catch (error) {
            console.error("Error loading user decks: ", error);
        }
    }

    playGameBtn.addEventListener('click', async () => { // ทำให้เป็น async function
        if (selectedDeckName) {
            sessionStorage.setItem('selectedDeckName', selectedDeckName);
            sessionStorage.setItem('isDefaultDeck', String(isDefaultDeck)); //แปลง boolean เป็น string

            if (!isDefaultDeck && auth.currentUser) {
                try {
                    const deckRef = doc(db, "users", auth.currentUser.uid, "decks", selectedDeckName);
                    const docSnap = await getDoc(deckRef); // ใช้ await เพื่อรอให้โหลดข้อมูลเสร็จ

                    if (docSnap.exists()) {
                        sessionStorage.setItem('selectedDeckData', JSON.stringify(docSnap.data()));
                        window.location.href = 'index.html';
                    } else {
                        alert(`Could not find the selected deck: ${selectedDeckName}`);
                    }
                } catch (error) {
                    console.error("Error fetching selected deck:", error);
                    alert("There was an error fetching your deck data.");
                }
            } else {
                 // ถ้าเป็นเด็คเริ่มต้น หรือไม่มี user (ซึ่งไม่น่าเป็นไปได้) ก็ไปหน้าเกมเลย
                 window.location.href = 'index.html';
            }
        }
    });

    // loadDecks();
});