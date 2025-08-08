// server.js
const WebSocket = require('ws');
const { createNewGame } = require('./game_logic/state');
const { handleAction } = require('./game_logic/actionHandler');
const { startTurn } = require('./game_logic/gameLoop'); 
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

    if (waitingPlayer) {
        const session = createNewGame(waitingPlayer, ws);
        gameSessions[session.sessionId] = session;
        
        waitingPlayer.sessionId = session.sessionId;
        waitingPlayer.playerKey = 'player1';
        ws.sessionId = session.sessionId;
        ws.playerKey = 'player2';

        console.log(`Game session ${session.sessionId} created for ${waitingPlayer.id} and ${ws.id}`);
        // หลังจากสร้างเกมเสร็จ ให้เริ่มเทิร์นแรกทันที
        // console.log("Starting first turn for player1...");
        // session.gameState = startTurn(session.gameState, 'player1');
        broadcastGameState(session.sessionId);
        waitingPlayer = null;
    } else {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'WAITING_FOR_OPPONENT' }));
        console.log(`Player ${ws.id} is waiting for an opponent.`);
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const { sessionId, playerKey, action } = data;
            const session = gameSessions[sessionId];

            if (!session) return;
            
            const gameState = session.gameState;
            
            // --- START: โค้ดที่แก้ไขและสมบูรณ์ ---
            const isRpsAction = action.type === 'CHOOSE_RPS' && gameState.rpsState.isActive;

            // ถ้าไม่ใช่ Action เป่ายิ้งฉุบ ให้ตรวจสอบเทิร์นตามปกติ
            if (!isRpsAction) {
                const isTurnCorrect = gameState.turn === playerKey;
                const isFlashAction = gameState.flashState.isActive && gameState.flashState.priority === playerKey;
                const isDefendingAction = gameState.attackState.isAttacking && gameState.attackState.defender === playerKey;

                // อนุญาต Action ถ้า: เป็นเทิร์นของผู้เล่น, หรือมี Priority ใน Flash Time, หรือกำลังตั้งรับ
                if (!isTurnCorrect && !isFlashAction && !isDefendingAction) {
                     console.log(`Action from ${playerKey} rejected: Not their turn/priority.`);
                     broadcastGameState(sessionId);
                     return;
                }
            }
            // --- END: โค้ดที่แก้ไขและสมบูรณ์ ---

            // ++ ลบ if statement เก่าที่ซ้ำซ้อนจากตรงนี้ออกไป ++

            console.log(`Received action from ${playerKey}:`, action.type);
            
            console.log(`\n--- [SERVER] Action from ${playerKey} ---`);
            console.log('Action Type:', action.type);
            console.log('Payload:', action.payload);
            console.log(`Current Turn: ${gameState.turn}, Current Phase: ${gameState.phase}`);

            let updatedGameState = handleAction(gameState, playerKey, action);
            
            if (!updatedGameState.placementState.isPlacing) {
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
        if (ws === waitingPlayer) {
            waitingPlayer = null;
        }
        
        const sessionId = ws.sessionId;
        if (sessionId && gameSessions[sessionId]) {
            console.log(`Game session ${sessionId} ended due to disconnect.`);
            const session = gameSessions[sessionId];
            const remainingPlayer = session.player1 === ws ? session.player2 : session.player1;
            if (remainingPlayer && remainingPlayer.readyState === WebSocket.OPEN) {
                remainingPlayer.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
            }
            delete gameSessions[sessionId];
        }
    });
});