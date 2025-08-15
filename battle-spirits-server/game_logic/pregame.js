// game_logic/pregame.js
const { startTurn } = require('./gameLoop');

function resolveRPS(gameState, playerKey, choice) {
    const rpsState = gameState.rpsState;
    if (!rpsState.isActive || rpsState[playerKey].choice) return gameState;

    console.log(`[RPS] ${playerKey} chose ${choice}`);
    rpsState[playerKey].choice = choice;

    const p1Choice = rpsState.player1.choice;
    const p2Choice = rpsState.player2.choice;

    // ถ้่ายังเลือกไม่ครบสองคน ก็แค่รอ
    if (!p1Choice || !p2Choice) {
        return gameState;
    }

    // ตรรกะการหาผู้ชนะ
    let winner = null;
    if (p1Choice === p2Choice) {
        // เสมอ
        console.log('[RPS] Draw! Resetting choices.');
        rpsState.player1.choice = null;
        rpsState.player2.choice = null;
    } else if (
        (p1Choice === 'rock' && p2Choice === 'scissors') ||
        (p1Choice === 'paper' && p2Choice === 'rock') ||
        (p1Choice === 'scissors' && p2Choice === 'paper')
    ) {
        winner = 'player1';
    } else {
        winner = 'player2';
    }

    if (winner) {
        console.log(`[RPS] Winner is ${winner}. Starting game.`);
        rpsState.isActive = false;
        rpsState.winner = winner;
        gameState.turn = winner; // กำหนดเทิร์นแรก
        return startTurn(gameState, winner); // เริ่มเทิร์นแรก
    }

    return gameState;
}

module.exports = { resolveRPS };