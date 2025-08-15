// แก้ไขไฟล์ game_logic/effects.js ทั้งหมดตามนี้

const { getSpiritLevelAndBP, getCardLevel } = require('./utils.js');
const { applyCrush, applyClash, applyPowerUp, applyDiscard, applyDrawAndDiscard, applyAuraPowerUp } = require('./effectHandlers.js');
const { applyWindstorm } = require('./effectHandlers.js');

// ฟังก์ชันใหม่: ใช้สำหรับทำงานตามเอฟเฟกต์ "เดียว" ที่ถูกเลือก
function applySingleEffect(gameState, card, effect, ownerKey) {
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
    }
    return gameState;
}

// แก้ไขฟังก์ชันเดิม: ให้ทำหน้าที่ตรวจสอบและเข้าสู่โหมดการเลือก
function resolveTriggeredEffects(gameState, card, timing, ownerKey) {
    if (!card.effects || card.effects.length === 0) return gameState;

    const { level: cardLevel } = getSpiritLevelAndBP(card, ownerKey, gameState);
    const triggeredEffects = card.effects.filter(effect =>
        effect.timing === timing && effect.level.includes(cardLevel)
    );

    if (triggeredEffects.length === 0) {
        return gameState;
    }

    if (triggeredEffects.length === 1) {
        // มีเอฟเฟกต์เดียว ทำงานทันที
        return applySingleEffect(gameState, card, triggeredEffects[0], ownerKey);
    }

    // มีหลายเอฟเฟกต์ ให้ผู้เล่นเลือก
    console.log(`[EFFECTS] Multiple effects triggered for ${card.name}. Awaiting player choice.`);
    gameState.effectResolutionState = {
        isActive: true,
        playerKey: ownerKey,
        cardUid: card.uid,
        timing: timing,
        effectsToResolve: triggeredEffects.map((eff, i) => ({ ...eff, uniqueId: i })), // uniqueId ใช้สำหรับให้ client ส่งกลับมา
        resolvedEffects: []
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
    gameState = applySingleEffect(gameState, card, chosenEffect, playerKey);
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

module.exports = { resolveTriggeredEffects, resolveChosenEffect };