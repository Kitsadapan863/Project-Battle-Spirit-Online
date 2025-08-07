// js/ui/components.js
import { getCardLevel, getSpiritLevelAndBP } from '../utils.js';

export function getDOMElements() {
    return {
        playerHandContainer: document.querySelector('#player-hand .card-container'),
        opponentHandContainer: document.querySelector('#opponent-hand .card-container'),
        playerFieldElement: document.getElementById('player-field'),
        opponentFieldElement: document.getElementById('opponent-field'),
        playerSpiritsContainer: document.getElementById('player-spirits-container'),
        playerNexusesContainer: document.getElementById('player-nexuses-container'),
        opponentSpiritsContainer: document.getElementById('opponent-spirits-container'),
        opponentNexusesContainer: document.getElementById('opponent-nexuses-container'),
        playerReserveCoreContainer: document.getElementById('player-reserve-core-container'),
        opponentReserveCoreContainer: document.getElementById('opponent-reserve-core-container'),
        playerCostTrashZone: document.getElementById('player-cost-trash-zone'),
        opponentCostTrashZone: document.getElementById('opponent-cost-trash-zone'),
        playerCardTrashZone: document.getElementById('player-card-trash-zone'),
        opponentCardTrashZone: document.getElementById('opponent-card-trash-zone'),
        playerLifeCirclesContainer: document.getElementById('player-life-circles'),
        opponentLifeCirclesContainer: document.getElementById('opponent-life-circles'),
        playerDeckElement: document.getElementById('player-deck'),
        opponentDeckElement: document.getElementById('opponent-deck'),
        turnIndicator: document.getElementById('turn-indicator'),
        turnNumberElement: document.getElementById('turn-number'),
        phaseIndicator: document.getElementById('phase-indicator'),
        phaseBtn: document.getElementById('phase-btn'),
        restartBtn: document.getElementById('restart-btn'),
        cardDetailViewer: document.getElementById('card-detail-viewer'),
        detailCardImage: document.getElementById('detail-card-image'),
        detailCardEffects: document.getElementById('detail-card-effects'),
        gameOverModal: document.getElementById('game-over-modal'),
        cardTrashModal: document.getElementById('card-trash-modal'),
        opponentCardTrashModal: document.getElementById('opponent-card-trash-modal'),
        effectChoiceModal: document.getElementById('effect-choice-modal'),
        deckDiscardViewerModal: document.getElementById('deck-discard-viewer-modal'),
        cardTrashViewerContainer: document.getElementById('card-trash-viewer-container'),
        opponentCardTrashViewerContainer: document.getElementById('opponent-card-trash-viewer-container'),
        deckDiscardViewerContainer: document.getElementById('deck-discard-viewer-container'),
        effectChoiceTitle: document.getElementById('effect-choice-title'),
        effectChoiceButtons: document.getElementById('effect-choice-buttons'),
        confirmSummonBtn: document.getElementById('confirm-summon-btn'),
        cancelSummonBtn: document.getElementById('cancel-summon-btn'),
        confirmPlacementBtn: document.getElementById('confirm-placement-btn'),
        takeDamageBtn: document.getElementById('take-damage-btn'),
        passFlashBtn: document.getElementById('pass-flash-btn'),
        confirmMagicBtn: document.getElementById('confirm-magic-btn'),
        cancelMagicBtn: document.getElementById('cancel-magic-btn'),
        confirmDiscardBtn: document.getElementById('confirm-discard-btn'),
        confirmCoreRemovalBtn: document.getElementById('confirm-core-removal-btn'),
        cancelCoreRemovalBtn: document.getElementById('cancel-core-removal-btn'),
        closeTrashViewerBtn: document.getElementById('close-trash-viewer-btn'),
        closeOpponentTrashViewerBtn: document.getElementById('close-opponent-trash-viewer-btn'),
        cancelEffectChoiceBtn: document.getElementById('cancel-effect-choice-btn'),
        confirmDeckDiscardBtn: document.getElementById('confirm-deck-discard-btn'),
    };
}

export function createCardElement(cardData, location, owner, gameState, myPlayerKey, callbacks) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.id = cardData.uid;
    cardDiv.innerHTML = `<img src="${cardData.image}" alt="${cardData.name}" draggable="false"/>`;

    const isMyTurn = gameState.turn === myPlayerKey;
    const hasPriority = gameState.flashState.priority === myPlayerKey;

    if (location === 'hand' && owner === myPlayerKey) {
        const isMainStep = gameState.phase === 'main';

        // เงื่อนไขสำหรับ Main Step
        if (isMyTurn && isMainStep) {
            if (cardData.type === 'Spirit' || cardData.type === 'Nexus') {
                cardDiv.classList.add('can-summon');
            }
            // ตรวจสอบทั้ง 'main' และ 'flash' สำหรับการใช้ Magic ใน Main Step
            if (cardData.type === 'Magic' && cardData.effects?.some(e => e.timing === 'main' || e.timing === 'flash')) {
                cardDiv.classList.add('can-main');
            }
        }

        // เงื่อนไขสำหรับ Flash Timing (ทำงานแยกเป็นอิสระจาก Main Step)
        if (gameState.flashState.isActive && hasPriority) {
            if (cardData.type === 'Magic' && cardData.effects?.some(e => e.timing === 'flash')) {
                cardDiv.classList.add('can-flash');
            }
        }
        
        // เงื่อนไขสำหรับ Discard Phase
        const discardState = gameState.discardState;
        if (discardState.isDiscarding && discardState.playerKey === myPlayerKey) {
            cardDiv.classList.add('can-discard');
            if (discardState.cardsToDiscard?.some(c => c.uid === cardData.uid)) {
                cardDiv.classList.add('selected-for-discard');
            }
        }
        
    } else if (location === 'field') {
        if (cardData.type === 'Nexus') {
            const { level } = getCardLevel(cardData);
            cardDiv.innerHTML += `<div class="card-info"><p>Lv${level} Nexus</p></div>`;
        } else { // Spirit
            const { level, bp, isBuffed } = getSpiritLevelAndBP(cardData, owner, gameState);
            const bpClass = isBuffed ? 'bp-buffed' : '';
            cardDiv.innerHTML += `<div class="card-info"><p class="${bpClass}">Lv${level} BP: ${bp}</p></div>`;
            
            if (cardData.isExhausted) {
                cardDiv.classList.add('exhausted');
            } else {
                if (owner === gameState.turn && isMyTurn && gameState.phase === 'attack' && !gameState.attackState.isAttacking) {
                    cardDiv.classList.add('can-attack');
                } else if (owner === myPlayerKey && gameState.attackState.isAttacking && gameState.attackState.defender === myPlayerKey && !gameState.flashState.isActive) {
                    cardDiv.classList.add('can-block');
                }
            }
        }
        cardDiv.innerHTML += `<div class="card-core-display"></div>`;

        // เงื่อนไขสำหรับ Targeting State
        const targetingState = gameState.targetingState;
        if (targetingState.isTargeting && gameState.turn === myPlayerKey) {
            // (ในอนาคตคุณสามารถเพิ่มเงื่อนไขการเลือกเป้าหมายที่ซับซ้อนขึ้นได้ที่นี่)
            if (cardData.type === 'Spirit') {
                cardDiv.classList.add('can-be-targeted');
            }
        }
    }
    return cardDiv;
}

export function createCoreElement(coreData, locationInfo, gameState, myPlayerKey, clientState ) {
    const coreDiv = document.createElement('div');
    coreDiv.className = 'core';
    coreDiv.id = coreData.id;
    const isMyTurn = gameState.turn === myPlayerKey;
    const isMainPhase = gameState.phase === 'main';
    const isPaying = gameState.summoningState.isSummoning || gameState.magicPaymentState.isPaying;
    const isPlacing = gameState.placementState.isPlacing;
    if (isMyTurn) {
        if (isPaying) {
            const paymentState = gameState.summoningState.isSummoning ? gameState.summoningState : gameState.magicPaymentState;
            if (paymentState.selectedCores.some(c => c.coreId === coreData.id)) {
                coreDiv.classList.add('selected-for-payment');
            }
            coreDiv.classList.add('selectable-for-payment');
        } else if (isPlacing) {
            coreDiv.classList.add('selectable-for-placement');
        } else if (isMainPhase) {
            // Logic สำหรับการย้าย Core ปกติใน Main Step
            coreDiv.classList.add('selectable-for-move');
            // ตรวจสอบจาก clientState ที่ส่งเข้ามา
            if (clientState?.selectedCoreForMove?.coreId === coreData.id) {
                coreDiv.classList.add('selected-for-move');
            }
        }
    }
    return coreDiv;
}

export function formatCardEffects(cardData) {
    if (!cardData.effects || cardData.effects.length === 0) {
        return '';
    }
    return cardData.effects.map(effect => {
        const description = effect.description.replace(/\\n/g, '<br>');
        return `${description}`;
    }).join('<br><br>');
    // if (!card.effects || card.effects.length === 0) return '';
    // return card.effects.map(effect => {
    //     const timingText = `<strong>[${effect.timing.charAt(0).toUpperCase() + effect.timing.slice(1)}]</strong>`;
    //     const description = effect.description.replace(/\\n/g, '<br>');
    //     return `${timingText}<br>${description}`;
    // }).join('<br><br>');
}