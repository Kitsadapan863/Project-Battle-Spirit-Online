// แก้ไขไฟล์ game_logic/effects.js ทั้งหมดตามนี้

const { getSpiritLevelAndBP, getCardLevel } = require('./utils.js');
const { applyCrush, applyClash, applyPowerUp, applyDiscard, applyDrawAndDiscard, applyAuraPowerUp } = require('./effectHandlers.js');
const { applyWindstorm, applyGainCoreByWindstorm, applyMoveToDeckBottom} = require('./effectHandlers.js');
const { returnToHand } = require('./card');

// ฟังก์ชันใหม่: ใช้สำหรับทำงานตามเอฟเฟกต์ "เดียว" ที่ถูกเลือก
function applySingleEffect(gameState, card, effect, ownerKey, context) {
    const cardLevel = getCardLevel(card).level;
    switch (effect.keyword) {
        case 'crush':
            return applyCrush(gameState, card, cardLevel, ownerKey);
        case 'clash':
            return applyClash(gameState);
        case 'power up':
            if (!effect.triggered_by) {
                return applyPowerUp(gameState, card.uid, effect.power, effect.duration);
            }
            break;
        case 'aura_power_up':
            return applyAuraPowerUp(gameState, ownerKey, effect);
        case 'discard':
            return applyDiscard(gameState, card, effect, ownerKey);
        case 'draw':
            return applyDrawAndDiscard(gameState, effect, ownerKey);
        case 'destroy_and_crush_by_cost':
            {
                const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1';
                const validTargets = gameState[opponentKey].field.filter(c =>
                    c.type === 'Spirit' && c.cost <= effect.target.costOrLess
                );
                if (validTargets.length > 0) {
                    gameState.targetingState = {
                        isTargeting: true,
                        forEffect: effect,
                        cardSourceUid: card.uid,
                        targetPlayer: ownerKey,
                        selectedTargets: []
                    };
                }
            }
            break;
        case 'assault':
            {
                const usedCount = gameState.assaultState.usedCounts[card.uid] || 0;
                const hasValidNexus = gameState[ownerKey].field.some(c => c.type === 'Nexus' && !c.isExhausted);
                if (usedCount < effect.count && hasValidNexus) {
                    gameState.assaultState.canUse = true;
                    gameState.assaultState.spiritUid = card.uid;
                }
            }
            break;
        case 'windstorm':
            return applyWindstorm(gameState, card, effect, ownerKey);
        case 'return_to_hand_with_cost':
            // ไม่ทำงานทันที แต่จะไปเปิดหน้าต่างยืนยันแทน
            if (gameState[ownerKey].reserve.length >= effect.cost.count) {
                console.log(`[EFFECTS] Awaiting cost confirmation for ${card.name}'s effect.`);
                gameState.effectCostConfirmationState = {
                    isActive: true,
                    playerKey: ownerKey,
                    effect: effect,
                    cardSourceUid: card.uid
                };
            } else {
                console.log(`[EFFECTS] Cannot activate ${card.name}'s effect, not enough core in reserve.`);
            }
            break;
                case 'gain_core_from_void':
            console.log(`[EFFECTS] ${card.name} activates, adding ${effect.quantity} core to reserve.`);
            for (let i = 0; i < effect.quantity; i++) {
                gameState[ownerKey].reserve.push({ id: `core-from-void-${Date.now()}-${i}` });
            }
            break;

        case 'refresh_all_spirits':
            console.log(`[EFFECTS] ${card.name} activates, refreshing all of ${ownerKey}'s spirits.`);
            gameState[ownerKey].field.forEach(fieldCard => {
                if (fieldCard.type === 'Spirit') {
                    fieldCard.isExhausted = false;
                }
            });
            break;
        case 'gain_core_by_windstorm_count':
             return applyGainCoreByWindstorm(gameState, ownerKey, effect, context);
        case 'move_exhausted_to_deck_bottom':
             return applyMoveToDeckBottom(gameState, ownerKey, effect, context);
    }
    return gameState;
}

// แก้ไขฟังก์ชันเดิม: ให้ทำหน้าที่ตรวจสอบและเข้าสู่โหมดการเลือก
function resolveTriggeredEffects(gameState, card, timing, ownerKey, context = {}) {
    if (!card.effects || card.effects.length === 0) return gameState;

    const { level: cardLevel } = getSpiritLevelAndBP(card, ownerKey, gameState);
    const triggeredEffects = card.effects.filter(effect => {
        if (effect.timing !== timing) return false;
        if (!effect.level.includes(cardLevel)) return false;

        // ตรวจสอบเงื่อนไขพิเศษของเอฟเฟกต์
        if (effect.condition?.hasKeyword) {
            if (!context || !context.summonedSpirit || !context.summonedSpirit.effects.some(e => e.keyword === effect.condition.hasKeyword)) {
                return false;
            }
        }
        // ---
        return true;
    });

    if (triggeredEffects.length === 0) {
        return gameState;
    }

    if (triggeredEffects.length === 1) {
        // มีเอฟเฟกต์เดียว ทำงานทันที
        return applySingleEffect(gameState, card, triggeredEffects[0], ownerKey, context);
    }

    // มีหลายเอฟเฟกต์ ให้ผู้เล่นเลือก
    console.log(`[EFFECTS] Multiple effects triggered for ${card.name}. Awaiting player choice.`);
    gameState.effectResolutionState = {
        isActive: true,
        playerKey: ownerKey,
        cardUid: card.uid,
        timing: timing,
        effectsToResolve: triggeredEffects.map((eff, i) => ({ ...eff, uniqueId: i })), // uniqueId ใช้สำหรับให้ client ส่งกลับมา
        resolvedEffects: [],
        context: context
    };
    return gameState;
}

// ฟังก์ชันใหม่: จัดการ Action เมื่อผู้เล่นเลือกเอฟเฟกต์แล้ว
function resolveChosenEffect(gameState, playerKey, payload) {
    const { enterFlashTiming } = require('./battle.js');
    const { chosenEffectId } = payload;
    const resState = gameState.effectResolutionState;

    if (!resState.isActive || resState.playerKey !== playerKey) return gameState;

    const chosenEffectIndex = resState.effectsToResolve.findIndex(e => e.uniqueId === chosenEffectId);
    if (chosenEffectIndex === -1) return gameState;

    const [chosenEffect] = resState.effectsToResolve.splice(chosenEffectIndex, 1);
    const card = gameState[playerKey].field.find(c => c.uid === resState.cardUid);
    if (!card) return gameState;

    // 1. ทำงานตามเอฟเฟกต์ที่เลือก
    gameState = applySingleEffect(gameState, card, chosenEffect, playerKey, resState.context);
    resState.resolvedEffects.push(chosenEffect);

    // 2. *** LOGIC ใหม่: ตรวจสอบว่าต้อง "หยุดพัก" หรือไม่ ***
    // ถ้าเอฟเฟกต์ที่เพิ่งเลือกไป ทำให้ต้องเปิดหน้าต่างใหม่ (เช่น เลือกเป้าหมาย หรือใช้ Assault)
    const needsToPauseResolution = gameState.targetingState.isTargeting || gameState.assaultState.canUse;

    if (needsToPauseResolution) {
        // "ปิด" หน้าต่างเลือกเอฟเฟกต์ชั่วคราว เพื่อให้หน้าต่างใหม่แสดงผลได้
        // แต่เราจะไม่ล้างข้อมูลเอฟเฟกต์ที่เหลือ (effectsToResolve) ทิ้ง
        console.log('[EFFECTS] Pausing effect resolution to handle targeting/assault.');
        resState.isActive = false; 
        return gameState; // หยุดรอให้ผู้เล่นทำ Action ในหน้าต่างใหม่
    }
    // *** สิ้นสุด LOGIC ใหม่ ***

    // 3. ถ้าไม่ต้องหยุดพัก และไม่มีเอฟเฟกต์เหลือให้เลือกแล้ว ให้จบกระบวนการ
    if (resState.effectsToResolve.length === 0) {
        console.log(`[EFFECTS] All simultaneous effects for ${card.name} resolved.`);
        gameState.effectResolutionState = { isActive: false, playerKey: null, cardUid: null, timing: null, effectsToResolve: [], resolvedEffects: [] };

        // ดำเนินเกมต่อตามปกติ
        if (resState.timing === 'whenAttacks') {
            if (!gameState.targetingState.isTargeting && !gameState.assaultState.canUse) {
                gameState = enterFlashTiming(gameState, 'beforeBlock');
            }
        }
    }
    // ถ้ายังมีเอฟเฟกต์เหลืออยู่ gameState จะถูกส่งกลับไปโดยที่ resState.isActive ยังเป็น true
    // ทำให้ Client แสดงหน้าต่างให้เลือกเอฟเฟกต์ถัดไปได้เอง

    return gameState;
}

/**
 * จัดการเมื่อผู้เล่นยืนยันการจ่ายค่าใช้จ่ายของเอฟเฟกต์
 */
function confirmEffectCost(gameState, playerKey) {
    const confirmState = gameState.effectCostConfirmationState;
    if (!confirmState.isActive || confirmState.playerKey !== playerKey) return gameState;

    const { effect, cardSourceUid } = confirmState;
    const player = gameState[playerKey];

    // 1. จ่าย Cost
    if (player.reserve.length >= effect.cost.count) {
        for (let i = 0; i < effect.cost.count; i++) {
            const [core] = player.reserve.splice(0, 1);
            player.costTrash.push(core); // หรือ costTrash ตามที่คุณต้องการ
        }
        console.log(`[EFFECTS] Cost paid for ${effect.keyword}.`);

        // 2. เข้าสู่สถานะเลือกเป้าหมาย
        gameState.targetingState = {
            isTargeting: true,
            forEffect: effect,
            cardSourceUid: cardSourceUid,
            targetPlayer: playerKey,
            selectedTargets: []
        };
    }

    // 3. Reset สถานะการยืนยัน
    gameState.effectCostConfirmationState = { isActive: false, playerKey: null, effect: null, cardSourceUid: null };
    return gameState;
}

/**
 * จัดการเมื่อผู้เล่นยกเลิกการจ่ายค่าใช้จ่าย
 */
function cancelEffectCost(gameState, playerKey) {
    const confirmState = gameState.effectCostConfirmationState;
    if (!confirmState.isActive || confirmState.playerKey !== playerKey) return gameState;

    console.log(`[EFFECTS] Player canceled cost payment.`);
    gameState.effectCostConfirmationState = { isActive: false, playerKey: null, effect: null, cardSourceUid: null };
    return gameState;
}





module.exports = { 
    resolveTriggeredEffects, 
    resolveChosenEffect,
    confirmEffectCost, // Export ฟังก์ชันใหม่
    cancelEffectCost   // Export ฟังก์ชันใหม่
};