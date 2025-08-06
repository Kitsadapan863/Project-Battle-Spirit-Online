// game_logic/battle.js
const { getSpiritLevelAndBP, calculateTotalSymbols, getCardLevel } = require('./utils.js');
// const { resolveTriggeredEffects } = require('./effects.js'); // Note: This will be the next file to create
const { destroyCard } = require('./card.js');
const { checkGameOver } = require('./gameLoop.js');

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

    console.log(`${playerKey} declares attack with ${attacker.name}`);

    const defenderPlayerKey = (playerKey === 'player1') ? 'player2' : 'player1';

    attacker.isExhausted = true;
    gameState.attackState = { isAttacking: true, attackerUid, defender: defenderPlayerKey, blockerUid: null, isClash: false };
    
    // gameState = resolveTriggeredEffects(gameState, attacker, 'whenAttacks', playerKey);

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
        // gameState = resolveTriggeredEffects(gameState, blocker, 'whenBlocks', playerKey);
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
            gameState = destroyCard(gameState, blockerUid, blockerOwner);
        } else if (blockerResult.bp > attackerResult.bp) {
            gameState = destroyCard(gameState, attackerUid, attackerOwner);
        } else {
            gameState = destroyCard(gameState, attackerUid, attackerOwner);
            gameState = destroyCard(gameState, blockerUid, blockerOwner);
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

module.exports = {
    declareAttack,
    declareBlock,
    takeLifeDamage,
    passFlash,
    resolveFlashWindow,
    enterFlashTiming
};