// game_logic/evolution.js

/**
 * เริ่มกระบวนการ Evolution (Awaken)
 */
function initiateEvolution(gameState, playerKey, payload) {
    const { spiritUid } = payload;
    const player = gameState[playerKey];
    const spirit = player.field.find(s => s.uid === spiritUid);

    // ตรวจสอบเงื่อนไขเบื้องต้น
    if (!spirit || gameState.evolutionState.isActive) {
        return gameState;
    }

    console.log(`[EVOLUTION] ${playerKey} initiates Evolution for ${spirit.name}`);
    gameState.evolutionState = {
        isActive: true,
        spiritUid: spiritUid,
        selectedCores: []
    };

    return gameState;
}

/**
 * เลือก/ยกเลิกการเลือก Core ที่จะย้ายมา
 */
function selectCoreForEvolution(gameState, playerKey, payload) {
    const { coreId, fromUid } = payload;
    const evolutionState = gameState.evolutionState;

    if (!evolutionState.isActive) return gameState;

    const coreInfo = { coreId, fromUid };
    const existingIndex = evolutionState.selectedCores.findIndex(c => c.coreId === coreId);

    if (existingIndex > -1) {
        // ถ้าเลือกซ้ำ ให้ยกเลิกการเลือก
        evolutionState.selectedCores.splice(existingIndex, 1);
    } else {
        // เพิ่ม Core ที่เลือกเข้าไป
        evolutionState.selectedCores.push(coreInfo);
    }

    return gameState;
}

/**
 * ยืนยันการย้าย Core ทั้งหมด
 */
function confirmEvolution(gameState, playerKey) {
    const { isActive, spiritUid, selectedCores } = gameState.evolutionState;
    if (!isActive || selectedCores.length === 0) return gameState;

    const player = gameState[playerKey];
    const targetSpirit = player.field.find(s => s.uid === spiritUid);

    if (targetSpirit) {
        selectedCores.forEach(coreInfo => {
            const sourceSpirit = player.field.find(s => s.uid === coreInfo.fromUid);
            if (sourceSpirit) {
                const coreIndex = sourceSpirit.cores.findIndex(c => c.id === coreInfo.coreId);
                if (coreIndex > -1) {
                    const [movedCore] = sourceSpirit.cores.splice(coreIndex, 1);
                    targetSpirit.cores.push(movedCore);
                }
            }
        });
        console.log(`[EVOLUTION] Moved ${selectedCores.length} cores to ${targetSpirit.name}.`);
    }

    // หลังจากใช้ Evolution เสร็จแล้ว ให้สลับ Priority ในช่วง Flash Timing
    if (gameState.flashState.isActive) {
        const otherPlayer = playerKey === 'player1' ? 'player2' : 'player1';
        gameState.flashState.priority = otherPlayer;
        
        // รีเซ็ตสถานะ "Pass" ของผู้เล่นที่เพิ่งใช้การ์ดไป
        gameState.flashState.hasPassed[playerKey] = false;

        console.log(`[SERVER LOG] Evolution used. Flash priority passed to ${otherPlayer}`);
    }

    // Reset state
    gameState.evolutionState = { isActive: false, spiritUid: null, selectedCores: [] };
    return gameState;
}

/**
 * ยกเลิกกระบวนการ Evolution
 */
function cancelEvolution(gameState, playerKey) {
    gameState.evolutionState = { isActive: false, spiritUid: null, selectedCores: [] };
    console.log(`[EVOLUTION] ${playerKey} canceled Evolution.`);
    return gameState;
}


module.exports = {
    initiateEvolution,
    selectCoreForEvolution,
    confirmEvolution,
    cancelEvolution
};