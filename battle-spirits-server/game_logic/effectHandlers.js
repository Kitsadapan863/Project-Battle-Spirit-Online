// game_logic/effectHandlers.js
const { getCardLevel } = require('./utils.js');
const { initiateDeckDiscard, drawCard } = require('./card.js'); // We will add card discard logic later

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


/**
 * จัดการเอฟเฟกต์ [Crush]
 */
function applyCrush(gameState, card, cardLevel, ownerKey) {
    const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1';
    let cardsToDiscard = cardLevel;

    // ตรวจสอบโบนัสจาก Nexus (เช่น The Collapse of Battle Line)
    gameState[ownerKey].field.forEach(fieldCard => {
        if (fieldCard.type === 'Nexus' && fieldCard.effects) {
            const fieldCardLevel = getCardLevel(fieldCard).level;
            fieldCard.effects.forEach(effect => {
                if (effect.keyword === 'add crush' && effect.level.includes(fieldCardLevel)) {
                    cardsToDiscard += effect.count;
                }
            });
        }
    });
    
    // ตรวจสอบโบนัสจากตัวเอง (เช่น Steam-Golem)
    // if (card.effects) {
    //     card.effects.forEach(effect => {
    //         if (effect.keyword === 'add crush' && effect.timing === 'permanent' && effect.level.includes(cardLevel)) {
    //             cardsToDiscard += effect.count;
    //         }
    //     });
    // }
    if (card.effects) {
            const selfAddCrushEffects = card.effects.filter(effect => 
                effect.timing === 'permanent' && 
                effect.keyword === 'add crush' && 
                effect.level.includes(cardLevel)
            );
            if (selfAddCrushEffects.length > 0) {
                const totalBonusFromSelf = selfAddCrushEffects.reduce((sum, effect) => sum + effect.count, 0);
                console.log(`[Crush] Found 'add crush' self-bonus from ${card.name}: +${totalBonusFromSelf}`);
                cardsToDiscard += totalBonusFromSelf;
            }
        }

    const { discardedCards, updatedGameState } = initiateDeckDiscard(gameState, opponentKey, cardsToDiscard);
    gameState = updatedGameState;

    gameState.deckDiscardViewerState.context = {
        sourceCardUid: card.uid,
        sourceCardLevel: cardLevel,
        discardedCards: discardedCards
    };

    // ตรวจสอบเอฟเฟกต์ที่ทำงานหลัง Crush (เช่น The Two-Sword Ambrose)
    if (card.effects) {
        const powerUpEffect = card.effects.find(effect =>
            effect.keyword === 'power up' &&
            effect.triggered_by === 'crush' &&
            effect.level.includes(cardLevel)
        );

        if (powerUpEffect && gameState.turn === ownerKey) {
            const discardedSpiritCount = discardedCards.filter(c => c.type === 'Spirit').length;
            if (discardedSpiritCount > 0) {
                console.log(`[Effect Log] Ambrose's BP up effect triggered ON ATTACK.`);
                const totalPowerUp = discardedSpiritCount * powerUpEffect.power;
                gameState = applyPowerUp(gameState, card.uid, totalPowerUp, powerUpEffect.duration);
            }
        }


    }

    // ตรวจสอบบัฟ 'core_on_crush_attack' จาก Blitz
    const coreChargeBuff = gameState[ownerKey].tempBuffs.find(buff => buff.type === 'core_on_crush_attack');
    if (coreChargeBuff) {
        console.log(`[EFFECT LOG] Blitz effect triggered! Gained 1 core.`);
        // เพิ่ม 1 Core ไปที่ Cost Trash (ตามกฎของเกมที่จะกลับมาใช้ได้ใน Refresh Step หน้า)
        gameState[ownerKey].costTrash.push({ id: `core-from-blitz-${Date.now()}` });
    }

    if (discardedCards.length > 0) {
        // วนลูปการ์ดในสนามของผู้ใช้ Crush เพื่อหา Nexus ที่เกี่ยวข้อง
        gameState[ownerKey].field.forEach(fieldCard => {
            if (fieldCard.type === 'Nexus' && fieldCard.effects) {
                const fieldCardLevel = getCardLevel(fieldCard).level;
                const coreOnCrushEffect = fieldCard.effects.find(eff => 
                    eff.keyword === 'core_on_crush' && eff.level.includes(fieldCardLevel)
                );

                if (coreOnCrushEffect) {
                    console.log(`[H.Q. LV2 Effect] Gained ${coreOnCrushEffect.count} core from Crush effect.`);
                    // เพิ่มคอร์ตามจำนวนที่เอฟเฟกต์กำหนด (ในที่นี้คือ 1)
                    for (let i = 0; i < coreOnCrushEffect.count; i++) {
                        gameState[ownerKey].reserve.push({ id: `core-from-hq-${Date.now()}-${i}` });
                    }
                }
            }
        });
    }
    return gameState;
}

function applyClash(gameState) {
    if (gameState.attackState.isAttacking) {
        gameState.attackState.isClash = true;
    }
    return gameState;
}


/**
 * จัดการเอฟเฟกต์ Discard จากเด็คคู่ต่อสู้ (ที่ไม่ได้มาจาก Crush)
 */
function applyDiscard(gameState, card, effect, ownerKey) {
    const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1';
    let cardsToDiscard = 0;

    if (effect.count) {
        // กรณีระบุจำนวนตายตัว (The GiantHero Titus)
        cardsToDiscard = effect.count;
    } else {
        // กรณีขึ้นอยู่กับเงื่อนไขอื่น (The MobileFortress Castle-Golem)
        if (effect.timing === 'whenSummoned') {
            const nexusCount = gameState[ownerKey].field.filter(c => c.type === 'Nexus').length;
            cardsToDiscard = Math.min(nexusCount * 5, 15);
        } else if (effect.timing === 'whenAttacks') {
            let blueSymbolCount = 0;
            gameState[ownerKey].field.forEach(c => {
                if (c.symbol?.blue) {
                    blueSymbolCount += c.symbol.blue;
                }
            });
            cardsToDiscard = blueSymbolCount;
        }
    }

    if (cardsToDiscard > 0) {
        // แก้ไขการเรียกใช้ initiateDeckDiscard ให้รับ gameState ที่อัปเดตแล้วกลับมา
        const { updatedGameState } = initiateDeckDiscard(gameState, opponentKey, cardsToDiscard);
        gameState = updatedGameState;
    }
    return gameState;
}


/**
 * จัดการเอฟเฟกต์ที่ให้จั่วการ์ด แล้วอาจจะมีการทิ้งการ์ดตามมา
 */
function applyDrawAndDiscard(gameState, effect, ownerKey) {
    console.log(`[Effect Handler] Applying Draw effect for ${ownerKey}.`);
    
    // จั่วการ์ดตามจำนวนที่ระบุ (quantity)
    const quantity = effect.quantity || 0;
    for (let i = 0; i < quantity; i++) {
        gameState = drawCard(gameState, ownerKey);
    }

    // ถ้ามีการระบุให้ทิ้งการ์ด (discard)
    const discardCount = effect.discard || 0;
    if (discardCount > 0) {
        if (gameState.discardState.isDiscarding) {
            // ถ้าอยู่ในสถานะทิ้งการ์ดอยู่แล้ว ให้บวกจำนวนเพิ่มเข้าไป
            gameState.discardState.count += discardCount;
            console.log(`[Effect Handler] Added ${discardCount} to discard count. Total is now ${gameState.discardState.count}.`);
        } else {
            // ถ้ายังไม่ได้อยู่ในสถานะทิ้งการ์ด ให้สร้างใหม่
            console.log(`[Effect Handler] Entering discard state for ${ownerKey}. Need to discard ${discardCount} card(s).`);
            gameState.discardState = {
                isDiscarding: true,
                count: discardCount,
                cardsToDiscard: [],
                playerKey: ownerKey
            };
        }
    }

    return gameState;
}

/**
 * จัดการเอฟเฟกต์เพิ่มพลัง (BP) ให้กับ Spirit ทั้ง Family
 */
// function applyFamilyPowerUp(gameState, ownerKey, targetFamilies, power, duration) {
//     console.log(`[Effect Handler] Applying +${power} BP buff to all "${targetFamilies.join(', ')}" spirits for ${ownerKey}.`);
    
//     // วนลูปการ์ดทุกใบบนสนามของผู้เล่น
//     gameState[ownerKey].field.forEach(card => {
//         // ตรวจสอบว่าเป็น Spirit และมี family ที่ถูกต้องหรือไม่
//         if (card.type === 'Spirit' && card.family?.some(f => targetFamilies.includes(f))) {
//             if (!card.tempBuffs) {
//                 card.tempBuffs = [];
//             }
//             card.tempBuffs.push({ type: 'BP', value: power, duration: duration });
//             console.log(`- Buffed ${card.name}.`);
//         }
//     });

//     return gameState;
// }

/**
 * จัดการเอฟเฟกต์ที่สร้าง Aura เพิ่มพลังให้ทั้ง Family ตลอดเทิร์น
 */
function applyAuraPowerUp(gameState, ownerKey, effect) {
    console.log(`[Effect Handler] Applying "${effect.targetFamily}" aura for ${ownerKey}.`);
    // เพิ่มบัฟไปที่ตัวผู้เล่น ไม่ใช่ที่การ์ด
    gameState[ownerKey].tempBuffs.push({
        type: 'AURA_BP',
        power: effect.power,
        duration: effect.duration,
        targetFamily: effect.targetFamily,
        sourceCardName: 'Ovirapt' // Optional: for debugging
    });
    return gameState;
}

function applyWindstorm(gameState, card, effect, ownerKey) {
    const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1';
    
    // หาเป้าหมายที่ถูกต้อง (Spirit ของฝ่ายตรงข้ามที่ยังไม่เหนื่อย)
    const validTargets = gameState[opponentKey].field.filter(c => 
        c.type === 'Spirit' && !c.isExhausted
    );

    if (validTargets.length > 0) {
        console.log(`[EFFECT LOG] ${card.name}'s [Windstorm] triggers. Entering targeting state.`);
        gameState.targetingState = {
            isTargeting: true,
            forEffect: effect,
            cardSourceUid: card.uid,
            targetPlayer: opponentKey, 
            selectedTargets: []
        };
        gameState.targetingState.windstormUserUid = card.uid;
    } else {
        console.log(`[EFFECT LOG] ${card.name}'s [Windstorm] triggered, but no valid targets.`);
    }
    return gameState;
}

function applyGainCoreByWindstorm(gameState, ownerKey, effect, context) {
    // เพิ่มการตรวจสอบ context และ context.summonedSpirit ก่อนใช้งาน
    if (!context || !context.summonedSpirit) {
        console.error("[EFFECTS ERROR] applyGainCoreByWindstorm was called without a valid 'summonedSpirit' in context.");
        return gameState;
    }
    const summonedSpirit = context.summonedSpirit;

    const windstormEffect = summonedSpirit.effects.find(e => e.keyword === 'windstorm');
    if (windstormEffect) {
        const coreCount = windstormEffect.target.count || 1;
        console.log(`[EFFECTS] Storm Highland adds ${coreCount} cores to ${summonedSpirit.name}.`);
        for (let i = 0; i < coreCount; i++) {
            summonedSpirit.cores.push({ id: `core-from-highland-${Date.now()}-${i}` });
        }
    }
    return gameState;
}

function applyMoveToDeckBottom(gameState, ownerKey, effect, context) {
    const exhaustedUids = context.exhaustedUids || [];
    if (exhaustedUids.length === 0) return gameState;
    
    const opponentKey = ownerKey === 'player1' ? 'player2' : 'player1';

    exhaustedUids.forEach(uid => {
        const cardIndex = gameState[opponentKey].field.findIndex(c => c.uid === uid);
        if (cardIndex > -1) {
            const [movedCard] = gameState[opponentKey].field.splice(cardIndex, 1);
            
            // ย้าย Core กลับ Reserve
            if (movedCard.cores.length > 0) {
                gameState[opponentKey].reserve.push(...movedCard.cores);
                movedCard.cores = [];
            }
            
            // ย้ายการ์ดไปไว้ล่างสุดของเด็ค
            gameState[opponentKey].deck.push(movedCard);
            console.log(`[EFFECTS] Storm Highland moves ${movedCard.name} to the bottom of the deck.`);
        }
    });

    return gameState;
}
module.exports = { 
    applyCrush, 
    applyClash, 
    applyPowerUp, 
    applyDiscard,
    applyDrawAndDiscard,
    applyAuraPowerUp,
    applyWindstorm,
    applyGainCoreByWindstorm,
    applyMoveToDeckBottom
};