// Project-Battle-Spirit/js/deck-builder.js
import { fetchAllCards } from './firebase-init.js'; // <-- ใช้ฟังก์ชันใหม่

document.addEventListener('DOMContentLoaded', async () => { // <-- ทำให้เป็น async
    const collectionView = document.getElementById('collection-view');
    const deckView = document.getElementById('deck-view');
    const deckCountSpan = document.getElementById('deck-count');
    const saveDeckBtn = document.getElementById('save-deck-btn');
    const clearDeckBtn = document.getElementById('clear-deck-btn');
    const deckNameInput = document.getElementById('deck-name');

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

        if (totalCards >= 40 && currentQty < maxCopies) {
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

    function saveDeck() {
        const deckName = deckNameInput.value.trim();
        if (!deckName) {
            alert('Please enter a name for your deck.');
            return;
        }
        localStorage.setItem(`deck_${deckName}`, JSON.stringify(currentDeck));
        alert(`Deck "${deckName}" saved!`);
    }

    function loadDeck(deckName) {
        const savedDeck = localStorage.getItem(`deck_${deckName}`);
        if (savedDeck) {
            currentDeck = JSON.parse(savedDeck);
            deckNameInput.value = deckName;
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