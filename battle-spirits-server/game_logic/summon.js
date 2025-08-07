// game_logic/summon.js
const { calculateCost } = require('./utils.js');
const { cleanupField } = require('./card.js');
const { resolveTriggeredEffects } = require('./effects.js');

function initiateSummon(gameState, playerKey, payload) {
    const { cardUid } = payload;
    const currentPlayer = gameState[playerKey];

    // --- DETAILED DEBUG LOGS ---
    console.log(`[SUMMON DEBUG] Attempting to initiate summon for card UID: ${cardUid}`);
    console.log(`[SUMMON DEBUG] Player ${playerKey}'s hand on server contains ${currentPlayer.hand.length} cards:`);
    // แสดง UID ของการ์ดทุกใบบนมือ
    currentPlayer.hand.forEach(card => console.log(`- Card: ${card.name}, UID: ${card.uid}`));
    // --- END DEBUG LOGS ---

    if (gameState.summoningState.isSummoning) {
        console.log('[SUMMON DEBUG] Action rejected: A summon is already in progress.');
        return gameState;
    }

    const cardToSummon = currentPlayer.hand.find(c => c.uid === cardUid);
    
    if (!cardToSummon) {
        console.error(`[SUMMON DEBUG] CRITICAL ERROR: Card with UID ${cardUid} NOT FOUND in player's hand on the server.`);
        return gameState; // หยุดทำงานถ้าหาการ์ดไม่เจอ
    }

    console.log(`[SUMMON DEBUG] Card ${cardToSummon.name} found on server.`);

    const finalCost = calculateCost(cardToSummon, playerKey, gameState);
    const totalAvailableCores = currentPlayer.reserve.length + currentPlayer.field.reduce((sum, card) => sum + (card.cores ? card.cores.length : 0), 0);
    const minCoresNeeded = cardToSummon.type === 'Spirit' ? 1 : 0;

    if (totalAvailableCores < finalCost + minCoresNeeded) {
        console.log("[SUMMON DEBUG] Action rejected: Not enough cores to summon.");
        return gameState;
    }

    console.log(`%c[SUMMON DEBUG] SUCCESS: Entering summoning state for ${cardToSummon.name}`, 'color: lightgreen;');
    gameState.summoningState = {
        isSummoning: true,
        cardToSummon,
        costToPay: finalCost,
        selectedCores: []
    };
    return gameState;
}

function selectCoreForPayment(gameState, playerKey, payload) {
    const { coreId, from, spiritUid } = payload;
    
    // --- START: แก้ไข Logic ส่วนนี้ ---
    // ตรวจสอบว่ากำลังจ่ายค่าร่ายสำหรับอะไร (Summon หรือ Magic)
    const isSummoning = gameState.summoningState.isSummoning;
    const isPayingForMagic = gameState.magicPaymentState.isPaying;

    if (!isSummoning && !isPayingForMagic) return gameState;

    // เลือก state ที่ถูกต้องที่จะทำงานด้วย
    const paymentState = isSummoning ? gameState.summoningState : gameState.magicPaymentState;
    const costToPay = paymentState.costToPay;
    // --- END: แก้ไข Logic ส่วนนี้ ---
    
    const { selectedCores } = paymentState;
    const coreInfo = { coreId, from, spiritUid };
    const existingIndex = selectedCores.findIndex(c => c.coreId === coreId);

    if (existingIndex > -1) {
        selectedCores.splice(existingIndex, 1);
    } else if (selectedCores.length < costToPay) {
        selectedCores.push(coreInfo);
    }
    return gameState;
}

function cancelSummon(gameState) {
    gameState.summoningState = { isSummoning: false, cardToSummon: null, costToPay: 0, selectedCores: [] };
    return gameState;
}

function confirmSummon(gameState, playerKey) {
    const { isSummoning, cardToSummon, costToPay, selectedCores } = gameState.summoningState;
    if (!isSummoning || selectedCores.length < costToPay) return gameState;

    const currentPlayer = gameState[playerKey];

    for (const coreInfo of selectedCores) {
        let sourceArray;
        if (coreInfo.from === 'reserve') {
            sourceArray = currentPlayer.reserve;
        } else {
            const sourceCard = currentPlayer.field.find(s => s.uid === coreInfo.spiritUid);
            sourceArray = sourceCard ? sourceCard.cores : undefined;
        }
        if (sourceArray) {
            const coreIndex = sourceArray.findIndex(c => c.id === coreInfo.coreId);
            if (coreIndex > -1) {
                const [paidCore] = sourceArray.splice(coreIndex, 1);
                currentPlayer.costTrash.push(paidCore);
            }
        }
    }

    gameState = cleanupField(gameState);

    const cardIndex = currentPlayer.hand.findIndex(c => c.uid === cardToSummon.uid);
    const [summonedCard] = currentPlayer.hand.splice(cardIndex, 1);
    summonedCard.isExhausted = false;
    summonedCard.cores = [];
    summonedCard.tempBuffs = [];
    currentPlayer.field.push(summonedCard);

    gameState.summoningState = { isSummoning: false, cardToSummon: null, costToPay: 0, selectedCores: [] };
    gameState.placementState = { isPlacing: true, targetSpiritUid: summonedCard.uid };
    
    return gameState;
}

function confirmPlacement(gameState, playerKey) {
    if (!gameState.placementState.isPlacing) return gameState;
    
    const currentPlayer = gameState[playerKey];
    const targetCard = currentPlayer.field.find(c => c.uid === gameState.placementState.targetSpiritUid);

    if (targetCard && targetCard.type === 'Spirit' && targetCard.cores.length === 0) {
        return gameState; // Prevent confirming placement if Spirit has no cores
    }

    // TODO: Resolve 'whenSummoned' effects
    gameState = resolveTriggeredEffects(gameState, targetCard, 'whenSummoned', playerKey);
    
    gameState.placementState = { isPlacing: false, targetSpiritUid: null };
    return cleanupField(gameState);
}

module.exports = {
    initiateSummon,
    selectCoreForPayment,
    cancelSummon,
    confirmSummon,
    confirmPlacement
};