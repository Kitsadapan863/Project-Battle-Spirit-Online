// game_logic/magic.js
const { calculateCost, getSpiritLevelAndBP } = require('./utils.js');
const { drawCard, initiateDeckDiscard, initiateDiscard, moveUsedMagicToTrash, destroyCards, applyPowerUpEffect, cleanupField } = require('./card.js');
const { resolveTriggeredEffects } = require('./effects.js');

// Helper function
function findValidTargets(gameState, targetInfo) {
    // ... (This logic can be complex, for now we will assume it finds targets correctly)
    // ... A full implementation would check scope, type, BP etc against all cards on the field
    return []; // Placeholder
}

function initiateMagicPayment(gameState, playerKey, payload) {
    const { cardUid, timing } = payload;
    const currentPlayer = gameState[playerKey];
    const cardToUse = currentPlayer.hand.find(c => c.uid === cardUid);
    if (!cardToUse) return gameState;

    // --- START: แก้ไข Logic การค้นหาเอฟเฟกต์ ---
    const mainEffect = cardToUse.effects.find(e => e.timing === 'main');
    const flashEffect = cardToUse.effects.find(e => e.timing === 'flash');

    // ถ้าเป็น Main Step และการ์ดมีทั้ง Main และ Flash effect
    if (timing === 'main' && mainEffect && flashEffect) {
        console.log(`[MAGIC LOG] Card ${cardToUse.name} has multiple effects. Awaiting player choice.`);
        // เข้าสู่สถานะให้ผู้เล่นเลือก
        gameState.effectChoiceState = {
            isChoosing: true,
            card: cardToUse
        };
        return gameState; // หยุดและรอให้ผู้เล่นเลือก
    }
    
    // ถ้ามีแค่เอฟเฟกต์เดียวที่ตรงกับ timing หรือไม่ใช่กรณีที่เลือกได้
    const effectToUse = cardToUse.effects.find(e => e.timing === timing);
    if (!effectToUse) return gameState;
    // --- END: แก้ไข Logic ---
    
    const finalCost = calculateCost(cardToUse, playerKey, gameState);
    // ... (check if enough cores) ...

    gameState.magicPaymentState = {
        isPaying: true,
        cardToUse: cardToUse,
        costToPay: finalCost,
        selectedCores: [],
        timing: timing, // ใช้ timing ที่ส่งมา
        effectToUse: effectToUse // ใช้เอฟเฟกต์ที่หาเจอ
    };
    return gameState;
}

function confirmMagicPayment(gameState, playerKey) {
    const { isPaying, cardToUse, costToPay, selectedCores, timing, effectToUse } = gameState.magicPaymentState;
    if (!isPaying || selectedCores.length < costToPay) return gameState;

    const currentPlayer = gameState[playerKey];
    const opponentPlayerKey = playerKey === 'player1' ? 'player2' : 'player1';

    // ... (Logic to move selected cores to trash) ...

    gameState = cleanupField(gameState);
    
    gameState.magicPaymentState = { isPaying: false, cardToUse: null, costToPay: 0, selectedCores: [], timing: null, effectToUse: null };
    
    // Apply the magic effect
    switch (effectToUse.keyword) {
        case 'draw':
            for (let i = 0; i < effectToUse.quantity; i++) {
                gameState = drawCard(gameState, playerKey);
            }
            if (effectToUse.discard > 0) {
                gameState.discardState = { isDiscarding: true, count: effectToUse.discard, cardToDiscard: null,  playerKey: playerKey };
            }
            break;
        case 'discard':
            // This needs the initiateDeckDiscard logic to be moved to card.js on the server
            // gameState = initiateDeckDiscard(gameState, opponentPlayerKey, effectToUse.quantity);
            break;
        case 'power up':
            // This requires targeting logic
            gameState.targetingState = { isTargeting: true, forEffect: effectToUse, onTarget: null };
            break;
        // Add other cases for other magic effects
    }

    // Move used magic card to trash
    const cardIndex = currentPlayer.hand.findIndex(c => c.uid === cardToUse.uid);
    if (cardIndex > -1) {
        const [usedCard] = currentPlayer.hand.splice(cardIndex, 1);
        currentPlayer.cardTrash.push(usedCard);
    }
    
    return gameState;
}

function cancelMagicPayment(gameState) {
    gameState.magicPaymentState = { isPaying: false, cardToUse: null, costToPay: 0, selectedCores: [] };
    return gameState;
}

function chooseMagicEffect(gameState, playerKey, payload) {
    const { chosenTiming } = payload;
    const { isChoosing, card } = gameState.effectChoiceState;
    if (!isChoosing) return gameState;

    const effectToUse = card.effects.find(e => e.timing === chosenTiming);
    if (!effectToUse) return gameState;

    // ออกจากสถานะการเลือก
    gameState.effectChoiceState = { isChoosing: false, card: null };
    
    // เข้าสู่สถานะจ่ายค่าร่าย
    const finalCost = calculateCost(card, playerKey, gameState);
    gameState.magicPaymentState = {
        isPaying: true,
        cardToUse: card,
        costToPay: finalCost,
        selectedCores: [],
        timing: chosenTiming,
        effectToUse: effectToUse
    };

    console.log(`[MAGIC LOG] Player chose ${chosenTiming.toUpperCase()} effect for ${card.name}. Proceeding to payment.`);
    return gameState;
}

function cancelEffectChoice(gameState, playerKey) {
    gameState.effectChoiceState = { isChoosing: false, card: null };
    return gameState;
}

module.exports = {
    initiateMagicPayment,
    confirmMagicPayment,
    cancelMagicPayment,
    chooseMagicEffect, // <--- เพิ่ม
    cancelEffectChoice  // <--- เพิ่ม
};