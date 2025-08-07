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
        if (!localGameState || !myPlayerKey) return; // ป้องกัน Error ตอนเริ่มเกม

        const isMyTurn = localGameState.turn === myPlayerKey;
        const isMainPhase = localGameState.phase === 'main';

        // --- START: ย้ายการประกาศตัวแปรทั้งหมดมาไว้ที่นี่ ---
        const isPayingForSummon = localGameState.summoningState?.isSummoning;
        const isPayingForMagic = localGameState.magicPaymentState?.isPaying;
        const isPlacingCores = localGameState.placementState?.isPlacing;
        const isActionBlocked = isPayingForSummon || isPlacingCores || isPayingForMagic;
        // --- START: แก้ไข Logic การคลิก Core ---

        if (coreEl) {
            if (isMyTurn && (isPayingForSummon || isPayingForMagic) && coreEl.classList.contains('selectable-for-payment')) {
                // Logic สำหรับจ่ายค่าร่าย (ใช้ได้ทั้ง Summon และ Magic)
                const spiritCardEl = coreEl.closest('.card');
                const payload = {
                    coreId: coreEl.id,
                    from: spiritCardEl ? 'card' : 'reserve',
                    spiritUid: spiritCardEl ? spiritCardEl.id : null,
                };
                sendActionToServer({ type: 'SELECT_CORE_FOR_PAYMENT', payload: payload });
                return;
            }  else if (isMyTurn && isPlacingCores && coreEl.classList.contains('selectable-for-placement')) {
                // Logic สำหรับวาง Core หลัง Summon
                const fromCardEl = coreEl.closest('.card');
                const payload = {
                    coreId: coreEl.id,
                    from: fromCardEl ? 'card' : 'reserve',
                    sourceCardUid: fromCardEl ? fromCardEl.id : null,
                    targetCardUid: localGameState.placementState.targetSpiritUid
                };
                sendActionToServer({ type: 'MOVE_CORE', payload: payload });
                return;
            }
            // เพิ่ม Logic การย้าย Core ใน Main Step ที่นี่ (ถ้าต้องการ)
                    // --- Logic การย้าย Core ใน Main Step ---
        if (isMyTurn && isMainPhase && !isActionBlocked) {
            if (clientState.selectedCoreForMove) {
                // --- คลิกครั้งที่ 2 (เลือกเป้าหมาย) ---
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
                
                // ไม่ว่าจะสำเร็จหรือไม่ ให้ยกเลิกการเลือกเสมอ
                clientState.selectedCoreForMove = null;
                forceUIRender(); // Re-render เพื่อลบ highlight
                return;

            } else if (coreEl) {
                // --- คลิกครั้งที่ 1 (เลือก Core ต้นทาง) ---
                const fromCardEl = coreEl.closest('.card');
                clientState.selectedCoreForMove = {
                    coreId: coreEl.id,
                    from: fromCardEl ? 'card' : 'reserve',
                    sourceCardUid: fromCardEl ? fromCardEl.id : null
                };
                forceUIRender(); // Re-render เพื่อแสดง highlight
                return;
            }
        }
        }
        
        if (cardEl) {
            const cardId = cardEl.id;
            if (cardEl.closest('#player-hand')) {
                const discardState = localGameState.discardState;
                // --- START: เพิ่มเงื่อนไขนี้ ---
                if (discardState.isDiscarding && discardState.playerKey === myPlayerKey && cardEl.classList.contains('can-discard')) {
                    console.log(`[CLIENT] Card selected for discard: ${cardId}`);
                    sendActionToServer({ type: 'SELECT_CARD_FOR_DISCARD', payload: { cardUid: cardId } });
                    return; // หยุดการทำงานทันที
                }
                // Logic สำหรับการ์ดบนมือ
            if (cardEl.classList.contains('can-summon')) {
                    console.log('%c[CLIENT] Card has .can-summon class. Sending INITIATE_SUMMON...', 'color: green;');
                    sendActionToServer({ type: 'INITIATE_SUMMON', payload: { cardUid: cardId } });
                } else if (cardEl.classList.contains('can-main')) {
                    console.log('%c[CLIENT] Card has .can-main class. Sending INITIATE_MAGIC...', 'color: green;');
                    // ส่ง Action ให้ Server เพื่อเริ่มกระบวนการใช้ Magic
                    sendActionToServer({ type: 'INITIATE_MAGIC', payload: { cardUid: cardId, timing: 'main' } });
                }
            } else if (cardEl.closest('#player-field')) {
                if (localGameState.targetingState?.isTargeting && cardEl.classList.contains('can-be-targeted')) {
                console.log(`[CLIENT] Target selected: ${cardEl.id}`);
                sendActionToServer({ type: 'SELECT_TARGET', payload: { targetUid: cardEl.id } });
                return;
            }
                // Logic สำหรับการ์ดบนสนาม
                if (cardEl.classList.contains('can-attack')) {
                    console.log(`[CLIENT] Attacking with ${cardId}. Sending DECLARE_ATTACK...`);
                    sendActionToServer({ type: 'DECLARE_ATTACK', payload: { attackerUid: cardId } });
                }else if (cardEl.classList.contains('can-block')) {
                    console.log(`[CLIENT] Blocking with ${cardId}. Sending DECLARE_BLOCK...`);
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
        console.log('[CLIENT] Deck Discard OK clicked. Sending CONFIRM_DECK_DISCARD...');
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
}