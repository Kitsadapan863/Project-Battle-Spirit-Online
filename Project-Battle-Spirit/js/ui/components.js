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
        confirmTargetsBtn: document.getElementById('confirm-targets-btn')
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
        const isFlashStep = gameState.flashState.isActive && gameState.flashState.priority === myPlayerKey;
        if (isMyTurn && isMainStep) {
            if (cardData.type === 'Spirit' || cardData.type === 'Nexus') {
                cardDiv.classList.add('can-summon');
            }
            if (cardData.type === 'Magic' && cardData.effects?.some(e => e.timing === 'main' || e.timing === 'flash')) {
                cardDiv.classList.add('can-main');
            }
        }
        // เพื่ม class เพื่อให้สามารถใช้ ใน flash timing ได้
        if (isFlashStep) {
            if (cardData.type === 'Magic' && cardData.effects?.some(e => e.timing === 'flash')) {
                cardDiv.classList.add('can-flash');
            }
        }

        if (gameState.flashState.isActive && hasPriority) {
            if (cardData.type === 'Magic' && cardData.effects?.some(e => e.timing === 'flash')) {
                cardDiv.classList.add('can-flash');
            }
        }
        
        const discardState = gameState.discardState;
        if (discardState.isDiscarding && discardState.playerKey === myPlayerKey) {
            cardDiv.classList.add('can-discard');
            if (discardState.cardsToDiscard?.some(c => c.uid === cardData.uid)) {
                cardDiv.classList.add('selected-for-discard');
            }
        }

   } else if (location === 'field') {
        const targetingState = gameState.targetingState;

        if (cardData.type === 'Nexus') {
            const { level } = getCardLevel(cardData);
            cardDiv.innerHTML += `<div class="card-info"><p>Lv${level} Nexus</p></div>`;
        } else { // Spirit
            const { level, bp, isBuffed } = getSpiritLevelAndBP(cardData, owner, gameState);
            const bpClass = isBuffed ? 'bp-buffed' : '';
            cardDiv.innerHTML += `<div class="card-info"><p class="${bpClass}">Lv${level} BP: ${bp}</p></div>`;
            
            const canEvolve = cardData.effects?.some(e => e.keyword === 'Evolution');
            const isValidTimingForFlash = (gameState.flashState.isActive && gameState.flashState.priority === myPlayerKey);
            if (canEvolve && isValidTimingForFlash) {
                cardDiv.classList.add('can-evolve');
            }
        }

        // ตรวจสอบสถานะ Exhausted สำหรับการ์ดทุกใบบนสนาม
        if (cardData.isExhausted) {
            cardDiv.classList.add('exhausted');
        } else {
            // เงื่อนไขการโจมตี/ป้องกันจะยังคงอยู่เฉพาะกับ Spirit
            if (cardData.type === 'Spirit') {
                if (owner === gameState.turn && isMyTurn && gameState.phase === 'attack' && !gameState.attackState.isAttacking) {
                    cardDiv.classList.add('can-attack');
                } 
                else if (owner === myPlayerKey && gameState.attackState.isAttacking && gameState.attackState.defender === myPlayerKey && !gameState.flashState.isActive) {
                    cardDiv.classList.add('can-block');
                }
            }
        }
       
        if (targetingState.isTargeting && targetingState.targetPlayer === myPlayerKey) {
            const effect = targetingState.forEffect;
            const isMyCard = owner === myPlayerKey;
            let canBeTargeted = false;

            // --- Path 1: การเลือกเป้าหมายแบบปกติ (มีการระบุ target) ---
            if (effect.target) {
                const targetInfo = Array.isArray(effect.target) ? effect.target[0] : effect.target;
                const cardType = cardData.type.toLowerCase();
                
                // ตรวจสอบชนิดของการ์ด
               
                if (targetInfo.type === cardType) {
                    const scope = targetInfo.scope;
                    // ตรวจสอบว่าเป็นเป้าหมายที่ถูกต้องตามขอบเขตหรือไม่
                    if (scope === 'any' || (scope === 'player' && isMyCard) || (scope === 'opponent' && !isMyCard)) {
                        canBeTargeted = true;
                    }
                  
                    // ถ้าในเอฟเฟกต์มีการระบุเงื่อนไข costOrLess
                    if (canBeTargeted && targetInfo.costOrLess !== undefined) {
                      
                        // ถ้า cost ของการ์ดใบนี้ มากกว่า ที่กำหนดไว้ ให้เลือกไม่ได้
                        if (cardData.cost > targetInfo.costOrLess) {
                            canBeTargeted = false;
                        }
                    }
                }
            }
            // --- Path 2: การเลือกเป้าหมายแบบพิเศษ (ใช้ condition) ---
            else if (effect.keyword === 'addEffects') {
                const nameCondition = effect.condition[0];
                
                if (cardData.type === 'Spirit' && isMyCard && cardData.name.includes(nameCondition)) {
                    canBeTargeted = true;
                }
            }
            
            // ถ้าเงื่อนไขข้อใดข้อหนึ่งถูกต้อง ให้แสดงผลว่าเลือกได้
            if (canBeTargeted) {
                cardDiv.classList.add('can-be-targeted');
            }
        }

        cardDiv.innerHTML += `<div class="card-core-display"></div>`;

        if (targetingState.isTargeting && targetingState.selectedTargets?.includes(cardData.uid)) {
            cardDiv.classList.add('selected-for-discard');
        }

        const attackTargetingState = gameState.attackTargetingState;
        if (attackTargetingState.isActive && owner !== myPlayerKey) {
            if (attackTargetingState.validTargets.includes(cardData.uid)) {
                cardDiv.classList.add('can-be-attack-target');
            }
        }
        // --- END: โค้ดที่แก้ไข ---
    }
    return cardDiv;
}

export function createCoreElement(coreData, locationInfo, gameState, myPlayerKey, clientState) {
    const coreDiv = document.createElement('div');
    coreDiv.className = 'core';
    coreDiv.id = coreData.id;

    const isMyTurn = gameState.turn === myPlayerKey;
    const iHavePriority = gameState.flashState.isActive && gameState.flashState.priority === myPlayerKey;
    const canInteract = isMyTurn || iHavePriority;

    const isPayingForSummon = gameState.summoningState.isSummoning && isMyTurn;
    const isPayingForMagic = gameState.magicPaymentState.isPaying && gameState.magicPaymentState.payingPlayer === myPlayerKey;
    const isPaying = isPayingForSummon || isPayingForMagic;

    const isPlacing = gameState.placementState.isPlacing && isMyTurn;
    const isEvolving = gameState.evolutionState.isActive;

    // --- START: แก้ไข Logic ส่วนนี้ ---

    // ลำดับ 1: ตรวจสอบ Evolution ก่อน
    if (isEvolving && canInteract) {
        const targetSpiritUid = gameState.evolutionState.spiritUid;
        const isSelected = gameState.evolutionState.selectedCores.some(c => c.coreId === coreData.id);
        
        // ทำให้เลือกได้เฉพาะ Core จาก Spirit "ตัวอื่น" เท่านั้น
        if (locationInfo.type === 'field' && locationInfo.spiritUid !== targetSpiritUid) {
            coreDiv.classList.add('selectable-for-evolution');
            if (isSelected) {
                coreDiv.classList.add('selected-for-evolution');
            }
        }
    } 
    // ลำดับ 2: ถ้าไม่ใช่ Evolution ให้ตรวจสอบ Action อื่นๆ
    else if (canInteract && (isPaying || isPlacing)) {
        if (isPaying) {
            const paymentState = gameState.summoningState.isSummoning ? gameState.summoningState : gameState.magicPaymentState;
            const isSelected = paymentState.selectedCores.some(c => c.coreId === coreData.id);
            coreDiv.classList.add('selectable-for-payment');
            if (isSelected) {
                coreDiv.classList.add('selected-for-payment');
            }
        } else { // isPlacing
            const targetSpiritUid = gameState.placementState.targetSpiritUid;
            const coreIsOnTargetSpirit = locationInfo.spiritUid === targetSpiritUid;
            
            if (locationInfo.type === 'reserve' || (locationInfo.type === 'field' && !coreIsOnTargetSpirit)) {
                coreDiv.classList.add('selectable-for-placement');
            }
        }
    }
   
    const isMainPhase = gameState.phase === 'main';
    
    if (isMyTurn && isMainPhase && clientState?.selectedCoreForMove?.coreId === coreData.id) {
        coreDiv.classList.add('selected-for-move');
    }
    
    // --- END: แก้ไข Logic ส่วนนี้ ---
    
    return coreDiv;
}

export function formatCardEffects(cardData) {
    let finalText = '';

    // 1. ตรวจสอบและเพิ่ม Family (ถ้ามี)
    if (cardData.type === 'Spirit' && cardData.family && cardData.family.length > 0) {
        // จัดรูปแบบ Family ให้อ่านง่าย เช่น <Family: Terra Dragon / Ancient Dragon>
        const familyString = cardData.family.join(' / ');
        finalText += `<strong>&lt;Family: ${familyString}&gt;</strong><br><br>`;
    }

    // 2. เพิ่มเอฟเฟกต์ (โค้ดเดิมของคุณ)
    if (cardData.effects && cardData.effects.length > 0) {
        const effectsText = cardData.effects.map(effect => {
            const description = effect.description.replace(/\\n/g, '<br>');
            return `${description}`;
        }).join('<br><br>');
        
        finalText += effectsText;
    }

    return finalText;
}