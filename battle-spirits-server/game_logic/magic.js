// game_logic/magic.js
const { calculateCost, getSpiritLevelAndBP, getCardLevel } = require('./utils.js');
const { drawCard, initiateDeckDiscard, initiateDiscard, moveUsedMagicToTrash, destroyCard, applyPowerUpEffect, cleanupField } = require('./card.js');
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
    let effectToUse = null;

    // ถ้าเป็น Main Step และการ์ดมีทั้ง Main และ Flash effect
    if (timing === 'main') {
        // กรณีที่ 1: การ์ดมีทั้ง Main และ Flash -> ให้ผู้เล่นเลือก
        if (mainEffect && flashEffect) {
            console.log(`[MAGIC LOG] Card ${cardToUse.name} has multiple effects. Awaiting player choice.`);
            gameState.effectChoiceState = { isChoosing: true, card: cardToUse };
            return gameState; // หยุดและรอให้ผู้เล่นเลือก
        }
        // กรณีที่ 2: ถ้าไม่ใช่กรณีที่ต้องเลือก ให้ใช้ Main ก่อน ถ้าไม่มีก็ใช้ Flash
        effectToUse = mainEffect || flashEffect; 
    } else { // timing === 'flash'
        // กรณีที่ 3: ใน Flash Timing ใช้ได้แค่ Flash เท่านั้น
        effectToUse = flashEffect;
    }
    
    // ถ้าหาเอฟเฟกต์ที่ใช้งานได้ไม่เจอ ให้หยุดทำงาน
    if (!effectToUse) {
        console.log(`[MAGIC LOG] No valid effect found for ${cardToUse.name} at timing: ${timing}`);
        return gameState;
    }
    
    const finalCost = calculateCost(cardToUse, playerKey, gameState);
    // ... (check if enough cores) ...

    gameState.magicPaymentState = {
        isPaying: true,
        payingPlayer: playerKey,
        cardToUse: cardToUse,
        costToPay: finalCost,
        selectedCores: [],
        timing: timing, // ใช้ timing ที่ส่งมา
        effectToUse: effectToUse // ใช้เอฟเฟกต์ที่หาเจอ
    };

    console.log(`[SERVER LOG] Initiating magic payment for ${playerKey} to use ${cardToUse.name}`);
    return gameState;
}

function confirmMagicPayment(gameState, playerKey) {
    const { isPaying, cardToUse, costToPay, selectedCores, timing, effectToUse } = gameState.magicPaymentState;
    if (!isPaying || selectedCores.length < costToPay) return gameState;

    const currentPlayer = gameState[playerKey];
    const opponentPlayerKey = playerKey === 'player1' ? 'player2' : 'player1';

    // (Logic การย้าย Core ของคุณถูกต้องแล้ว)
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
    
    gameState.magicPaymentState = { isPaying: false, cardToUse: null, costToPay: 0, selectedCores: [], timing: null, effectToUse: null };
    
    // Apply the magic effect
    switch (effectToUse.keyword) {
        case 'draw':
            const quantity = effectToUse.quantity || 0;
            for (let i = 0; i < quantity; i++) {
                gameState = drawCard(gameState, playerKey);
            }

            if (effectToUse.succeed === 'show') {
                // สำหรับ Extra Draw: เข้าสู่สถานะเปิดดูการ์ด
                if (currentPlayer.deck.length > 0) {
                    const revealedCard = currentPlayer.deck.shift();
                    console.log(`[EFFECT LOG] Extra Draw reveals: ${revealedCard.name}`);
                    gameState.revealState = {
                        isActive: true,
                        card: revealedCard,
                        condition: { type: effectToUse.type, color: effectToUse.color }
                    };
                }
            } else if (effectToUse.discard > 0) {
                // สำหรับ Strong Draw: เข้าสู่สถานะทิ้งการ์ด
                gameState.discardState = { isDiscarding: true, count: effectToUse.discard, cardsToDiscard: [], playerKey: playerKey };
            }
            break;
        case 'discard':
            if (effectToUse.quantity) {
                // --- START: แก้ไขการเรียกใช้ ---
                const { updatedGameState } = initiateDeckDiscard(gameState, opponentPlayerKey, effectToUse.quantity);
                gameState = updatedGameState;
                // --- END ---
            }
            break;
        case 'destroy':
        case 'destroy_combo':
            console.log(`[EFFECT LOG] Entering targeting state for effect: ${effectToUse.description}`);
            // เข้าสู่สถานะเลือกเป้าหมาย
            gameState.targetingState = { 
                isTargeting: true, 
                forEffect: effectToUse, 
                cardSourceUid: cardToUse.uid,
                targetPlayer: playerKey,
                selectedTargets: [] // เพิ่ม Array สำหรับเก็บเป้าหมายที่เลือก
            };
            break;
        case 'power up':
            // เราจะใช้ gameState.targetingState ที่มีอยู่แล้ว
            console.log(`[EFFECT LOG] Entering targeting state for effect: ${effectToUse.description}`);
            gameState.targetingState = { 
                isTargeting: true, 
                forEffect: effectToUse, 
                cardSourceUid: cardToUse.uid, // ส่งข้อมูลการ์ดต้นทางไปด้วย
                targetPlayer: playerKey,
                selectedTargets: []
            };
            break;
        case 'core charge':
            console.log(`[EFFECT LOG] Applying turn-long buff: ${effectToUse.buff_type}`);
            currentPlayer.tempBuffs.push({
                type: effectToUse.buff_type, // 'core_on_crush_attack'
                sourceCardName: cardToUse.name
            });
            break;
        case 'deploy_from_trash':
                const nexusesToDeploy = [];
                const newCardTrash  = [];

                // ค้นหา Nexus สีที่ถูกต้องในกองทิ้ง
                // 1. วนลูปใน Card Trash ของผู้เล่นปัจจุบัน (currentPlayer)
                currentPlayer.cardTrash.forEach(card => {
                    if (card.type === 'Nexus' && effectToUse.targetColors.includes(card.color)) {
                        // Reset ค่าเริ่มต้นของ Nexus ก่อนนำลงสนาม
                        card.cores = [];
                        card.isExhausted = false;
                        nexusesToDeploy.push(card);
                    } else {
                        newCardTrash .push(card);
                    }
                });

                if (nexusesToDeploy.length > 0) {
                    console.log(`[Construction Effect] Deploying ${nexusesToDeploy.length} Nexuses from Trash.`);
                    // นำ Nexus ที่พบไปวางบนสนาม
                    currentPlayer.field.push(...nexusesToDeploy);
                    // อัปเดตกองทิ้งโดยลบ Nexus ที่นำไปวางบนสนามออก
                    currentPlayer.cardTrash = newCardTrash ;
                }

                break;
        case 'change cost':
        console.log(`[EFFECT LOG] Applying turn-long buff: Cost Change for ${playerKey}`);
        currentPlayer.tempBuffs.push({
            type: 'AURA_COST_CHANGE',
            duration: 'turn',
            targetFamily: effectToUse.condition, // ["Astral Dragon"]
            newValue: currentPlayer.life // ค่าร่ายใหม่คือ Life ของผู้เล่น
        });
        break;
        case 'conditional_aura_power_up':
        console.log(`[EFFECT LOG] Applying turn-long buff: Conditional Power Up for ${playerKey}`);
        currentPlayer.tempBuffs.push({
            type: 'AURA_CONDITIONAL_BP',
            duration: 'turn',
            buffs: effectToUse.buffs, // [{ condition: { hasKeyword: 'clash' }, power: 3000 }, ...]
            sourceCardName: cardToUse.name
        });
        break;
        case 'addEffects':
            
            let validTargets = [];
            validTargets = gameState[playerKey].field.filter(card => card.name.includes('wurm'));
            console.log(`[EFFECT LOG] Entering targeting state for effect: ${effectToUse.description}`);
            // เข้าสู่สถานะเลือกเป้าหมาย
            if (validTargets.length > 0) {
                gameState.targetingState = {
                isTargeting: true,
                forEffect: effectToUse, 
                cardSourceUid: cardToUse.uid,
                targetPlayer: playerKey, // คนที่เลือกเป้าหมายคือคนที่ร่าย
                selectedTargets: []
            };
            }

            break;
    }

    // หลังจากใช้ Magic เสร็จแล้ว ให้สลับ Priority ในช่วง Flash Timing
    // if (gameState.flashState.isActive) {
    //     const otherPlayer = playerKey === 'player1' ? 'player2' : 'player1';
    //     gameState.flashState.priority = otherPlayer;
        
    //     // รีเซ็ตสถานะ "Pass" ของผู้เล่นที่เพิ่งใช้การ์ดไป
    //     gameState.flashState.hasPassed[playerKey] = false;

    //     console.log(`[SERVER LOG] Magic used. Flash priority passed to ${otherPlayer}`);
    // }

    // Move used magic card to trash
    const cardIndex = currentPlayer.hand.findIndex(c => c.uid === cardToUse.uid);
    if (cardIndex > -1) {
        const [usedCard] = currentPlayer.hand.splice(cardIndex, 1);
        currentPlayer.cardTrash.push(usedCard);
    }
    
    // --- เพิ่ม return ที่ท้ายฟังก์ชัน ---
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
        payingPlayer: playerKey,
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

function applyTargetedEffect(gameState, playerKey, payload) {
    const { targetUid } = payload;
    const { isTargeting, forEffect, cardSourceUid } = gameState.targetingState;

    if (!isTargeting) return gameState;

    // --- ใช้เอฟเฟกต์ Power Up ---
    if (forEffect.keyword === 'power up') {
        gameState = applyPowerUpEffect(gameState, targetUid, forEffect.power, forEffect.duration);
    }
    
    // --- ออกจากสถานะเลือกเป้าหมาย ---
    gameState.targetingState = { isTargeting: false, forEffect: null, cardSourceUid: null };
    
    return gameState;
}

function selectTarget(gameState, playerKey, payload) {
    const { targetUid } = payload;
    const targetingState = gameState.targetingState;
    // if (!targetingState.isTargeting || gameState.turn !== playerKey) return gameState;
    if (!targetingState.isTargeting || targetingState.targetPlayer !== playerKey) {
        return gameState;
    }
    const targetIndex = targetingState.selectedTargets.findIndex(uid => uid === targetUid);
    const targetCount = targetingState.forEffect.target ? targetingState.forEffect.target.count || 1 : 1;

    if (targetIndex > -1) {
        // ถ้าคลิกเป้าหมายเดิม ให้ยกเลิกการเลือก
        targetingState.selectedTargets.splice(targetIndex, 1);
    } else if (targetingState.selectedTargets.length < targetCount) {
        // ถ้ายังเลือกไม่ครบ ให้เพิ่มเข้าไป
        targetingState.selectedTargets.push(targetUid);
    }

    return gameState;
}

function confirmTargets(gameState, playerKey) {
    const targetingState = gameState.targetingState;
    // แก้ไขเงื่อนไขให้ถูกต้อง: ต้องเช็คกับ targetPlayer ไม่ใช่ gameState.turn
    if (!targetingState.isTargeting || targetingState.targetPlayer !== playerKey) {
        return gameState;
    }

    const { forEffect, selectedTargets } = targetingState;
    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    let destructionSuccessful = false; // สร้างตัวแปรเพื่อตรวจสอบความสำเร็จ

    if (forEffect.keyword === 'destroy') {
        selectedTargets.forEach(targetUid => {
            // --- START: แก้ไขการเรียกใช้ destroyCard ---
            const targetScopeKey = forEffect.target.scope === 'opponent' ? opponentKey : playerKey;
            const result = destroyCard(gameState, targetUid, targetScopeKey, 'effect');
            gameState = result.updatedGameState; // อัปเดต gameState ให้ถูกต้อง
            if (result.wasSuccessful) {
                destructionSuccessful = true; // ถ้าสำเร็จ ให้ตั้งค่าเป็น true
            }
            // --- END: แก้ไขการเรียกใช้ destroyCard ---
        });

    }else if (forEffect.keyword === 'windstorm') {
        selectedTargets.forEach(targetUid => {
            const targetSpirit = gameState[playerKey].field.find(s => s.uid === targetUid);
            if (targetSpirit && !targetSpirit.isExhausted) {
                targetSpirit.isExhausted = true;
                console.log(`[EFFECT LOG] ${targetSpirit.name} was exhausted by Windstorm.`);
            }
        });
    }
    else if (forEffect.keyword === 'power up') {
        selectedTargets.forEach(targetUid => {
            gameState = applyPowerUpEffect(gameState, targetUid, forEffect.power, forEffect.duration);
        });
    }else if (forEffect.keyword === 'addEffects') {
        selectedTargets.forEach(targetUid => {
            // ค้นหา Spirit เป้าหมายในสนาม
            const targetSpirit = gameState[playerKey].field.find(s => s.uid === targetUid);
            if (targetSpirit) {
                // เพิ่ม temporary effect เข้าไปที่ Spirit
                targetSpirit.tempBuffs.push({
                    type: 'EFFECT', // ประเภทใหม่สำหรับบัฟที่เป็นเอฟเฟกต์
                    keyword: forEffect.add_keyword[0], // ในที่นี้คือ 'destroy_life'
                    duration: forEffect.duration, // 'turn'
                    sourceCardName: 'Meteor Storm'
                });
                console.log(`[EFFECT LOG] ${targetSpirit.name} gains the [${forEffect.add_keyword[0]}] effect for the turn.`);
            }
        });
    }   
    else if (forEffect.keyword === 'destroy_on_crush') {
        selectedTargets.forEach(targetUid => {
            console.log(`[EFFECT LOG] Destroying target ${targetUid} due to BlastingGiant Douglas's effect.`);
            // ใช้ opponentKey เพราะเป้าหมายคือสปิริตของฝ่ายตรงข้าม
            const result = destroyCard(gameState, targetUid, opponentKey, 'effect');
            gameState = result.updatedGameState;
        });
    }
    // ===== เพิ่ม else if ใหม่สำหรับ Alexander ที่นี่ =====
    else if (forEffect.keyword === 'destroy_and_crush_by_cost') {
        selectedTargets.forEach(targetUid => {
            const opponentField = gameState[opponentKey].field;
            const targetCard = opponentField.find(c => c.uid === targetUid);
            
            if (targetCard) {
                const costOfDestroyedCard = targetCard.cost;
                // 1. ทำลายการ์ด
                let result = destroyCard(gameState, targetUid, opponentKey, 'effect');
                gameState = result.updatedGameState;

                // 2. ถ้าทำลายสำเร็จ ให้ทิ้งเด็คตาม Cost
                if (result.wasSuccessful) {
                    console.log(`[EFFECT LOG] Alexander destroyed ${targetCard.name} (Cost: ${costOfDestroyedCard}). Discarding ${costOfDestroyedCard} cards.`);
                    const { updatedGameState: gsAfterDiscard } = initiateDeckDiscard(gameState, opponentKey, costOfDestroyedCard);
                    gameState = gsAfterDiscard;
                }
            }
        });
    }

    // --- START: เพิ่ม Logic การจั่วการ์ดเข้ามา ---
    // ตรวจสอบว่าการทำลายสำเร็จ และในเอฟเฟกต์มีการระบุให้จั่วการ์ดหรือไม่
    if (destructionSuccessful && forEffect.target?.succeed === 'draw') {
        const quantity = forEffect.target.quantity || 1;
        console.log(`[EFFECT LOG] Buster Javelin succeeded! Drawing ${quantity} card(s).`);
        for (let i = 0; i < quantity; i++) {
            gameState = drawCard(gameState, playerKey);
        }
    }
    // --- END: เพิ่ม Logic การจั่วการ์ดเข้ามา ---

    // ออกจากสถานะเลือกเป้าหมาย
    // 1. ออกจากสถานะเลือกเป้าหมาย
    gameState.targetingState = { isTargeting: false, forEffect: null, cardSourceUid: null, selectedTargets: [] };

    // หลังจากจัดการเป้าหมายเสร็จ, ตรวจสอบว่าเราต้องกลับไปเลือกเอฟเฟกต์ที่เหลือหรือไม่
    const resState = gameState.effectResolutionState;
    if (resState.effectsToResolve && resState.effectsToResolve.length > 0) {
        console.log('[EFFECTS] Resuming effect resolution after targeting.');
        // "เปิด" หน้าต่างเลือกเอฟเฟกต์อีกครั้ง
        resState.isActive = true; 
        return gameState; // ส่งกลับเพื่อให้ Client แสดงหน้าต่างเลือกเอฟเฟกต์ที่เหลือ
    }

    if (gameState.attackState.postBlockAction === 'enterFlash') {
        const { enterFlashTiming } = require('./battle.js');
        console.log(`[BATTLE LOG] Post-block action found. Entering Flash Timing.`);
        // เอาธงออก แล้วเริ่ม Flash Timing
        delete gameState.attackState.postBlockAction; 
        return enterFlashTiming(gameState, 'afterBlock');
    }

    // โค้ดนี้สำหรับจัดการกรณีที่ใช้ Magic ระหว่าง Flash Timing (เหมือนเดิม)
    if (gameState.flashState.isActive) {
        // หาผู้เล่นอีกฝ่าย
        const otherPlayer = (playerKey === 'player1') ? 'player2' : 'player1';
        
        // ส่ง Priority ไปให้ผู้เล่นอีกฝ่าย
        gameState.flashState.priority = otherPlayer;
        
        // รีเซ็ตสถานะ "Pass" ของเรา เพื่อให้เราสามารถเล่นอีกครั้งได้ถ้า Priority วนกลับมา
        gameState.flashState.hasPassed[playerKey] = false;

        console.log(`[FLASH LOG] Action by ${playerKey} completed. Priority passed to ${otherPlayer}.`);
    }

    return gameState;
}

/**
 * ผู้เล่นกดยืนยันหลังจากดูการ์ดที่ถูกเปิด (Reveal)
 */
function confirmReveal(gameState, playerKey) {
    const { isActive, card, condition } = gameState.revealState;
    if (!isActive || gameState.turn !== playerKey) return gameState;

    const player = gameState[playerKey];
    let conditionMet = false;

    // ตรวจสอบเงื่อนไข (ในที่นี้คือ Red Spirit)
    if (card.type.toLowerCase() === condition.type && condition.color.includes(card.color)) {
        conditionMet = true;
    }

    if (conditionMet) {
        // ถ้าเงื่อนไขถูกต้อง นำการ์ดขึ้นมือ
        console.log(`[REVEAL LOG] Condition met for ${card.name}. Adding to hand.`);
        player.hand.push(card);
    } else {
        // ถ้าเงื่อนไขไม่ถูกต้อง นำการ์ดกลับไปไว้บนสุดของเด็ค
        console.log(`[REVEAL LOG] Condition NOT met for ${card.name}. Returning to decktop.`);
        player.deck.unshift(card);
    }

    // Reset state
    gameState.revealState = { isActive: false, card: null, condition: null };
    return gameState;
}

module.exports = {
    initiateMagicPayment,
    confirmMagicPayment,
    cancelMagicPayment,
    chooseMagicEffect, // <--- เพิ่ม
    cancelEffectChoice,  // <--- เพิ่ม
    applyTargetedEffect,
    selectTarget,
    confirmTargets,
    confirmReveal
};