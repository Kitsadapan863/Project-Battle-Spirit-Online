// game_logic/actionHandler.js
const { advancePhase, endTurn } = require('./gameLoop');
const { declareAttack, declareBlock, takeLifeDamage, passFlash, resolveFlashWindow, selectAttackTarget, chooseAttackType, useAssault, skipAssault  } = require('./battle');
const { initiateSummon, selectCoreForPayment, cancelSummon, confirmSummon, selectCoreForPlacement, confirmPlacement } = require('./summon');
const { initiateMagicPayment, confirmMagicPayment, cancelMagicPayment, chooseMagicEffect, cancelEffectChoice, 
      applyTargetedEffect, selectTarget, confirmTargets, confirmReveal  } = require('./magic');
const { confirmDeckDiscard, confirmDiscard, selectCardForDiscard } = require('./card');
const { confirmCoreRemoval, cancelCoreRemoval, moveCore } = require('./core');
const {resolveRPS} = require('./pregame.js')
const { initiateEvolution, selectCoreForEvolution, confirmEvolution, cancelEvolution } = require('./evolution'); 
const { resolveChosenEffect, confirmEffectCost, cancelEffectCost  } = require('./effects');

function handleAction(gameState, playerKey, action) {
     // --- LOG DEBUG ---
    console.log(`[ACTION_HANDLER] Routing action: ${action.type}`);
    switch (action.type) {

        case 'CHOOSE_RPS':
            return resolveRPS(gameState, playerKey, action.payload.choice);
        //EVOLUTION
        case 'INITIATE_EVOLUTION':
            return initiateEvolution(gameState, playerKey, action.payload);
        case 'SELECT_CORE_FOR_EVOLUTION':
            return selectCoreForEvolution(gameState, playerKey, action.payload);
        case 'CONFIRM_EVOLUTION':
            return confirmEvolution(gameState, playerKey);
        case 'CANCEL_EVOLUTION':
            return cancelEvolution(gameState, playerKey);
        case 'USE_ASSAULT':
            return useAssault(gameState, playerKey, action.payload);
        case 'SKIP_ASSAULT':
            return skipAssault(gameState, playerKey);

        // Game Loop & Battle
        case 'ADVANCE_PHASE': return advancePhase(gameState, playerKey);
        case 'END_TURN': return endTurn(gameState);
        case 'DECLARE_ATTACK': return declareAttack(gameState, playerKey, action.payload);
        case 'CHOOSE_ATTACK_TYPE': return chooseAttackType(gameState, playerKey, action.payload);
        case 'SELECT_ATTACK_TARGET': return selectAttackTarget(gameState, playerKey, action.payload);
        case 'DECLARE_BLOCK': return declareBlock(gameState, playerKey, action.payload);
        case 'TAKE_LIFE_DAMAGE': return takeLifeDamage(gameState, playerKey);
        case 'PASS_FLASH': return passFlash(gameState, playerKey);

        // Summoning Process
        case 'INITIATE_SUMMON': return initiateSummon(gameState, playerKey, action.payload);
        case 'SELECT_CORE_FOR_PAYMENT': return selectCoreForPayment(gameState, playerKey, action.payload);
        case 'CANCEL_SUMMON': return cancelSummon(gameState, playerKey);
        case 'CONFIRM_SUMMON': return confirmSummon(gameState, playerKey);
        case 'SELECT_CORE_FOR_PLACEMENT': return selectCoreForPlacement(gameState, playerKey, action.payload);
        case 'CONFIRM_PLACEMENT': return confirmPlacement(gameState, playerKey);

        // Magic Process
        case 'INITIATE_MAGIC': 
            console.log(`[SERVER DEBUG] Action INITIATE_MAGIC received for card:`, action.payload.cardUid);
            return initiateMagicPayment(gameState, playerKey, action.payload);
        case 'CHOOSE_MAGIC_EFFECT': return chooseMagicEffect(gameState, playerKey, action.payload);
        case 'CANCEL_EFFECT_CHOICE': return cancelEffectChoice(gameState, playerKey);
        case 'CONFIRM_MAGIC': return confirmMagicPayment(gameState, playerKey);
        case 'CANCEL_MAGIC': return cancelMagicPayment(gameState, playerKey);
        // case 'SELECT_TARGET': return applyTargetedEffect(gameState, playerKey, action.payload);
        case 'SELECT_TARGET': return selectTarget(gameState, playerKey, action.payload);
        case 'RESOLVE_CHOSEN_EFFECT': return resolveChosenEffect(gameState, playerKey, action.payload);
        case 'CONFIRM_EFFECT_COST': return confirmEffectCost(gameState, playerKey);
        case 'CANCEL_EFFECT_COST': return cancelEffectCost(gameState, playerKey);
        case 'CONFIRM_TARGETS': return confirmTargets(gameState, playerKey);
        case 'CONFIRM_REVEAL': return confirmReveal(gameState, playerKey);

        // Card interactions
        case 'CONFIRM_DECK_DISCARD': return confirmDeckDiscard(gameState);
        case 'SELECT_CARD_FOR_DISCARD': return selectCardForDiscard(gameState, playerKey, action.payload);
        case 'CONFIRM_DISCARD': return confirmDiscard(gameState, playerKey);

        // Core Movement
        case 'MOVE_CORE': return moveCore(gameState, playerKey, action.payload);
        case 'CONFIRM_CORE_REMOVAL': return confirmCoreRemoval(gameState, playerKey);
        case 'CANCEL_CORE_REMOVAL': return cancelCoreRemoval(gameState, playerKey);

        default:
            console.log(`[ACTION_HANDLER] Unknown action type: ${action.type}`);
            return gameState;
    }
}

module.exports = { handleAction };