// game_logic/effectHandlers.js
const { getCardLevel } = require('./utils.js');
// const { initiateDeckDiscard } = require('./card.js'); // We will add card discard logic later

function applyPowerUp(gameState, cardUid, power, duration) {
    const p1_key = 'player1';
    const p2_key = 'player2';

    let targetSpirit = gameState[p1_key].field.find(s => s.uid === cardUid);
    if (!targetSpirit) {
        targetSpirit = gameState[p2_key].field.find(s => s.uid === cardUid);
    }
    
    if (targetSpirit) {
        if (!targetSpirit.tempBuffs) {
            targetSpirit.tempBuffs = [];
        }
        targetSpirit.tempBuffs.push({ type: 'BP', value: power, duration: duration });
        console.log(`[Effect: Power Up] ${targetSpirit.name} gets +${power} BP for the ${duration}.`);
    }
    return gameState;
}

function applyCrush(gameState, card, cardLevel, ownerKey) {
    const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1';
    let cardsToDiscard = cardLevel;
    // ... logic to calculate total discard count ...
    console.log(`Applying Crush: Discarding ${cardsToDiscard} cards from ${opponentKey}'s deck.`);
    // gameState = initiateDeckDiscard(gameState, opponentKey, cardsToDiscard);
    return gameState;
}

function applyClash(gameState) {
    if (gameState.attackState.isAttacking) {
        gameState.attackState.isClash = true;
    }
    return gameState;
}

function applyDiscard(gameState, card, effect, ownerKey) {
    const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1';
    let cardsToDiscard = 0;
    // ... logic to calculate discard count ...
    console.log(`Applying Discard: Discarding ${cardsToDiscard} cards from ${opponentKey}'s deck.`);
    // gameState = initiateDeckDiscard(gameState, opponentKey, cardsToDiscard);
    return gameState;
}

module.exports = { 
    applyCrush, 
    applyClash, 
    applyPowerUp, 
    applyDiscard 
};