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

            // **(เพิ่ม)** ถ้าเป็น Spirit ที่มีความสามารถ High Speed
            if (cardData.type === 'Spirit' && cardData.effects?.some(e => e.keyword === 'high_speed')) {
                cardDiv.classList.add('can-high-speed-summon');
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

            // ตรวจสอบว่า Spirit มีความสามารถ Flash ที่ใช้งานได้หรือไม่
            const hasFlashAbility = cardData.effects?.some(e => e.timing === 'flash');
            if (isValidTimingForFlash && owner === myPlayerKey && !cardData.isExhausted && hasFlashAbility) {
                cardDiv.classList.add('can-use-flash-ability');
            }
        }

        const tributeState = gameState.tributeState;
        if (tributeState.isTributing && owner === myPlayerKey) {
            const tributeEffect = tributeState.cardToSummon.effects.find(e => e.keyword === 'tribute');
            if (tributeEffect && cardData.type === 'Spirit' && cardData.cost >= tributeEffect.condition.costOrMore) {
                cardDiv.classList.add('can-be-tribute'); // Class ใหม่สำหรับทำให้เรืองแสง
                if (tributeState.selectedTributeUid === cardData.uid) {
                    cardDiv.classList.add('selected-for-discard'); // ใช้ Class เดิมเพื่อให้มีกรอบแดง
                }
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

            // 1. หาว่าใครเป็น "เจ้าของเอฟเฟกต์"
            const effectOwnerKey = targetingState.cardSourceUid 
                ? (gameState.player1.field.some(c => c.uid === targetingState.cardSourceUid) ? 'player1' : 'player2')
                : (myPlayerKey === 'player1' ? 'player2' : 'player1'); // Fallback in case source is not on field
                        // เพิ่มเงื่อนไขพิเศษสำหรับ Thorn Prison
            if (effect.keyword === 'force_exhaust') {
                // ถ้าการ์ดที่กำลังแสดงผลเป็น Spirit ของเราเอง (myPlayerKey) และยังไม่ Exhausted
                if (cardData.type === 'Spirit' && owner === myPlayerKey && !cardData.isExhausted) {
                    canBeTargeted = true;
                }
            } else if (effect.keyword === 'boost_bp_by_exhausting_ally') {
                const requiredFamily = effect.target?.family[0];
                // เป้าหมายคือ Spirit ของเราเอง ที่ยังไม่เหนื่อย และมี Family ที่ถูกต้อง
                if (
                    cardData.type === 'Spirit' && 
                    owner === myPlayerKey && 
                    !cardData.isExhausted &&
                    cardData.family?.includes(requiredFamily)
                ) {
                    canBeTargeted = true;
                }
            } 
            // Logic เดิมสำหรับเอฟเฟกต์อื่นๆ
            else {

            // 2. ตรวจสอบเงื่อนไขตาม target scope
            if (effect.target) {
                const targetInfo = Array.isArray(effect.target) ? effect.target[0] : effect.target;
                
                // เช็คว่าการ์ดใบนี้ตรงกับประเภทที่ระบุหรือไม่ (spirit, nexus)
                if (targetInfo.type === cardData.type.toLowerCase()) {
                    let isTargetScopeMatch = false;
                    
                    // Scope 'opponent' หมายถึง การ์ดของฝ่ายตรงข้าม "ของเจ้าของเอฟเฟกต์"
                    if (targetInfo.scope === 'opponent' && owner !== effectOwnerKey) {
                        isTargetScopeMatch = true;
                    }
                    // Scope 'player' หมายถึง การ์ดของ "เจ้าของเอฟเฟกต์" เอง
                    else if (targetInfo.scope === 'player' && owner === effectOwnerKey) {
                        isTargetScopeMatch = true;
                    }
                    // Scope 'any' หมายถึงการ์ดของใครก็ได้
                    else if (targetInfo.scope === 'any') {
                        isTargetScopeMatch = true;
                    }

                    if (isTargetScopeMatch) {
                        canBeTargeted = true; // ผ่านเงื่อนไขเบื้องต้น

                        // เช็คเงื่อนไขย่อยอื่นๆ เช่น cost หรือ BP
                        if (targetInfo.costOrLess !== undefined && cardData.cost > targetInfo.costOrLess) {
                            canBeTargeted = false;
                        }
                        if (targetInfo.isExhausted === false && cardData.isExhausted) {
                            canBeTargeted = false; // สำหรับ Windstorm ที่เลือกได้เฉพาะตัวที่ไม่เหนื่อย
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

    // --- START: โค้ดที่แก้ไขสมบูรณ์ ---
    const isPayingForSummon = gameState.summoningState.isSummoning;
    const isPayingForMagic = gameState.magicPaymentState.isPaying;
    const isPaying = isPayingForSummon || isPayingForMagic;

    const isMyTurn = gameState.turn === myPlayerKey;
    const isPlacing = gameState.placementState.isPlacing && gameState.placementState.placingPlayer === myPlayerKey;
    const isEvolving = gameState.evolutionState.isActive && gameState.flashState.priority === myPlayerKey;
    // --- END: โค้ดที่แก้ไขสมบูรณ์ ---

    if (isPaying) {
        const payingPlayer = isPayingForSummon 
            ? gameState.summoningState.summoningPlayer 
            : gameState.magicPaymentState.payingPlayer;

        if (payingPlayer === myPlayerKey) {
            const isHighSpeed = gameState.summoningState.summonType === 'high_speed';

            if (isHighSpeed && locationInfo.type !== 'reserve') {
                // High Speed ใช้ได้แค่ Core จาก Reserve
            } else {
                const paymentState = isPayingForSummon ? gameState.summoningState : gameState.magicPaymentState;
                const isSelected = paymentState.selectedCores.some(c => c.coreId === coreData.id);
                coreDiv.classList.add('selectable-for-payment');
                if (isSelected) {
                    coreDiv.classList.add('selected-for-payment');
                }
            }
        }
    }
    else if (isPlacing) {
        const targetSpiritUid = gameState.placementState.targetSpiritUid;
        const coreIsOnTargetSpirit = locationInfo.spiritUid === targetSpiritUid;
        if (locationInfo.type.includes('reserve') || (locationInfo.type === 'field' && !coreIsOnTargetSpirit)) {
            coreDiv.classList.add('selectable-for-placement');
        }
    }
    else if (isEvolving) {
        const targetSpiritUid = gameState.evolutionState.spiritUid;
        const isSelected = gameState.evolutionState.selectedCores.some(c => c.coreId === coreData.id);
        
        if (locationInfo.type === 'field' && locationInfo.spiritUid !== targetSpiritUid) {
            coreDiv.classList.add('selectable-for-evolution');
            if (isSelected) {
                coreDiv.classList.add('selected-for-evolution');
            }
        }
    }
   
    const isMainPhase = gameState.phase === 'main';
    
    if (isMyTurn && isMainPhase && !isPaying && !isPlacing && !isEvolving && clientState?.selectedCoreForMove?.coreId === coreData.id) {
        coreDiv.classList.add('selected-for-move');
    }
    
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