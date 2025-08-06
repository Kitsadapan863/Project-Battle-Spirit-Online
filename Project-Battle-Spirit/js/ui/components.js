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

export function createCardElement(cardData, location, owner, gameState, myPlayerKey) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.id = cardData.uid;
    cardDiv.innerHTML = `<img src="${cardData.image}" alt="${cardData.name}" draggable="false"/>`;

    const isMyTurn = gameState.turn === myPlayerKey;

    if (location === 'hand' && owner === myPlayerKey) {
        const isMainStep = gameState.phase === 'main';

        console.groupCollapsed(`[UI DEBUG] Checking Hand Card: ${cardData.name}`);
        console.log(`- Card Owner: ${owner}, Your Key: ${myPlayerKey}`);
        console.log(`- Is My Turn? ${isMyTurn} (Game Turn: ${gameState.turn})`);
        console.log(`- Is Main Phase? ${isMainStep} (Game Phase: ${gameState.phase})`);
        console.log(`- Card Type: ${cardData.type}`);
        
        // --- DEBUG LOG ---
        if (isMyTurn && isMainStep) {
            console.log(`Checking card ${cardData.name} (Type: ${cardData.type}). Is my turn: ${isMyTurn}, Is main step: ${isMainStep}`);
        }

        if (isMyTurn && isMainStep) {
            if (cardData.type === 'Spirit' || cardData.type === 'Nexus') {
                cardDiv.classList.add('can-summon');
                console.log(`%c[DEBUG] Added .can-summon to ${cardData.name}`, 'color: lightgreen;');
            }
            if (cardData.type === 'Magic' && cardData.effects?.some(e => e.timing === 'main')) {
                cardDiv.classList.add('can-main');
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
                }
                else if (owner === myPlayerKey && gameState.attackState.isAttacking && gameState.attackState.defender === myPlayerKey && !gameState.flashState.isActive) {
                    cardDiv.classList.add('can-block');
                }
            }
        }
        cardDiv.innerHTML += `<div class="card-core-display"></div>`;
    }
    return cardDiv;
}

export function createCoreElement(coreData, locationInfo, gameState, myPlayerKey) {
    const coreDiv = document.createElement('div');
    coreDiv.className = 'core';
    coreDiv.id = coreData.id;
    const isMyTurn = gameState.turn === myPlayerKey;
    const isPaying = gameState.summoningState.isSummoning || gameState.magicPaymentState.isPaying;
    const isPlacing = gameState.placementState.isPlacing;
    if (isMyTurn && (isPaying || isPlacing)) {
        if (isPaying) {
            const paymentState = gameState.summoningState.isSummoning ? gameState.summoningState : gameState.magicPaymentState;
            const isSelected = paymentState.selectedCores.some(c => c.coreId === coreData.id);
            coreDiv.classList.add('selectable-for-payment');
            if (isSelected) {
                coreDiv.classList.add('selected-for-payment');
            }
        } else {
            coreDiv.classList.add('selectable-for-placement');
        }
    }
    return coreDiv;
}

// ... (Card Detail Viewer logic)