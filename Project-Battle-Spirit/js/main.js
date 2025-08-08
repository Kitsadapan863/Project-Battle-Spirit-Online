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
    let previousGameState = {};

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

    // ++ สร้างฟังก์ชันสำหรับหน่วงเวลา ++
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // ++ สร้างฟังก์ชันสำหรับแสดง Animation การเริ่มเทิร์น ++
    async function animateTurnStart(finalState) {
        const phases = ['start', 'core', 'draw', 'refresh'];
        for (const phase of phases) {
            // สร้าง State จำลองสำหรับแต่ละเฟสแล้ววาด UI
            updateUI({ ...finalState, phase: phase }, myPlayerKey, dom, callbacks, getClientState());
            await delay(300); // หน่วงเวลา
        }
        // เมื่อ Animation จบ ให้วาด UI ด้วย State ที่ถูกต้องล่าสุด
        updateUI(finalState, myPlayerKey, dom, callbacks, getClientState());
    }

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
                
                const newState = message.payload;
                myPlayerKey = message.yourPlayerKey;
                
                // --- START: Logic การตัดสินใจว่าจะแสดง Animation หรือไม่ ---
                const isNewTurn = newState.gameTurn > (previousGameState.gameTurn || 0);
                const isFirstTurnAfterRPS = newState.gameTurn === 1 && previousGameState.rpsState?.isActive === true && newState.rpsState?.isActive === false;

                // จะแสดง Animation ก็ต่อเมื่อเป็นเทิร์นใหม่ และเฟสสุดท้ายคือ 'main'
                if ((isNewTurn || isFirstTurnAfterRPS) && newState.phase === 'main') {
                    // ไม่ต้องอัปเดต localGameState ทันที ให้ฟังก์ชัน animate จัดการ
                    animateTurnStart(newState);
                } else {
                    // อัปเดต UI ตามปกติสำหรับการกระทำอื่นๆ กลางเทิร์น
                    localGameState = newState;
                    updateLocalGameState(localGameState);
                    renderUI();
                }
                
                // เก็บ State ปัจจุบัน (หลังจาก animation หรือ render) ไว้เปรียบเทียบครั้งหน้า
                previousGameState = JSON.parse(JSON.stringify(newState));
                // --- END: Logic การตัดสินใจ ---
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