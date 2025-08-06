// js/main.js
import { updateUI } from './ui/index.js';
import { setupInitialEventListeners } from './core/eventManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.querySelector('.game-board');
    const selectionScreen = document.getElementById('game-mode-selection');
    const statusMessage = document.querySelector('.selection-content p');
    const modeButtons = document.querySelector('.selection-buttons');
    
    let localGameState = {};
    let myPlayerKey = null;

    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('Connected to WebSocket server!');
        statusMessage.textContent = 'Connecting to server...';
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

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
                updateUI(localGameState, myPlayerKey); 
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

    setupInitialEventListeners(sendActionToServer);
});