// game_logic/battle.js
const { getSpiritLevelAndBP, calculateTotalSymbols, getCardLevel, isImmune  } = require('./utils.js');
const { resolveTriggeredEffects } = require('./effects.js'); // Note: This will be the next file to create
const { destroyCard } = require('./card.js');
const { checkGameOver } = require('./gameLoop.js');
const { applyCrush } = require('./effectHandlers.js');


function clearBattleBuffs(gameState, playerKey) {
    if (!gameState[playerKey]) return gameState;
    gameState[playerKey].field.forEach(spirit => {
        
        if (spirit.tempBuffs?.length > 0) {
            spirit.tempBuffs = spirit.tempBuffs.filter(buff => buff.duration !== 'battle');
        }
    });
    return gameState;
}


function enterFlashTiming(gameState, timing) {
   
    const p1_key = 'player1';
    const p2_key = 'player2';

    gameState.flashState = {
        isActive: true,
        timing: timing,
        priority: gameState.attackState.defender, // Defender gets priority
        hasPassed: { [p1_key]: false, [p2_key]: false }
    };

    return gameState;
}

function declareAttack(gameState, playerKey, payload) {
    const { attackerUid } = payload;
    const attacker = gameState[playerKey].field.find(s => s.uid === attackerUid);
    if (!attacker || attacker.isExhausted) return gameState;
    
    attacker.isExhausted = true;
    console.log(`${playerKey} declares attack with ${attacker.name}`);

    // --- ส่วนที่ 1: ตรวจสอบคุณสมบัติการโจมตีก่อน (Clash, Target Attack) ---
    // ส่วนนี้ทำงานถูกต้องแล้ว ไม่ต้องแก้ไข
    let spiritHasClash = attacker.effects?.some(e => e.keyword === 'clash' && e.level.includes(getCardLevel(attacker).level));

    if (!spiritHasClash) {
        gameState[playerKey].field.forEach(auraCard => {
            if (auraCard.uid === attacker.uid || !auraCard.effects) return;
            const auraCardLevel = getCardLevel(auraCard).level;
            auraCard.effects.forEach(auraEffect => {
                if (
                    (auraEffect.timing === 'yourAttackStep' || auraEffect.timing === 'duringBattle') &&
                    auraEffect.level.includes(auraCardLevel) &&
                    auraEffect.keyword === 'addEffects' &&
                    auraEffect.add_keyword?.includes('clash')
                ) {
                    const condition = auraEffect.condition[0];
                    if (attacker.effects?.some(e => e.keyword === condition)) {
                        spiritHasClash = true;
                    } else if (attacker.family?.includes(condition)) {
                        spiritHasClash = true;
                    }
                }
            });
        });
    }

    let canTargetAndAttack = false;
    if (spiritHasClash) {
        const meteorwurm = gameState[playerKey].field.find(c => c.id === 'card-meteorwurm');
        if (meteorwurm) {
            const meteorwurmLevel = getCardLevel(meteorwurm).level;
            if (meteorwurm.effects.some(e => e.level.includes(meteorwurmLevel) && e.keyword === 'targetAndAttack')) {
                canTargetAndAttack = true;
            }
        }
    }
    
    if (canTargetAndAttack) {
        const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
        const opponentHasSpirits = gameState[opponentKey].field.some(card => card.type === 'Spirit');
        if (opponentHasSpirits) {
            gameState.attackChoiceState = { isActive: true, attackerUid: attackerUid };
            return gameState;
        }
    }

    // --- ส่วนที่ 2: จัดการเอฟเฟกต์ "When Attacks" ทั้งหมดในที่เดียว (แก้ไขแล้ว) ---

    // 1. ตั้งค่าสถานะการโจมตีพื้นฐาน
    const defenderPlayerKey = (playerKey === 'player1') ? 'player2' : 'player1';
    gameState.attackState = { isAttacking: true, attackerUid, defender: defenderPlayerKey, blockerUid: null, isClash: spiritHasClash };
    
    // 2. เรียกใช้ resolveTriggeredEffects ที่จะจัดการเอฟเฟกต์ "When Attacks" ทั้งหมด
    // **รวมถึง [Assault] ด้วย** และจะเข้าสู่โหมดเลือกถ้ามีเอฟเฟกต์มากกว่า 1 อย่าง
    gameState = resolveTriggeredEffects(gameState, attacker, 'whenAttacks', playerKey);
    
    // 3. **จุดสำคัญ:** ถ้าเกมเข้าสู่สถานะให้เลือกเอฟเฟกต์ ให้หยุดการทำงานทันทีเพื่อรอผู้เล่น
    // โค้ดส่วนนี้จะทำให้เกมรอ Action 'RESOLVE_CHOSEN_EFFECT' จาก Client
    if (gameState.effectResolutionState.isActive) {
        return gameState;
    }

    // --- ส่วนที่ 3: ดำเนินเกมต่อหากไม่มีเอฟเฟกต์ให้เลือก หรือเลือกเสร็จแล้ว ---
    // ถ้าโค้ดทำงานมาถึงตรงนี้ หมายความว่า:
    // - ไม่มีเอฟเฟกต์ "When Attacks" เลย
    // - มีแค่ 1 เอฟเฟกต์ และทำงานไปแล้ว (เช่น Crush อย่างเดียว หรือ Assault อย่างเดียว)
    // - มีหลายเอฟเฟกต์ แต่ผู้เล่นเลือกจนหมดแล้ว
    
    // ตรวจสอบสถานะอื่นๆ ที่อาจจะขัดจังหวะ (เช่น รอเลือกเป้าหมาย) ก่อนที่จะเข้า Flash Timing
    if (!gameState.deckDiscardViewerState.isActive && !gameState.targetingState.isTargeting && !gameState.assaultState.canUse) {
        gameState = enterFlashTiming(gameState, 'beforeBlock');
    }
    
    return gameState;
}

function declareBlock(gameState, playerKey, payload) {
    if (!gameState.attackState.isAttacking || playerKey !== gameState.attackState.defender) return gameState;
    
    const { blockerUid } = payload;
    const blocker = gameState[playerKey].field.find(s => s.uid === blockerUid);

    if (blocker && !blocker.isExhausted) {
        blocker.isExhausted = true;
        gameState.attackState.blockerUid = blockerUid;

        const attackerOwnerKey = playerKey === 'player1' ? 'player2' : 'player1';
        const attacker = gameState[attackerOwnerKey].field.find(s => s.uid === gameState.attackState.attackerUid);

        // 1. ตรวจสอบเอฟเฟกต์ 'whenBlocked' ของตัวโจมตี (เช่น Windstorm)
        if (attacker) {
            gameState = resolveTriggeredEffects(gameState, attacker, 'whenBlocked', attackerOwnerKey);
        }
        
        // 2. ตรวจสอบเอฟเฟกต์ Crush ตอน Block (จาก Nexus "The H.Q.")
        const spiritHasCrush = blocker.effects?.some(eff => eff.keyword === 'crush');
        if (spiritHasCrush) {
            const hqNexus = gameState[playerKey].field.find(card =>
                card.type === 'Nexus' && card.effects?.some(eff => 
                    eff.keyword === 'enable_crush_on_block' && eff.level.includes(getCardLevel(card).level)
                )
            );

            if (hqNexus) {
                console.log(`[EFFECT LOG] "${blocker.name}"'s Crush is triggered on block by "${hqNexus.name}".`);
                const { level: blockerLevel } = getSpiritLevelAndBP(blocker, playerKey, gameState);
                gameState = applyCrush(gameState, blocker, blockerLevel, playerKey);
            }
        }

        // 3. ตรวจสอบเอฟเฟกต์ 'whenBlocks' ทั่วไปของตัวป้องกัน
        gameState = resolveTriggeredEffects(gameState, blocker, 'whenBlocks', playerKey);
        
        // 4. ถ้ามีเอฟเฟกต์ที่ต้องเลือกเป้าหมาย ให้หยุดรอ
        if (gameState.targetingState.isTargeting) {
            console.log("[BATTLE LOG] Pausing before Flash Timing due to a targeting requirement.");
            gameState.attackState.postBlockAction = 'enterFlash';
            return gameState;
        }
        
        // 5. ถ้าไม่มีอะไรค้างอยู่ ให้เข้า Flash Timing
        gameState = enterFlashTiming(gameState, 'afterBlock');
    }

    return gameState;
}

function resolveBattle(gameState) {
    const { attackerUid, blockerUid, defender } = gameState.attackState;
    const attackerOwner = (defender === 'player1') ? 'player2' : 'player1';
    const blockerOwner = defender;
    
    const attacker = gameState[attackerOwner].field.find(s => s.uid === attackerUid);
    const blocker = gameState[blockerOwner].field.find(s => s.uid === blockerUid);

    if (attacker && blocker) {
        const attackerResult = getSpiritLevelAndBP(attacker, attackerOwner, gameState);
        const blockerResult = getSpiritLevelAndBP(blocker, blockerOwner, gameState);

        if (attackerResult.bp > blockerResult.bp) {
            const attackerHasWindstorm = attacker.effects.some(e => e.keyword === 'windstorm');
            
            gameState = destroyCard(gameState, blockerUid, blockerOwner, 'battle').updatedGameState;

            const destroyLifeEffect = attacker.tempBuffs.find(buff => buff.type === 'EFFECT' && buff.keyword === 'destroy_life');

            if (destroyLifeEffect) {
                const symbols = calculateTotalSymbols(attacker);
                const opponentKey = blockerOwner;

                console.log(`[EFFECT LOG] Meteor Storm's effect triggers! ${attacker.name} will destroy ${symbols} life.`);

                for (let i = 0; i < symbols; i++) {
                    if (gameState[opponentKey].life > 0) {
                        gameState[opponentKey].life--;
                        // เพิ่มคอร์ไปที่ Reserve ของฝ่ายตรงข้าม
                        gameState[opponentKey].reserve.push({ id: `core-from-life-${opponentKey}-${Date.now()}-${i}` });
                    }
                }
                // ตรวจสอบเกมโอเวอร์หลังจากลด life
                gameState = checkGameOver(gameState);
            }
            
            gameState = resolveTriggeredEffects(gameState, attacker, 'onOpponentDestroyedInBattle', attackerOwner);

            // ถ้าตัวที่ชนะมี Windstorm ให้ตรวจสอบเอฟเฟกต์จาก The Storm Highland
            if (attackerHasWindstorm) {
                const playerField = [...gameState[attackerOwner].field];
                playerField.forEach(cardOnField => {
                    gameState = resolveTriggeredEffects(gameState, cardOnField, 'onOpponentDestroyedByWindstormSpirit', attackerOwner, {
                        exhaustedUids: gameState.attackState.exhaustedByWindstorm || [] // ส่งรายชื่อ Spirit ที่ถูก Windstorm exhaust ไปด้วย
                    });
                });
            }

        } else if (blockerResult.bp > attackerResult.bp) {
            
            gameState = destroyCard(gameState, attackerUid, attackerOwner, 'battle').updatedGameState;
        } else { // เสมอ
            
            gameState = destroyCard(gameState, attackerUid, attackerOwner, 'battle').updatedGameState;
            gameState = destroyCard(gameState, blockerUid, blockerOwner, 'battle').updatedGameState;
        }
    }
    
    gameState = clearBattleBuffs(gameState, attackerOwner);
    gameState = clearBattleBuffs(gameState, blockerOwner);
    gameState.attackState = { isAttacking: false, attackerUid: null, defender: null, blockerUid: null };
    return gameState;
}

function takeLifeDamage(gameState, playerKey) {
    // ตรวจสอบว่า Action มาจากผู้เล่นที่กำลังป้องกันอยู่หรือไม่
    if (!gameState.attackState.isAttacking || playerKey !== gameState.attackState.defender) return gameState;
    // ถ้าเป็นการโจมตีแบบ [Clash]
    if (gameState.attackState.isClash) {
        const defenderState = gameState[playerKey];
        const attackingPlayerKey = playerKey === 'player1' ? 'player2' : 'player1';
        const attacker = gameState[attackingPlayerKey].field.find(s => s.uid === gameState.attackState.attackerUid);

        // 1. ค้นหา Spirit ทั้งหมดที่สามารถบล็อกได้ (ยังไม่เหนื่อย)
        const potentialBlockers = defenderState.field.filter(s => s.type === 'Spirit' && !s.isExhausted);

        // 2. จาก Spirit เหล่านั้น, ตรวจสอบว่ามีอย่างน้อย 1 ใบที่ "ไม่ติด Armor" ต่อผู้โจมตีหรือไม่
        const hasValidBlocker = potentialBlockers.some(blocker => 
            !isImmune(blocker, attacker, gameState)
        );
        
        // 3. ถ้ามี Spirit ที่สามารถบล็อกได้ (และไม่ติด Armor) เหลืออยู่, ผู้เล่นจะถูกบังคับให้บล็อก
        if (hasValidBlocker) {
            console.log(`[CLASH] REJECTED: ${playerKey} must block the Clash attack with a valid Spirit.`);
            return gameState; 
        }
    }
    const { attackerUid, defender } = gameState.attackState;
    const attackingPlayer = (defender === 'player1') ? 'player2' : 'player1';
    
    const attacker = gameState[attackingPlayer].field.find(s => s.uid === attackerUid);
    if (attacker) {
        const damage = calculateTotalSymbols(attacker);
        let lifeWasReduced = false;
        for (let i = 0; i < damage; i++) {
            if (gameState[defender].life > 0) {
                gameState[defender].life--;
                gameState[defender].reserve.push({ id: `core-from-life-${defender}-${Date.now()}-${i}` });
                lifeWasReduced = true;
            }
        }

        // ถ้า Life ลดลงจริงๆ ให้ตรวจสอบเอฟเฟกต์
        if (lifeWasReduced) {
            console.log(`[BATTLE LOG] Life was reduced. Checking for 'onLifeDamageDealt' effects.`);
            gameState = resolveTriggeredEffects(gameState, attacker, 'onLifeDamageDealt', attackingPlayer);

            console.log(`[BATTLE LOG] Checking for 'onLifeReduced' effects for the defender.`);
            // ตรวจสอบการ์ดทุกใบบนสนามของผู้ป้องกัน (playerKey)
            const defenderField = [...gameState[playerKey].field]; // สร้างสำเนาเพื่อความปลอดภัย
            defenderField.forEach(card => {
                gameState = resolveTriggeredEffects(gameState, card, 'onLifeReduced', playerKey);
            });

            // ตรวจสอบบัฟ 'gain_core_on_life_damage' ที่ตัวผู้โจมตี
            const coreGainBuff = gameState[attackingPlayer].tempBuffs.find(
                buff => buff.type === 'gain_core_on_life_damage'
            );

            if (coreGainBuff) {
                const quantity = coreGainBuff.quantity || 0;
                const destination = coreGainBuff.destination || 'reserve';
                console.log(`[EFFECT LOG] ${coreGainBuff.sourceCardName}'s effect triggered! Gained ${quantity} cores in ${destination}.`);

                for (let i = 0; i < quantity; i++) {
                    gameState[attackingPlayer][destination].push({ id: `core-from-${coreGainBuff.sourceCardName}-${Date.now()}-${i}` });
                }
            }
        }
    }
    gameState = clearBattleBuffs(gameState, attackingPlayer);
    gameState = clearBattleBuffs(gameState, defender);
    gameState.attackState = { isAttacking: false, attackerUid: null, defender: null, blockerUid: null };
    return checkGameOver(gameState);
}

function resolveFlashWindow(gameState) {
    gameState.flashState.isActive = false;
    if (gameState.flashState.timing === 'afterBlock') {
        gameState = resolveBattle(gameState);
    }
    return gameState;
}

function passFlash(gameState, playerKey) {
    if (!gameState.flashState.isActive) return gameState;
    
    gameState.flashState.hasPassed[playerKey] = true;
    const otherPlayer = (playerKey === 'player1') ? 'player2' : 'player1';

    if (gameState.flashState.hasPassed[otherPlayer]) {
        gameState = resolveFlashWindow(gameState);
    } else {
        gameState.flashState.priority = otherPlayer;
    }
    return gameState;
}


/**
 * ผู้เล่นเลือก Spirit ของคู่ต่อสู้เป็นเป้าหมายโจมตี
 */
function selectAttackTarget(gameState, playerKey, payload) {
    const { targetUid } = payload;
    const { isActive, attackerUid } = gameState.attackTargetingState;
    if (!isActive || gameState.turn !== playerKey) return gameState;

    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    const targetSpirit = gameState[opponentKey].field.find(s => s.uid === targetUid);
    const attacker = gameState[playerKey].field.find(s => s.uid === attackerUid);

    if (!targetSpirit || !attacker) return gameState;

    console.log(`[TARGET ATTACK] ${playerKey} attacks ${targetSpirit.name} with ${attacker.name}`);
    attacker.isExhausted = true;      // สั่งให้ตัวที่โจมตี Exhausted

    if (!targetSpirit.isExhausted) {
        targetSpirit.isExhausted = true;  // สั่งให้เป้าหมายที่ถูกโจมตี Exhausted ด้วย
    }

    // ตั้งค่าสถานะการต่อสู้ให้เหมือนการ Block ทันที
    attacker.isExhausted = true;
    gameState.attackState = {
        isAttacking: true,
        attackerUid: attackerUid,
        defender: opponentKey,
        blockerUid: targetUid, // <<< เป้าหมายที่ถูกเลือกจะกลายเป็น Blocker ทันที
        isClash: false // การโจมตีแบบระบุเป้าหมายมักจะไม่ใช่ Clash
    };
    
    // ปิดสถานะเลือกเป้าหมาย
    gameState.attackTargetingState = { isActive: false, attackerUid: null, validTargets: [] };

    // เข้าสู่ Flash Timing หลังประกาศโจมตี (เหมือน afterBlock)
    return enterFlashTiming(gameState, 'afterBlock');
}

// ++ สร้างฟังก์ชันใหม่นี้ ++
function chooseAttackType(gameState, playerKey, payload) {
    const { choice } = payload;
    const { isActive, attackerUid } = gameState.attackChoiceState;
    if (!isActive || gameState.turn !== playerKey) return gameState;

    // ปิดสถานะการเลือก
    gameState.attackChoiceState = { isActive: false, attackerUid: null };

    if (choice === 'spirit') {
        // ถ้าเลือกโจมตี Spirit ให้เข้าสู่สถานะเลือกเป้าหมาย
        const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
        const validTargets = gameState[opponentKey].field.filter(s => s.type === 'Spirit').map(s => s.uid);
        gameState.attackTargetingState = { isActive: true, attackerUid: attackerUid, validTargets: validTargets };
    } else {
        // ถ้าเลือกโจมตี Life ให้ทำการโจมตีแบบปกติ
        const attacker = gameState[playerKey].field.find(s => s.uid === attackerUid);
        const defenderPlayerKey = playerKey === 'player1' ? 'player2' : 'player1';
        
        attacker.isExhausted = true;
        gameState.attackState = { isAttacking: true, attackerUid, defender: defenderPlayerKey, blockerUid: null, isClash: true }; // สมมติว่าถ้า target ได้คือมี clash
        
        gameState = resolveTriggeredEffects(gameState, attacker, 'whenAttacks', playerKey);
        if (!gameState.deckDiscardViewerState.isActive) {
            gameState = enterFlashTiming(gameState, 'beforeBlock');
        }
    }
    return gameState;
}

// ฟังก์ชันสำหรับจัดการเมื่อผู้เล่นเลือกใช้ Assault
function useAssault(gameState, playerKey, payload) {
    const { nexusUid } = payload;
    const { canUse, spiritUid } = gameState.assaultState;
    if (!canUse || gameState.turn !== playerKey) return gameState;

    const player = gameState[playerKey];
    const spirit = player.field.find(s => s.uid === spiritUid);
    const nexus = player.field.find(n => n.uid === nexusUid);

    if (!spirit || !nexus || nexus.isExhausted) return gameState;

    const assaultEffect = spirit.effects.find(e => e.keyword === 'assault');
    const usedCount = gameState.assaultState.usedCounts[spiritUid] || 0;

    if (assaultEffect && usedCount < assaultEffect.count) {
        spirit.isExhausted = false; // Refresh Spirit
        nexus.isExhausted = true;  // Exhaust Nexus
        gameState.assaultState.usedCounts[spiritUid] = usedCount + 1;
        console.log(`[ASSAULT] ${spirit.name} refreshed by exhausting ${nexus.name}.`);
    }
    

    // 1. ออกจากสถานะ Assault
    gameState.assaultState = { ...gameState.assaultState, canUse: false, spiritUid: null };
    const defenderPlayerKey = playerKey === 'player1' ? 'player2' : 'player1';
    gameState.attackState = { isAttacking: true, attackerUid: spirit.uid, defender: defenderPlayerKey, blockerUid: null, isClash: false };
    
    const resState = gameState.effectResolutionState;
    if (resState.effectsToResolve && resState.effectsToResolve.length > 0) {
        console.log('[EFFECTS] Resuming effect resolution after Assault.');
        resState.isActive = true;
        return gameState;
    }
    // 2. สั่งให้เกมดำเนินต่อไปยัง Flash Timing 
    console.log(`[ASSAULT] Assault used. Proceeding to Flash Timing.`);
    return enterFlashTiming(gameState, 'beforeBlock');
}
// ฟังก์ชันสำหรับจัดการเมื่อผู้เล่นไม่ต้องการใช้ Assault
function skipAssault(gameState, playerKey) {
    if (!gameState.assaultState.canUse || gameState.turn !== playerKey) return gameState;

    // ปิดหน้าต่าง Assault และเข้าสู่ Flash Timing ตามปกติ
    gameState.assaultState = { ...gameState.assaultState, canUse: false, spiritUid: null };

    const resState = gameState.effectResolutionState;
    if (resState.effectsToResolve && resState.effectsToResolve.length > 0) {
        console.log('[EFFECTS] Resuming effect resolution after skipping Assault.');
        resState.isActive = true;
        return gameState;
    }
    console.log(`[ASSAULT] Player skipped using Assault.`);
    return enterFlashTiming(gameState, 'beforeBlock');
}

module.exports = {
    declareAttack,
    declareBlock,
    takeLifeDamage,
    passFlash,
    resolveFlashWindow,
    enterFlashTiming,
    selectAttackTarget,
    chooseAttackType,
    useAssault,
    skipAssault
};