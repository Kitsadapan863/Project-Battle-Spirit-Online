// js/ui/modals.js
import { getSpiritLevelAndBP } from "../utils.js";
import { createCardElement } from "./components.js";

/**
 * อัปเดตการแสดงผลของ Modal ทั้งหมด
 * @param {object} gameState 
 * @param {string} myPlayerKey 
 * @param {object} callbacks 
 */
export function updateAllModals(gameState, myPlayerKey, callbacks) {
    const modals = {
        summonPaymentOverlay: document.getElementById('summon-payment-overlay'),
        magicPaymentOverlay: document.getElementById('magic-payment-overlay'),
        placementOverlay: document.getElementById('placement-overlay'),
        defenseOverlay: document.getElementById('defense-overlay'),
        flashOverlay: document.getElementById('flash-overlay'),
        discardOverlay: document.getElementById('discard-overlay'),
        coreRemovalConfirmationOverlay: document.getElementById('core-removal-confirmation-overlay'),
        targetingOverlay: document.getElementById('targeting-overlay'),
        effectChoiceModal: document.getElementById('effect-choice-modal'),
        gameOverModal: document.getElementById('game-over-modal'),
        deckDiscardViewerModal: document.getElementById('deck-discard-viewer-modal'),
    };

    // --- 1. ซ่อน Modal ที่เป็น Action หลักทั้งหมดก่อน ---
    modals.summonPaymentOverlay.classList.remove('visible');
    modals.magicPaymentOverlay.classList.remove('visible');
    modals.placementOverlay.classList.remove('visible');
    modals.defenseOverlay.classList.remove('visible');
    modals.flashOverlay.classList.remove('visible');
    modals.discardOverlay.classList.remove('visible');
    modals.coreRemovalConfirmationOverlay.classList.remove('visible');
    modals.targetingOverlay.classList.remove('visible');
    modals.effectChoiceModal.classList.remove('visible');

    // --- 2. ตรวจสอบและแสดง Modal ที่ถูกต้องเพียงอันเดียว (จัดลำดับความสำคัญ) ---
    const choiceState = gameState.effectChoiceState;
    const discardState = gameState.discardState;
    const flashState = gameState.flashState;
    const attackState = gameState.attackState;
    const placementState = gameState.placementState;
    const magicPaymentState = gameState.magicPaymentState;
    const summonState = gameState.summoningState;
    const coreRemovalState = gameState.coreRemovalConfirmationState;
    const targetingState = gameState.targetingState;
    const amIPaying = magicPaymentState.payingPlayer === myPlayerKey
   
    // ลำดับ 1: Targeting Modal
    if (targetingState.isTargeting && targetingState.targetPlayer === myPlayerKey) {
        modals.targetingOverlay.classList.add('visible');

        const effect = targetingState.forEffect;
        if (effect) {
            document.getElementById('targeting-prompt').textContent = effect.description;
            const selectedCount = targetingState.selectedTargets?.length || 0;
            const requiredCount = effect.target?.count || 1;
            
            const confirmBtn = document.getElementById('confirm-targets-btn');
            confirmBtn.textContent = `Confirm Targets (${selectedCount}/${requiredCount})`;
            confirmBtn.disabled = selectedCount < requiredCount;
        }
    }
    // ลำดับ 2: Discard Modal
    else if (discardState.isDiscarding && discardState.playerKey === myPlayerKey) {
        modals.discardOverlay.classList.add('visible');
        const selectedCount = discardState.cardsToDiscard?.length || 0;
        document.getElementById('discard-prompt').textContent = `Please select ${discardState.count} card(s) from your hand to discard. (${selectedCount}/${discardState.count})`;
        // สมมติว่าคุณจะจัดการ selected card ใน state อื่น
        document.getElementById('confirm-discard-btn').disabled = selectedCount < discardState.count;
    }
    // ลำดับ 2: Effect Choice Modal
    else if (choiceState.isChoosing && gameState.turn === myPlayerKey) {
        modals.effectChoiceModal.classList.add('visible');
        if (choiceState.card) {
            document.getElementById('effect-choice-title').textContent = `Choose Effect for ${choiceState.card.name}`;
        }
    }
    // ลำดับ 6: Magic Payment Modal     
    else if (magicPaymentState.isPaying && amIPaying) {
        modals.magicPaymentOverlay.classList.add('visible');
        if(magicPaymentState.cardToUse) {
            document.getElementById('magic-payment-title').textContent = `Use Magic: ${magicPaymentState.cardToUse.name}`;
            document.getElementById('magic-payment-cost-value').textContent = magicPaymentState.costToPay;
            document.getElementById('magic-payment-selected-value').textContent = magicPaymentState.selectedCores.length;
            document.getElementById('confirm-magic-btn').disabled = magicPaymentState.selectedCores.length < magicPaymentState.costToPay;
        }
    }

    // ลำดับ 3: Flash Modal
    
    // else if (flashState.isActive && flashState.priority === myPlayerKey) {
    //     modals.flashOverlay.classList.add('visible');
    //     document.getElementById('flash-title').textContent = `Flash Timing (${flashState.priority}'s Priority)`;
    // }

    else if (flashState.isActive && flashState.priority === myPlayerKey &&
             !magicPaymentState.isPaying && 
             !targetingState.isTargeting &&
             !choiceState.isChoosing) {
        modals.flashOverlay.classList.add('visible');
        document.getElementById('flash-title').textContent = `Flash Timing (${flashState.priority}'s Priority)`;
    }


    // ลำดับ 4: Defense Modal
    else if (attackState.isAttacking && attackState.defender === myPlayerKey && !flashState.isActive) {
        modals.defenseOverlay.classList.add('visible');
        const attackerPlayerKey = myPlayerKey === 'player1' ? 'player2' : 'player1';
        const attacker = gameState[attackerPlayerKey]?.field.find(s => s.uid === attackState.attackerUid);
        if (attacker) {
            const { bp } = getSpiritLevelAndBP(attacker, attackerPlayerKey, gameState);
            document.getElementById('defense-attacker-info').textContent = `Attacker: ${attacker.name} (BP: ${bp})`;
        }
    }
    // ลำดับ 5: Placement Modal
    else if (placementState.isPlacing && gameState.turn === myPlayerKey) {
        modals.placementOverlay.classList.add('visible');
        const currentPlayerState = gameState[myPlayerKey];
        const targetCard = currentPlayerState.field.find(s => s.uid === placementState.targetSpiritUid);
        if (targetCard) {
            document.getElementById('placement-title').textContent = `Place Cores on ${targetCard.name}`;
            const confirmBtn = document.getElementById('confirm-placement-btn');
            confirmBtn.disabled = (targetCard.type === 'Spirit' && targetCard.cores.length === 0);
        }
    }

    // ลำดับ 7: Summon Payment Modal
    else if (summonState.isSummoning && gameState.turn === myPlayerKey) {
        modals.summonPaymentOverlay.classList.add('visible');
        if(summonState.cardToSummon) {
            document.getElementById('summon-payment-title').textContent = `Summoning ${summonState.cardToSummon.name}`;
            document.getElementById('payment-cost-value').textContent = summonState.costToPay;
            document.getElementById('payment-selected-value').textContent = summonState.selectedCores.length;
            document.getElementById('confirm-summon-btn').disabled = summonState.selectedCores.length < summonState.costToPay;
        }
    }
    // ลำดับ 8: Core Removal Confirmation Modal
    else if (coreRemovalState.isConfirming && gameState.turn === myPlayerKey) {
        modals.coreRemovalConfirmationOverlay.classList.add('visible');
    }


    // --- 3. Modal ที่ทำงานแยกต่างหาก ---

    // Game Over Modal
    if (gameState.gameover) {
        modals.gameOverModal.classList.add('visible');
        let winnerText = '';
        if (gameState.player1.life <= 0) {
            winnerText = 'Player 2 Wins!';
        } else if (gameState.player2.life <= 0) {
            winnerText = 'Player 1 Wins!';
        }
        document.getElementById('game-over-message').textContent = winnerText;
    }

    // Deck Discard Viewer Modal
    const discardViewerState = gameState.deckDiscardViewerState;
    if (discardViewerState.isActive) {
        modals.deckDiscardViewerModal.classList.add('visible');
        const container = document.getElementById('deck-discard-viewer-container');
        container.innerHTML = '';
        discardViewerState.cards.forEach(card => {
            const cardEl = createCardElement(card, 'viewer', discardViewerState.owner, gameState, myPlayerKey);
            container.appendChild(cardEl);
        });
    } else {
        modals.deckDiscardViewerModal.classList.remove('visible');
    }

}