// แก้ไขไฟล์ game_logic/effects.js ทั้งหมดตามนี้

const { getSpiritLevelAndBP, getCardLevel, isImmune } = require('./utils.js');
const { applyCrush, applyClash, applyPowerUp, applyDiscard, applyDrawAndDiscard, applyAuraPowerUp } = require('./effectHandlers.js');
const { applyWindstorm, applyGainCoreByWindstorm, applyMoveToDeckBottom} = require('./effectHandlers.js');
const {returnToHand} = require('./card.js')


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
        case 'deal_life_damage_with_cost':
            // ตรวจสอบว่าผู้เล่นมี core พอจ่ายหรือไม่
            if (gameState[ownerKey].reserve.length >= effect.cost.count) {
                console.log(`[EFFECTS] Awaiting cost confirmation for ${card.name}'s life damage effect.`);
                // เข้าสู่สถานะรอการยืนยันจ่ายค่าร่าย
                gameState.effectCostConfirmationState = {
                    isActive: true,
                    playerKey: ownerKey,
                    effect: effect,
                    cardSourceUid: card.uid
                };
            } else {
                console.log(`[EFFECTS] Cannot activate ${card.name}'s effect, not enough core in reserve to pay the cost.`);
            }
            break;
        case 'refresh_with_cost':
            // ตรวจสอบว่าผู้เล่นมี core พอจ่ายหรือไม่
            if (gameState[ownerKey].reserve.length >= effect.cost.count) {
                console.log(`[EFFECTS] Awaiting cost confirmation for ${card.name}'s refresh effect.`);
                // เข้าสู่สถานะรอการยืนยันจ่ายค่าร่าย
                gameState.effectCostConfirmationState = {
                    isActive: true,
                    playerKey: ownerKey,
                    effect: effect,
                    cardSourceUid: card.uid
                };
            } else {
                console.log(`[EFFECTS] Cannot activate ${card.name}'s refresh effect, not enough core in reserve.`);
            }
            break;
        case 'place_core_on_target' || 'cores_charge' || 'boost_bp_by_exhausting_ally':
            console.log(`[EFFECTS] ${card.name} triggers 'place_core_on_target'. Entering targeting state.`);
            gameState.targetingState = {
                isTargeting: true,
                forEffect: effect,
                cardSourceUid: card.uid,
                targetPlayer: ownerKey, // ผู้เล่นที่ร่ายเป็นคนเลือกเป้าหมาย
                selectedTargets: []
            };
            break;
        case 'deal_life_damage':
            const damage = effect.damage || 0;
            const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1'
            if (damage > 0) {
                console.log(`[EFFECTS] ${card.name}'s effect deals ${damage} additional damage to ${opponentKey}'s life.`);
                for (let i = 0; i < damage; i++) {
                    if (gameState[opponentKey].life > 0) {
                        gameState[opponentKey].life--;
                        gameState[opponentKey].reserve.push({ id: `core-from-effect-${card.name}-${Date.now()}-${i}` });
                    }
                }
                // ตรวจสอบเกมโอเวอร์หลังจากลด life
                const { checkGameOver } = require('./gameLoop.js');
                gameState = checkGameOver(gameState);
            }
            break;
        case 'mass_return_to_hand_by_bp':
            console.log(`[EFFECTS] ${card.name} activates mass return to hand.`);
            const bpThreshold = effect.bpOrLess;
            const players = ['player1', 'player2'];

            players.forEach(pKey => {
                // สร้างสำเนาของ field ก่อนวนลูป เพราะ array จะถูกแก้ไข
                const fieldCopy = [...gameState[pKey].field]; 
                fieldCopy.forEach(targetCard => {
                    if (targetCard.type === 'Spirit') {
                        const { bp } = getSpiritLevelAndBP(targetCard, pKey, gameState);
                        // ตรวจสอบ BP และเช็คว่าเป้าหมายติดเกราะป้องกันหรือไม่
                        if (bp <= bpThreshold && !isImmune(targetCard, card, pKey, gameState)) {
                            gameState = returnToHand(gameState, targetCard.uid, pKey).updatedGameState;
                        }
                    }
                });
            });
            break;
        case 'mass_return_opponent_to_hand_by_bp':
            console.log(`[EFFECTS] ${card.name} activates mass return for opponent.`);
            const bpThresholdOpponent = effect.bpOrLess;
            const opponent = ownerKey === 'player1' ? 'player2' : 'player1';

            const opponentFieldCopy = [...gameState[opponent].field];
            opponentFieldCopy.forEach(targetCard => {
                if (targetCard.type === 'Spirit') {
                    const { bp } = getSpiritLevelAndBP(targetCard, opponent, gameState);
                    if (bp <= bpThresholdOpponent && !isImmune(targetCard, card, opponent, gameState)) {
                        gameState = returnToHand(gameState, targetCard.uid, opponent).updatedGameState;
                    }
                }
            });
            break;
    }
    return gameState;
}

// แก้ไขฟังก์ชันเดิม: ให้ทำหน้าที่ตรวจสอบและเข้าสู่โหมดการเลือก
function resolveTriggeredEffects(gameState, card, timing, ownerKey, context = {}) {
    // เพิ่ม Safety Check: ถ้า card เป็น undefined ให้หยุดทำงานทันที
    if (!card || !card.effects || card.effects.length === 0) return gameState;

    const { level: cardLevel } = getCardLevel(card, ownerKey, gameState);
    const triggeredEffects = card.effects.filter(effect => {
        if (effect.timing !== timing) return false;
        if (!effect.level.includes(cardLevel)) return false;

        // **จุดที่แก้ไข:** เพิ่มการตรวจสอบ 'timing' เข้าไปในเงื่อนไข
        // โค้ดส่วนนี้จะทำงานเพื่อตรวจสอบ 'hasKeyword' ก็ต่อเมื่อเป็น timing 'onSpiritSummoned' เท่านั้น
        if (timing === 'onSpiritSummoned' && effect.condition?.hasKeyword) {
            if (!context || !context.summonedSpirit || !context.summonedSpirit.effects.some(e => e.keyword === effect.condition.hasKeyword)) {
                return false; // ไม่ตรงเงื่อนไขของ Storm Highland
            }
        }
        
        return true;
    });

    if (triggeredEffects.length === 0) {
        return gameState;
    }

    if (triggeredEffects.length === 1) {
        return applySingleEffect(gameState, card, triggeredEffects[0], ownerKey, context);
    }

    console.log(`[EFFECTS] Multiple effects triggered for ${card.name}. Awaiting player choice.`);
    gameState.effectResolutionState = {
        isActive: true,
        playerKey: ownerKey,
        cardUid: card.uid,
        timing: timing,
        effectsToResolve: triggeredEffects.map((eff, i) => ({ ...eff, uniqueId: i })),
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
    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    let costPaid = false;

    // 1. ตรวจสอบและจ่าย Cost ตาม 'from' ที่ระบุใน effect
    if (effect.cost.from === 'reserve') {
        if (player.reserve.length >= effect.cost.count) {
            for (let i = 0; i < effect.cost.count; i++) {
                const [core] = player.reserve.splice(0, 1);
                const destination = effect.cost.to || 'costTrash';
                if (destination !== 'void') {
                    player[destination].push(core);
                }
            }
            costPaid = true;
        }
    } else if (effect.cost.from === 'spiritThis') {
        const sourceCard = player.field.find(c => c.uid === cardSourceUid);
        if (sourceCard && sourceCard.cores.length >= effect.cost.count) {
            for (let i = 0; i < effect.cost.count; i++) {
                const [core] = sourceCard.cores.splice(0, 1);
                const destination = effect.cost.to || 'costTrash';
                 if (destination !== 'void') {
                    player[destination].push(core);
                }
            }
            costPaid = true;
        }
    }

    // 2. ถ้าจ่าย Cost สำเร็จ ให้ทำงานตามเอฟเฟกต์
    if (costPaid) {
        console.log(`[EFFECTS] Cost paid for ${effect.keyword}.`);

        if (effect.keyword === 'return_to_hand_with_cost') {
            gameState.targetingState = {
                isTargeting: true,
                forEffect: effect,
                cardSourceUid: cardSourceUid,
                targetPlayer: playerKey,
                selectedTargets: []
            };
        } else if (effect.keyword === 'deal_life_damage_with_cost') {
            const damage = effect.damage || 0;
            console.log(`[EFFECTS] ${cardSourceUid} deals ${damage} damage to ${opponentKey}'s life.`);
            for (let i = 0; i < damage; i++) {
                if (gameState[opponentKey].life > 0) {
                    gameState[opponentKey].life--;
                    gameState[opponentKey].reserve.push({ id: `core-from-life-${opponentKey}-${Date.now()}-${i}` });
                }
            }
            gameState = checkGameOver(gameState);
        } else if (effect.keyword === 'refresh_with_cost') {
            const sourceCard = player.field.find(c => c.uid === cardSourceUid);
            if (sourceCard) {
                sourceCard.isExhausted = false;
                console.log(`[EFFECTS] ${sourceCard.name} has been refreshed.`);
            }
        }
    } else {
        console.log(`[EFFECTS] Cost could not be paid for ${effect.keyword}.`);
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

/**
 * จัดการเมื่อผู้เล่นกดใช้ความสามารถ Flash จาก Spirit บนสนาม
 */
function activateSpiritFlashEffect(gameState, playerKey, payload) {
    const { cardUid } = payload;
    const player = gameState[playerKey];
    const sourceCard = player.field.find(c => c.uid === cardUid);

    // ตรวจสอบเงื่อนไขเบื้องต้น
    if (!sourceCard || sourceCard.isExhausted || !gameState.flashState.isActive || gameState.flashState.priority !== playerKey) {
        return gameState;
    }

    const { level } = getCardLevel(sourceCard);
    const flashEffect = sourceCard.effects.find(
        e => e.timing === 'flash' && e.level.includes(level)
    );

    if (!flashEffect) return gameState;

    // ทำงานตาม keyword ของเอฟเฟกต์
    if (flashEffect.keyword === 'flash_exhaust_self_for_bp_boost') {
        // 1. สั่งให้ Spirit ที่ใช้ความสามารถ Exhausted
        sourceCard.isExhausted = true;
        gameState = checkExhaustTriggers(gameState, sourceCard, playerKey);
        console.log(`[EFFECTS] ${sourceCard.name} exhausts itself to activate its Flash effect.`);

        // 2. คำนวณ BP ที่จะเพิ่มให้ (ตาม BP ปัจจุบันของตัวเอง)
        const { bp } = getSpiritLevelAndBP(sourceCard, playerKey, gameState);

        // 3. เข้าสู่สถานะเลือกเป้าหมาย
        gameState.targetingState = {
            isTargeting: true,
            forEffect: { ...flashEffect, power: bp }, // ส่งค่า BP ที่คำนวณได้ไปกับ forEffect
            cardSourceUid: sourceCard.uid,
            targetPlayer: playerKey,
            selectedTargets: []
        };
    }
    
    return gameState;
}

/**
 * จัดการเมื่อผู้เล่นตัดสินใจว่าจะ Negate Magic หรือไม่
 */
function confirmNegation(gameState, playerKey, payload) {
    const { decision, spiritUid } = payload;
    const negateState = gameState.negateState;

    if (!negateState.isActive || negateState.negatingPlayer !== playerKey) {
        return gameState;
    }

    const { magicCardToUse, magicCaster, magicEffectToUse } = negateState;

    if (decision === 'negate' && spiritUid) {
        // --- กรณีที่ผู้เล่นเลือกที่จะ Negate ---
        const negatingSpirit = gameState[playerKey].field.find(s => s.uid === spiritUid);
        if (negatingSpirit) {
            // 1. จ่าย Cost (Exhaust ตัวเอง)
            negatingSpirit.isExhausted = true;
            console.log(`[NEGATE] ${negatingSpirit.name} exhausts to negate ${magicCardToUse.name}.`);

            // 2. ย้าย Magic Card ที่ถูกยกเลิกไปที่ Trash ของผู้ร่าย
            const casterHand = gameState[magicCaster].hand;
            const cardIndex = casterHand.findIndex(c => c.uid === magicCardToUse.uid);
            if (cardIndex > -1) {
                const [negatedCard] = casterHand.splice(cardIndex, 1);
                gameState[magicCaster].cardTrash.push(negatedCard);
            }
        }
        // เมื่อ Negate สำเร็จ ให้เคลียร์ State และจบการทำงานทันที
        gameState.negateState = { isActive: false, negatingPlayer: null, magicCardToUse: null, negatingSpirits: [] };
        return gameState;

    } else {
        // --- กรณีที่ผู้เล่นเลือกที่จะ Pass (ไม่ Negate) ---
        console.log(`[NEGATE] ${playerKey} chose not to negate. Resolving effect for ${magicCaster}.`);
        
        // เรียกใช้ฟังก์ชันกลางเพื่อทำงานตามเอฟเฟกต์
        gameState = resolveMagicEffect(gameState, magicCaster, magicCardToUse, magicEffectToUse);
        
        // ย้าย Magic ที่ใช้แล้วไปกองทิ้ง
        const casterHand = gameState[magicCaster].hand;
        const cardIndex = casterHand.findIndex(c => c.uid === magicCardToUse.uid);
        if (cardIndex > -1) {
            const [usedCard] = casterHand.splice(cardIndex, 1);
            gameState[magicCaster].cardTrash.push(usedCard);
        }
    }
    
    // Reset negateState
    gameState.negateState = { isActive: false, negatingPlayer: null, magicCardToUse: null, negatingSpirits: [] };
    return gameState;
}
/**
 * ตรวจสอบและทำงานตาม Trigger "onFriendlySpiritExhausted"
 */
function checkExhaustTriggers(gameState, exhaustedSpirit, ownerKey) {
    if (!exhaustedSpirit) return gameState;

    // วนลูปหาการ์ดในสนามของผู้เล่นคนเดียวกัน
    gameState[ownerKey].field.forEach(cardOnField => {
        if (!cardOnField.effects) return;
        
        const { level } = getCardLevel(cardOnField);
        const triggerEffect = cardOnField.effects.find(e => 
            e.timing === 'onFriendlySpiritExhausted' && e.level.includes(level)
        );

        if (triggerEffect) {
            // ตรวจสอบเงื่อนไขของ Trigger
            const condition = triggerEffect.condition;
            const isTargetFamily = exhaustedSpirit.family?.includes(condition.family);
            const isNotSelf = condition.isNotSelf ? exhaustedSpirit.uid !== cardOnField.uid : true;

            if (isTargetFamily && isNotSelf) {
                console.log(`[TRIGGER] ${cardOnField.name}'s effect triggers due to ${exhaustedSpirit.name} exhausting.`);
                // ทำงานตามเอฟเฟกต์
                if (triggerEffect.keyword === 'refresh_self') {
                    cardOnField.isExhausted = false;
                }
            }
        }
    });
    return gameState;
}

module.exports = { 
    resolveTriggeredEffects, 
    resolveChosenEffect,
    confirmEffectCost, 
    cancelEffectCost,
    activateSpiritFlashEffect,
    confirmNegation,
    checkExhaustTriggers  
};