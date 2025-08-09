// game_logic/battle.js
const { getSpiritLevelAndBP, calculateTotalSymbols, getCardLevel } = require('./utils.js');
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
    // --- START: โค้ดที่แก้ไขและเพิ่มเติม ---
    let spiritHasClash = attacker.effects?.some(e => e.keyword === 'clash');
    let canTargetAndAttack = false;

    // ตรวจสอบ Aura ทั้งหมดในสนาม
    gameState[playerKey].field.forEach(cardOnField => {
        if (!cardOnField.effects) return;

        const cardOnFieldLevel = getCardLevel(cardOnField).level;
        cardOnField.effects.forEach(eff => {
            if (eff.timing === 'yourAttackStep' && eff.level.includes(cardOnFieldLevel)) {
                
                // ตรวจสอบ Aura ที่มอบ Clash
                if (eff.keyword === 'addEffects' && eff.add_keyword?.includes('clash')) {
                    const conditionKeyword = eff.condition[0];
                    if (attacker.effects?.some(e => e.keyword === conditionKeyword)) {
                        spiritHasClash = true;
                    }
                }
                
                // ตรวจสอบ Aura ที่อนุญาตให้ Target Attack (Meteorwurm LV3)
                if (eff.keyword === 'targetAndAttack') {
                    const conditionKeyword = eff.condition[0]; // คือ 'clash'
                    if (spiritHasClash || attacker.effects?.some(e => e.keyword === conditionKeyword)) {
                        canTargetAndAttack = true;
                    }
                }
            }
        });
    });

    if (canTargetAndAttack) {
        // แทนที่จะเข้า targeting state ทันที ให้เข้า choice state ก่อน
        gameState.attackChoiceState = { isActive: true, attackerUid: attackerUid };
        return gameState; 
    }
    // --- END: โค้ดที่แก้ไขและเพิ่มเติม ---

    // ถ้าไม่สามารถ Target Attack ได้ ให้ทำการโจมตีปกติ
    const defenderPlayerKey = (playerKey === 'player1') ? 'player2' : 'player1';

    gameState.attackState = { isAttacking: true, attackerUid, defender: defenderPlayerKey, blockerUid: null, isClash: spiritHasClash };
    
    gameState = resolveTriggeredEffects(gameState, attacker, 'whenAttacks', playerKey);

    if (!gameState.deckDiscardViewerState.isActive) {
        gameState = enterFlashTiming(gameState, 'beforeBlock');
    }
    
    return gameState;
}

function declareBlock(gameState, playerKey, payload) {
    // Note: The playerKey here is the one who clicked, which should be the defender.
    if (!gameState.attackState.isAttacking || playerKey !== gameState.attackState.defender) return gameState;
    
    const { blockerUid } = payload;
    const blocker = gameState[playerKey].field.find(s => s.uid === blockerUid);

    if (blocker && !blocker.isExhausted) {
        blocker.isExhausted = true;
        gameState.attackState.blockerUid = blockerUid;

        // --- START: โค้ดที่เพิ่มเข้ามา ---
        // ตรวจสอบเอฟเฟกต์ Crush ตอน Block (จาก Nexus "The H.Q.")
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
        // --- END: โค้ดที่เพิ่มเข้ามา ---

        // เรียกใช้เอฟเฟกต์ "whenBlocks" ตามปกติ
        gameState = resolveTriggeredEffects(gameState, blocker, 'whenBlocks', playerKey);
        
        // เข้าสู่ Flash Timing หลังประกาศ Block
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
            // --- START: เพิ่ม 'battle' เป็น reason ---
            gameState = destroyCard(gameState, blockerUid, blockerOwner, 'battle');
            gameState = resolveTriggeredEffects(gameState, attacker, 'onOpponentDestroyedInBattle', attackerOwner);
            // --- END ---
        } else if (blockerResult.bp > attackerResult.bp) {
            // --- START: เพิ่ม 'battle' เป็น reason ---
            gameState = destroyCard(gameState, attackerUid, attackerOwner, 'battle');
            // gameState = resolveTriggeredEffects(gameState, blocker, 'onOpponentDestroyedInBattle', blockerOwner);
            // --- END ---
        } else { // เสมอ ทำลายทั้งคู่
            // --- START: เพิ่ม 'battle' เป็น reason ---
            gameState = destroyCard(gameState, attackerUid, attackerOwner, 'battle');
            gameState = destroyCard(gameState, blockerUid, blockerOwner, 'battle');
            // --- END ---
        }
    }
    
    gameState = clearBattleBuffs(gameState, attackerOwner);
    gameState = clearBattleBuffs(gameState, blockerOwner);
    gameState.attackState = { isAttacking: false, attackerUid: null, defender: null, blockerUid: null };
    return gameState;
}

function takeLifeDamage(gameState, playerKey) {
    // The playerKey is the one who clicked "Take Damage", which must be the defender
    if (!gameState.attackState.isAttacking || playerKey !== gameState.attackState.defender) return gameState;
    
    const { attackerUid, defender } = gameState.attackState;
    const attackingPlayer = (defender === 'player1') ? 'player2' : 'player1';
    
    const attacker = gameState[attackingPlayer].field.find(s => s.uid === attackerUid);
    if (attacker) {
        const damage = calculateTotalSymbols(attacker);
        for (let i = 0; i < damage; i++) {
            if (gameState[defender].life > 0) {
                gameState[defender].life--;
                gameState[defender].reserve.push({ id: `core-from-life-${defender}-${Date.now()}-${i}` });
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


module.exports = {
    declareAttack,
    declareBlock,
    takeLifeDamage,
    passFlash,
    resolveFlashWindow,
    enterFlashTiming,
    selectAttackTarget,
    chooseAttackType
};