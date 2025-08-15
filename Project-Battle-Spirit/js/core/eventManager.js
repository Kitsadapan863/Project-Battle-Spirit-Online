// ในไฟล์ Project-Battle-Spirit/js/core/eventManager.js

// ประกาศ localGameState นอกฟังก์ชันเพื่อให้เข้าถึงได้
let localGameState = {};
// State ชั่วคราวสำหรับเก็บข้อมูล Core ที่ถูกเลือกเพื่อย้าย
let clientState = {
    selectedCoreForMove: null
};

export function updateLocalGameState(newState) {
    // Reset สถานะการเลือก Core ทุกครั้งที่ได้รับ state ใหม่จาก server
    // เพื่อป้องกันการเลือกค้าง
    if (clientState.selectedCoreForMove && newState.turn === localGameState.turn && newState.phase === localGameState.phase) {
        // ไม่ต้อง reset ถ้าเป็นแค่การ re-render เล็กน้อย
    } else {
       clientState.selectedCoreForMove = null;
    }
    localGameState = newState;
}

// ฟังก์ชันสำหรับบังคับ re-render UI ฝั่ง client
let forceUIRender = () => {}; 
export function setForceUIRender(renderFunc) {
    forceUIRender = renderFunc;
}

export function getClientState() {
    return clientState;
}

export function setupInitialEventListeners(sendActionToServer, dom, callbacks) {
    const gameBoard = document.querySelector('.game-board');

gameBoard.addEventListener('click', (event) => {
    const targetEl = event.target;
    const cardEl = targetEl.closest('.card');
    const coreEl = targetEl.closest('.core');
    const reserveEl = targetEl.closest('#player-reserve-zone');

    const myPlayerKey = callbacks.getMyPlayerKey();
    if (!localGameState || !myPlayerKey) return;

    const isMyTurn = localGameState.turn === myPlayerKey;
    const isMainPhase = localGameState.phase === 'main';

    // --- START: แก้ไขบรรทัดนี้ ---
    const isPayingForSummon = localGameState.summoningState?.isSummoning;
    const isPayingForMagic = localGameState.magicPaymentState?.isPaying;
    const isPlacingCores = localGameState.placementState?.isPlacing;
    const isEvolving = localGameState.evolutionState?.isActive;
    // ++ เพิ่ม isEvolving เข้าไปในเงื่อนไขที่นี่ ++
    const isActionBlocked = isPayingForSummon || isPlacingCores || isPayingForMagic || isEvolving;
    // --- END: แก้ไขบรรทัดนี้ ---

    // ลำดับที่ 1: การวาง Core ที่เลือกไว้ (Move Core ปกติ)
    if (isMyTurn && isMainPhase && !isActionBlocked && clientState.selectedCoreForMove) {
        const targetUid = cardEl ? cardEl.id : (reserveEl ? 'reserve' : null);
        if (targetUid) {
            const payload = {
                coreId: clientState.selectedCoreForMove.coreId,
                from: clientState.selectedCoreForMove.from,
                sourceCardUid: clientState.selectedCoreForMove.sourceCardUid,
                targetCardUid: targetUid !== 'reserve' ? targetUid : null
            };
            sendActionToServer({ type: 'MOVE_CORE', payload });
        }
        clientState.selectedCoreForMove = null;
        forceUIRender();
        return;
    }

    // ลำดับที่ 2: การคลิกบน Core โดยตรง
    if (coreEl) {
        // จัดลำดับความสำคัญใหม่ ให้ Action เฉพาะทางอยู่ก่อน

        if (isEvolving && coreEl.classList.contains('selectable-for-evolution')) {
            const fromCardEl = coreEl.closest('.card');
            sendActionToServer({ type: 'SELECT_CORE_FOR_EVOLUTION', payload: {
                coreId: coreEl.id,
                fromUid: fromCardEl.id
            }});
            return;
        }
        if ((isPayingForSummon || isPayingForMagic) && coreEl.classList.contains('selectable-for-payment')) {
            const spiritCardEl = coreEl.closest('.card');
            sendActionToServer({
                type: 'SELECT_CORE_FOR_PAYMENT',
                payload: {
                    coreId: coreEl.id,
                    from: spiritCardEl ? 'card' : 'reserve',
                    spiritUid: spiritCardEl ? spiritCardEl.id : null
                }
            });
            return;
        }
        if (isPlacingCores && coreEl.classList.contains('selectable-for-placement')) {
            const fromCardEl = coreEl.closest('.card');
            sendActionToServer({
                type: 'SELECT_CORE_FOR_PLACEMENT',
                payload: {
                    coreId: coreEl.id,
                    from: fromCardEl ? 'card' : 'reserve',
                    sourceCardUid: fromCardEl ? fromCardEl.id : null
                }
            });
            return;
        }
        // Logic สำหรับ "เลือก" Core เพื่อย้าย (คลิกครั้งที่ 1) จะทำงานเมื่อไม่มี Action อื่นค้างอยู่
        if (isMyTurn && isMainPhase && !isActionBlocked) {
            const fromCardEl = coreEl.closest('.card');
            clientState.selectedCoreForMove = {
                coreId: coreEl.id,
                from: fromCardEl ? 'card' : 'reserve',
                sourceCardUid: fromCardEl ? fromCardEl.id : null
            };
            forceUIRender();
            return;
        }
    }
    // --- ลำดับที่ 3: ถ้าไม่ใช่การทำงานเกี่ยวกับ Core, ให้ตรวจสอบการคลิกบน Card ---
    if (cardEl) {
        const cardId = cardEl.id;

        if (cardEl.classList.contains('can-evolve')) {
            sendActionToServer({ type: 'INITIATE_EVOLUTION', payload: { spiritUid: cardId }});
            return;
        }
        
        if (cardEl.closest('#player-hand')) {
            const discardState = localGameState.discardState;
            if (discardState.isDiscarding && discardState.playerKey === myPlayerKey && cardEl.classList.contains('can-discard')) {
                sendActionToServer({ type: 'SELECT_CARD_FOR_DISCARD', payload: { cardUid: cardId } });
                return;
            }
            if (cardEl.classList.contains('can-summon')) {
                sendActionToServer({ type: 'INITIATE_SUMMON', payload: { cardUid: cardId } });
            } else if (cardEl.classList.contains('can-main')) {
                sendActionToServer({ type: 'INITIATE_MAGIC', payload: { cardUid: cardId, timing: 'main' } });
            } else if (cardEl.classList.contains('can-flash')) {
                sendActionToServer({ type: 'INITIATE_MAGIC', payload: { cardUid: cardId, timing: 'flash' } });
            }
        } else if (cardEl.closest('#player-field') || cardEl.closest('#opponent-field')) {
            //SELECT_ATTACK_TARGET
            if (cardEl.classList.contains('can-be-attack-target')) {
                sendActionToServer({ type: 'SELECT_ATTACK_TARGET', payload: { targetUid: cardId }});
                return;
            }
            if (localGameState.targetingState?.isTargeting && cardEl.classList.contains('can-be-targeted')) {
                sendActionToServer({ type: 'SELECT_TARGET', payload: { targetUid: cardId } });
                return;
            }
            if (cardEl.classList.contains('can-attack')) {
                sendActionToServer({ type: 'DECLARE_ATTACK', payload: { attackerUid: cardId } });
            } else if (cardEl.classList.contains('can-block')) {
                sendActionToServer({ type: 'DECLARE_BLOCK', payload: { blockerUid: cardId } });
            }
        }
    }
});

    // เปลี่ยนจาก gameBoard เป็น document
   document.addEventListener('mouseover', (event) => {
        const cardEl = event.target.closest('.card');
        
        // เพิ่มเงื่อนไขป้องกันการ์ดหลังบ้านของคู่แข่ง
        if (!cardEl || cardEl.closest('#opponent-hand .card-container')) {
             dom.cardDetailViewer.classList.remove('visible');
             return;
        }

        const cardId = cardEl.id;
        let cardData = null;
        
        // ค้นหาการ์ดใน state ทั้งหมด
        for (const playerKey of ['player1', 'player2']) {
            if (localGameState[playerKey]) {
                const pState = localGameState[playerKey];
                // เพิ่มการค้นหาใน cardTrash ด้วย
                const found = [...pState.hand, ...pState.field, ...pState.cardTrash].find(c => c.uid === cardId);
                if (found) {
                    cardData = found;
                    break;
                }
            }
        }

        if (cardData) {
            dom.detailCardImage.src = cardData.image;
            dom.detailCardEffects.innerHTML = callbacks.formatEffectText(cardData);
            dom.cardDetailViewer.classList.add('visible');
        }
    });

    // เปลี่ยนจาก gameBoard เป็น document
    document.addEventListener('mouseout', (event) => {
        dom.cardDetailViewer.classList.remove('visible');
    });
    
    document.getElementById('phase-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) sendActionToServer({ type: 'ADVANCE_PHASE' });
    });
    
    document.getElementById('confirm-summon-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) sendActionToServer({ type: 'CONFIRM_SUMMON' });
    });

    document.getElementById('cancel-summon-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CANCEL_SUMMON' });
    });

    document.getElementById('confirm-evolution-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CONFIRM_EVOLUTION' });
    });
    document.getElementById('cancel-evolution-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CANCEL_EVOLUTION' });
    });

    // --- START: เพิ่ม Event Listener สำหรับปุ่ม Placement ---
    document.getElementById('confirm-placement-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) {
            console.log('[CLIENT] Confirm Placement clicked. Sending CONFIRM_PLACEMENT...');
            sendActionToServer({ type: 'CONFIRM_PLACEMENT' });
        }
    });
    // --- END: เพิ่ม Event Listener สำหรับปุ่ม Placement ---

    document.getElementById('pass-flash-btn').addEventListener('click', () => {
        console.log('[CLIENT] Pass Flash clicked. Sending PASS_FLASH...');
        sendActionToServer({ type: 'PASS_FLASH' });
    });

    //เพิ่ม Event Listener สำหรับปุ่มรับ Damage 
    document.getElementById('take-damage-btn').addEventListener('click', () => {
        console.log('[CLIENT] Take Life Damage clicked. Sending TAKE_LIFE_DAMAGE...');
        sendActionToServer({ type: 'TAKE_LIFE_DAMAGE' });
    });

    //Core เม็ดสุดท้ายออกจาก Spirit
    document.getElementById('confirm-core-removal-btn').addEventListener('click', () => {
        console.log('[CLIENT] Confirm Core Removal clicked. Sending CONFIRM_CORE_REMOVAL...');
        sendActionToServer({ type: 'CONFIRM_CORE_REMOVAL' });
    });

    document.getElementById('cancel-core-removal-btn').addEventListener('click', () => {
        console.log('[CLIENT] Cancel Core Removal clicked. Sending CANCEL_CORE_REMOVAL...');
        sendActionToServer({ type: 'CANCEL_CORE_REMOVAL' });
    });

    document.getElementById('rps-choices').addEventListener('click', (e) => {
        const choice = e.target.closest('.rps-btn')?.dataset.choice;
        if (choice) {
            sendActionToServer({ type: 'CHOOSE_RPS', payload: { choice } });
        }
    });

    // Event Listeners for Card Trash Modals
    dom.playerCardTrashZone.addEventListener('click', () => {
        dom.cardTrashViewerContainer.innerHTML = ''; // Clear previous cards
        const myState = localGameState[callbacks.getMyPlayerKey()];
        myState.cardTrash.forEach(card => {
            // เรียกใช้ผ่าน callbacks
            const cardEl = callbacks.createCardElement(card, 'viewer', callbacks.getMyPlayerKey(), localGameState, callbacks.getMyPlayerKey());
            dom.cardTrashViewerContainer.appendChild(cardEl);
        });
        dom.cardTrashModal.classList.add('visible');
    });

    dom.opponentCardTrashZone.addEventListener('click', () => {
        dom.opponentCardTrashViewerContainer.innerHTML = ''; // Clear previous cards
        const myKey = callbacks.getMyPlayerKey();
        const opponentKey = myKey === 'player1' ? 'player2' : 'player1';
        const opponentState = localGameState[opponentKey];
        if (opponentState) {
            opponentState.cardTrash.forEach(card => {
                // เรียกใช้ผ่าน callbacks
                const cardEl = callbacks.createCardElement(card, 'viewer', opponentKey, localGameState, myKey);
                dom.opponentCardTrashViewerContainer.appendChild(cardEl);
            });
        }
        dom.opponentCardTrashModal.classList.add('visible');
    });

    // Listeners for closing the modals
    dom.closeTrashViewerBtn.addEventListener('click', () => {
        dom.cardTrashModal.classList.remove('visible');
    });

    dom.closeOpponentTrashViewerBtn.addEventListener('click', () => {
        dom.opponentCardTrashModal.classList.remove('visible');
    });
    // Listeners for deck discard
    dom.confirmDeckDiscardBtn.addEventListener('click', () => {
        sendActionToServer({ type: 'CONFIRM_DECK_DISCARD' });
    });

    // Listeners for Magic
     document.getElementById('confirm-magic-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) {
            sendActionToServer({ type: 'CONFIRM_MAGIC' });
        }
    });

    document.getElementById('cancel-magic-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CANCEL_MAGIC' });
    });

        // Listeners for Effect Choice Modal
    const effectChoiceButtons = dom.effectChoiceButtons; // ควรจะชี้ไปที่ div ที่ครอบปุ่ม
    effectChoiceButtons.innerHTML = `
        <button id="effect-choice-main-btn">Main</button>
        <button id="effect-choice-flash-btn">Flash</button>
    `;

    document.getElementById('effect-choice-main-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CHOOSE_MAGIC_EFFECT', payload: { chosenTiming: 'main' } });
    });

    document.getElementById('effect-choice-flash-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CHOOSE_MAGIC_EFFECT', payload: { chosenTiming: 'flash' } });
    });

    dom.cancelEffectChoiceBtn.addEventListener('click', () => {
        sendActionToServer({ type: 'CANCEL_EFFECT_CHOICE' });
    });
    //ยืนยันการทิ้งการ์ด
    document.getElementById('confirm-discard-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) {
            console.log('[CLIENT] Confirm Discard clicked. Sending CONFIRM_DISCARD...');
            sendActionToServer({ type: 'CONFIRM_DISCARD' });
        }
    });

    dom.confirmTargetsBtn.addEventListener('click', (e) => {
        console.log('[CLIENT DEBUG] "Confirm Targets" button was clicked!');
        if (!e.target.disabled) {
            sendActionToServer({ type: 'CONFIRM_TARGETS' });
        }
    });
    //เลือกเป้าโจมตี
    document.getElementById('attack-choice-life-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CHOOSE_ATTACK_TYPE', payload: { choice: 'life' } });
    });
    document.getElementById('attack-choice-spirit-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CHOOSE_ATTACK_TYPE', payload: { choice: 'spirit' } });
    });
    //แสดงการ์ด
    document.getElementById('confirm-reveal-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CONFIRM_REVEAL' });
    });

    // ปุ่ม Skip
    document.getElementById('skip-assault-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'SKIP_ASSAULT' });
    });

    // Container ของ Nexus (ใช้ Event Delegation)
    document.getElementById('assault-nexus-container').addEventListener('click', (event) => {
        const nexusEl = event.target.closest('.card');
        if (nexusEl) {
            sendActionToServer({ 
                type: 'USE_ASSAULT', 
                payload: { 
                    spiritUid: localGameState.assaultState.spiritUid,
                    nexusUid: nexusEl.id 
                }
            });
        }
    });

    document.getElementById('effect-resolution-buttons').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.effectId) {
            const chosenEffectId = parseInt(button.dataset.effectId, 10);
            sendActionToServer({ type: 'RESOLVE_CHOSEN_EFFECT', payload: { chosenEffectId } });
        }
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        // สั่งให้หน้าเว็บโหลดใหม่ทั้งหมดเพื่อเริ่มการเชื่อมต่อและเกมใหม่
        location.reload();
    });


}