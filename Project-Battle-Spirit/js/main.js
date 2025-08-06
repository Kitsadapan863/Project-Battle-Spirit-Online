// js/main.js
import { updateUI } from './ui/index.js';
import { setupInitialEventListeners, updateLocalGameState, setForceUIRender, getClientState } from './core/eventManager.js';
import { getDOMElements,createCardElement, formatCardEffects  } from './ui/components.js';

document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.querySelector('.game-board');
    const selectionScreen = document.getElementById('game-mode-selection');
    const statusMessage = document.querySelector('.selection-content p');
    const modeButtons = document.querySelector('.selection-buttons');
    const dom = getDOMElements(); // สร้างตัวแปร dom
    
    let localGameState = {};
    let myPlayerKey = null;

    // สร้าง object callbacks ที่จะส่งฟังก์ชันไปให้ส่วนต่างๆ
    const callbacks = {
        formatEffectText: formatCardEffects,
        getMyPlayerKey: () => myPlayerKey,
        createCardElement: createCardElement // เพิ่ม createCardElement เข้าไปใน callbacks
    };

    // ฟังก์ชันสำหรับ re-render UI
    const renderUI = () => {
        if (localGameState.sessionId) {
            updateUI(localGameState, myPlayerKey, dom, callbacks, getClientState());
        }
    };

    // ส่งฟังก์ชัน render ไปให้ eventManager
    setForceUIRender(renderUI);

    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('Connected to WebSocket server!');
        statusMessage.textContent = 'Connecting to server...';
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'GAME_STATE_UPDATE') {
            localGameState = message.payload;
            myPlayerKey = message.yourPlayerKey;
            updateLocalGameState(localGameState);
            renderUI(); // เรียกใช้ฟังก์ชัน render กลาง
        }
   
         // --- LOG DEBUG ---
        console.log('%c[CLIENT] Received message from server:', 'color: blue;', message);
        switch (message.type) {
            case 'WAITING_FOR_OPPONENT':
                statusMessage.textContent = 'Waiting for an opponent...';
                modeButtons.classList.add('hidden');
                break;
            case 'GAME_STATE_UPDATE':
                if (selectionScreen) selectionScreen.classList.add('hidden');
                if (gameBoard) gameBoard.classList.remove('hidden');
                localGameState = message.payload;
                myPlayerKey = message.yourPlayerKey;
                updateLocalGameState(localGameState);
                renderUI();
                // updateUI(localGameState, myPlayerKey, dom, callbacks); 
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
            const dataToSend = {
                sessionId: localGameState.sessionId,
                playerKey: myPlayerKey,
                action: action
            };
            // --- LOG DEBUG ---
            console.log('%c[CLIENT] Sending action to server:', 'color: orange;', dataToSend);
            ws.send(JSON.stringify(dataToSend));
        }
    }
    // ส่ง dom ไปให้ setupInitialEventListeners
    setupInitialEventListeners(sendActionToServer, dom, callbacks); 
});