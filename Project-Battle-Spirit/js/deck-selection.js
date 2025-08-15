// Project-Battle-Spirit/js/deck-selection.js
import { defaultDecks } from './default-decks.js';

document.addEventListener('DOMContentLoaded', () => {
    const decksListDiv = document.getElementById('saved-decks-list');
    const playGameBtn = document.getElementById('play-game-btn');
    let selectedDeckName = null;
    let isDefaultDeck = false;

    function createDeckItem(deckName, isDefault = false) {
        const deckItem = document.createElement('div');
        deckItem.className = 'deck-item';
        deckItem.textContent = deckName;
        
        if (isDefault) {
            deckItem.classList.add('default-deck');
        }

        deckItem.addEventListener('click', () => {
            document.querySelectorAll('.deck-item').forEach(d => d.classList.remove('selected'));
            deckItem.classList.add('selected');
            
            selectedDeckName = deckName;
            isDefaultDeck = isDefault; // เก็บสถานะว่าเป็นเด็คเริ่มต้นหรือไม่
            playGameBtn.disabled = false;
        });

        return deckItem;
    }

    function loadDecks() {
        decksListDiv.innerHTML = '';

        // 1. แสดงเด็คเริ่มต้นก่อน
        defaultDecks.forEach(deck => {
            decksListDiv.appendChild(createDeckItem(deck.name, true));
        });

        // 2. แสดงเด็คที่ผู้เล่นสร้างเอง
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('deck_')) {
                const deckName = key.replace('deck_', '');
                decksListDiv.appendChild(createDeckItem(deckName, false));
            }
        }
    }

    playGameBtn.addEventListener('click', () => {
        if (selectedDeckName) {
            // ใช้ sessionStorage เพื่อส่งข้อมูลไปยังหน้าเกม
            sessionStorage.setItem('selectedDeckName', selectedDeckName);
            sessionStorage.setItem('isDefaultDeck', isDefaultDeck); // ส่งสถานะไปด้วย
            
            window.location.href = 'index.html';
        }
    });

    loadDecks();
});