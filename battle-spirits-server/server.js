// battle-spirits-server/server.js
const WebSocket = require('ws');
const { createNewGame } = require('./game_logic/state');
const { handleAction } = require('./game_logic/actionHandler');
const { cleanupField } = require('./game_logic/card');
const wss = new WebSocket.Server({ port: 8080 });

let gameSessions = {};
let waitingPlayer = null;

console.log('Server is listening on port 8080');

function broadcastGameState(sessionId) {
    const session = gameSessions[sessionId];
    if (!session) return;
    const { player1, player2, gameState } = session;
    if (player1 && player1.readyState === WebSocket.OPEN) {
        player1.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', payload: gameState, yourPlayerKey: 'player1' }));
    }
    if (player2 && player2.readyState === WebSocket.OPEN) {
        player2.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', payload: gameState, yourPlayerKey: 'player2' }));
    }
}

wss.on('connection', (ws) => {
    ws.id = `player-${Date.now()}`;
    console.log(`Player ${ws.id} connected.`);

    // **แก้ไขจุดนี้:** wss.on('connection') จะไม่ทำอะไรเลยนอกจากรอรับ message
    // เราได้ลบ if (waitingPlayer) {...} ออกจากส่วนนี้ทั้งหมด

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // --- Logic การจับคู่จะทำงานในนี้ที่เดียวเท่านั้น ---
            if (data.type === 'FIND_GAME') {
                const deckData = data.deck;
                console.log(`Player ${ws.id} is finding a game with a deck of ${deckData.length} cards.`);

                if (waitingPlayer) {
                    const customDecks = {
                        player1: waitingPlayer.deck,
                        player2: deckData
                    };
                    
                    createNewGame(waitingPlayer.ws, ws, customDecks).then(session => {
                        gameSessions[session.sessionId] = session;
                        
                        waitingPlayer.ws.sessionId = session.sessionId;
                        waitingPlayer.ws.playerKey = 'player1';
                        ws.sessionId = session.sessionId;
                        ws.playerKey = 'player2';

                        console.log(`Game session ${session.sessionId} created for ${waitingPlayer.ws.id} and ${ws.id}`);
                        broadcastGameState(session.sessionId);
                        waitingPlayer = null;
                    }).catch(err => {
                        console.error("Failed to create game session:", err);
                    });

                } else {
                    waitingPlayer = { ws: ws, deck: deckData };
                    ws.send(JSON.stringify({ type: 'WAITING_FOR_OPPONENT' }));
                    console.log(`Player ${ws.id} is waiting with their custom deck.`);
                }
                return; // จบการทำงานสำหรับ message 'FIND_GAME'
            }
            
            // --- Logic การรับ Action ในเกม (โค้ดส่วนนี้เหมือนเดิม) ---
            const { sessionId, playerKey, action } = data;
            const session = gameSessions[sessionId];
            if (!session) return;
            
            const gameState = session.gameState;
            
            const isRpsAction = action.type === 'CHOOSE_RPS' && gameState.rpsState.isActive;
            if (!isRpsAction) {
                const isTurnCorrect = gameState.turn === playerKey;
                const isFlashAction = gameState.flashState.isActive && gameState.flashState.priority === playerKey;
                const isDefendingAction = gameState.attackState.isAttacking && gameState.attackState.defender === playerKey;

                if (!isTurnCorrect && !isFlashAction && !isDefendingAction) {
                     console.log(`Action from ${playerKey} rejected: Not their turn/priority.`);
                     broadcastGameState(sessionId);
                     return;
                }
            }

            let updatedGameState = handleAction(gameState, playerKey, action);
            
            if (updatedGameState && !updatedGameState.placementState.isPlacing) {
                updatedGameState = cleanupField(updatedGameState);
            }
            
            session.gameState = updatedGameState;
            broadcastGameState(sessionId);

        } catch (error) {
            console.error('[SERVER] Failed to process message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`Player ${ws.id} disconnected.`);
        // แก้ไขการตรวจสอบ waitingPlayer ให้ถูกต้อง
        if (waitingPlayer && waitingPlayer.ws === ws) {
            waitingPlayer = null;
        }
        
        const sessionId = ws.sessionId;
        if (sessionId && gameSessions[sessionId]) {
            const session = gameSessions[sessionId];
            const remainingPlayer = session.player1 === ws ? session.player2 : session.player1;
            if (remainingPlayer && remainingPlayer.readyState === WebSocket.OPEN) {
                remainingPlayer.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
            }
            delete gameSessions[sessionId];
        }
    });
});