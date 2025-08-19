// game_logic/summon.js
const { calculateCost } = require('./utils.js');
const { cleanupField } = require('./card.js');
const { resolveTriggeredEffects } = require('./effects.js');

function initiateSummon(gameState, playerKey, payload) {
    const { cardUid, summonType = 'normal' } = payload;
    const currentPlayer = gameState[playerKey];
    const cardToSummon = currentPlayer.hand.find(c => c.uid === cardUid);

    console.log(`[SUMMON DEBUG] Attempting to initiate summon for card UID: ${cardUid}`);
    console.log(`[SUMMON DEBUG] Player ${playerKey}'s hand on server contains ${currentPlayer.hand.length} cards:`);
    // แสดง UID ของการ์ดทุกใบบนมือ
    currentPlayer.hand.forEach(card => console.log(`- Card: ${card.name}, UID: ${card.uid}`));

    const tributeEffect = cardToSummon.effects.find(e => e.keyword === 'tribute');
    if (tributeEffect) {
        // ตรวจสอบว่ามี Spirit ที่สามารถใช้เป็น Tribute ได้ในสนามหรือไม่
        const hasValidTribute = currentPlayer.field.some(s => 
            s.type === 'Spirit' && s.cost >= tributeEffect.condition.costOrMore
        );

        if (!hasValidTribute) {
            console.log(`[SUMMON DEBUG] Action rejected: No valid Spirit for Tribute.`);
            return gameState; // อัญเชิญไม่ได้ถ้าไม่มีตัว Tribute
        }
    }

    if (gameState.summoningState.isSummoning) {
        console.log('[SUMMON DEBUG] Action rejected: A summon is already in progress.');
        return gameState;
    }

    
    if (!cardToSummon) {
        console.error(`[SUMMON DEBUG] CRITICAL ERROR: Card with UID ${cardUid} NOT FOUND in player's hand on the server.`);
        return gameState; // หยุดทำงานถ้าหาการ์ดไม่เจอ
    }

    console.log(`[SUMMON DEBUG] Card ${cardToSummon.name} found on server.`);

    const finalCost = calculateCost(cardToSummon, playerKey, gameState);
    let totalAvailableCores;
    if (summonType === 'high_speed') {
        // ถ้าเป็น High Speed นับ Core จาก Reserve เท่านั้น
        totalAvailableCores = currentPlayer.reserve.length;
    } else {
        // แบบปกติ นับ Core ทั้งหมด
        // totalAvailableCores = currentPlayer.reserve.length + currentPlayer.field.reduce((sum, card) => sum + (card.cores ? card.cores.length : 0), 0);
        totalAvailableCores = currentPlayer.field.reduce((sum, card) => sum + (card.cores ? card.cores.length : 0), 0) + currentPlayer.reserve.length;
    }
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
        selectedCores: [],
        summonType: summonType,
        summoningPlayer: playerKey
    };
    return gameState;
}

function selectCoreForPayment(gameState, playerKey, payload) {
    const { coreId, from, spiritUid } = payload;
    let paymentState;
    let isSummonPayment = false;

    if (gameState.summoningState.isSummoning) {
        paymentState = gameState.summoningState;
        isSummonPayment = true;
    } else if (gameState.magicPaymentState.isPaying) {
        paymentState = gameState.magicPaymentState;
    } else {
        return gameState;
    }

    // **จุดที่แก้ไข:** เพิ่ม Logic การตรวจสอบ Tribute ที่ซับซ้อนและแม่นยำขึ้น
    const { selectedCores, costToPay, cardToSummon } = paymentState;
    const tributeEffect = cardToSummon?.effects.find(e => e.keyword === 'tribute');
    if (tributeEffect && from === 'card') {
            const allValidTributeTargets = gameState[playerKey].field.filter(s =>
                s.type === 'Spirit' && s.cost >= tributeEffect.condition.costOrMore
            );

            const coreIsAlreadySelected = selectedCores.some(c => c.coreId === coreId);
            
            if (!coreIsAlreadySelected) {
                const spiritBeingClicked = gameState[playerKey].field.find(s => s.uid === spiritUid);

                if (spiritBeingClicked && allValidTributeTargets.some(t => t.uid === spiritUid)) {
                    
                    // 1. หาจำนวน Core ที่ LV1 ต้องการ
                    const coresNeededForLv1 = spiritBeingClicked.level['level-1']?.core || 1;
                    const coresOnSpirit = spiritBeingClicked.cores.length;
                    const coresAlreadySelected = selectedCores.filter(c => c.spiritUid === spiritUid).length;

                    // 2. ตรวจสอบว่าถ้าดึง Core นี้ออกไปแล้วจะทำให้เลเวลต่ำกว่า 1 หรือไม่
                    if ((coresOnSpirit - (coresAlreadySelected + 1)) < coresNeededForLv1) {
                        
                        // หาจำนวน Spirit ที่ "ปลอดภัย"
                        let safeTargets = 0;
                        allValidTributeTargets.forEach(target => {
                            if (target.uid === spiritUid) return;

                            const coresNeeded = target.level['level-1']?.core || 1;
                            const coresSelectedFromTarget = selectedCores.filter(c => c.spiritUid === target.uid).length;
                            
                            if (target.cores.length - coresSelectedFromTarget >= coresNeeded) {
                                safeTargets++;
                            }
                        });

                        if (safeTargets === 0) {
                            console.log(`[TRIBUTE VALIDATION] Rejected: This action would destroy the only available Tribute target.`);
                            return gameState;
                        }
                    }
                }
            }
        }


    const designatedPayer = paymentState.summoningPlayer || paymentState.payingPlayer;
    if (designatedPayer !== playerKey) {
        return gameState;
    }

    if (paymentState.summonType === 'high_speed') {
        if (from !== 'reserve') {
            return gameState;
        }
    }
    
    // Core selection/deselection logic

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
    const { isSummoning, cardToSummon, costToPay, selectedCores, summoningPlayer  } = gameState.summoningState;
    if (!isSummoning || summoningPlayer !== playerKey || selectedCores.length < costToPay) return gameState;

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

    const tributeEffect = cardToSummon.effects.find(e => e.keyword === 'tribute');
    if (tributeEffect) {
        // **จุดที่แก้ไข 3:** ไม่ต้องเก็บ paidCores แล้ว เพราะเราจัดการไปแล้ว
        gameState.tributeState = {
            isTributing: true,
            summoningPlayer: playerKey,
            cardToSummon: cardToSummon,
            selectedTributeUid: null
        };
        gameState.summoningState = { isSummoning: false, cardToSummon: null, costToPay: 0, selectedCores: [] };
        return gameState;
    }

    const cardIndex = currentPlayer.hand.findIndex(c => c.uid === cardToSummon.uid);
    const [summonedCard] = currentPlayer.hand.splice(cardIndex, 1);
    summonedCard.isExhausted = false;
    summonedCard.cores = [];
    summonedCard.tempBuffs = [];
    currentPlayer.field.push(summonedCard);

    gameState.summoningState = { isSummoning: false, cardToSummon: null, costToPay: 0, selectedCores: [] };
    gameState.placementState = { isPlacing: true, targetSpiritUid: summonedCard.uid, placingPlayer: playerKey };
    
    return gameState;
}

function confirmPlacement(gameState, playerKey) {
    
    if (!gameState.placementState.isPlacing || playerKey !== gameState.placementState.placingPlayer) {
        return gameState;
    }
    const currentPlayer = gameState[playerKey];
    const targetCard = currentPlayer.field.find(c => c.uid === gameState.placementState.targetSpiritUid);

    if (targetCard && targetCard.type === 'Spirit' && targetCard.cores.length === 0) {
        return gameState; // Prevent confirming placement if Spirit has no cores
    }

    // TODO: Resolve 'whenSummoned' effects
    gameState = resolveTriggeredEffects(gameState, targetCard, 'whenSummoned', playerKey);

    // 2. ตรวจสอบเอฟเฟกต์ 'onSpiritSummoned' (เอฟเฟกต์จาก Nexus ที่ส่งผลต่อการ์ดที่เพิ่งลงมา)
    console.log(`[GAME LOG] Checking for 'onSpiritSummoned' effects.`);
    const playerField = [...currentPlayer.field];
    playerField.forEach(cardOnField => {
        // ส่ง targetCard (Spirit ที่เพิ่งถูกอัญเชิญ) ไปเป็นข้อมูล context ให้ effect handler
        gameState = resolveTriggeredEffects(gameState, cardOnField, 'onSpiritSummoned', playerKey, { summonedSpirit: targetCard });
    });
    
    gameState.placementState = { isPlacing: false, targetSpiritUid: null, placingPlayer: null  };

    if (gameState.flashState.isActive) {
        const otherPlayer = (playerKey === 'player1') ? 'player2' : 'player1';
        gameState.flashState.priority = otherPlayer;
        gameState.flashState.hasPassed[playerKey] = false;
        console.log(`[FLASH LOG] Summon by ${playerKey} completed. Priority passed to ${otherPlayer}.`);
    }

    return cleanupField(gameState);
}

function selectCoreForPlacement(gameState, playerKey, payload) {
    const { coreId, from, sourceCardUid } = payload;
    const placementState = gameState.placementState;

    if (!placementState.isPlacing) return gameState;

    const player = gameState[playerKey];
    const targetCard = player.field.find(c => c.uid === placementState.targetSpiritUid);
    if (!targetCard) return gameState;

    let sourceArray;
    let coreToMove;

    // หา Core ต้นทาง
    if (from === 'reserve') {
        sourceArray = player.reserve;
    } else { // from === 'card'
        const sourceCard = player.field.find(c => c.uid === sourceCardUid);
        if (!sourceCard || sourceCard.uid === targetCard.uid) return gameState; // ป้องกันการย้ายจากตัวเอง
        sourceArray = sourceCard.cores;
    }

    const coreIndex = sourceArray.findIndex(c => c.id === coreId);
    if (coreIndex > -1) {
        // ย้าย Core จากต้นทางไปยังเป้าหมาย
        [coreToMove] = sourceArray.splice(coreIndex, 1);
        targetCard.cores.push(coreToMove);
    }
    
    return gameState;
}

/**
 * ผู้เล่นเลือก Spirit ที่จะใช้เป็น Tribute
 */
function selectTribute(gameState, playerKey, payload) {
    const { tributeUid } = payload;
    const tributeState = gameState.tributeState;
    if (!tributeState.isTributing || tributeState.summoningPlayer !== playerKey) return gameState;

    tributeState.selectedTributeUid = tributeUid;
    return gameState;
}


/**
 * ยืนยันการอัญเชิญแบบ Tribute
 */
function confirmTribute(gameState, playerKey) {
    const tributeState = gameState.tributeState;
    if (!tributeState.isTributing || tributeState.summoningPlayer !== playerKey || !tributeState.selectedTributeUid) return gameState;

    const { cardToSummon, selectedTributeUid } = tributeState;
    const currentPlayer = gameState[playerKey];
    
    // --- START: MODIFIED SECTION ---

    // 1. หาข้อมูลเอฟเฟกต์ Tribute จากการ์ดที่กำลังจะอัญเชิญ
    const tributeEffect = cardToSummon.effects.find(e => e.keyword === 'tribute');
    if (!tributeEffect) {
        console.error(`[TRIBUTE ERROR] Tribute effect not found on ${cardToSummon.name}`);
        gameState.tributeState = { isTributing: false };
        return gameState;
    }

    // 2. หา Spirit ที่จะถูก Tribute
    const tributeCardIndex = currentPlayer.field.findIndex(c => c.uid === selectedTributeUid);
    if (tributeCardIndex === -1) {
        gameState.tributeState = { isTributing: false };
        return gameState;
    }
    const [tributeCard] = currentPlayer.field.splice(tributeCardIndex, 1);
    
    // 3. ย้าย Core ของ Tribute ไปยังตำแหน่งที่ 'destination' ระบุไว้
    if (tributeCard.cores.length > 0) {
        const destinationZone = tributeEffect.destination || 'costTrash'; // ถ้าไม่ได้ระบุ ให้ไป costTrash เป็นค่าเริ่มต้น
        
        if (gameState[playerKey][destinationZone]) {
            gameState[playerKey][destinationZone].push(...tributeCard.cores);
            tributeCard.cores = [];
            console.log(`[TRIBUTE LOG] Moved ${tributeCard.cores.length} cores from ${tributeCard.name} to ${destinationZone}.`);
        } else {
            console.error(`[TRIBUTE ERROR] Destination zone "${destinationZone}" not found for player ${playerKey}.`);
            // คืน Core ไปที่ reserve เพื่อป้องกันการหาย
            // currentPlayer.reserve.push(...tributeCard.cores);
        }
    }
    
    // 4. ย้ายการ์ด Tribute ไปยัง cardTrash
    currentPlayer.cardTrash.push(tributeCard);
    console.log(`[SUMMON LOG] Tributed ${tributeCard.name}.`);
    
    // --- END: MODIFIED SECTION ---

    // 5. อัญเชิญ Spirit ใบใหม่ลงสนาม
    const cardIndex = currentPlayer.hand.findIndex(c => c.uid === cardToSummon.uid);
    const [summonedCard] = currentPlayer.hand.splice(cardIndex, 1);
    currentPlayer.field.push(summonedCard);
    
    // 6. Reset State และเข้าสู่ Placement
    gameState.tributeState = { isTributing: false };
    gameState.placementState = { isPlacing: true, targetSpiritUid: summonedCard.uid, placingPlayer: playerKey };

    return gameState;
}


module.exports = {
    initiateSummon,
    selectCoreForPayment,
    selectCoreForPlacement,
    cancelSummon,
    confirmSummon,
    confirmPlacement,
    selectTribute,
    confirmTribute
};