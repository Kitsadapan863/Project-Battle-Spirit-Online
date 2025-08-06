// game_logic/core.js
// This file will handle core game actions that might not fit elsewhere,
// like complex core movements or confirmations.

function confirmCoreRemoval(gameState, playerKey) {
    const { isConfirming, coreId, sourceUid, target } = gameState.coreRemovalConfirmationState;
    if (!isConfirming) return gameState;

    const sourceCard = gameState[playerKey].field.find(s => s.uid === sourceUid);
    const sourceArray = sourceCard ? sourceCard.cores : undefined;

    if (sourceArray) {
        const coreIndex = sourceArray.findIndex(c => c.id === coreId);
        if (coreIndex > -1) {
            const [movedCore] = sourceArray.splice(coreIndex, 1);

            if (target && target.targetCardUid) {
                const destCard = gameState[playerKey].field.find(c => c.uid === target.targetCardUid);
                if (destCard) destCard.cores.push(movedCore);
            } else if (target && target.targetZoneId && target.targetZoneId.includes('player-reserve-zone')) {
                gameState[playerKey].reserve.push(movedCore);
            }
            
            // cleanupField will be called after this action in the action handler
        }
    }

    gameState.coreRemovalConfirmationState = { isConfirming: false, coreId: null, from: null, sourceUid: null, target: null };
    return gameState;
}

function cancelCoreRemoval(gameState, playerKey) {
    gameState.coreRemovalConfirmationState = { isConfirming: false, coreId: null, from: null, sourceUid: null, target: null };
    return gameState;
}

function moveCore(gameState, playerKey, payload) {
    const { coreId, from, sourceCardUid, targetCardUid } = payload;
    const player = gameState[playerKey];
    let coreToMove;
    let sourceArray;
    let sourceCard = null;

    if (from === 'card') {
        sourceCard = player.field.find(c => c.uid === sourceCardUid);
        if (!sourceCard) return gameState;
        sourceArray = sourceCard.cores;
    } else {
        sourceArray = player.reserve;
    }

    const coreIndex = sourceArray.findIndex(c => c.id === coreId);
    if (coreIndex === -1) return gameState;

    // ตรวจสอบว่า 1. เป็น Spirit, 2. มีข้อมูล Level 1, 3. จำนวน Core ปัจจุบันเท่ากับที่ Level 1 ต้องการพอดี
    if (sourceCard && sourceCard.type === 'Spirit' && sourceCard.level['level-1'] && sourceArray.length === sourceCard.level['level-1'].core) {
        gameState.coreRemovalConfirmationState = { 
            isConfirming: true, 
            coreId: coreId, 
            from: from, 
            sourceUid: sourceCardUid,
            target: {
                targetCardUid: targetCardUid,
                // เพิ่ม targetZoneId สำหรับกรณีที่ย้ายไป Reserve
                targetZoneId: targetCardUid ? null : 'player-reserve-zone' 
            }
        };
        return gameState; // Wait for confirmation
    }

    [coreToMove] = sourceArray.splice(coreIndex, 1);

    if (targetCardUid) {
        const destCard = player.field.find(c => c.uid === targetCardUid);
        if (destCard) {
            destCard.cores.push(coreToMove);
        } else {
            sourceArray.push(coreToMove); // Return core if target not found
        }
    } else { // Assuming move to reserve
        player.reserve.push(coreToMove);
    }
    
    // cleanupField will be called after this
    return gameState;
}


module.exports = {
    confirmCoreRemoval,
    cancelCoreRemoval,
    moveCore
};