// Project-Battle-Spirit/js/main.js
import { updateUI } from './ui/index.js';
import { setupInitialEventListeners, updateLocalGameState, setForceUIRender, getClientState } from './core/eventManager.js';
import { getDOMElements, createCardElement, formatCardEffects } from './ui/components.js';
import { fetchAllCards } from './firebase-init.js'; // <-- Import ฟังก์ชันใหม่
import { defaultDecks } from './default-decks.js'; 
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.querySelector('.game-board');
    const selectionScreen = document.getElementById('game-mode-selection');
    // const statusMessage = document.querySelector('.selection-content p');
    const statusMessage = document.getElementById('status-message');
    const modeButtons = document.querySelector('.selection-buttons');
    const auth = getAuth(); // เรียกใช้ auth
    const userInfoDiv = document.getElementById('user-info');
    const userEmailSpan = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
     
    const dom = getDOMElements();
    
    let localGameState = {};
    let myPlayerKey = null;
    let previousGameState = {};

    const callbacks = {
        formatEffectText: formatCardEffects,
        getMyPlayerKey: () => myPlayerKey,
        createCardElement: createCardElement
    };

    const renderUI = () => {
        if (localGameState.sessionId) {
            updateUI(localGameState, myPlayerKey, dom, callbacks, getClientState());
        }
    };
    setForceUIRender(renderUI);

        logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log('User signed out.');
            window.location.href = 'login.html'; // กลับไปหน้า login
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    });

    // เพื่อแสดงข้อมูลผู้ใช้เมื่อล็อกอินสำเร็จ
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // ถ้ามี user (ล็อกอินอยู่)
            userInfoDiv.classList.remove('hidden');
            userEmailSpan.textContent = user.email;
        }
    });

    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = async () => {
        console.log('Connected to WebSocket server!');

        const selectedDeckName = sessionStorage.getItem('selectedDeckName');
        const isDefault = sessionStorage.getItem('isDefaultDeck') === 'true';
        const customDeckData = sessionStorage.getItem('selectedDeckData');
        
        if (selectedDeckName) {
            const allCards = await fetchAllCards();
            let deckToBuild = null;

            if (isDefault) {
                console.log(`Loading default deck: ${selectedDeckName}`);
                const defaultDeckData = defaultDecks.find(d => d.name === selectedDeckName);
                if(defaultDeckData) {
                    deckToBuild = defaultDeckData.cards;
                }
            }else if (customDeckData) {
                // ========== START: โค้ดที่เพิ่มเข้ามา ==========
                // ถ้าเป็นเด็คที่ผู้ใช้สร้าง ให้ดึงข้อมูลจาก sessionStorage
                console.log(`Loading custom deck from session storage: ${selectedDeckName}`);
                deckToBuild = JSON.parse(customDeckData);
                // ========== END: โค้ดที่เพิ่มเข้ามา ==========
            } else {
                console.log(`Loading custom deck: ${selectedDeckName}`);
                const savedDeckJSON = localStorage.getItem(`deck_${selectedDeckName}`);
                if (savedDeckJSON) {
                    deckToBuild = JSON.parse(savedDeckJSON);
                }
            }
            
            // ===== START: แก้ไขเงื่อนไขตรงนี้ =====
            if (deckToBuild && allCards.length > 0) {
            // ===== END: แก้ไขเงื่อนไข =====
                statusMessage.textContent = 'Finding opponent...';
                modeButtons.classList.add('hidden');
                const fullDeckData = [];

                Object.keys(deckToBuild).forEach(cardId => {
                    const cardTemplate = allCards.find(c => c.id === cardId);
                    if (cardTemplate) {
                        // ใช้ deckToBuild[cardId] เพื่อหาจำนวนการ์ด
                        for (let i = 0; i < deckToBuild[cardId]; i++) {
                            fullDeckData.push(cardTemplate);
                        }
                    }
                });

                ws.send(JSON.stringify({
                    type: 'FIND_GAME',
                    deck: fullDeckData
                }));
                
                sessionStorage.removeItem('selectedDeckName');
                sessionStorage.removeItem('isDefaultDeck');
                sessionStorage.removeItem('selectedDeckData')
            } else {
                 alert('Deck not found or failed to load card data. Returning to deck selection.');
                 window.location.href = 'deck-selection.html';
            }
        } else {
            statusMessage.textContent = 'Connection Successful!';
            if (modeButtons) {
                modeButtons.classList.remove('hidden');
            }
        }
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    async function animateTurnStart(finalState) {
        const phases = ['start', 'core', 'draw', 'refresh'];
        for (const phase of phases) {
            updateUI({ ...finalState, phase: phase }, myPlayerKey, dom, callbacks, getClientState());
            await delay(300);
        }
        updateUI(finalState, myPlayerKey, dom, callbacks, getClientState());
    }

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('%c[CLIENT] Received message from server:', 'color: blue;', message);
        switch (message.type) {
            case 'WAITING_FOR_OPPONENT':
                statusMessage.textContent = 'Waiting for an opponent...';
                modeButtons.classList.add('hidden');
                break;
            case 'GAME_STATE_UPDATE':
                if (selectionScreen) selectionScreen.classList.add('hidden');
                if (gameBoard) gameBoard.classList.remove('hidden');
                
                const newState = message.payload;
                myPlayerKey = message.yourPlayerKey;
                
                const isNewTurn = newState.gameTurn > (previousGameState.gameTurn || 0);
                const isFirstTurnAfterRPS = newState.gameTurn === 1 && previousGameState.rpsState?.isActive === true && newState.rpsState?.isActive === false;

                if ((isNewTurn || isFirstTurnAfterRPS) && newState.phase === 'main') {
                    animateTurnStart(newState);
                } else {
                    localGameState = newState;
                    updateLocalGameState(localGameState);
                    renderUI();
                }
                
                previousGameState = JSON.parse(JSON.stringify(newState));
                break;
            case 'OPPONENT_DISCONNECTED':
                alert('Your opponent has disconnected. The game has ended.');
                location.reload();
                break;
        }
    };

    ws.onclose = () => { statusMessage.textContent = 'Disconnected. Please refresh.'; };
    ws.onerror = (error) => { statusMessage.textContent = 'Could not connect to the server.'; };

    function sendActionToServer(action) {
        if (ws.readyState === WebSocket.OPEN && localGameState.sessionId) {
            const dataToSend = { sessionId: localGameState.sessionId, playerKey: myPlayerKey, action: action };
            console.log('%c[CLIENT] Sending action to server:', 'color: orange;', dataToSend);
            ws.send(JSON.stringify(dataToSend));
        }
    }
    setupInitialEventListeners(sendActionToServer, dom, callbacks); 
});