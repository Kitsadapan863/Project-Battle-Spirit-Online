// game_logic/gameLoop.js
const { drawCard } = require('./card.js');

function performRefreshStep(gameState, playerKey) {
    const player = gameState[playerKey];
    player.field.forEach(card => {
        if (card.type === 'Spirit') {
            card.isExhausted = false;
        }
    });
    if (player.costTrash.length > 0) {
        player.reserve.push(...player.costTrash);
        player.costTrash = [];
    }
    return gameState;
}

function clearTemporaryBuffs(gameState, playerKey) {
    if (!gameState[playerKey]) return gameState;
    gameState[playerKey].field.forEach(spirit => {
        if (spirit.tempBuffs && spirit.tempBuffs.length > 0) {
            spirit.tempBuffs = spirit.tempBuffs.filter(buff => buff.duration !== 'turn');
        }
    });
    gameState[playerKey].tempBuffs = [];
    return gameState;
}

function checkGameOver(gameState) {
    if (gameState.gameover) return gameState;
    let winner = null;
    const p1 = gameState.player1;
    const p2 = gameState.player2;

    if (p1.life <= 0) winner = 'Player 2';
    if (p2.life <= 0) winner = 'Player 1';
    
    if (winner) {
        gameState.gameover = true;
        console.log('Game Over!', winner, 'wins!');
    }
    return gameState;
}

function startTurn(gameState, playerKey) {
    console.log(`[GAME LOOP] Starting turn for ${playerKey}`);
    gameState.phase = 'start';
    
    gameState.phase = 'core';
    if (gameState.gameTurn > 1 || playerKey === 'player2') {
        gameState[playerKey].reserve.push({ id: `core-${playerKey}-${Date.now()}` });
    }
    
    gameState.phase = 'draw';
    gameState = drawCard(gameState, playerKey);
    gameState = checkGameOver(gameState);
    
    gameState.phase = 'refresh';
    gameState = performRefreshStep(gameState, playerKey);
    
    gameState.phase = 'main'; // <--- สิ้นสุดที่ Main Phase
    console.log(`[GAME LOOP] ${playerKey}'s turn now in MAIN phase.`);
    return gameState;
}

function advancePhase(gameState, playerKey) {
    if (gameState.turn !== playerKey || gameState.summoningState.isSummoning || gameState.placementState.isPlacing || gameState.attackState.isAttacking || gameState.flashState.isActive) {
        return gameState;
    }

    if (gameState.phase === 'main') {
        // ถ้าเป็นเทิร์นที่ 1 และเป็นตาของผู้เล่น player1 (ผู้เล่นคนแรก)
        console.log('[GAME LOOP] Turn:',gameState.gameTurn, "player:", playerKey);
        if (gameState.gameTurn === 1 && playerKey === 'player1') {
            console.log('[GAME LOOP] First player cannot attack on Turn 1. Ending turn.');
            gameState = endTurn(gameState); // ให้จบเทิร์นทันที
        } else {
            gameState.phase = 'attack'; // ถ้าไม่ใช่เทิร์นแรก ก็เข้า Attack Step ได้ตามปกติ
        }
    } else if (gameState.phase === 'attack' && !gameState.attackState.isAttacking) {
        gameState = endTurn(gameState);
    }
    
    return gameState;
}

function endTurn(gameState) {
    const currentPlayerKey = gameState.turn;
    
    gameState.phase = 'end';
    gameState = clearTemporaryBuffs(gameState, 'player1');
    gameState = clearTemporaryBuffs(gameState, 'player2');

    const nextPlayerKey = (currentPlayerKey === 'player1') ? 'player2' : 'player1';
    gameState.turn = nextPlayerKey;

    //นับ turn
    gameState.gameTurn++;
    

    // Start the next player's turn
    return startTurn(gameState, nextPlayerKey);
}

module.exports = {
    startTurn,
    advancePhase,
    endTurn,
    checkGameOver // Export for use in other files
};